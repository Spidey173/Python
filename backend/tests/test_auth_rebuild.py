import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_cookie_based_login_and_headers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["username"] == "admin"
        
        # Verify correlation ID
        assert "x-request-id" in res.headers
        assert "x-response-time-ms" in res.headers
        
        # Verify HttpOnly cookies
        cookies = res.cookies
        assert "access_token" in cookies
        assert "refresh_token" in cookies
        assert "csrf_token" in cookies


@pytest.mark.asyncio
async def test_cookie_only_auth_on_me_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Step 1: Login to get cookies
        login_res = await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert login_res.status_code == 200
        
        # Step 2: Call /api/auth/me without ANY Authorization header (Cookie only!)
        me_res = await ac.get("/api/auth/me")
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "admin"


@pytest.mark.asyncio
async def test_silent_refresh_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login
        await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        
        # Call /api/auth/refresh with the refresh_token cookie
        refresh_res = await ac.post("/api/auth/refresh")
        assert refresh_res.status_code == 200
        assert "access_token" in refresh_res.cookies


@pytest.mark.asyncio
async def test_typed_error_codes_and_rate_limiting():
    import uuid
    dummy_user = f"ratetest_{uuid.uuid4().hex[:6]}"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Test typed error on bad credentials
        res = await ac.post("/api/auth/login", json={"username": dummy_user, "password": "wrongpassword"})
        assert res.status_code == 401
        err_json = res.json()
        assert err_json["code"] == "INVALID_CREDENTIALS"
        assert "detail" in err_json
        assert "request_id" in err_json

        # 2. Trigger rate limit (5 failed attempts total)
        for _ in range(4):
            await ac.post("/api/auth/login", json={"username": dummy_user, "password": "wrongpassword"})
            
        # 6th attempt must be 429 Too Many Requests
        rate_res = await ac.post("/api/auth/login", json={"username": dummy_user, "password": "wrongpassword"})
        assert rate_res.status_code == 429
        rate_json = rate_res.json()
        assert rate_json["code"] == "RATE_LIMITED"
        assert "retry_after" in rate_json
        assert rate_json["retry_after"] > 0


@pytest.mark.asyncio
async def test_logout_clears_cookies():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        await ac.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        logout_res = await ac.post("/api/auth/logout")
        assert logout_res.status_code == 200
        # Cookie deletion sets max-age=0 or expires in past
        set_cookie_header = logout_res.headers.get("set-cookie", "")
        assert "access_token=" in set_cookie_header
