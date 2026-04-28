"""Point d'entree : pnpm dev:scraper ou python -m src."""

import hashlib
import logging
import os
import sys
import time as _time
from pathlib import Path

from .crawler.francolomb import FrancolombCrawler
from .db.persist import (
    load_crawled_pages,
    load_processed_pdf_urls,
    mark_page_crawled,
    pdf_already_processed,
    pdf_url_already_processed,
    record_pdf,
    upsert_race,
    upsert_results,
)
from .parser.models import ParseStatus
from .parser.pdf_parser import parse_pdf

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# Budget temps : s'arreter proprement avant que GitHub Actions tue le job (6h)
MAX_RUNTIME_S = int(os.environ.get("MAX_RUNTIME_S", str(5 * 3600 + 30 * 60)))

PDF_STORAGE_DIR = Path(os.environ.get("PDF_STORAGE_DIR", "/tmp/colombo-pdfs"))


def sha256_of_url(crawler: FrancolombCrawler, pdf_url: str) -> str | None:
    """Telecharge le PDF et retourne (path, sha256). None si erreur."""
    try:
        content = crawler._client.get(pdf_url).content
        return hashlib.sha256(content).hexdigest()
    except Exception:
        return None


def process_pdf(crawler: FrancolombCrawler, pdf_url: str) -> None:
    # 1. Deduplication par URL (sans telecharger)
    if pdf_url_already_processed(pdf_url):
        log.debug("PDF deja connu (url) : %s", pdf_url.split("/")[-1])
        return

    # 2. Telecharger
    try:
        path, sha256 = crawler.download_pdf(pdf_url)
    except Exception as exc:
        log.warning("Echec telechargement %s : %s", pdf_url, exc)
        return

    # 3. Deduplication par hash (même contenu, URL differente)
    if pdf_already_processed(sha256):
        log.debug("PDF deja traite : %s", path.name)
        return

    # 3. Parser
    try:
        result = parse_pdf(path)
    except Exception as exc:
        log.error("Echec parsing %s : %s", path.name, exc)
        return

    if result.parse_status == ParseStatus.quarantine:
        log.warning("PDF en quarantaine : %s (confiance=%.2f)", path.name, result.confidence)
        return

    # 4. Persister la course
    try:
        race_id = upsert_race(result.metadata)
    except Exception as exc:
        log.error("Echec upsert_race %s : %s", path.name, exc)
        return

    # 5. Persister les resultats
    try:
        upsert_results(race_id, result.results)
    except Exception as exc:
        log.error("Echec upsert_results %s : %s", path.name, exc)

    # 6. Enregistrer le PDF (maintenant qu'on a le race_id)
    try:
        record_pdf(
            pdf_url=pdf_url,
            content_hash=sha256,
            storage_path=str(path),
            race_id=race_id,
            parse_status=result.parse_status,
            parse_method=result.parse_method,
        )
        log.info(
            "OK : %s → %d resultats (confiance=%.2f)",
            path.name,
            len(result.results),
            result.confidence,
        )
    except Exception as exc:
        log.error("Echec record_pdf %s : %s", path.name, exc)


def main() -> None:
    _start = _time.monotonic()
    log.info("Colombo scraper demarre")

    missing = [v for v in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(v)]
    if missing:
        log.error("Variables d'environnement manquantes : %s", ", ".join(missing))
        sys.exit(1)

    PDF_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    with FrancolombCrawler(storage_dir=PDF_STORAGE_DIR) as crawler:
        result_pages = crawler.discover_result_page_urls()

        # Chargement bulk en memoire — evite une requete Supabase par URL
        crawled_pages = load_crawled_pages()
        processed_urls = load_processed_pdf_urls()
        log.info(
            "Cache charge : %d pages crawlees, %d PDFs traites",
            len(crawled_pages),
            len(processed_urls),
        )

        pending = [url for url in result_pages if url not in crawled_pages]
        log.info("%d pages a traiter sur %d total", len(pending), len(result_pages))

        seen_urls: set[str] = set(processed_urls)

        for pages_done, page_url in enumerate(pending, start=1):
            if _time.monotonic() - _start > MAX_RUNTIME_S:
                log.info(
                    "Budget temps epuise (%.0f min) — arret propre apres %d pages",
                    MAX_RUNTIME_S / 60,
                    pages_done - 1,
                )
                break

            pdf_urls = crawler.list_pdf_urls_from_page(page_url)
            for url in pdf_urls:
                if url not in seen_urls:
                    seen_urls.add(url)
                    process_pdf(crawler, url)

            mark_page_crawled(page_url)

            if pages_done % 50 == 0:
                elapsed = _time.monotonic() - _start
                log.info(
                    "Progression : %d/%d pages traitees — %.0f min ecoulees",
                    pages_done,
                    len(pending),
                    elapsed / 60,
                )

    log.info("Scraper termine en %.0f min", (_time.monotonic() - _start) / 60)


if __name__ == "__main__":
    main()
