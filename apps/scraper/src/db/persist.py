import datetime
import logging

from ..parser.models import ParseStatus, PigeonResult, RaceMetadata
from .client import get_client

log = logging.getLogger(__name__)


def upsert_race(metadata: RaceMetadata) -> str:
    """Insert ou met a jour une course. Retourne son uuid."""
    client = get_client()
    row = {
        "francolomb_id": metadata.francolomb_id,
        "race_date": metadata.race_date.isoformat(),
        "release_point": metadata.release_point,
        "category": metadata.category.value,
        "age_class": metadata.age_class.value,
    }
    if metadata.release_time:
        row["release_time"] = metadata.release_time.isoformat()
    if metadata.pigeons_released is not None:
        row["pigeons_released"] = metadata.pigeons_released
    if metadata.distance_min_km is not None:
        row["distance_min_km"] = metadata.distance_min_km
    if metadata.distance_max_km is not None:
        row["distance_max_km"] = metadata.distance_max_km
    if metadata.scope:
        row["scope"] = metadata.scope

    result = (
        client.table("races")
        .upsert(row, on_conflict="francolomb_id")
        .execute()
    )
    race_id: str = result.data[0]["id"]
    log.info("Course upsert : %s → %s", metadata.francolomb_id, race_id)
    return race_id


def upsert_results(race_id: str, results: list[PigeonResult]) -> int:
    """Insere les resultats d'une course. Retourne le nombre de lignes inserees."""
    if not results:
        return 0

    client = get_client()

    # Upsert d'abord les pigeons pour satisfaire la FK pigeon_results → pigeons
    pigeon_rows = [{"matricule": r.pigeon_matricule} for r in results]
    for i in range(0, len(pigeon_rows), 500):
        client.table("pigeons").upsert(
            pigeon_rows[i : i + 500], on_conflict="matricule", ignore_duplicates=True
        ).execute()

    rows = []
    for r in results:
        row: dict = {
            "race_id": race_id,
            "pigeon_matricule": r.pigeon_matricule,
            "amateur_display_name": r.amateur_display_name,
            "place": r.place,
            "clocked_at_time": r.clocked_at_time.isoformat(),
            "velocity_m_per_min": float(r.velocity_m_per_min),
        }
        if r.society_name:
            row["society_name"] = r.society_name
        if r.n_pigeon_amateur is not None:
            row["n_pigeon_amateur"] = r.n_pigeon_amateur
        if r.n_constatation is not None:
            row["n_constatation"] = r.n_constatation
        if r.n_engagement is not None:
            row["n_engagement"] = r.n_engagement
        if r.distance_m is not None:
            row["distance_m"] = r.distance_m
        if r.ecart_code:
            row["ecart_code"] = r.ecart_code
        if r.mise_type:
            row["mise_type"] = r.mise_type
        if r.mise_eur is not None:
            row["mise_eur"] = float(r.mise_eur)
        rows.append(row)

    # Batch par 500 pour ne pas depasser les limites Supabase
    inserted = 0
    for i in range(0, len(rows), 500):
        batch = rows[i : i + 500]
        result = (
            client.table("pigeon_results")
            .upsert(batch, on_conflict="race_id,pigeon_matricule", ignore_duplicates=True)
            .execute()
        )
        inserted += len(result.data)

    log.info("Resultats inseres : %d / %d", inserted, len(results))
    return inserted


def pdf_url_already_processed(pdf_url: str) -> bool:
    """Retourne True si ce PDF a deja ete traite (dedup par URL, sans telecharger)."""
    client = get_client()
    result = (
        client.table("race_pdfs")
        .select("id")
        .eq("pdf_url", pdf_url)
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def pdf_already_processed(content_hash: str) -> bool:
    """Retourne True si ce PDF a deja ete traite (dedup par content_hash)."""
    client = get_client()
    result = (
        client.table("race_pdfs")
        .select("id")
        .eq("content_hash", content_hash)
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def page_url_already_crawled(url: str) -> bool:
    """Retourne True si cette page de resultats a deja ete crawlee."""
    client = get_client()
    result = client.table("crawled_result_pages").select("url").eq("url", url).limit(1).execute()
    return len(result.data) > 0


def mark_page_crawled(url: str) -> None:
    """Marque une page de resultats comme crawlee."""
    get_client().table("crawled_result_pages").upsert({"url": url}).execute()


def record_pdf(pdf_url: str, content_hash: str, storage_path: str, race_id: str, parse_status: ParseStatus, parse_method: str = "pdfplumber", error: str | None = None) -> str:
    """Enregistre un PDF apres parsing. Retourne son id."""
    client = get_client()
    row: dict = {
        "race_id": race_id,
        "pdf_url": pdf_url,
        "content_hash": content_hash,
        "storage_path": storage_path,
        "type": "resultat_concours",
        "parse_status": parse_status.value,
        "parse_method": parse_method,
        "parsed_at": datetime.datetime.utcnow().isoformat(),
    }
    if error:
        row["parse_error"] = error[:2000]
    result = client.table("race_pdfs").insert(row).execute()
    pdf_id: str = result.data[0]["id"]
    log.info("PDF enregistre : %s", pdf_id[:8])
    return pdf_id


