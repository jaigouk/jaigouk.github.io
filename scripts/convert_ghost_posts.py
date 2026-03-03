#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "beautifulsoup4>=4.12",
#     "markdownify>=0.14",
# ]
# ///
"""Convert Ghost static HTML blog posts to Astro Modular markdown files."""

import json
import re
import sys
from datetime import datetime
from html import unescape
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag
from markdownify import MarkdownConverter

# Blog posts to convert (excluding pages: 404, about, contact, projects, rss)
POST_SLUGS = [
    "reboot",
    "grpc",
    "blockchain",
    "reactjs",
    "running-deis-on-aws",
    "in-berlin",
    "raspberry-pi-zero-w-for-iot-dev-env",
    "openfaas-on-tinkerboard-cluster",
    "message-queues",
    "openfaas-on-free-kubernetes",
    "evangelizing-openfaas-at-work",
    "map-to-future",
    "serverless-edge-computing",
    "switching-between-git-profiles",
    "istio",
    "work-env-in-covoid19-erra",
    "deploying-harbor",
    "host-ghost-blog-with-static-pages-on-github",
    "building-docker-image-for-rust",
    "gpt-3-codex",
]

DOCS_DIR = Path(__file__).parent.parent / "docs"
OUTPUT_DIR = Path(__file__).parent.parent / "src" / "content" / "posts"

# Dead image CDN domains - images are no longer accessible
DEAD_IMAGE_DOMAINS = [
    "files.jaigouk.com",
    "cdn.jaigouk.com",
    "s3.eu-central-1.amazonaws.com",  # old S3 bucket for cdn.jaigouk.com
]


def is_dead_image(url: str) -> bool:
    """Check if an image URL is from a dead CDN domain."""
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        return parsed.hostname in DEAD_IMAGE_DOMAINS
    except Exception:
        return False


class GhostConverter(MarkdownConverter):
    """Custom markdownify converter for Ghost HTML quirks."""

    def convert_pre(self, el, text, **kwargs):
        """Handle <pre><code> blocks, preserving language hints."""
        code_el = el.find("code")
        if code_el:
            # Try to get language from class
            lang = ""
            classes = code_el.get("class", [])
            if isinstance(classes, list):
                for cls in classes:
                    if cls.startswith("language-"):
                        lang = cls.replace("language-", "")
                        break
            # Get raw text, unescape HTML entities
            code_text = code_el.get_text()
            # Remove trailing newline if present
            code_text = code_text.rstrip("\n")
            return f"\n\n```{lang}\n{code_text}\n```\n\n"
        return f"\n\n```\n{text.strip()}\n```\n\n"

    def convert_figure(self, el, text, **kwargs):
        """Handle Ghost figure elements (images, embeds, bookmark cards)."""
        classes = el.get("class", [])
        if isinstance(classes, str):
            classes = classes.split()

        # Handle bookmark cards
        if "kg-bookmark-card" in classes:
            return self._convert_bookmark(el)

        # Handle image cards
        img = el.find("img")
        if img:
            src = img.get("src", "")
            alt = img.get("alt", "")
            figcaption = el.find("figcaption")
            caption = figcaption.get_text(strip=True) if figcaption else ""
            result = f"\n\n![{alt}]({src})"
            if caption:
                result += f"\n*{caption}*"
            return result + "\n\n"

        # Handle iframes (YouTube, etc.)
        iframe = el.find("iframe")
        if iframe:
            src = iframe.get("src", "")
            return f"\n\n[Embedded content]({src})\n\n"

        return text

    def _convert_bookmark(self, el):
        """Convert Ghost bookmark card to markdown link."""
        link = el.find("a", class_="kg-bookmark-container")
        if not link:
            link = el.find("a")
        if not link:
            return ""

        url = link.get("href", "")
        title_el = el.find(class_="kg-bookmark-title")
        desc_el = el.find(class_="kg-bookmark-description")
        title = title_el.get_text(strip=True) if title_el else url
        desc = desc_el.get_text(strip=True) if desc_el else ""

        result = f"\n\n> [{title}]({url})"
        if desc:
            result += f"\n> {desc}"
        return result + "\n\n"

    def convert_blockquote(self, el, text, **kwargs):
        """Clean up blockquotes."""
        lines = text.strip().split("\n")
        quoted = "\n".join(f"> {line}" for line in lines)
        return f"\n\n{quoted}\n\n"

    def convert_img(self, el, text, **kwargs):
        """Handle standalone images."""
        src = el.get("src", "")
        alt = el.get("alt", "")
        if not src:
            return ""
        return f"![{alt}]({src})"

    def convert_table(self, el, text, **kwargs):
        """Pass through tables as HTML since markdown tables are limited."""
        return f"\n\n{str(el)}\n\n"


