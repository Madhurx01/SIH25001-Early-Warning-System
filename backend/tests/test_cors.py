import asyncio

from httpx import ASGITransport, AsyncClient
import pytest

from app.main import ALLOWED_CORS_ORIGINS, app


def request_with_origin(origin: str):
    async def make_request():
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.get("/api/public/villages", headers={"Origin": origin})

    return asyncio.run(make_request())


@pytest.mark.parametrize("origin", ALLOWED_CORS_ORIGINS)
def test_public_villages_allows_configured_frontend_origins(origin: str) -> None:
    response = request_with_origin(origin)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert response.headers["access-control-allow-credentials"] == "true"


def test_public_villages_does_not_allow_unconfigured_origins() -> None:
    response = request_with_origin("https://untrusted.example")

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
