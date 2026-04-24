"""Tier 1 : parsing pdfplumber des PDFs Francolomb CLAPI."""

import re
from datetime import date, time
from decimal import Decimal, InvalidOperation
from pathlib import Path

import pdfplumber

from .models import (
    ParseResult,
    ParseStatus,
    PigeonAgeClass,
    PigeonResult,
    RaceCategory,
    RaceMetadata,
)

MATRICULE_RE = re.compile(r"\b([A-Z]{2})\s+(\d{3,7})\s+(\d{2})(\s+F)?\b")
PLACE_RE = re.compile(r"^\s*(\d+)\s+")
INSC_ENGAG_RE = re.compile(r"(\d+)\s*/\s*(\d+)")
CLOCKED_RE = re.compile(r"\b(\d{2}:\d{2}:\d{2})\b")
VELOCITY_RE = re.compile(r"\b(\d{1,4},\d{3})\b")
FRANCOLOMB_ID_RE = re.compile(r"\b(\d{6})\s*$")
DATE_RE = re.compile(r"\bdu\s+(\d{2})/(\d{2})/(\d{4})\b")
PIGEONS_RELEASED_RE = re.compile(r"(\d+)\s+pigeons?\s+l[aâ]ch", re.IGNORECASE)
RELEASE_TIME_RE = re.compile(r"[aà]\s+(\d{2}:\d{2}(?::\d{2})?)", re.IGNORECASE)
DISTANCE_RE = re.compile(
    r"Pt\s+avant\s*:\s*(\d+)\s*km.*?Pt\s+extr[eê]me\s*:\s*(\d+)\s*km", re.IGNORECASE
)
DISTANCE_M_RE = re.compile(r"\b(1\d{5})\b")
FOOTER_RE = re.compile(r"FRANCOLOMB CLAPI", re.IGNORECASE)

CATEGORY_MAP: dict[str, RaceCategory] = {
    "vitesse": RaceCategory.vitesse,
    "petit demi-fond": RaceCategory.petit_demi_fond,
    "demi-fond": RaceCategory.demi_fond,
    "grand demi-fond": RaceCategory.grand_demi_fond,
    "fond": RaceCategory.fond,
    "grand-fond": RaceCategory.grand_fond,
}

AGE_MAP: dict[str, PigeonAgeClass] = {
    "vieux": PigeonAgeClass.vieux,
    "jeunes": PigeonAgeClass.jeune,
    "jeune": PigeonAgeClass.jeune,
    "1 an": PigeonAgeClass.jeune,
}


def _parse_velocity(raw: str) -> Decimal:
    return Decimal(raw.replace(",", "."))


def _parse_time(raw: str) -> time:
    parts = raw.split(":")
    h, m, s = int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0
    return time(h, m, s)


def _normalize_matricule(country: str, number: str, year: str, female: str | None) -> str:
    suffix = "-F" if female and female.strip() else ""
    return f"{country}-{number}-{year}{suffix}"


def _parse_header(first_page_text: str) -> dict:
    meta: dict = {}
    lines = first_page_text.splitlines()

    # Le francolomb_id est le dernier token (6 chiffres) de la ligne 1 du header
    if lines:
        m = FRANCOLOMB_ID_RE.search(lines[0])
        if m:
            meta["francolomb_id"] = m.group(1)

    for line in lines:
        if not meta.get("race_date"):
            m = DATE_RE.search(line)
            if m:
                meta["race_date"] = date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
                if not meta.get("release_point"):
                    before = line[: m.start()].strip().rstrip("du ").strip()
                    if before:
                        meta["release_point"] = before

        if not meta.get("pigeons_released"):
            m = PIGEONS_RELEASED_RE.search(line)
            if m:
                meta["pigeons_released"] = int(m.group(1))

        if not meta.get("release_time"):
            m = RELEASE_TIME_RE.search(line)
            if m:
                raw = m.group(1)
                if ":" in raw:
                    meta["release_time"] = _parse_time(raw if raw.count(":") == 2 else raw + ":00")

        if not meta.get("distance_min_km"):
            m = DISTANCE_RE.search(line)
            if m:
                meta["distance_min_km"] = int(m.group(1))
                meta["distance_max_km"] = int(m.group(2))

        if not meta.get("category"):
            lower = line.lower()
            for key, val in CATEGORY_MAP.items():
                if key in lower:
                    meta["category"] = val
                    break

        if not meta.get("age_class"):
            lower = line.lower()
            for key, val in AGE_MAP.items():
                if re.search(rf"\b{key}\b", lower):
                    meta["age_class"] = val
                    break

    return meta


def _is_result_row(line: str) -> bool:
    return bool(PLACE_RE.match(line)) and bool(MATRICULE_RE.search(line))