def extract_json_ld(soup: BeautifulSoup) -> dict:
    """Extract metadata from JSON-LD script tag."""
    script = soup.find("script", type="application/ld+json")
    if not script:
        return {}
    try:
        return json.loads(script.string)
    except (json.JSONDecodeError, TypeError):
        return {}


def extract_tags(soup: BeautifulSoup) -> list[str]:
    """Extract tags from the postbottom section."""
    tags = []
    postbottom = soup.find("section", class_="postbottom")
    if postbottom:
        tags_div = postbottom.find("div", class_="tags")
        if tags_div:
            for a in tags_div.find_all("a", class_="tag"):
                tag_text = a.get_text(strip=True)
                if tag_text and tag_text.lower() != "posts":
                    tags.append(tag_text.lower())
    # Also check JSON-LD keywords
    return list(dict.fromkeys(tags))  # deduplicate preserving order


def extract_cover_image(soup: BeautifulSoup) -> str:
    """Extract cover image URL from the cover section background-image."""
    cover = soup.find("section", class_="cover")
    if cover:
        bg = cover.find("div", class_="background")
        if bg:
            style = bg.get("style", "")
            match = re.search(r"background-image:\s*url\(['\"]?([^'\")\s]+)['\"]?\)", style)
            if match:
                url = match.group(1)
                # Convert relative URLs to absolute
                if url.startswith("/content/images/"):
                    url = f"https://jaigouk.com{url}"
                return url
    return ""


def extract_content(soup: BeautifulSoup) -> str:
    """Extract and convert post content to markdown."""
    content_section = soup.find("section", class_="postcontents")
    if not content_section:
        return ""

    # Remove any kg-card-begin/end comments but keep content between them
    for comment in content_section.find_all(string=lambda text: isinstance(text, NavigableString) and isinstance(text, type(soup.new_string(""))) is False):
        pass

    converter = GhostConverter(
        heading_style="atx",
        bullets="-",
        strong_em_symbol="*",
        code_language="",
        escape_underscores=False,
        escape_asterisks=False,
        escape_misc=False,
        wrap=False,
        wrap_width=0,
    )

    md = converter.convert_soup(BeautifulSoup(str(content_section), "html.parser"))

    # Clean up the markdown
    md = clean_markdown(md)
    return md


def clean_markdown(md: str) -> str:
    """Clean up converted markdown."""
    # Remove HTML comments (Ghost kg-card markers)
    md = re.sub(r"<!--.*?-->", "", md, flags=re.DOTALL)

    # Replace dead image references with HTML comments
    # Match ![alt](url) where url is from a dead domain
    def replace_dead_image(match):
        alt = match.group(1)
        url = match.group(2)
        if is_dead_image(url):
            return f"<!-- image unavailable: {alt} ({url}) -->"
        return match.group(0)

    md = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", replace_dead_image, md)

    # Fix excessive blank lines (more than 2 consecutive)
    md = re.sub(r"\n{4,}", "\n\n\n", md)

    # Fix space issues around code blocks
    md = re.sub(r"```\n\n\n", "```\n\n", md)
    md = re.sub(r"\n\n\n```", "\n\n```", md)

    # Remove leading/trailing whitespace
    md = md.strip()

    # Ensure single trailing newline
    md += "\n"

    return md


