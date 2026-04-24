"""Tests unitaires du parser Francolomb."""

from datetime import date, time
from decimal import Decimal
from pathlib import Path

import pytest

from src.parser.models import ParseStatus, PigeonAgeClass
from src.parser.pdf_parser import (
    _normalize_matricule,
    _parse_time,
    _parse_velocity,
)

# ---------------------------------------------------------------------------
# Tests unitaires purs (sans fixture PDF)
# ---------------------------------------------------------------------------


class TestNormalizeMatricule:
    def test_male(self) -> None:
        assert _normalize_matricule("FR", "123456", "26", None) == "FR-123456-26"

    def test_female(self) -> None:
        assert _normalize_matricule("FR", "123456", "26", " F") == "FR-123456-26-F"

    def test_belgium_7_digits(self) -> None:
        assert _normalize_matricule("BE", "1234567", "21", None) == "BE-1234567-21"

    def test_nl_female(self) -> None:
        assert _normalize_matricule("NL", "1234567", "24", " F") == "NL-1234567-24-F"


class TestParseVelocity:
    def test_comma_decimal(self) -> None:
        assert _parse_velocity("1283,359") == Decimal("1283.359")

    def test_low_velocity(self) -> None:
        assert _parse_velocity("987,654") == Decimal("987.654")

    def test_three_decimals(self) -> None:
        result = _parse_velocity("1100,000")
        assert result == Decimal("1100.000")


class TestParseTime:
    def test_standard(self) -> None:
        assert _parse_time("12:02:36") == time(12, 2, 36)

    def test_midnight(self) -> None:
        assert _parse_time("00:00:00") == time(0, 0, 0)

    def test_late(self) -> None:
        assert _parse_time("18:59:59") == time(18, 59, 59)


# ---------------------------------------------------------------------------
# Tests sur PDF reels (skipped si pas de fixtures)
# ---------------------------------------------------------------------------


@pytest.mark.needs_fixtures
def test_header_extraction(fixtures_dir: Path) -> None:
    from src.parser.pdf_parser import parse_pdf

    for pdf in fixtures_dir.glob("*.pdf"):
        result = parse_pdf(pdf)
        assert result.metadata.francolomb_id != "UNKNOWN", f"{pdf.name} : francolomb_id manquant"
        assert result.metadata.race_date > date(2020, 1, 1), f"{pdf.name} : race_date invalide"
        assert result.metadata.release_point != "UNKNOWN", f"{pdf.name} : release_point manquant"
        assert result.metadata.age_class in list(PigeonAgeClass), f"{pdf.name} : age_class invalide"
        assert result.metadata.pigeons_released is not None, (
            f"{pdf.name} : pigeons_released manquant"
        )
        assert result.metadata.distance_min_km is not None, f"{pdf.name} : distance_min_km manquant"
        assert result.metadata.release_time is not None, f"{pdf.name} : release_time manquant"


@pytest.mark.needs_fixtures
def test_forward_fill_amateur(fixtures_dir: Path) -> None:
    from src.parser.pdf_parser import parse_pdf

    pdfs = list(fixtures_dir.glob("*.pdf"))
    result = parse_pdf(pdfs[0])

    assert len(result.results) > 0
    for row in result.results:
        assert row.amateur_display_name != ""


@pytest.mark.needs_fixtures
def test_matricule_variants(fixtures_dir: Path) -> None:
    from src.parser.pdf_parser import parse_pdf

    for pdf in fixtures_dir.glob("*.pdf"):
        result = parse_pdf(pdf)
        for row in result.results:
            parts = row.pigeon_matricule.split("-")
            assert len(parts) >= 3
            assert len(parts[0]) == 2
            assert parts[0].isupper()


@pytest.mark.needs_fixtures
def test_velocity_comma_decimal(fixtures_dir: Path) -> None:
    from src.parser.pdf_parser import parse_pdf

    pdfs = list(fixtures_dir.glob("*.pdf"))
    result = parse_pdf(pdfs[0])

    for row in result.results:
        assert row.velocity_m_per_min > Decimal("500")
        assert row.velocity_m_per_min < Decimal("2000")


@pytest.mark.needs_fixtures
def test_multipage_continuation(fixtures_dir: Path) -> None:
    from src.parser.pdf_parser import parse_pdf

    pdfs = list(fixtures_dir.glob("*.pdf"))
    result = parse_pdf(pdfs[0])

    assert result.parse_status in (ParseStatus.success, ParseStatus.partial)
    assert len(result.results) > 10


@pytest.mark.needs_fixtures
def test_confidence_above_threshold(fixtures_dir: Path) -> None:
    from src.parser.pdf_parser import parse_pdf

    for pdf in sorted(fixtures_dir.glob("*.pdf")):
        result = parse_pdf(pdf)
        assert result.confidence >= 0.90, (
            f"{pdf.name} : confiance {result.confidence:.0%} < 90%\nErreurs : {result.errors}"
        )


@pytest.mark.needs_fixtures
def test_ecart_code_not_a_time(fixtures_dir: Path) -> None:
    """Le code écart ne doit pas être un HH:MM:SS (bug double-time)."""
    import re

    from src.parser.pdf_parser import parse_pdf

    time_re = re.compile(r"^\d{2}:\d{2}:\d{2}$")
    for pdf in fixtures_dir.glob("*.pdf"):
        result = parse_pdf(pdf)
        for row in result.results:
            if row.ecart_code is not None:
                assert not time_re.match(row.ecart_code), (
                    f"{pdf.name} place {row.place} : ecart_code='{row.ecart_code}' ressemble à un temps"
                )


@pytest.mark.needs_fixtures
def test_age_class_1_an(fixtures_dir: Path) -> None:
    """Les PDFs avec 'Catégorie : 1 an' doivent être classés en jeune."""
    from src.parser.pdf_parser import parse_pdf

    one_an_pdfs = [
        p for p in fixtures_dir.glob("*.pdf") if "1-An" in p.name or "1_an" in p.name.lower()
    ]
    for pdf in one_an_pdfs:
        result = parse_pdf(pdf)
        assert result.metadata.age_class == PigeonAgeClass.jeune, (
            f"{pdf.name} : age_class={result.metadata.age_class}, attendu jeune"
        )
