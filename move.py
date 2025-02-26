#!/usr/bin/env python3
"""
Script to generate notes graph data for a static website.
This script scans the 'notes' directory for markdown files, extracts link relationships,
and produces a JavaScript file with the graph data.
"""

import os
import re
import json
import random

# Configuration
NOTES_DIR = 'notes'  # Directory containing markdown files
OUTPUT_FILE = 'notesData.js'  # JavaScript file to generate
GROUP_CATEGORIES = 20  # Number of color categories for nodes

def extract_links(content):
    """Extract wiki-style links from markdown content."""
    link_pattern = r'\[\[([^\]\|]+)(\|.*?)?\]\]'
    links = []
    
    for match in re.finditer(link_pattern, content):
        raw_link = match.group(1).strip()
        clean_link = raw_link.replace('.md', '')
        if clean_link not in links:
            links.append(clean_link)
    
    return links

def generate_notes_data():
    """Generate the graph data from markdown files."""
    nodes = []
    links = []
    existing_edges = set()
    
    # Check if notes directory exists
    if not os.path.isdir(NOTES_DIR):
        print(f"Warning: '{NOTES_DIR}' directory not found!")
        return [], []
    
    # Process all markdown files
    for filename in os.listdir(NOTES_DIR):
        if not filename.endswith('.md'):
            continue
            
        node_name = filename[:-3]  # Remove .md extension
        
        # Add node if not already in the list
        if not any(node['id'] == node_name for node in nodes):
            # Assign a consistent group (for color) based on the name
            # This ensures the same note always gets the same color
            group = hash(node_name) % GROUP_CATEGORIES + 1
            nodes.append({'id': node_name, 'group': group})
        
        # Parse file content
        try:
            with open(os.path.join(NOTES_DIR, filename), 'r', encoding='utf-8') as file:
                content = file.read()
                
            # Extract links from content
            links_in_file = extract_links(content)
            
            # Add links
            for linked_file in links_in_file:
                # Check if linked file exists
                if os.path.exists(os.path.join(NOTES_DIR, f"{linked_file}.md")):
                    # Create sorted edge key to prevent duplicates
                    edge_key = '|'.join(sorted([node_name, linked_file]))
                    if edge_key not in existing_edges:
                        links.append({
                            'source': node_name, 
                            'target': linked_file, 
                            'value': 1
                        })
                        existing_edges.add(edge_key)
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    print(f"Processed {len(nodes)} nodes and {len(links)} links")
    return nodes, links

def write_js_file(nodes, links):
    """Write nodes and links to a JavaScript file."""
    js_content = f"""// Auto-generated notes graph data
// Generated on: {import_stats}
const notesData = {{
  nodes: {json.dumps(nodes, indent=2)},
  links: {json.dumps(links, indent=2)}
}};
"""
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as file:
        file.write(js_content)
    
    print(f"Generated {OUTPUT_FILE} with {len(nodes)} nodes and {len(links)} links")

def update_html_file():
    """Check if notes.html needs to be updated to include the data file."""
    try:
        # Read the HTML file
        with open('notes.html', 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Check if our data file is already included
        if f'<script src="{OUTPUT_FILE}"></script>' in content:
            print("notes.html already includes the data file")
            return
        
        # Add our script right before parseNotes.js
        updated_content = content.replace(
            '<script src="parseNotes.js"></script>',
            f'<script src="{OUTPUT_FILE}"></script>\n  <script src="parseNotes.js"></script>'
        )
        
        # Write the updated HTML
        with open('notes.html', 'w', encoding='utf-8') as file:
            file.write(updated_content)
            
        print("Updated notes.html to include the data file")
    except Exception as e:
        print(f"Error updating HTML file: {e}")
        print("You may need to manually add this line to your HTML file:")
        print(f'<script src="{OUTPUT_FILE}"></script>')

if __name__ == "__main__":
    import_stats = "imported directly"
    nodes, links = generate_notes_data()
    write_js_file(nodes, links)
    update_html_file()