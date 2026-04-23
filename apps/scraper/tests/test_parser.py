"""Tests unitaires du parser Francolomb."""

from datetime import date, time
from decimal import Decimal
from pathlib import Path

import pytest

from src.parser.models import ParseStatus, PigeonAgeClass, RaceCategory
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

    pdfs = list(fixtures_dir.glob("*.pdf"))
    result = parse_pdf(pdfs[0])

    assert result.metadata.francolomb_id != "UNKNOWN"
    assert result.metadata.race_date > date(2020, 1, 1)
    assert result.metadata.release_point != "UNKNOWN"
    assert result.metadata.category in list(RaceCategory)
    assert result.metadata.age_class in list(PigeonAgeClass)


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

    for pdf in fixtures_dir.glob("*.pdf"):
        result = parse_pdf(pdf)
        assert result.confidence >= 0.90, (
            f"{pdf.name} : confiance {result.confidence:.0%} < 90%\nErreurs : {result.errors}"
        )
