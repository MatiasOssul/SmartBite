"""
Pexels image service.

Requires PEXELS_API_KEY in the environment (backend/.env).
Get a free key at: https://www.pexels.com/api/
"""

import os

import httpx

# Reliable fallback — a generic food photo that will never 404
_FALLBACK_URL = (
    "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
    "?auto=compress&cs=tinysrgb&w=800"
)


def fetch_image_from_pexels(keyword: str) -> str:
    """
    Searches Pexels for `keyword` and returns the 'large' src URL of the
    first result.  Returns _FALLBACK_URL on any error (missing key, no
    results, network timeout, non-2xx response, etc.).
    """
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        return _FALLBACK_URL

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(
                "https://api.pexels.com/v1/search",
                params={"query": keyword, "per_page": 1, "orientation": "landscape"},
                headers={"Authorization": api_key},
            )
            resp.raise_for_status()
            photos = resp.json().get("photos") or []
            if photos:
                return photos[0]["src"]["large"]
    except Exception:
        pass

    return _FALLBACK_URL
