"""Crawler Francolomb : liste et telecharge les PDFs de resultats."""

import datetime
import hashlib
import logging
import re
import time as time_module
from pathlib import Path

import httpx

log = logging.getLogger(__name__)

USER_AGENT = "Colombo-Bot/1.0 (+https://colombo.fr/bot; contact@colombo.fr)"
RATE_LIMIT_FRANCOLOMB = 2.0
RATE_LIMIT_CLUBS = 5.0

BASE_URL = "https://www.francolomb.com"
INDEX_URL = f"{BASE_URL}/fr/resultats-championnats-par-region/"

# Annee de debut de l'historique disponible sur Francolomb
HISTORY_START_YEAR = 2017

# Capture tous les PDFs wp-content (avec ou sans prefixe R\d+, ex: GESE_..., 21EESE_..., R21_...)
PDF_RE = re.compile(
    r'(?:https?://www\.francolomb\.com)?(/wp-content/uploads/\d{4}/\d{2}/[^"\s<>]+\.pdf)'
)


class RateLimiter:
    def __init__(self, interval: float) -> None:
        self._interval = interval
        self._last_call = 0.0

    def wait(self) -> None:
        elapsed = time_module.monotonic() - self._last_call
        if elapsed < self._interval:
            time_module.sleep(self._interval - elapsed)
        self._last_call = time_module.monotonic()


class FrancolombCrawler:
    def __init__(self, storage_dir: Path) -> None:
        self._storage_dir = storage_dir
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        self._francolomb_limiter = RateLimiter(RATE_LIMIT_FRANCOLOMB)
        self._club_limiter = RateLimiter(RATE_LIMIT_CLUBS)
        self._client = httpx.Client(
            headers={"User-Agent": USER_AGENT},
            follow_redirects=True,
            timeout=30.0,
        )

    def _get(self, url: str, is_club_site: bool = False) -> httpx.Response:
        limiter = self._club_limiter if is_club_site else self._francolomb_limiter
        limiter.wait()
        log.debug("GET %s", url)
        response = self._client.get(url)
        response.raise_for_status()
        return response

    def download_pdf(self, url: str, is_club_site: bool = False) -> tuple[Path, str]:
        """Telecharge un PDF et retourne (chemin_local, sha256). Idempotent."""
        response = self._get(url, is_club_site=is_club_site)
        content = response.content
        sha256 = hashlib.sha256(content).hexdigest()

        filename = url.split("/")[-1].split("?")[0] or f"{sha256[:16]}.pdf"
        dest = self._storage_dir / filename

        if not dest.exists():
            dest.write_bytes(content)
            log.info("PDF sauvegarde : %s (%d octets)", dest.name, len(content))
        else:
            log.debug("PDF deja present : %s", dest.name)

        return dest, sha256

    def _discover_groupement_base_urls(self) -> list[str]:
        """Retourne les URLs de base des groupements/clubs depuis la page index (1 requete)."""
        resp = self._get(INDEX_URL)
        raw = re.findall(r'href="(https://www\.francolomb\.com/clubs/[^"#?]+)', resp.text)
        seen: set[str] = set()
        result: list[str] = []
        for url in raw:
            clean = url.rstrip("/")
            if clean not in seen:
                seen.add(clean)
                result.append(clean)
        log.info("%d groupements/clubs decouverts", len(result))
        return result

    def discover_all_pages(self) -> tuple[list[str], list[str]]:
        """Retourne (pages_courantes, pages_historiques).

        Pages courantes  : onglet ?view=tab de chaque groupement, re-visites a chaque run
                           pour capter les nouveaux concours de la saison en cours.
        Pages historiques: onglets ?y=YYYY pour HISTORY_START_YEAR..annee-1,
                           crawles une seule fois puis checkpointes.
        """
        base_urls = self._discover_groupement_base_urls()
        current_year = datetime.date.today().year

        current_pages = [f"{base}/?view=tab" for base in base_urls]

        historical_pages = [
            f"{base}/?y={year}#championships"
            for base in base_urls
            for year in range(HISTORY_START_YEAR, current_year)
        ]

        log.info(
            "%d pages courantes, %d pages historiques (%d groupements x %d ans)",
            len(current_pages),
            len(historical_pages),
            len(base_urls),
            current_year - HISTORY_START_YEAR,
        )
        return current_pages, historical_pages

    def list_pdf_urls_from_page(self, page_url: str) -> list[str]:
        """Retourne toutes les URLs de PDFs Francolomb trouvees sur une page."""
        try:
            response = self._get(page_url)
        except httpx.HTTPError as exc:
            log.warning("Erreur sur %s : %s", page_url, exc)
            return []

        seen: set[str] = set()
        result: list[str] = []
        for match in PDF_RE.finditer(response.text):
            path = match.group(1)
            full_url = BASE_URL + path if not path.startswith("http") else path
            if full_url not in seen:
                seen.add(full_url)
                result.append(full_url)
        return result

    # Conserve pour compatibilite avec les tests existants
    def list_pdf_urls(self, region_slug: str) -> list[str]:
        url = f"{INDEX_URL}{region_slug}/"
        try:
            response = self._get(url)
        except httpx.HTTPError as exc:
            log.warning("Erreur lors de la liste de %s : %s", region_slug, exc)
            return []
        return [BASE_URL + m.group(1) for m in PDF_RE.finditer(response.text)]

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "FrancolombCrawler":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
