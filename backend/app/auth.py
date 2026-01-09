import os
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional

# Load Auth0 details from your .env file
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]

# Check if we're in development mode (GCS not configured typically means dev mode)
# You can also set DEV_MODE=true explicitly
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true" or not os.getenv("GCS_BUCKET_NAME")

# This tells FastAPI where to look for the token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)
http_bearer = HTTPBearer(auto_error=False)

# Fetch the Auth0 public keys (JWKS)
# This is done once when the app starts
try:
    jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    jwks_response = requests.get(jwks_url)
    jwks_response.raise_for_status()
    jwks = jwks_response.json()
except requests.exceptions.RequestException as e:
    print(f"CRITICAL ERROR: Could not fetch JWKS from Auth0: {e}")
    jwks = None

def validate_token(
    token: Optional[str] = Depends(oauth2_scheme),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer)
) -> dict:
    """
    Validates the Auth0 Access Token and returns its decoded payload.
    In development mode, returns a mock token payload.
    """
    # In development mode, skip token validation and return a mock payload
    if DEV_MODE:
        return {
            "sub": "dev-user-123",
            "email": "dev@example.com",
            "name": "Development User",
            "iat": 1234567890,
            "exp": 9999999999,
        }
    
    # Extract token from either oauth2_scheme or http_bearer
    if not token and credentials:
        token = credentials.credentials
    elif not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if jwks is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Auth0 JWKS not loaded. Cannot validate token."
        )
        
    try:
        # Get the 'kid' (Key ID) from the token's header
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Error parsing token header: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not rsa_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find matching public key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Decode and validate the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTClaimsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid claims. Check audience and issuer.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )