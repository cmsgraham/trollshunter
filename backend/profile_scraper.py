"""Fetch public profile info from X using syndication API + og: meta fallback."""

import re
import json
import httpx


async def fetch_x_profile(username: str) -> dict:
    """
    Fetch profile picture, display name, banner, bio, and recent posts from X.
    Primary: syndication.twitter.com (works from datacenter IPs).
    Fallback: x.com og: meta tags (works from residential IPs).
    """
    result = {
        "display_name": None,
        "profile_image_url": None,
        "banner_url": None,
        "bio": None,
        "followers_count": None,
    }

    try:
        # Primary: syndication API — reliable from server environments
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            res = await client.get(
                f"https://syndication.twitter.com/srv/timeline-profile/screen-name/{username}",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
            )
            if res.status_code == 200:
                text = res.text

                # Profile image
                img_match = re.search(
                    r'https://pbs\.twimg\.com/profile_images/[^"\\]+',
                    text,
                )
                if img_match:
                    img_url = img_match.group(0)
                    img_url = re.sub(r'_(?:bigger|normal|mini|200x200)', '_400x400', img_url)
                    result["profile_image_url"] = img_url

                # Banner
                banner_match = re.search(
                    r'https://pbs\.twimg\.com/profile_banners/\d+/\d+',
                    text,
                )
                if banner_match:
                    result["banner_url"] = banner_match.group(0) + "/1080x360"

                # Display name
                name_match = re.search(r'"name"\s*:\s*"([^"]+)"', text)
                if name_match:
                    result["display_name"] = name_match.group(1)

                # Bio / description
                bio_match = re.search(r'"description"\s*:\s*"([^"]*)"', text)
                if bio_match and bio_match.group(1):
                    result["bio"] = bio_match.group(1)

                # Followers count
                followers_match = re.search(r'"followers_count"\s*:\s*(\d+)', text)
                if followers_match:
                    result["followers_count"] = int(followers_match.group(1))



        # Fallback: og: meta tags (if syndication didn't get profile image)
        if not result["profile_image_url"]:
            async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
                res = await client.get(
                    f"https://x.com/{username}",
                    headers={
                        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
                    },
                )
                if res.status_code == 200:
                    html = res.text

                    og_image = re.search(
                        r'<meta\s+content="([^"]+)"\s+property="og:image"\s*/?>',
                        html,
                    )
                    if og_image:
                        img_url = og_image.group(1)
                        img_url = re.sub(r'_(?:200x200|normal)', '_400x400', img_url)
                        result["profile_image_url"] = img_url

                    if not result["display_name"]:
                        og_title = re.search(
                            r'<meta\s+content="([^"]+)"\s+property="og:title"\s*/?>',
                            html,
                        )
                        if og_title:
                            title = og_title.group(1)
                            name_match = re.match(r"^(.+?)\s*\(@", title)
                            if name_match:
                                result["display_name"] = name_match.group(1).strip()

                    if not result["bio"]:
                        og_desc = re.search(
                            r'<meta\s+content="([^"]+)"\s+property="og:description"\s*/?>',
                            html,
                        )
                        if og_desc:
                            result["bio"] = og_desc.group(1)

    except Exception:
        pass

    return result
