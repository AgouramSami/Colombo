"""Crawler Francolomb : liste et telecharge les PDFs de resultats."""

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

# Pattern des PDFs de resultats Francolomb : R<region>_<groupe>_<date>-<point>-<categorie>.pdf
PDF_RE = re.compile(r'href="((?:https?://[^"]+)?/[^"]+R\d+_[^"]+\.pdf)"')

# Pattern des liens vers des pages regionales (internes)
REGION_LINK_RE = re.compile(
    r'href="(https?://(?:www\.)?francolomb\.com/[^"#]+/)"'
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
        log.info("GET %s", url)
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

    def discover_pages(self) -> list[str]:
        """Decouvre toutes les pages de resultats depuis l'index. Retourne leurs URLs."""
        pages: list[str] = []

        try:
            index_resp = self._get(INDEX_URL)
        except httpx.HTTPError as exc:
            log.warning("Impossible de charger l'index : %s", exc)
            return pages

        # Toujours inclure la page finale apres redirection (peut etre la homepage)
        final_url = str(index_resp.url)
        pages.append(final_url)

        # Chercher tous les liens internes francolomb depuis la page d'index
        seen: set[str] = {final_url}
        for match in REGION_LINK_RE.finditer(index_resp.text):
            url = match.group(1)
            # Exclure la homepage et les pages non-contenu
            if url in seen:
                continue
            if any(x in url for x in ["/wp-", "/feed/", "/tag/", "/category/", "/author/"]):
                continue
            seen.add(url)
            pages.append(url)

        log.info("Pages decouvertes : %d", len(pages))
        return pages

    def list_pdf_urls_from_page(self, page_url: str) -> list[str]:
        """Retourne toutes les URLs de PDFs trouvees sur une page."""
        try:
            response = self._get(page_url)
        except httpx.HTTPError as exc:
            log.warning("Erreur sur %s : %s", page_url, exc)
            return []

        urls: list[str] = []
        for match in PDF_RE.finditer(response.text):
            raw = match.group(1)
            # Convertir les URLs relatives en absolues
            full_url = raw if raw.startswith("http") else BASE_URL + raw
            urls.append(full_url)

        # Deduplication tout en preservant l'ordre
        seen: set[str] = set()
        result = []
        for u in urls:
            if u not in seen:
                seen.add(u)
                result.append(u)
        return result

    # Conserve pour compatibilite avec les tests existants
    def list_pdf_urls(self, region_slug: str) -> list[str]:
        url = f"{INDEX_URL}{region_slug}/"
        try:
            response = self._get(url)
        except httpx.HTTPError as exc:
            log.warning("Erreur lors de la liste de %s : %s", region_slug, exc)
            return []
        return [m.group(1) for m in PDF_RE.finditer(response.text)]

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "FrancolombCrawler":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
