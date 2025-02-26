// parseNotes.js - Updated with debug logging
console.log("parseNotes.js loaded successfully");

// This is a fallback function that will be used only if graph_data.js fails to load
async function getNotesData() {
  console.log("getNotesData() called");
  
  // Check if graphData is already available (from graph_data.js)
  if (typeof graphData !== 'undefined') {
    console.log("Using pre-generated graph data", graphData);
    return graphData;
  }
  
  console.log("Pre-generated graph data not found, attempting to scan notes directory");
  
  try {
    // Check if notes directory exists
    console.log("Checking if notes directory exists...");
    const response = await fetch('/notes');
    console.log("Notes directory response:", response.status, response.statusText);
    
    if (!response.ok) {
      console.error("Notes directory not accessible. Status:", response.status);
      return null;
    }
  
    // Recursively get all markdown files
    console.log("Fetching markdown files...");
    const files = await getAllMarkdownFiles('/notes');
    console.log("Found files:", files);
    
    const nodes = [];
    const links = [];
    const existingEdges = new Set();
  
    // Process each file
    console.log("Processing files to build graph...");
    for (const file of files) {
      // Add node
      const nodeName = file.path.replace('/notes/', '').replace('.md', '');
      console.log(`Processing node: ${nodeName}`);
      
      if (!nodes.find(n => n.id === nodeName)) {
        nodes.push({ id: nodeName, group: 1 });
        console.log(`Added node: ${nodeName}`);
      }
  
      // Parse file content
      try {
        console.log(`Fetching content for: ${file.url}`);
        const content = await fetch(file.url).then(res => {
          if (!res.ok) {
            console.error(`Failed to fetch ${file.url}: ${res.status}`);
            throw new Error(`Failed to fetch ${file.url}: ${res.status}`);
          }
          return res.text();
        });
        
        console.log(`Extracting links from: ${nodeName}`);
        const linksInFile = extractLinks(content);
        console.log(`Found links in ${nodeName}:`, linksInFile);
  
        // Add links
        for (const linkedFile of linksInFile) {
          if (files.find(f => f.name === `${linkedFile}.md`)) {
            // Create sorted edge key to prevent duplicates
            const edgeKey = [nodeName, linkedFile].sort().join('|');
            if (!existingEdges.has(edgeKey)) {
              links.push({ source: nodeName, target: linkedFile, value: 1 });
              existingEdges.add(edgeKey);
              console.log(`Added link: ${nodeName} -> ${linkedFile}`);
            }
          } else {
            console.warn(`Link target not found: ${linkedFile} (referenced in ${nodeName})`);
          }
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.path}:`, fileError);
      }
    }
  
    const result = { nodes, links };
    console.log("Final graph data:", result);
    return result;
    
  } catch (error) {
    console.error('Error loading notes:', error);
    console.error('Error stack:', error.stack);
    return null;
  }
}
  
async function getAllMarkdownFiles(path) {
  console.log(`getAllMarkdownFiles() called with path: ${path}`);
  try {
    const response = await fetch(path);
    console.log(`Directory listing response for ${path}:`, response.status);
    
    if (!response.ok) {
      console.error(`Failed to get directory listing for ${path}: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const files = [];
    const links = Array.from(doc.querySelectorAll('a'));
    console.log(`Found ${links.length} links in directory ${path}`);
    
    for (const link of links) {
      const href = link.href;
      console.log(`Processing link: ${href}`);
      
      if (href.endsWith('/')) {
        console.log(`${href} is a directory, recursing...`);
        const subFiles = await getAllMarkdownFiles(href);
        console.log(`Found ${subFiles.length} files in subdirectory ${href}`);
        files.push(...subFiles);
      } else if (href.endsWith('.md')) {
        console.log(`${href} is a markdown file, adding to list`);
        files.push({
          name: href.split('/').pop(),
          path: href.replace(window.location.origin, ''),
          url: href
        });
      }
    }
    return files;
  } catch (error) {
    console.error(`Error in getAllMarkdownFiles(${path}):`, error);
    console.error('Error stack:', error.stack);
    return [];
  }
}
  
function extractLinks(content) {
  console.log("extractLinks() called");
  const linkRegex = /\[\[([^\]\|]+)(\|.*?)?\]\]/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const rawLink = match[1].trim();
    const cleanLink = rawLink.replace(/\.md$/, '');
    if (!links.includes(cleanLink)) {
      links.push(cleanLink);
    }
  }
  console.log(`Extracted ${links.length} links`);
  return links;
}