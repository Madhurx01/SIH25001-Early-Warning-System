import asyncio

from httpx import ASGITransport, AsyncClient

from app.main import app


def test_community_reports_endpoint() -> None:
    async def get_reports():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get("/api/community-reports")

    response = asyncio.run(get_reports())

    assert response.status_code == 200
    assert len(response.json()) >= 5


def test_community_report_response_structure() -> None:
    async def get_reports():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get("/api/community-reports")

    reports = asyncio.run(get_reports()).json()
    required_fields = {
        "id",
        "village_id",
        "village_name",
        "category",
        "description",
        "latitude",
        "longitude",
        "reported_at",
        "photo_url",
        "evidence_type",
        "report_count_nearby",
        "verification_status",
        "priority",
        "data_source",
    }

    assert all(required_fields <= report.keys() for report in reports)
    assert all(report["data_source"] == "synthetic" for report in reports)
    assert all(report["evidence_type"] == "DEMO_PHOTO_PLACEHOLDER" for report in reports)
    assert all(report["photo_url"] is None for report in reports)
    assert any(report["report_count_nearby"] > 1 for report in reports)
    assert any(report["category"] == "STAGNANT_WATER" for report in reports)
    assert any(report["verification_status"] == "VERIFIED_HAZARD" for report in reports)
