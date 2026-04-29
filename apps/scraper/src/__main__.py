"""Point d'entree : pnpm dev:scraper ou python -m src."""

import logging
import os
import re
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
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
log = logging.getLogger(__name__)

# Budget temps : s'arreter proprement avant que GitHub Actions tue le job (6h)
MAX_RUNTIME_S = int(os.environ.get("MAX_RUNTIME_S", str(5 * 3600 + 30 * 60)))

PDF_STORAGE_DIR = Path(os.environ.get("PDF_STORAGE_DIR", "/tmp/colombo-pdfs"))

DOUBLAGE_URL_RE = re.compile(r"\bdoubl(?:age|ages|e|es)?\b", re.IGNORECASE)
DOUBLAGE_SCOPE_RE = re.compile(r"\bdoubl(?:age|ages|e|es)?\b", re.IGNORECASE)
GLOBAL_SCOPE_HINTS = (
    "groupement",
    "entente",
    "federation",
    "fédération",
    "region",
    "région",
    "championnat",
)


def is_doublage_pdf_url(pdf_url: str) -> bool:
    """Exclut les PDFs de doublage (sous-ensembles par club)."""
    filename = pdf_url.split("/")[-1].split("?")[0]
    normalized = filename.replace("_", " ").replace("-", " ")
    return bool(DOUBLAGE_URL_RE.search(normalized))


def is_doublage_scope(scope: str | None) -> bool:
    """Heuristique sur le titre de PDF: scope global attendu, sinon doublage."""
    if not scope:
        return False
    s = scope.strip().lower()
    if not s:
        return False
    if DOUBLAGE_SCOPE_RE.search(s):
        return True
    return not any(hint in s for hint in GLOBAL_SCOPE_HINTS)


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

    # 3. Deduplication par hash (meme contenu, URL differente)
    if pdf_already_processed(sha256):
        log.debug("PDF deja traite : %s", path.name)
        return

    # 4. Parser
    try:
        result = parse_pdf(path)
    except Exception as exc:
        log.error("Echec parsing %s : %s", path.name, exc)
        return

    if is_doublage_scope(result.metadata.scope):
        log.info(
            "Skip doublage (scope=%s) : %s",
            result.metadata.scope,
            path.name,
        )
        return

    if result.parse_status == ParseStatus.quarantine:
        log.warning("PDF en quarantaine : %s (confiance=%.2f)", path.name, result.confidence)
        return

    # 5. Persister la course
    try:
        race_id = upsert_race(result.metadata)
    except Exception as exc:
        log.error("Echec upsert_race %s : %s", path.name, exc)
        return

    # 6. Persister les resultats — si echec, ne pas marquer le PDF comme traite
    try:
        upsert_results(race_id, result.results)
    except Exception as exc:
        log.error("Echec upsert_results %s : %s", path.name, exc)
        return

    # 7. Enregistrer le PDF uniquement si les resultats ont ete persistes
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
            "OK : %s -> %d resultats (confiance=%.2f)",
            path.name,
            len(result.results),
            result.confidence,
        )
    except Exception as exc:
        log.error("Echec record_pdf %s : %s", path.name, exc)


def _process_pages(
    crawler: FrancolombCrawler,
    pages: list[str],
    seen_urls: set[str],
    start_time: float,
    label: str,
) -> int:
    """Parcourt une liste de pages, extrait et traite les PDFs. Retourne le nb de pages traitees."""
    done = 0
    for i, page_url in enumerate(pages, start=1):
        if _time.monotonic() - start_time > MAX_RUNTIME_S:
            log.info(
                "Budget temps epuise — arret apres %d/%d pages %s",
                i - 1,
                len(pages),
                label,
            )
            break

        pdf_urls = crawler.list_pdf_urls_from_page(page_url)
        for url in pdf_urls:
            if url not in seen_urls:
                seen_urls.add(url)
                if is_doublage_pdf_url(url):
                    log.info("Skip doublage : %s", url.split("/")[-1])
                    continue
                process_pdf(crawler, url)

        done += 1
        if done % 50 == 0:
            elapsed = _time.monotonic() - start_time
            log.info(
                "Progression %s : %d/%d — %.0f min ecoulees",
                label,
                done,
                len(pages),
                elapsed / 60,
            )

    return done


def main() -> None:
    _start = _time.monotonic()
    log.info("Colombo scraper demarre")

    missing = [v for v in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(v)]
    if missing:
        log.error("Variables d'environnement manquantes : %s", ", ".join(missing))
        sys.exit(1)

    PDF_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    with FrancolombCrawler(storage_dir=PDF_STORAGE_DIR) as crawler:
        # Decouverte : 1 requete INDEX_URL -> listes courante + historique
        current_pages, historical_pages = crawler.discover_all_pages()

        # Cache bulk en memoire
        crawled_pages = load_crawled_pages()
        processed_urls = load_processed_pdf_urls()
        seen_urls: set[str] = set(processed_urls)
        log.info(
            "Cache charge : %d pages crawlees, %d PDFs traites",
            len(crawled_pages),
            len(processed_urls),
        )

        # --- Saison courante : re-visitee a chaque run, pas de checkpoint page ---
        # Les pages ?view=tab montrent les nouveaux concours de la semaine.
        log.info("Traitement saison courante : %d pages", len(current_pages))
        _process_pages(crawler, current_pages, seen_urls, _start, "courante")

        if _time.monotonic() - _start > MAX_RUNTIME_S:
            log.info("Scraper termine en %.0f min", (_time.monotonic() - _start) / 60)
            return

        # --- Historique : crawle une seule fois par page, checkpoint ---
        pending = [p for p in historical_pages if p not in crawled_pages]
        log.info(
            "Historique : %d pages a traiter sur %d total",
            len(pending),
            len(historical_pages),
        )

        for i, page_url in enumerate(pending, start=1):
            if _time.monotonic() - _start > MAX_RUNTIME_S:
                log.info(
                    "Budget temps epuise — arret apres %d/%d pages historiques",
                    i - 1,
                    len(pending),
                )
                break

            pdf_urls = crawler.list_pdf_urls_from_page(page_url)
            for url in pdf_urls:
                if url not in seen_urls:
                    seen_urls.add(url)
                    if is_doublage_pdf_url(url):
                        log.info("Skip doublage : %s", url.split("/")[-1])
                        continue
                    process_pdf(crawler, url)

            mark_page_crawled(page_url)

            if i % 50 == 0:
                elapsed = _time.monotonic() - _start
                log.info(
                    "Progression historique : %d/%d — %.0f min ecoulees",
                    i,
                    len(pending),
                    elapsed / 60,
                )

    log.info("Scraper termine en %.0f min", (_time.monotonic() - _start) / 60)


if __name__ == "__main__":
    main()
