import asyncio

from httpx import ASGITransport, AsyncClient, Response

from app.main import app
from app.services import community_reports as community_report_service


def request(method: str, path: str, **kwargs) -> Response:
    async def make_request() -> Response:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.request(method, path, **kwargs)
    return asyncio.run(make_request())


def test_village_operational_detail_and_invalid_id() -> None:
    response = request("GET", "/api/villages/ASM-CCH-001")
    assert response.status_code == 200
    payload = response.json()
    assert payload["risk_score"] != payload["confidence_score"]
    assert payload["priority_drivers"]
    assert len(payload["evidence"]) == 4
    assert payload["location_note"].startswith("Demo village")
    assert request("GET", "/api/villages/UNKNOWN").status_code == 404


def test_village_trend_and_related_endpoints() -> None:
    trend = request("GET", "/api/villages/ASM-HLK-004/trend")
    assert trend.status_code == 200
    assert trend.json()["village_id"] == "ASM-HLK-004"
    assert len(trend.json()["weeks"]) >= 8
    assert request("GET", "/api/villages/UNKNOWN/trend").status_code == 404
    assert request("GET", "/api/villages/ASM-HLK-004/community-reports").status_code == 200
    assert request("GET", "/api/villages/ASM-HLK-004/tasks").status_code == 200


