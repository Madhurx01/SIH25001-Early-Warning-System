import asyncio

from httpx import ASGITransport, AsyncClient, Response

from app.main import app


def get(path: str) -> Response:
    async def make_request() -> Response:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get(path)

    return asyncio.run(make_request())


def test_dashboard_overview() -> None:
    response = get("/api/dashboard/overview")
    payload = response.json()

    assert response.status_code == 200
    assert payload["total_villages"] == 15
    assert payload["normal"] + payload["preparedness"] + payload["high_risk"] == 15
    assert payload["stale_water_tests"] == 4
    assert payload["data_source"] == "synthetic"


def test_rainfall_disease_trend() -> None:
    response = get("/api/dashboard/rainfall-disease-trend")
    payload = response.json()

    assert response.status_code == 200
    assert payload["data_source"] == "synthetic"
    assert 8 <= len(payload["weeks"]) <= 12
    assert all(
        {"week_start", "label", "rainfall_mm", "reported_cases"} <= week.keys()
        for week in payload["weeks"]
    )
    assert all(week["rainfall_mm"] >= 0 for week in payload["weeks"])
    assert all(week["reported_cases"] >= 0 for week in payload["weeks"])
    assert "does not establish causation" in payload["disclaimer"]
    assert "statistically" in payload["future_analysis_note"]


def test_villages_are_risk_sorted_and_filterable() -> None:
    response = get("/api/villages")
    villages = response.json()

    assert response.status_code == 200
    assert len(villages) == 15
    assert villages[0]["risk_score"] >= villages[-1]["risk_score"]
    assert all(village["data_source"] == "synthetic" for village in villages)

    filtered = get("/api/villages?alert_level=HIGH&needs_verification=true").json()
    assert filtered
    assert all(village["alert_level"] == "HIGH" for village in filtered)
    assert all(village["needs_verification"] for village in filtered)


def test_valid_village_detail() -> None:
    response = get("/api/villages/ASM-CCH-001")
    payload = response.json()

    assert response.status_code == 200
    assert payload["id"] == "ASM-CCH-001"
    assert "confidence_score" in payload
    assert payload["data_source"] == "synthetic"


def test_invalid_village_detail() -> None:
    response = get("/api/villages/DOES-NOT-EXIST")

    assert response.status_code == 404
    assert response.json()["detail"] == "Village not found"
