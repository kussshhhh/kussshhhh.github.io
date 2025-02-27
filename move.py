#!/usr/bin/env python3
"""
Script to generate graph data for notes visualization.
This script scans the 'notes' directory for markdown files,
extracts links between them, and saves the data as a JavaScript file.
"""

import os
import re
import json
import random
from pathlib import Path

# Configuration
NOTES_DIR = "notes"  # Directory containing markdown files
OUTPUT_FILE = "notesData.js"  # Output JavaScript file
GROUP_CATEGORIES = {  # Optional: categorize notes by content type
    "project": 1,
    "concept": 2,
    "person": 3,
    "quote": 4,
    "future": 5,
    "contact": 6,
    "default": 15  # Default group for uncategorized notes
}

def extract_links(content):
    """Extract wiki-style links from markdown content."""
    link_regex = r'\[\[([^\]\|]+)(\|.*?)?\]\]'
    links = []
    
    for match in re.finditer(link_regex, content):
        raw_link = match.group(1).strip()
        clean_link = raw_link.replace('.md', '')
        if clean_link not in links:
            links.append(clean_link)
    
    return links

def determine_group(filename, content):
    """Determine the group for a note based on content or filename."""
    # Simple categorization logic - extend as needed
    filename_lower = filename.lower()
    content_lower = content.lower()
    
    if 'project' in filename_lower or 'project' in content_lower[:500]:
        return GROUP_CATEGORIES['project']
    elif 'concept' in filename_lower or '## concept' in content_lower:
        return GROUP_CATEGORIES['concept']
    elif 'person' in filename_lower or 'person' in content_lower[:500]:
        return GROUP_CATEGORIES['person']
    elif filename_lower == 'quotes.md' or 'quote' in filename_lower:
        return GROUP_CATEGORIES['quote']
    elif 'future' in filename_lower:
        return GROUP_CATEGORIES['future']
    elif 'contact' in filename_lower:
        return GROUP_CATEGORIES['contact']
    else:
        # Assign a random group if no category matches
        return random.randint(1, 10)

def generate_graph_data():
    """Generate graph data from markdown files."""
    print(f"Scanning directory: {NOTES_DIR}")
    
    # Check if notes directory exists
    if not os.path.isdir(NOTES_DIR):
        print(f"Error: Directory '{NOTES_DIR}' not found.")
        return None
    
    notes_path = Path(NOTES_DIR)
    nodes = []
    links = []
    existing_edges = set()
    file_map = {}  # Map filenames to actual files (handle case sensitivity)
    
    # First pass: collect all files and create nodes
    for file_path in notes_path.glob('**/*.md'):
        rel_path = file_path.relative_to(notes_path)
        filename = str(rel_path).replace('\\', '/')  # Normalize path for Windows
        node_name = filename.replace('.md', '')
        
        # Store in file map for case-insensitive lookup
        file_map[node_name.lower()] = node_name
        
        # Read file content
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Determine group
            group = determine_group(filename, content)
            
            # Add node
            nodes.append({
                "id": node_name,
                "group": group
            })
            
            print(f"Added node: {node_name} (Group {group})")
            
        except Exception as e:
            print(f"Error reading file {filename}: {e}")
    
    # Second pass: extract links
    for node in nodes:
        node_name = node["id"]
        file_path = notes_path / f"{node_name}.md"
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            links_in_file = extract_links(content)
            
            # Add links
            for linked_file in links_in_file:
                # Look up the real filename (case sensitive)
                linked_lower = linked_file.lower()
                if linked_lower in file_map:
                    real_linked_file = file_map[linked_lower]
                    
                    # Create sorted edge key to prevent duplicates
                    edge_key = '|'.join(sorted([node_name, real_linked_file]))
                    if edge_key not in existing_edges:
                        links.append({
                            "source": node_name,
                            "target": real_linked_file,
                            "value": 1
                        })
                        existing_edges.add(edge_key)
                        print(f"Added link: {node_name} -> {real_linked_file}")
                else:
                    print(f"Warning: Link target '{linked_file}' in '{node_name}' not found")
                    
        except Exception as e:
            print(f"Error extracting links from {node_name}: {e}")
    
    return {"nodes": nodes, "links": links}

def save_as_js(data, filename):
    """Save graph data as a JavaScript file."""
    js_content = f"""// Auto-generated graph data for notes visualization
// Generated on: {import_time()}
// DO NOT EDIT MANUALLY

const graphData = {json.dumps(data, indent=2)};
"""
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Data saved to {filename}")
    print(f"Found {len(data['nodes'])} nodes and {len(data['links'])} links")

def import_time():
    """Get current time for file comment."""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

if __name__ == "__main__":
    print("Starting graph data generation...")
    data = generate_graph_data()
    
    if data:
        save_as_js(data, OUTPUT_FILE)
        print("Graph data generation complete!")
    else:
        print("Failed to generate graph data.")