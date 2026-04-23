"""Point d'entree : pnpm dev:scraper ou python -m src."""

import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def main() -> None:
    log.info("Colombo scraper demarre")
    # TODO: boucle principale crawl + parse


if __name__ == "__main__":
    main()
