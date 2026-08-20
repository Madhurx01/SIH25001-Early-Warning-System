"""In-memory demo repositories for official staff field submissions."""

from copy import deepcopy
from datetime import datetime, timezone
from threading import RLock
from typing import Any

from app.services.auth import ASHA_WORKER, GOVT_OFFICER, WATER_WORKER
from app.services.mock_data import get_village


class InvalidStaffReportError(ValueError):
    pass


class InMemoryStaffReportRepository:
    """Process-local storage. All records reset when the API restarts."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._health_reports = [
            {
                "id": "HR-DEMO-001", "village_id": "ASM-HLK-003", "village_name": "Demo Village 03",
                "report_date": "2026-08-19T08:30:00Z", "diarrhoeal_cases": 4, "vomiting_cases": 2,
                "fever_cases": 3, "suspected_acute_watery_diarrhoea_cases": 1, "households_visited": 28,
                "unusual_symptom_cluster": True, "common_water_source": "Community hand pump",
                "remarks": "Symptom surveillance signal only; households advised to contact local health services.",
                "field_evidence_note": "Demo household visit register reviewed; no personal details retained.",
                "submitted_by_id": "USR-ASHA-001", "submitted_by_name": "Mina Das",
                "submitted_at": "2026-08-19T08:45:00Z", "data_source": "synthetic", "is_demo": True,
                "diagnostic_boundary": "Observed/reported symptoms are surveillance signals, not confirmed diagnoses.",
            }
        ]
        self._water_reports = [
            {
                "id": "WR-DEMO-001", "village_id": "ASM-CCH-001", "village_name": "Demo Village 01",
                "water_source_name": "Community Well W01", "inspection_date": "2026-08-19T09:15:00Z",
                "source_type": "COMMUNITY_WELL", "ph": 7.1, "turbidity_ntu": 6.4,
                "residual_chlorine_mg_l": 0.1, "bacterial_contamination_result": "NOT_TESTED",
                "infrastructure_condition": "Drainage channel partially obstructed; retest requested.",
                "remarks": "Field measurements are indicative and do not prove the absence or presence of every pathogen.",
                "field_evidence_note": "Demo inspection checklist completed; no photo attached.",
                "submitted_by_id": "USR-WATER-001", "submitted_by_name": "Ravi Debbarma",
                "submitted_at": "2026-08-19T09:30:00Z", "data_source": "synthetic", "is_demo": True,
                "testing_boundary": "Low-cost field observations do not establish comprehensive pathogen safety.",
            }
        ]

    def list_health(self) -> list[dict[str, Any]]:
        with self._lock:
            return deepcopy(sorted(self._health_reports, key=lambda item: item["submitted_at"], reverse=True))

    def list_water(self) -> list[dict[str, Any]]:
        with self._lock:
            return deepcopy(sorted(self._water_reports, key=lambda item: item["submitted_at"], reverse=True))

    def add_health(self, report: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._health_reports.append(deepcopy(report))
            return deepcopy(report)

    def add_water(self, report: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._water_reports.append(deepcopy(report))
            return deepcopy(report)


repository = InMemoryStaffReportRepository()


def assigned_villages(user: dict[str, Any]) -> list[dict[str, str]]:
    village_ids = user["assigned_village_ids"]
    if user["role"] == GOVT_OFFICER:
        from app.services.mock_data import get_villages
        villages = get_villages()
    else:
        villages = [get_village(village_id) for village_id in village_ids]
    return [
        {"id": village["id"], "name": village["name"], "district": village["district"], "state": village["state"]}
        for village in villages if village
    ]


def _validate_scope(user: dict[str, Any], village_id: str) -> dict[str, Any]:
    village = get_village(village_id)
    if village is None:
        raise InvalidStaffReportError("Unknown village")
    if user["role"] != GOVT_OFFICER and village_id not in user["assigned_village_ids"]:
        raise InvalidStaffReportError("Village is outside the worker's assigned scope")
    return village


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def create_health_report(payload: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    village = _validate_scope(user, payload["village_id"])
    submitted_at = _timestamp()
    report = {
        "id": f"HR-{len(repository.list_health()) + 1001}", **payload,
        "report_date": payload["report_date"].isoformat().replace("+00:00", "Z"),
        "village_name": village["name"], "submitted_by_id": user["id"], "submitted_by_name": user["name"],
        "submitted_at": submitted_at, "data_source": "demo_session", "is_demo": True,
        "diagnostic_boundary": "Observed/reported symptoms are surveillance signals, not confirmed diagnoses.",
    }
    return repository.add_health(report)


def create_water_report(payload: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    village = _validate_scope(user, payload["village_id"])
    submitted_at = _timestamp()
    report = {
        "id": f"WR-{len(repository.list_water()) + 1001}", **payload,
        "inspection_date": payload["inspection_date"].isoformat().replace("+00:00", "Z"),
        "village_name": village["name"], "submitted_by_id": user["id"], "submitted_by_name": user["name"],
        "submitted_at": submitted_at, "data_source": "demo_session", "is_demo": True,
        "testing_boundary": "Low-cost field observations do not establish comprehensive pathogen safety.",
    }
    return repository.add_water(report)


def list_health_reports(user: dict[str, Any]) -> list[dict[str, Any]]:
    reports = repository.list_health()
    return reports if user["role"] == GOVT_OFFICER else [item for item in reports if item["submitted_by_id"] == user["id"]]


def list_water_reports(user: dict[str, Any]) -> list[dict[str, Any]]:
    reports = repository.list_water()
    return reports if user["role"] == GOVT_OFFICER else [item for item in reports if item["submitted_by_id"] == user["id"]]
