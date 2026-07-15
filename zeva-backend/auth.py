"""
JWT authentication for FastAPI using Better Auth's JWKS endpoint.

This module verifies JWT tokens issued by Better Auth (Next.js frontend)
using the JWKS (JSON Web Key Set) endpoint.
"""

import os
from typing import Annotated

from fastapi import Depends
from fastapi_betterauth import BetterAuth, User

# Better Auth base URL - where Next.js app runs.
# In production, set BETTER_AUTH_BASE_URL to the real deployed frontend origin.
BETTER_AUTH_BASE_URL = os.getenv("BETTER_AUTH_BASE_URL", "http://localhost:3000")

# `BetterAuth` is itself a FastAPI-injectable dependency (it subclasses
# HTTPBearer): it extracts the bearer token, verifies it against the JWKS
# endpoint in a threadpool, and returns the decoded user — use it directly.
# Do NOT call `.fetch_token()` yourself: it's a *sync* method, so `await`-ing
# it raises TypeError, which previously got swallowed into a false 401.
better_auth = BetterAuth(BETTER_AUTH_BASE_URL)

# Dependency type for routes that require authentication
CurrentUser = Annotated[User, Depends(better_auth)]
