#!/usr/bin/env python3
"""
Fetch blog content from Google Docs and generate blog_data.json

This script:
1. Connects to Google Docs API using service account credentials
2. Fetches document content by document ID
3. Parses content by ## Date headers
4. Extracts inline images and downloads them
5. Generates blog_data.json with all entries
"""

import os
import sys
import json
import re
import base64
import hashlib
import requests
from pathlib import Path
from datetime import datetime
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# Paths
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
IMAGES_DIR = ROOT_DIR / "images" / "blog"
BLOG_DATA_FILE = ROOT_DIR / "blog_data.json"
PROCESSED_FILE = SCRIPT_DIR / "processed.json"


def get_credentials():
    """Get Google API credentials from environment or file."""
    # First try environment variable (for GitHub Actions)
    creds_b64 = os.environ.get("GOOGLE_CREDENTIALS")
    if creds_b64:
        creds_json = base64.b64decode(creds_b64).decode("utf-8")
        creds_info = json.loads(creds_json)
        return service_account.Credentials.from_service_account_info(
            creds_info,
            scopes=["https://www.googleapis.com/auth/documents.readonly"]
        )
    
    # Fallback to local file (for testing)
    creds_file = SCRIPT_DIR / "credentials.json"
    if creds_file.exists():
        return service_account.Credentials.from_service_account_file(
            str(creds_file),
            scopes=["https://www.googleapis.com/auth/documents.readonly"]
        )
    
    raise ValueError(
        "No credentials found. Set GOOGLE_CREDENTIALS env var or "
        "place credentials.json in scripts/ folder."
    )


def get_doc_id() -> str:
    """Get Google Doc ID from environment or config."""
    doc_id = os.environ.get("GOOGLE_DOC_ID")
    if doc_id:
        return doc_id
    
    # Fallback to local config
    config_file = SCRIPT_DIR / "config.json"
    if config_file.exists():
        with open(config_file) as f:
            config = json.load(f)
            return config.get("doc_id", "")
    
    raise ValueError(
        "No document ID found. Set GOOGLE_DOC_ID env var or "
        "create scripts/config.json with 'doc_id' key."
    )


def fetch_document(service, doc_id: str) -> dict:
    """Fetch the Google Doc content."""
    try:
        document = service.documents().get(documentId=doc_id).execute()
        return document
    except HttpError as e:
        print(f"Error fetching document: {e}")
        sys.exit(1)


def extract_text_from_element(element: dict) -> str:
    """Extract text content from a document element."""
    text = ""
    if "textRun" in element:
        content = element["textRun"].get("content", "")
        text_style = element["textRun"].get("textStyle", {})
        
        # Handle formatting
        if text_style.get("bold"):
            content = f"**{content.strip()}**"
        if text_style.get("italic"):
            content = f"*{content.strip()}*"
        if text_style.get("link"):
            url = text_style["link"].get("url", "")
            content = f"[{content.strip()}]({url})"
        
        text += content
    return text


def download_image(url: str, image_id: str, date_slug: str) -> Optional[str]:
    """Download an image and return the local path."""
    try:
        # Create images directory if it doesn't exist
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        filename = f"{date_slug}_{image_id[:8]}.png"
        filepath = IMAGES_DIR / filename
        
        # Download if not already exists
        if not filepath.exists():
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"Downloaded: {filename}")
        
        # Return relative path for web
        return f"images/blog/{filename}"
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None


