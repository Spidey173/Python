import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_unauthenticated_access_is_blocked():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Public read-only catalog can be explored by guests
        res_chap = await ac.get("/api/challenges/chapters")
        assert res_chap.status_code == 200

        res_detail = await ac.get("/api/challenges/1")
        assert res_detail.status_code == 200

        # Protected mutations and compute endpoints must return 401
        res3 = await ac.post("/api/execution/run", json={"challenge_id": 1, "code": "print(1)"})
        assert res3.status_code == 401

        res4 = await ac.post("/api/execution/submit", json={"challenge_id": 1, "code": "print(1)"})
        assert res4.status_code == 401

        res5 = await ac.get("/api/profile/me")
        assert res5.status_code == 401

        # AI tutor and explain endpoints are accessible to guests and users alike
        res6 = await ac.post("/api/ai/explain", json={"code": "print('hello')"})
        assert res6.status_code == 200

        res7 = await ac.post("/api/ai/tutor", json={"message": "hello", "code": "x = 1"})
        assert res7.status_code == 200


@pytest.mark.asyncio
async def test_get_chapters_and_levels_authenticated():
    uid = uuid.uuid4().hex[:6]
    username = f"ch_user_{uid}"
    email = f"ch_{uid}@pythonquest.io"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg = await ac.post("/api/auth/register", json={
            "username": username,
            "email": email,
            "password": "password123"
        })
        assert reg.status_code == 200
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await ac.get("/api/challenges/chapters", headers=headers)
        assert response.status_code == 200
        chapters = response.json()
        assert len(chapters) == 14
        total_levels = sum(len(c["levels"]) for c in chapters)
        assert total_levels == 70
        # First level should be unlocked
        assert chapters[0]["levels"][0]["locked"] is False


@pytest.mark.asyncio
async def test_get_challenge_detail_authenticated():
    uid = uuid.uuid4().hex[:6]
    username = f"det_user_{uid}"
    email = f"det_{uid}@pythonquest.io"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg = await ac.post("/api/auth/register", json={
            "username": username,
            "email": email,
            "password": "password123"
        })
        assert reg.status_code == 200
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await ac.get("/api/challenges/1", headers=headers)
        assert response.status_code == 200
        detail = response.json()
        assert detail["level_number"] == 1
        assert "Valid Palindrome" in detail["title"]
        assert len(detail["visible_test_cases"]) > 0


@pytest.mark.asyncio
async def test_case_insensitive_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        uid = uuid.uuid4().hex[:6]
        username = f"fresh_user_{uid}"
        email = f"fresh_{uid}@pythonquest.io"
        reg = await ac.post("/api/auth/register", json={
            "username": username,
            "email": email,
            "password": "password123"
        })
        assert reg.status_code == 200

        # Lowercase login
        res1 = await ac.post("/api/auth/login", json={"username": username, "password": "password123"})
        assert res1.status_code == 200

        # Uppercase / mixed
        res2 = await ac.post("/api/auth/login", json={"username": username.upper(), "password": "password123"})
        assert res2.status_code == 200

        # Email login
        res3 = await ac.post("/api/auth/login", json={"identifier": email, "password": "password123"})
        assert res3.status_code == 200

        # Bad password
        res4 = await ac.post("/api/auth/login", json={"username": "fresh_user", "password": "badpassword"})
        assert res4.status_code == 401


@pytest.mark.asyncio
async def test_user_registration_flow():
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
