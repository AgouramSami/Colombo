from datetime import date, time
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class ParseStatus(StrEnum):
    pending = "pending"
    success = "success"
    partial = "partial"
    quarantine = "quarantine"


class RaceCategory(StrEnum):
    vitesse = "vitesse"
    petit_demi_fond = "petit_demi_fond"
    demi_fond = "demi_fond"
    grand_demi_fond = "grand_demi_fond"
    fond = "fond"
    grand_fond = "grand_fond"
    jeunes = "jeunes"


class PigeonAgeClass(StrEnum):
    vieux = "vieux"
    jeune = "jeune"


FILENAME_CATEGORY_MAP: dict[str, RaceCategory] = {
    "vitesse": RaceCategory.vitesse,
    "demi-fond": RaceCategory.demi_fond,
    "demi_fond": RaceCategory.demi_fond,
    "grand-fond": RaceCategory.grand_fond,
    "grand_fond": RaceCategory.grand_fond,
    "fond": RaceCategory.fond,
}

FILENAME_AGE_MAP: dict[str, PigeonAgeClass] = {
    "vieux": PigeonAgeClass.vieux,
    "jeunes": PigeonAgeClass.jeune,
    "jeune": PigeonAgeClass.jeune,
}


class RaceMetadata(BaseModel):
    francolomb_id: str
    release_point: str
    race_date: date
    pdf_title: str | None = None
    release_time: time | None = None
    pigeons_released: int | None = None
    distance_min_km: int | None = None
    distance_max_km: int | None = None
    category: RaceCategory
    age_class: PigeonAgeClass
    scope: str | None = None


class PigeonResult(BaseModel):
    place: int
    pigeon_matricule: str
    amateur_display_name: str
    society_name: str | None = None
    n_pigeon_amateur: int | None = None
    n_constatation: int | None = None
    n_engagement: int | None = None
    distance_m: int | None = None
    clocked_at_time: time
    velocity_m_per_min: Decimal = Field(decimal_places=3)
    ecart_code: str | None = None
    mise_type: str | None = None
    mise_eur: Decimal | None = None


class ParseResult(BaseModel):
    metadata: RaceMetadata
    results: list[PigeonResult]
    parse_status: ParseStatus = ParseStatus.success
    parse_method: str = "pdfplumber"
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    errors: list[str] = Field(default_factory=list)
