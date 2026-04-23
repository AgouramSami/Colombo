"""Crawler Francolomb : liste et telecharge les PDFs de resultats."""

import hashlib
import logging
import time as time_module
from pathlib import Path

import httpx

log = logging.getLogger(__name__)

USER_AGENT = "Colombo-Bot/1.0 (+https://colombo.fr/bot; contact@colombo.fr)"
RATE_LIMIT_FRANCOLOMB = 2.0
RATE_LIMIT_CLUBS = 5.0

BASE_URL = "https://www.francolomb.com/fr/resultats-championnats-par-region/"


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

    def list_pdf_urls(self, region_slug: str) -> list[str]:
        """Liste les URLs de PDFs pour une region. Retourne [] si aucun."""
        url = f"{BASE_URL}{region_slug}/"
        try:
            response = self._get(url)
        except httpx.HTTPError as exc:
            log.warning("Erreur lors de la liste de %s : %s", region_slug, exc)
            return []

        # Les URLs de PDFs Francolomb suivent le pattern R\d+_...pdf
        import re

        return re.findall(r'href="([^"]+R\d+_[^"]+\.pdf)"', response.text)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "FrancolombCrawler":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
