"""
JWT authentication for FastAPI using Better Auth's JWKS endpoint.

This module verifies JWT tokens issued by Better Auth (Next.js frontend)
using the JWKS (JSON Web Key Set) endpoint.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi_betterauth import BetterAuth, User

# Better Auth base URL - where Next.js app runs
# In production, this should be your actual domain
BETTER_AUTH_BASE_URL = "http://localhost:3000"

# Create Better Auth instance
better_auth = BetterAuth(BETTER_AUTH_BASE_URL)

# HTTP Bearer token extractor
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Extract and verify JWT token from Authorization header.
    
    Returns the decoded user payload if token is valid.
    Raises 401 if token is missing, invalid, or expired.
    """
    try:
        user = await better_auth.fetch_token(credentials.credentials)
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency type for routes that require authentication
CurrentUser = Annotated[User, Depends(get_current_user)]
