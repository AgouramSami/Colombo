from pathlib import Path

import pytest

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"


def pytest_collection_modifyitems(items: list) -> None:
    """Skip les tests qui necessitent des fixtures PDF si le dossier est vide."""
    for item in items:
        if item.get_closest_marker("needs_fixtures") and not any(FIXTURES_DIR.glob("*.pdf")):
            item.add_marker(
                pytest.mark.skip(reason="Aucun PDF dans fixtures/ -- ajouter des PDFs reels")
            )


@pytest.fixture
def fixtures_dir() -> Path:
    return FIXTURES_DIR
