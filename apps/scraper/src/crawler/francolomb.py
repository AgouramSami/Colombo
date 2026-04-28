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

# Chaque page clubs-results affiche dynamiquement les derniers PDFs de tous les clubs.
# Les pages historiques (2015-2024) et recentes montrent le meme contenu.
# On ne crawle que les 3 premiers sitemaps (pages les plus recentes) pour couvrir
# les nouveaux concours sans re-traiter 27 000 pages identiques.
CLUBS_RESULTS_SITEMAP_BASE = f"{BASE_URL}/sitemap-post-type-clubs-results"
CLUBS_RESULTS_SITEMAP_COUNT = 3

# Capture tous les PDFs wp-content (avec ou sans prefixe R\d+)
PDF_RE = re.compile(
    r'(?:https?://www\.francolomb\.com)?(/wp-content/uploads/\d{4}/\d{2}/[^"\s<>]+\.pdf)'
)
SITEMAP_URL_RE = re.compile(r"<loc>(https?://[^<]+)</loc>")


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

    def discover_result_page_urls(self, max_sitemaps: int | None = None) -> list[str]:
        """Decouvre toutes les URLs de pages de resultats via les sitemaps Francolomb."""
        all_urls: list[str] = []
        count = max_sitemaps or CLUBS_RESULTS_SITEMAP_COUNT

        for i in range(1, count + 1):
            sitemap_url = (
                f"{CLUBS_RESULTS_SITEMAP_BASE}.xml"
                if i == 1
                else f"{CLUBS_RESULTS_SITEMAP_BASE}-{i}.xml"
            )
            try:
                resp = self._get(sitemap_url)
            except httpx.HTTPError as exc:
                log.warning("Sitemap introuvable %s : %s", sitemap_url, exc)
                break

            urls = SITEMAP_URL_RE.findall(resp.text)
            # Filtrer pour ne garder que les pages clubs-results
            result_urls = [u for u in urls if "clubs-results" in u]
            all_urls.extend(result_urls)
            log.info("Sitemap %d/%d : %d URLs", i, count, len(result_urls))

        log.info("Total pages de resultats decouvertes : %d", len(all_urls))
        return all_urls

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