def test_task_list_detail_and_status_validation() -> None:
    listed = request("GET", "/api/tasks")
    assert listed.status_code == 200
    assert listed.json()[0]["status"] in {"OPEN", "ASSIGNED", "IN_PROGRESS", "VERIFIED", "CLOSED"}
    detail = request("GET", "/api/tasks/TASK-001")
    assert detail.status_code == 200
    assert detail.json()["task_type"] == "WATER_TEST"
    updated = request("PATCH", "/api/tasks/TASK-001/status", json={"status": "ASSIGNED"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "ASSIGNED"
    invalid = request("PATCH", "/api/tasks/TASK-002/status", json={"status": "NOT_A_STATUS"})
    assert invalid.status_code == 422
    assert request("GET", "/api/tasks/UNKNOWN").status_code == 404


def test_closed_task_is_hidden_from_village_but_retained_in_surveillance() -> None:
    for status in ("IN_PROGRESS", "VERIFIED", "CLOSED"):
        response = request("PATCH", "/api/tasks/TASK-003/status", json={"status": status})
        assert response.status_code == 200

    village_tasks = request("GET", "/api/villages/ASM-KRG-005/tasks").json()
    all_tasks = request("GET", "/api/tasks").json()

    assert all(task["id"] != "TASK-003" for task in village_tasks)
    assert any(task["id"] == "TASK-003" and task["status"] == "CLOSED" for task in all_tasks)


def test_community_detail_status_and_risk_boundary() -> None:
    before_risk = request("GET", "/api/villages/ASM-HLK-004").json()["risk_score"]
    detail = request("GET", "/api/community-reports/CR-001")
    assert detail.status_code == 200
    assert detail.json()["cluster_id"]
    updated = request("PATCH", "/api/community-reports/CR-001/status", json={"status": "VERIFIED_HAZARD"})
    assert updated.status_code == 200
    assert "future model/evidence engine" in updated.json()["risk_boundary_notice"]
    after_risk = request("GET", "/api/villages/ASM-HLK-004").json()["risk_score"]
    assert after_risk == before_risk
    invalid = request("PATCH", "/api/community-reports/CR-002/status", json={"status": "CONFIRMED_DISEASE"})
    assert invalid.status_code == 422
    assert request("GET", "/api/community-reports/UNKNOWN").status_code == 404


def test_citizen_submission_without_image_and_status_lookup() -> None:
    response = request("POST", "/api/community-reports", data={
        "village_id": "TRP-DLI-013", "category": "OTHER_ENVIRONMENTAL_HAZARD",
        "description": "Demo obstruction near a shared drain",
    })
    assert response.status_code == 201
    payload = response.json()
    assert payload["verification_status"] == "UNVERIFIED"
    assert payload["report_id"].startswith("CR-")
    lookup = request("GET", f"/api/community-reports/{payload['report_id']}/status")
    assert lookup.status_code == 200
    assert lookup.json()["verification_status"] == "UNVERIFIED"


def test_citizen_submission_with_valid_image_and_invalid_type(tmp_path, monkeypatch) -> None:
    upload_dir = tmp_path / "uploads"
    monkeypatch.setattr(community_report_service, "UPLOAD_DIR", upload_dir)
    png = b"\x89PNG\r\n\x1a\n" + b"demo-image-content"
    valid = request(
        "POST", "/api/community-reports",
        data={"village_id": "MNP-IMP-008", "category": "OTHER_ENVIRONMENTAL_HAZARD"},
        files={"photo": ("unsafe original name.png", png, "image/png")},
    )
    assert valid.status_code == 201
    report = request("GET", f"/api/community-reports/{valid.json()['report_id']}").json()
    assert report["evidence_type"] == "CITIZEN_SUBMITTED_PHOTO"
    assert report["photo_url"].startswith("/api/community-reports/")
    assert request("GET", report["photo_url"]).status_code == 200
    assert len(list(upload_dir.iterdir())) == 1
    invalid = request(
        "POST", "/api/community-reports",
        data={"village_id": "MNP-IMP-008", "category": "FLOODED_AREA"},
        files={"photo": ("payload.txt", b"not an image", "text/plain")},
    )
    assert invalid.status_code == 422
    assert len(list(upload_dir.iterdir())) == 1


def test_clustered_reports_retain_their_own_photo_evidence(tmp_path, monkeypatch) -> None:
    upload_dir = tmp_path / "uploads"
    monkeypatch.setattr(community_report_service, "UPLOAD_DIR", upload_dir)
    first_png = b"\x89PNG\r\n\x1a\nfirst-report-evidence"
    second_png = b"\x89PNG\r\n\x1a\nsecond-report-evidence"
    form = {
        "village_id": "MIZ-AIZ-012",
        "category": "BROKEN_WATER_PIPELINE",
        "latitude": "23.6600",
        "longitude": "92.7800",
    }

    first = request(
        "POST",
        "/api/community-reports",
        data={**form, "description": "First submitted observation"},
        files={"photo": ("first.png", first_png, "image/png")},
    )
    second = request(
        "POST",
        "/api/community-reports",
        data={
            **form,
            "description": "Second submitted observation",
            "latitude": "23.6602",
            "longitude": "92.7802",
        },
        files={"photo": ("second.png", second_png, "image/png")},
    )

    assert first.status_code == second.status_code == 201
    first_payload, second_payload = first.json(), second.json()
    assert second_payload["clustered"] is True
    assert first_payload["cluster_id"] == second_payload["cluster_id"]

    first_photo = request("GET", f"/api/community-reports/{first_payload['report_id']}/photo")
    second_photo = request("GET", f"/api/community-reports/{second_payload['report_id']}/photo")
    assert first_photo.status_code == second_photo.status_code == 200
    assert first_photo.content == first_png
    assert second_photo.content == second_png

    first_detail = request("GET", f"/api/community-reports/{first_payload['report_id']}").json()
    second_detail = request("GET", f"/api/community-reports/{second_payload['report_id']}").json()
    assert first_detail["photo_url"].endswith(f"/{first_payload['report_id']}/photo")
    assert second_detail["photo_url"].endswith(f"/{second_payload['report_id']}/photo")
    assert first_detail["description"] == "First submitted observation"
    assert second_detail["description"] == "Second submitted observation"

    cluster = request("GET", f"/api/community-reports/{first_payload['cluster_id']}").json()
    assert cluster["id"] == first_payload["report_id"]
    assert cluster["photo_report_ids"] == [first_payload["report_id"], second_payload["report_id"]]
    assert cluster["representative_photo_report_id"] == second_payload["report_id"]
    assert len(list(upload_dir.iterdir())) == 2


def test_invalid_report_fields_are_rejected_before_image_storage(tmp_path, monkeypatch) -> None:
    upload_dir = tmp_path / "uploads"
    monkeypatch.setattr(community_report_service, "UPLOAD_DIR", upload_dir)
    png = b"\x89PNG\r\n\x1a\n" + b"demo-image-content"

    invalid = request(
        "POST", "/api/community-reports",
        data={"village_id": "UNKNOWN", "category": "FLOODED_AREA"},
        files={"photo": ("evidence.png", png, "image/png")},
    )

    assert invalid.status_code == 422
    assert not upload_dir.exists()


def test_submission_requires_latitude_and_longitude_together() -> None:
    latitude_only = request(
        "POST", "/api/community-reports",
        data={
            "village_id": "TRP-DLI-014", "category": "FLOODED_AREA",
            "latitude": "23.95",
        },
    )
    longitude_only = request(
        "POST", "/api/community-reports",
        data={
            "village_id": "TRP-DLI-014", "category": "FLOODED_AREA",
            "longitude": "92.04",
        },
    )

    assert latitude_only.status_code == 422
    assert longitude_only.status_code == 422
    assert "supplied together" in latitude_only.json()["detail"]
    assert "supplied together" in longitude_only.json()["detail"]


def test_demo_clustering_links_nearby_recent_reports() -> None:
    form = {
        "village_id": "TRP-DLI-014", "category": "OTHER_ENVIRONMENTAL_HAZARD",
        "latitude": "23.9500", "longitude": "92.0400",
    }
    first = request("POST", "/api/community-reports", data=form)
    second = request("POST", "/api/community-reports", data={**form, "latitude": "23.9502", "longitude": "92.0402"})
    assert first.status_code == second.status_code == 201
    assert second.json()["clustered"] is True
    assert second.json()["cluster_id"] == first.json()["cluster_id"]
    assert second.json()["report_count_nearby"] == first.json()["report_count_nearby"] + 1


def test_new_submission_preserves_reviewed_cluster_status() -> None:
    form = {
        "village_id": "TRP-UNK-015",
        "category": "GARBAGE_NEAR_WATER_SOURCE",
        "latitude": "24.3300",
        "longitude": "92.0100",
    }
    first = request("POST", "/api/community-reports", data=form)
    assert first.status_code == 201

    cluster_id = first.json()["cluster_id"]
    reviewed = request(
        "PATCH",
        f"/api/community-reports/{cluster_id}/status",
        json={"status": "VERIFIED_HAZARD"},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["verification_status"] == "VERIFIED_HAZARD"

    second = request(
        "POST",
        "/api/community-reports",
        data={**form, "latitude": "24.3302", "longitude": "92.0102"},
    )
    assert second.status_code == 201
    assert second.json()["clustered"] is True
    assert second.json()["cluster_id"] == cluster_id
    assert second.json()["verification_status"] == "UNVERIFIED"
    assert second.json()["cluster_verification_status"] == "VERIFIED_HAZARD"

    cluster = request("GET", f"/api/community-reports/{cluster_id}")
    status = request("GET", f"/api/community-reports/{second.json()['report_id']}/status")
    assert cluster.status_code == status.status_code == 200
    assert cluster.json()["verification_status"] == "VERIFIED_HAZARD"
    assert status.json()["verification_status"] == "UNVERIFIED"
    assert status.json()["cluster_verification_status"] == "VERIFIED_HAZARD"


def test_submission_rejects_unknown_village_and_category() -> None:
    assert request("POST", "/api/community-reports", data={"village_id": "UNKNOWN", "category": "FLOODED_AREA"}).status_code == 422
    assert request("POST", "/api/community-reports", data={"village_id": "TRP-DLI-014", "category": "DIAGNOSE_DENGUE"}).status_code == 422
