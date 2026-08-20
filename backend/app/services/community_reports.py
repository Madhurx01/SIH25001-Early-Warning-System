"""Runtime repository for clustered community environmental signals.

Clustering uses same village/category, a 24-hour window, and a 500-metre
radius when coordinates are available. These are demo rules, not validated
public-health thresholds. Review status never recalculates disease risk.
"""

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from threading import RLock
from typing import Any
from uuid import uuid4

from app.services.mock_data import get_village


REPORT_STATUSES = ("UNVERIFIED", "UNDER_REVIEW", "VERIFIED_HAZARD", "REJECTED", "DUPLICATE")
REPORT_CATEGORIES = (
    "STAGNANT_WATER", "FLOODED_AREA", "SEWAGE_OVERFLOW",
    "SUSPECTED_DIRTY_WATER_SOURCE", "BROKEN_WATER_PIPELINE",
    "GARBAGE_NEAR_WATER_SOURCE", "SUSPECTED_MOSQUITO_BREEDING_SITE",
    "OTHER_ENVIRONMENTAL_HAZARD",
)
MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_TYPES = {
    "image/jpeg": (".jpg", (b"\xff\xd8\xff",)),
    "image/png": (".png", (b"\x89PNG\r\n\x1a\n",)),
    "image/webp": (".webp", (b"RIFF",)),
    "image/gif": (".gif", (b"GIF87a", b"GIF89a")),
}
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "runtime_uploads"


class ReportNotFoundError(LookupError):
    pass


class InvalidReportError(ValueError):
    pass


class InvalidImageError(ValueError):
    pass


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed


