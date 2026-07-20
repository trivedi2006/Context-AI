import httpx
from typing import Dict, Any, Optional
from urllib.parse import urlencode
from app.config.settings import settings
from app.utils.logging import logger

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

def get_google_auth_url(redirect_uri: str) -> str:
    """
    Builds the Google OAuth login consent screen URL.
    """
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

async def exchange_google_code_for_token(code: str, redirect_uri: str) -> Optional[Dict[str, Any]]:
    """
    Exchanges Google authorization code for access token and fetches user info.
    """
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(GOOGLE_TOKEN_URL, data=data, timeout=10.0)
            if token_response.status_code != 200:
                logger.error(f"Google OAuth token exchange failed: {token_response.text}")
                return None

            tokens = token_response.json()
            access_token = tokens.get("access_token")

            # Fetch Google user profile
            headers = {"Authorization": f"Bearer {access_token}"}
            user_response = await client.get(GOOGLE_USERINFO_URL, headers=headers, timeout=10.0)
            if user_response.status_code != 200:
                logger.error(f"Google OAuth userinfo fetch failed: {user_response.text}")
                return None

            return user_response.json()
        except Exception as e:
            logger.error(f"Error during Google OAuth exchange: {str(e)}")
            return None
