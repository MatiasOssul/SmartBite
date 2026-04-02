"""
Pexels image service.

Requires PEXELS_API_KEY in the environment (backend/.env).
Get a free key at: https://www.pexels.com/api/
"""

import logging
import os

import httpx

logger = logging.getLogger("smartbite.images")

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
    api_key = os.getenv("PEXELS_API_KEY", "").strip()
    if not api_key:
        logger.warning("PEXELS_API_KEY not set — using fallback image")
        return _FALLBACK_URL

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(
                "https://api.pexels.com/v1/search",
                params={"query": keyword, "per_page": 1, "orientation": "landscape"},
                headers={"Authorization": api_key},
            )
            resp.raise_for_status()
            photos = resp.json().get("photos") or []
            if photos:
                return photos[0]["src"]["large"]
            logger.warning("Pexels returned 0 results for keyword: %r", keyword)
    except httpx.HTTPStatusError as e:
        logger.error("Pexels API error %s for keyword %r: %s", e.response.status_code, keyword, e.response.text[:200])
    except httpx.TimeoutException:
        logger.error("Pexels API timeout for keyword: %r", keyword)
    except Exception as e:
        logger.error("Pexels unexpected error for keyword %r: %s", keyword, e)

    return _FALLBACK_URL