def _haversine_metres(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6_371_000
    d_lat, d_lon = radians(lat2 - lat1), radians(lon2 - lon1)
    value = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return 2 * radius * asin(sqrt(value))


def _seed_reports() -> list[dict[str, Any]]:
    rows = [
        ("CR-001", "ASM-HLK-004", "STAGNANT_WATER", "Standing water reported near the government school", 24.80, 92.70, "2026-08-19T16:30:00Z", 6, "UNVERIFIED", "HIGH"),
        ("CR-002", "ASM-HLK-004", "SEWAGE_OVERFLOW", "Overflowing drain reported near Community Well W04", 24.81, 92.69, "2026-08-19T15:45:00Z", 8, "UNVERIFIED", "HIGH"),
        ("CR-003", "ASM-CCH-001", "FLOODED_AREA", "Flooded residential lane reported after heavy rainfall", 24.77, 92.73, "2026-08-19T13:20:00Z", 4, "UNDER_REVIEW", "HIGH"),
        ("CR-004", "ASM-KRG-005", "SUSPECTED_DIRTY_WATER_SOURCE", "Community well reported with unusual colour and odour", 24.86, 92.36, "2026-08-18T10:10:00Z", 3, "VERIFIED_HAZARD", "HIGH"),
        ("CR-005", "MNP-IMP-007", "BROKEN_WATER_PIPELINE", "Leaking distribution pipe reported beside the market road", 24.82, 93.01, "2026-08-18T08:40:00Z", 2, "UNVERIFIED", "MEDIUM"),
        ("CR-006", "MNP-UKL-009", "GARBAGE_NEAR_WATER_SOURCE", "Waste accumulation reported beside a shared water point", 25.10, 94.36, "2026-08-17T17:15:00Z", 1, "UNVERIFIED", "MEDIUM"),
        ("CR-007", "MIZ-AIZ-011", "SUSPECTED_MOSQUITO_BREEDING_SITE", "Discarded containers holding rainwater reported near housing", 23.73, 92.72, "2026-08-17T12:05:00Z", 5, "UNVERIFIED", "MEDIUM"),
    ]
    result = []
    for index, row in enumerate(rows, start=1):
        report_id, village_id, category, description, latitude, longitude, reported_at, count, status, priority = row
        village = get_village(village_id)
        result.append({
            "id": report_id, "cluster_id": f"INC-{index:03d}", "member_report_ids": [report_id],
            "village_id": village_id, "village_name": village["name"], "category": category,
            "description": description, "latitude": latitude, "longitude": longitude,
            "reported_at": reported_at, "photo_url": None,
            "representative_photo_report_id": None, "photo_report_ids": [],
            "evidence_type": "DEMO_PHOTO_PLACEHOLDER",
            "report_count_nearby": count, "verification_status": status, "priority": priority,
            "data_source": "synthetic",
        })
    return result


def _public(report: dict[str, Any]) -> dict[str, Any]:
    result = deepcopy(report)
    result.pop("photo_storage_name", None)
    result.pop("photo_content_type", None)
    return result


class InMemoryCommunityReportRepository:
    """Incident clusters and report lookup; state intentionally resets."""

    def __init__(self) -> None:
        self._clusters = {item["cluster_id"]: item for item in _seed_reports()}
        self._report_to_cluster = {item["id"]: item["cluster_id"] for item in self._clusters.values()}
        self._submissions = {
            item["id"]: {
                "report_id": item["id"],
                "cluster_id": item["cluster_id"],
                "verification_status": item["verification_status"],
                "reported_at": item["reported_at"],
                "description": item["description"],
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "photo_storage_name": None,
                "photo_content_type": None,
                "evidence_type": item["evidence_type"],
            }
            for item in self._clusters.values()
        }
        self._counter = 1000
        self._lock = RLock()

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            ordered = sorted(self._clusters.values(), key=lambda row: row["reported_at"], reverse=True)
            return [_public(item) for item in ordered]

    def get(self, identifier: str, public: bool = True) -> dict[str, Any] | None:
        with self._lock:
            cluster_id = identifier if identifier in self._clusters else self._report_to_cluster.get(identifier)
            report = self._clusters.get(cluster_id) if cluster_id else None
            return (_public(report) if public else deepcopy(report)) if report else None

    def save(self, report: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._clusters[report["cluster_id"]] = deepcopy(report)
            for report_id in report["member_report_ids"]:
                self._report_to_cluster[report_id] = report["cluster_id"]
            return _public(report)

    def add_submission(
        self,
        report_id: str,
        cluster_id: str,
        reported_at: str,
        description: str,
        latitude: float | None,
        longitude: float | None,
        image: tuple[str, str] | None,
    ) -> None:
        with self._lock:
            self._submissions[report_id] = {
                "report_id": report_id,
                "cluster_id": cluster_id,
                "verification_status": "UNVERIFIED",
                "reported_at": reported_at,
                "description": description,
                "latitude": latitude,
                "longitude": longitude,
                "photo_storage_name": image[0] if image else None,
                "photo_content_type": image[1] if image else None,
                "evidence_type": "CITIZEN_SUBMITTED_PHOTO" if image else "NO_PHOTO_SUBMITTED",
            }

    def get_submission(self, report_id: str) -> dict[str, Any] | None:
        with self._lock:
            submission = self._submissions.get(report_id)
            return deepcopy(submission) if submission else None

    def update_submission_status(self, report_id: str, status: str) -> None:
        with self._lock:
            if report_id in self._submissions:
                self._submissions[report_id]["verification_status"] = status

    def next_report_id(self) -> str:
        with self._lock:
            self._counter += 1
            return f"CR-{self._counter}"


repository = InMemoryCommunityReportRepository()


def get_community_reports(village_id: str | None = None) -> list[dict[str, Any]]:
    reports = repository.list()
    return [report for report in reports if report["village_id"] == village_id] if village_id else reports


def get_community_report(identifier: str) -> dict[str, Any]:
    report = repository.get(identifier)
    if not report:
        raise ReportNotFoundError(identifier)
    submission = repository.get_submission(identifier)
    if submission:
        representative_photo_url = report.get("photo_url")
        cluster_status = report["verification_status"]
        cluster_reported_at = report["reported_at"]
        report.update({
            "id": identifier,
            "reported_at": submission["reported_at"],
            "description": submission["description"],
            "latitude": submission["latitude"],
            "longitude": submission["longitude"],
            "verification_status": submission["verification_status"],
            "cluster_verification_status": cluster_status,
            "cluster_reported_at": cluster_reported_at,
            "photo_url": (
                f"/api/community-reports/{identifier}/photo"
                if submission["photo_storage_name"] else None
            ),
            "representative_photo_url": representative_photo_url,
            "evidence_type": submission["evidence_type"],
        })
    return report


def update_report_status(identifier: str, status: str) -> dict[str, Any]:
    next_status = status.upper()
    if next_status not in REPORT_STATUSES:
        raise InvalidReportError(f"Unsupported verification status: {status}")
    report = repository.get(identifier, public=False)
    if not report:
        raise ReportNotFoundError(identifier)
    report["verification_status"] = next_status
    report["risk_boundary_notice"] = (
        "Verified environmental evidence recorded. Risk recalculation will be handled by the future model/evidence engine."
        if next_status == "VERIFIED_HAZARD"
        else "Community review status recorded; disease-risk scores are unchanged."
    )
    saved = repository.save(report)
    # A review addressed through a report ID applies to that submission as well
    # as its incident. Cluster-ID updates only change the incident decision.
    repository.update_submission_status(identifier, next_status)
    return saved


def validate_report_fields(
    village_id: str,
    category: str,
    latitude: float | None,
    longitude: float | None,
) -> tuple[dict[str, Any], str]:
    """Validate report metadata before any optional image is persisted."""
    village = get_village(village_id)
    if not village:
        raise InvalidReportError("Unknown village ID")
    normalized_category = category.upper()
    if normalized_category not in REPORT_CATEGORIES:
        raise InvalidReportError("Unsupported issue category")
    if (latitude is None) != (longitude is None):
        raise InvalidReportError("Latitude and longitude must be supplied together")
    if latitude is not None and not -90 <= latitude <= 90:
        raise InvalidReportError("Latitude must be between -90 and 90")
    if longitude is not None and not -180 <= longitude <= 180:
        raise InvalidReportError("Longitude must be between -180 and 180")
    return village, normalized_category


def validate_and_store_image(content: bytes, content_type: str | None) -> tuple[str, str]:
    if not content_type or content_type not in IMAGE_TYPES:
        raise InvalidImageError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.")
    if len(content) > MAX_IMAGE_BYTES:
        raise InvalidImageError("Image exceeds the 5 MB upload limit.")
    if not content:
        raise InvalidImageError("Uploaded image is empty.")
    extension, signatures = IMAGE_TYPES[content_type]
    valid = any(content.startswith(signature) for signature in signatures)
    if content_type == "image/webp":
        valid = valid and len(content) >= 12 and content[8:12] == b"WEBP"
    if not valid:
        raise InvalidImageError("File content does not match the declared image type.")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    storage_name = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / storage_name).write_bytes(content)
    return storage_name, content_type


def submit_report(village_id: str, category: str, description: str | None,
                  latitude: float | None, longitude: float | None,
                  image: tuple[str, str] | None) -> dict[str, Any]:
    village, category = validate_report_fields(village_id, category, latitude, longitude)

    now, report_id, cluster = _utc_now(), repository.next_report_id(), None
    for candidate in repository.list():
        if candidate["village_id"] != village_id or candidate["category"] != category:
            continue
        if now - _parse_datetime(candidate["reported_at"]) > timedelta(hours=24):
            continue
        coordinates = (latitude, longitude, candidate["latitude"], candidate["longitude"])
        if None not in coordinates and _haversine_metres(*coordinates) > 500:
            continue
        cluster = repository.get(candidate["cluster_id"], public=False)
        break

    clustered = cluster is not None
    if cluster:
        cluster["member_report_ids"].append(report_id)
        cluster["report_count_nearby"] += 1
        cluster["reported_at"] = now.isoformat()
        if description:
            cluster["description"] = description.strip()[:500]
        if image:
            cluster["photo_url"] = f"/api/community-reports/{report_id}/photo"
            cluster["representative_photo_report_id"] = report_id
            cluster.setdefault("photo_report_ids", []).append(report_id)
            cluster["evidence_type"] = "CITIZEN_SUBMITTED_PHOTO"
    else:
        cluster = {
            "id": report_id, "cluster_id": f"INC-{uuid4().hex[:8].upper()}", "member_report_ids": [report_id],
            "village_id": village_id, "village_name": village["name"], "category": category,
            "description": (description or "No description supplied").strip()[:500],
            "latitude": latitude, "longitude": longitude, "reported_at": now.isoformat(),
            "photo_url": f"/api/community-reports/{report_id}/photo" if image else None,
            "representative_photo_report_id": report_id if image else None,
            "photo_report_ids": [report_id] if image else [],
            "evidence_type": "CITIZEN_SUBMITTED_PHOTO" if image else "NO_PHOTO_SUBMITTED",
            "report_count_nearby": 1, "verification_status": "UNVERIFIED", "priority": "MEDIUM",
            "data_source": "citizen_demo_submission",
        }
    saved = repository.save(cluster)
    submission_description = (description or "No description supplied").strip()[:500]
    repository.add_submission(
        report_id,
        saved["cluster_id"],
        now.isoformat(),
        submission_description,
        latitude,
        longitude,
        image,
    )
    return {
        "report_id": report_id, "cluster_id": saved["cluster_id"],
        "report_count_nearby": saved["report_count_nearby"], "clustered": clustered,
        "verification_status": "UNVERIFIED",
        "cluster_verification_status": saved["verification_status"],
        "submitted_at": now.isoformat(),
        "notice": "Citizen reports are community signals and require official verification.",
    }


def get_photo(identifier: str) -> tuple[Path, str]:
    submission = repository.get_submission(identifier)
    if not submission or not submission.get("photo_storage_name"):
        raise ReportNotFoundError(identifier)
    path = (UPLOAD_DIR / submission["photo_storage_name"]).resolve()
    if path.parent != UPLOAD_DIR.resolve() or not path.is_file():
        raise ReportNotFoundError(identifier)
    return path, submission["photo_content_type"]


def get_public_status(report_id: str) -> dict[str, Any]:
    report = repository.get(report_id)
    if not report:
        raise ReportNotFoundError(report_id)
    submission = repository.get_submission(report_id)
    submission_status = submission["verification_status"] if submission else report["verification_status"]
    reported_at = submission["reported_at"] if submission else report["reported_at"]
    return {
        "report_id": report_id, "cluster_id": report["cluster_id"],
        "verification_status": submission_status,
        "cluster_verification_status": report["verification_status"],
        "reported_at": reported_at,
        "status_note": "Demo session status; data resets when the backend restarts.",
    }
