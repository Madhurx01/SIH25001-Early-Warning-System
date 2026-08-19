import asyncio

from httpx import ASGITransport, AsyncClient

from app.main import app


def test_health_check() -> None:
    async def get_health():
        transport = ASGITransport(app=app)
        async with AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get("/api/health")

    response = asyncio.run(get_health())

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