def _parse_result_rows(pages_text: list[str]) -> tuple[list[PigeonResult], list[str]]:
    results: list[PigeonResult] = []
    errors: list[str] = []

    carry_amateur: str = ""
    carry_society: str | None = None
    carry_distance_m: int | None = None

    for page_text in pages_text:
        in_results = False
        for line in page_text.splitlines():
            if FOOTER_RE.search(line):
                in_results = False
                continue

            if not in_results:
                if _is_result_row(line):
                    in_results = True
                else:
                    continue

            place_m = PLACE_RE.match(line)
            matricule_m = MATRICULE_RE.search(line)
            clocked_m = CLOCKED_RE.search(line)
            velocity_m = VELOCITY_RE.search(line)

            if not (place_m and matricule_m and clocked_m and velocity_m):
                if place_m and INSC_ENGAG_RE.search(line):
                    errors.append(f"Ligne incomplete : {line.strip()[:80]}")
                continue

            place = int(place_m.group(1))
            matricule = _normalize_matricule(
                matricule_m.group(1),
                matricule_m.group(2),
                matricule_m.group(3),
                matricule_m.group(4),
            )

            before_matricule = line[: matricule_m.start()]
            after_place = line[place_m.end() :].strip()

            amateur_candidate = before_matricule[len(place_m.group(0)) :].strip()
            if amateur_candidate:
                carry_amateur = amateur_candidate
                carry_society = None
            amateur = carry_amateur

            insc_engag_m = INSC_ENGAG_RE.search(line)
            n_constatation = int(insc_engag_m.group(1)) if insc_engag_m else None
            n_engagement = int(insc_engag_m.group(2)) if insc_engag_m else None

            dist_m = DISTANCE_M_RE.search(after_place)
            if dist_m:
                carry_distance_m = int(dist_m.group(1))

            try:
                velocity = _parse_velocity(velocity_m.group(1))
                clocked = _parse_time(clocked_m.group(1))
            except (InvalidOperation, ValueError) as exc:
                errors.append(f"Place {place} : {exc}")
                continue

            # Certains PDFs doublent le temps constaté avant le code écart (ex: "12:02:36 12:02:36 J")
            after_clocked = line[clocked_m.end() :].strip()
            second_time_m = CLOCKED_RE.match(after_clocked)
            if second_time_m:
                after_clocked = after_clocked[second_time_m.end() :].strip()
            ecart_code = after_clocked.split()[0] if after_clocked else None

            results.append(
                PigeonResult(
                    place=place,
                    pigeon_matricule=matricule,
                    amateur_display_name=amateur,
                    society_name=carry_society,
                    n_constatation=n_constatation,
                    n_engagement=n_engagement,
                    distance_m=carry_distance_m,
                    clocked_at_time=clocked,
                    velocity_m_per_min=velocity,
                    ecart_code=ecart_code,
                )
            )

    return results, errors


def parse_pdf(path: Path) -> ParseResult:
    errors: list[str] = []

    with pdfplumber.open(path) as pdf:
        pages_text = [p.extract_text() or "" for p in pdf.pages]

    if not pages_text:
        return ParseResult(
            metadata=RaceMetadata(
                francolomb_id="UNKNOWN",
                release_point="UNKNOWN",
                race_date=date.today(),
                category=RaceCategory.vitesse,
                age_class=PigeonAgeClass.vieux,
            ),
            results=[],
            parse_status=ParseStatus.quarantine,
            parse_method="pdfplumber",
            confidence=0.0,
            errors=["PDF vide ou illisible"],
        )

    raw_meta = _parse_header(pages_text[0])

    missing = [
        f for f in ("francolomb_id", "race_date", "category", "age_class") if f not in raw_meta
    ]
    if missing:
        errors.append(f"Metadonnees manquantes : {missing}")

    metadata = RaceMetadata(
        francolomb_id=raw_meta.get("francolomb_id", "UNKNOWN"),
        release_point=raw_meta.get("release_point", "UNKNOWN"),
        race_date=raw_meta.get("race_date", date.today()),
        release_time=raw_meta.get("release_time"),
        pigeons_released=raw_meta.get("pigeons_released"),
        distance_min_km=raw_meta.get("distance_min_km"),
        distance_max_km=raw_meta.get("distance_max_km"),
        category=raw_meta.get("category", RaceCategory.vitesse),
        age_class=raw_meta.get("age_class", PigeonAgeClass.vieux),
        scope=raw_meta.get("scope"),
    )

    results, row_errors = _parse_result_rows(pages_text)
    errors.extend(row_errors)

    total = len(results) + len(row_errors)
    confidence = len(results) / total if total > 0 else 0.0

    status = ParseStatus.success
    if confidence < 0.9:
        status = ParseStatus.partial
    if confidence < 0.5:
        status = ParseStatus.quarantine

    return ParseResult(
        metadata=metadata,
        results=results,
        parse_status=status,
        parse_method="pdfplumber",
        confidence=round(confidence, 3),
        errors=errors,
    )
