"""Village operational detail assembled from synthetic evidence services."""

from copy import deepcopy
from typing import Any

from app.services.mock_data import get_rainfall_disease_trend, get_village


def freshness(age_days: int | None, fresh_days: int, aging_days: int) -> str:
    if age_days is None:
        return "MISSING"
    if age_days <= fresh_days:
        return "FRESH"
    if age_days <= aging_days:
        return "AGING"
    return "STALE"


def get_operational_village(village_id: str) -> dict[str, Any] | None:
    village = get_village(village_id)
    if not village:
        return None

    numeric_id = int(village_id.rsplit("-", 1)[-1])
    rainfall_age = numeric_id % 4
    flood_age = numeric_id % 7
    drivers = []
    if village["rainfall_risk"] in {"HIGH", "MODERATE"}:
        drivers.append(f"{village['rainfall_risk'].title()} rainfall signal")
    if village["flood_risk"] in {"HIGH", "MODERATE"}:
        drivers.append(f"Flood exposure {village['flood_risk'].lower()}")
    if freshness(village["water_test_age_days"], 30, 60) in {"STALE", "MISSING"}:
        drivers.append("Water-quality information stale or missing")
    if village["health_signal"] in {"ELEVATED", "MODERATE"}:
        drivers.append(f"Recent health signal {village['health_signal'].lower()}")
    if village["needs_verification"]:
        drivers.append("Evidence gap requires verification")
    if not drivers:
        drivers.append("No elevated synthetic evidence driver")

    village["priority_drivers"] = drivers
    village["evidence"] = [
        {"key": "rainfall", "label": "Rainfall data", "value": f"{village['rainfall_risk']} signal", "age_days": rainfall_age, "freshness": freshness(rainfall_age, 3, 7)},
        {"key": "flood", "label": "Flood data", "value": f"{village['flood_risk']} exposure", "age_days": flood_age, "freshness": freshness(flood_age, 3, 7)},
        {"key": "water", "label": "Water test", "value": village["water_quality_status"], "age_days": village["water_test_age_days"], "freshness": freshness(village["water_test_age_days"], 30, 60)},
        {"key": "health", "label": "Health report", "value": village["health_signal"], "age_days": village["health_report_age_days"], "freshness": freshness(village["health_report_age_days"], 7, 14)},
    ]
    village["freshness_rules_note"] = "Prototype freshness rules are demonstration rules only, not validated medical thresholds."
    village["risk_explanation"] = "Risk is an illustrative modeled outbreak-concern score; it is not a medically validated prediction."
    village["confidence_explanation"] = "Confidence reflects how complete and current the supporting demo evidence is."
    return village


def get_village_trend(village_id: str) -> dict[str, Any] | None:
    village = get_village(village_id)
    if not village:
        return None
    trend = deepcopy(get_rainfall_disease_trend())
    numeric_id = int(village_id.rsplit("-", 1)[-1])
    rain_factor = 0.76 + (numeric_id % 5) * 0.08
    case_factor = 0.55 + village["risk_score"] / 180
    for week in trend["weeks"]:
        week["rainfall_mm"] = round(week["rainfall_mm"] * rain_factor)
        week["reported_cases"] = max(0, round(week["reported_cases"] * case_factor))
    trend["location_scope"] = f"{village['name']} synthetic demonstration"
    trend["village_id"] = village_id
    return trend