def format_date(iso_date: str) -> str:
    """Format ISO date to YYYY-MM-DD."""
    try:
        dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, AttributeError):
        return datetime.now().strftime("%Y-%m-%d")


def truncate_description(desc: str, max_len: int = 160) -> str:
    """Truncate description to first sentence or max_len chars."""
    # Take only the first line
    first_line = desc.split("\n")[0].strip()
    # If short enough, use it
    if len(first_line) <= max_len:
        return first_line
    # Truncate at last word boundary before max_len
    truncated = first_line[:max_len].rsplit(" ", 1)[0]
    return truncated + "..."


def generate_frontmatter(metadata: dict) -> str:
    """Generate YAML frontmatter from metadata."""
    lines = ["---"]
    lines.append(f"title: \"{metadata['title']}\"")
    if metadata.get("description"):
        # Truncate to single line, escape quotes
        desc = truncate_description(metadata["description"]).replace('"', '\\"')
        lines.append(f"description: \"{desc}\"")
    lines.append(f"date: {metadata['date']}")
    if metadata.get("tags"):
        lines.append("tags:")
        for tag in metadata["tags"]:
            lines.append(f"  - {tag}")
    if metadata.get("image"):
        lines.append(f"image: \"{metadata['image']}\"")
    lines.append("author: Jaigouk Kim")
    lines.append("draft: false")
    lines.append("---")
    return "\n".join(lines)


def convert_post(slug: str) -> tuple[bool, str]:
    """Convert a single Ghost post to Astro markdown. Returns (success, message)."""
    html_path = DOCS_DIR / slug / "index.html"
    if not html_path.exists():
        return False, f"HTML file not found: {html_path}"

    html = html_path.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    # Extract metadata from JSON-LD
    ld = extract_json_ld(soup)
    if not ld:
        return False, f"No JSON-LD found in {slug}"

    # Build metadata
    title = unescape(ld.get("headline", slug))
    description = unescape(ld.get("description", ""))
    date_published = ld.get("datePublished", "")
    date = format_date(date_published)

    # Image from JSON-LD or cover section
    image_url = ""
    if "image" in ld:
        img_data = ld["image"]
        if isinstance(img_data, dict):
            image_url = img_data.get("url", "")
        elif isinstance(img_data, str):
            image_url = img_data
    if not image_url:
        image_url = extract_cover_image(soup)

    tags = extract_tags(soup)

    # Also grab keywords from JSON-LD if tags empty
    if not tags and "keywords" in ld:
        kw = ld["keywords"]
        if isinstance(kw, str):
            tags = [t.strip().lower() for t in kw.split(",") if t.strip().lower() != "posts"]
        elif isinstance(kw, list):
            tags = [t.lower() for t in kw if t.lower() != "posts"]

    # Remove dead image URLs from frontmatter
    if image_url and is_dead_image(image_url):
        image_url = ""

    metadata = {
        "title": title,
        "description": description,
        "date": date,
        "tags": tags,
        "image": image_url,
    }

    frontmatter = generate_frontmatter(metadata)

    # Extract and convert content
    content = extract_content(soup)
    if not content:
        return False, f"No content found in {slug}"

    # Write output
    output_path = OUTPUT_DIR / f"{slug}.md"
    output_path.write_text(f"{frontmatter}\n\n{content}", encoding="utf-8")

    return True, f"Converted: {slug} → {output_path.name} ({len(content)} chars)"


def main():
    """Convert all Ghost posts."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Converting {len(POST_SLUGS)} Ghost posts...")
    print(f"Source: {DOCS_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    success_count = 0
    fail_count = 0

    for slug in POST_SLUGS:
        ok, msg = convert_post(slug)
        status = "OK" if ok else "FAIL"
        print(f"  [{status}] {msg}")
        if ok:
            success_count += 1
        else:
            fail_count += 1

    print()
    print(f"Done: {success_count} converted, {fail_count} failed")
    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