def parse_document(document: dict) -> list[dict]:
    """Parse the document and extract blog entries by ## Date headers."""
    entries = []
    current_entry = None
    current_content = []
    
    body = document.get("body", {})
    content = body.get("content", [])
    inline_objects = document.get("inlineObjects", {})
    
    for element in content:
        if "paragraph" not in element:
            continue
        
        paragraph = element["paragraph"]
        para_elements = paragraph.get("elements", [])
        
        # Build paragraph text
        para_text = ""
        para_images = []
        
        for elem in para_elements:
            if "textRun" in elem:
                para_text += extract_text_from_element(elem)
            elif "inlineObjectElement" in elem:
                # Handle inline images
                obj_id = elem["inlineObjectElement"].get("inlineObjectId")
                if obj_id and obj_id in inline_objects:
                    obj = inline_objects[obj_id]
                    embedded = obj.get("inlineObjectProperties", {}).get(
                        "embeddedObject", {}
                    )
                    image_props = embedded.get("imageProperties", {})
                    content_uri = image_props.get("contentUri") or embedded.get("contentUri")
                    
                    if content_uri:
                        para_images.append({
                            "id": obj_id,
                            "url": content_uri
                        })
        
        para_text = para_text.strip()
        
        # Check if this is a date header (## Date format)
        date_match = re.match(r"^##\s*(.+)$", para_text)
        
        if date_match:
            # Save previous entry if exists
            if current_entry and current_content:
                current_entry["content"] = current_content
                entries.append(current_entry)
            
            # Start new entry
            date_str = date_match.group(1).strip()
            date_slug = re.sub(r"[^a-z0-9]+", "_", date_str.lower()).strip("_")
            
            current_entry = {
                "date": date_str,
                "date_slug": date_slug,
                "timestamp": datetime.now().isoformat()
            }
            current_content = []
        
        elif current_entry is not None:
            # Add content to current entry
            if para_text:
                current_content.append({
                    "type": "text",
                    "content": para_text
                })
            
            # Add images
            for img in para_images:
                if current_entry:
                    local_path = download_image(
                        img["url"], 
                        img["id"], 
                        current_entry["date_slug"]
                    )
                    if local_path:
                        current_content.append({
                            "type": "image",
                            "src": local_path
                        })
    
    # Don't forget the last entry
    if current_entry and current_content:
        current_entry["content"] = current_content
        entries.append(current_entry)
    
    return entries


def load_existing_data() -> dict:
    """Load existing blog data."""
    if BLOG_DATA_FILE.exists():
        with open(BLOG_DATA_FILE) as f:
            return json.load(f)
    return {"entries": [], "last_updated": None}


def save_blog_data(entries: list[dict]):
    """Save blog data to JSON file."""
    data = {
        "entries": entries,
        "last_updated": datetime.now().isoformat()
    }
    with open(BLOG_DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {len(entries)} entries to blog_data.json")


def main():
    """Main entry point."""
    print("🚀 Fetching blog content from Google Docs...")
    
    # Get credentials and doc ID
    try:
        credentials = get_credentials()
        doc_id = get_doc_id()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        sys.exit(1)
    
    # Build the Docs API service
    service = build("docs", "v1", credentials=credentials)
    
    # Fetch and parse document
    print(f"📄 Fetching document: {doc_id[:10]}...")
    document = fetch_document(service, doc_id)
    
    print("📝 Parsing content...")
    entries = parse_document(document)
    
    if not entries:
        print("⚠️  No entries found. Make sure your doc has ## Date headers.")
        return
    
    # Sort entries by date (newest first)
    # Try to parse dates for sorting
    def parse_date(date_str):
        # Normalize the date string - handle case insensitivity
        normalized = date_str.strip()
        
        # Try various formats
        formats = [
            "%d %b, %Y",    # 9 dec, 2025
            "%d %B, %Y",    # 9 december, 2025
            "%B %d, %Y",    # December 9, 2025
            "%b %d, %Y",    # Dec 9, 2025
            "%d %B %Y",     # 9 December 2025
            "%d %b %Y",     # 9 Dec 2025
            "%Y-%m-%d",     # 2025-12-09
            "%d/%m/%Y",     # 09/12/2025
            "%m/%d/%Y",     # 12/09/2025
        ]
        
        for fmt in formats:
            try:
                # Try with title case (Dec) and lower case (dec)
                return datetime.strptime(normalized.title(), fmt)
            except ValueError:
                try:
                    return datetime.strptime(normalized, fmt)
                except ValueError:
                    continue
        
        # Fallback: try to extract just the day number for basic ordering
        day_match = re.search(r'(\d{1,2})', date_str)
        if day_match:
            return datetime(2025, 12, int(day_match.group(1)))
        
        return datetime.min
    
    entries.sort(key=lambda x: parse_date(x["date"]), reverse=True)
    
    # Save to JSON
    save_blog_data(entries)
    
    print(f"✅ Done! Found {len(entries)} blog entries.")
    for entry in entries[:5]:  # Show first 5
        print(f"   - {entry['date']}")
    if len(entries) > 5:
        print(f"   ... and {len(entries) - 5} more")


if __name__ == "__main__":
    main()
