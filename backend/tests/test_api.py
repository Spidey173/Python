import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_chapters_and_levels():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/challenges/chapters")
    assert response.status_code == 200
    chapters = response.json()
    assert len(chapters) == 14
    total_levels = sum(len(c["levels"]) for c in chapters)
    assert total_levels == 70
    # First level should be unlocked
    assert chapters[0]["levels"][0]["locked"] is False


@pytest.mark.asyncio
async def test_get_challenge_detail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/challenges/1")
    assert response.status_code == 200
    detail = response.json()
    assert detail["level_number"] == 1
    assert "Valid Palindrome" in detail["title"]
    assert len(detail["visible_test_cases"]) > 0


@pytest.mark.asyncio
async def test_guest_login_and_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/auth/guest")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["lives"] == 5
    assert data["user"]["role"] == "guest"
    assert data["user"]["username"].startswith("runner_")


@pytest.mark.asyncio
async def test_case_insensitive_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register a fresh user
        reg = await ac.post("/api/auth/register", json={
            "username": "fresh_user",
            "email": "fresh@pythonquest.io",
            "password": "password123"
        })
        assert reg.status_code == 200

        # Lowercase login
        res1 = await ac.post("/api/auth/login", json={"username": "fresh_user", "password": "password123"})
        assert res1.status_code == 200

        # Uppercase / mixed
        res2 = await ac.post("/api/auth/login", json={"username": "Fresh_User", "password": "password123"})
        assert res2.status_code == 200

        # Email login
        res3 = await ac.post("/api/auth/login", json={"identifier": "fresh@pythonquest.io", "password": "password123"})
        assert res3.status_code == 200

        # Bad password
        res4 = await ac.post("/api/auth/login", json={"username": "fresh_user", "password": "badpassword"})
        assert res4.status_code == 401


@pytest.mark.asyncio
async def test_user_registration_flow():
    import uuid
    uname = f"test_{uuid.uuid4().hex[:6]}"
    email = f"{uname}@example.com"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register new
        res = await ac.post("/api/auth/register", json={
            "username": uname,
            "email": email,
            "password": "validpassword123"
        })
        assert res.status_code == 200
        assert res.json()["user"]["role"] == "user"

        # Duplicate username rejection
        res_dup = await ac.post("/api/auth/register", json={
            "username": uname.upper(),
            "email": f"diff_{email}",
            "password": "validpassword123"
        })
        assert res_dup.status_code == 400
        assert "username is already taken" in res_dup.json()["detail"]

