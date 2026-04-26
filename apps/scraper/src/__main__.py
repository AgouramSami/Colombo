"""Point d'entree : pnpm dev:scraper ou python -m src."""

import logging
import os
import sys
from pathlib import Path

from .crawler.francolomb import FrancolombCrawler
from .db.persist import record_pdf, update_pdf_status, upsert_race, upsert_results
from .parser.models import ParseStatus
from .parser.pdf_parser import parse_pdf

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# Slugs des pages de resultats sur francolomb.com
REGION_SLUGS = [
    "1ere-region",
    "2eme-region",
    "3eme-region",
    "4eme-region",
    "5eme-region",
    "6eme-region",
    "7eme-region",
    "8eme-region",
    "9eme-region",
    "10eme-region",
    "11eme-region",
    "12eme-region",
    "13eme-region",
    "14eme-region",
    "15eme-region",
    "16eme-region",
    "17eme-region",
    "18eme-region",
    "19eme-region",
    "20eme-region",
    "21eme-region",
]

PDF_STORAGE_DIR = Path(os.environ.get("PDF_STORAGE_DIR", "/tmp/colombo-pdfs"))


def process_pdf(crawler: FrancolombCrawler, pdf_url: str) -> None:
    try:
        path, sha256 = crawler.download_pdf(pdf_url)
    except Exception as exc:
        log.warning("Echec telechargement %s : %s", pdf_url, exc)
        return

    pdf_id = record_pdf(pdf_url, sha256, str(path))
    if pdf_id is None:
        return  # deja traite

    try:
        result = parse_pdf(path)
    except Exception as exc:
        log.error("Echec parsing %s : %s", path.name, exc)
        update_pdf_status(pdf_id, ParseStatus.quarantine, error=str(exc))
        return

    if result.parse_status == ParseStatus.quarantine:
        log.warning("PDF en quarantaine : %s (confiance=%.2f)", path.name, result.confidence)
        update_pdf_status(
            pdf_id,
            ParseStatus.quarantine,
            error="; ".join(result.errors),
        )
        return

    try:
        race_id = upsert_race(result.metadata)
        upsert_results(race_id, result.results)
        update_pdf_status(
            pdf_id,
            result.parse_status,
            race_id=race_id,
            parse_method=result.parse_method,
        )
        log.info(
            "OK : %s → %d resultats (confiance=%.2f)",
            path.name,
            len(result.results),
            result.confidence,
        )
    except Exception as exc:
        log.error("Echec persistance %s : %s", path.name, exc)
        update_pdf_status(pdf_id, ParseStatus.quarantine, error=str(exc))


def main() -> None:
    log.info("Colombo scraper demarre")

    # Verification des variables d'env requises
    missing = [v for v in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(v)]
    if missing:
        log.error("Variables d'environnement manquantes : %s", ", ".join(missing))
        sys.exit(1)

    PDF_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    with FrancolombCrawler(storage_dir=PDF_STORAGE_DIR) as crawler:
        for slug in REGION_SLUGS:
            log.info("Region : %s", slug)
            urls = crawler.list_pdf_urls(slug)
            log.info("  %d PDF(s) trouves", len(urls))
            for url in urls:
                process_pdf(crawler, url)

    log.info("Scraper termine")


if __name__ == "__main__":
    main()
