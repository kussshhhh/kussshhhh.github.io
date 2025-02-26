// parseNotes.js
async function getNotesData() {
    try {
      // Check if notes directory exists
      const response = await fetch('/notes');
      if (!response.ok) return null;
  
      // Recursively get all markdown files
      const files = await getAllMarkdownFiles('/notes');
      const nodes = [];
      const links = [];
      const existingEdges = new Set();
  
      // Process each file
      for (const file of files) {
        // Add node
        const nodeName = file.path.replace('/notes/', '').replace('.md', '');
        if (!nodes.find(n => n.id === nodeName)) {
          nodes.push({ id: nodeName, group: 1 });
        }
  
        // Parse file content
        const content = await fetch(file.url).then(res => res.text());
        const linksInFile = extractLinks(content);
  
        // Add links
        for (const linkedFile of linksInFile) {
          if (files.find(f => f.name === `${linkedFile}.md`)) {
            // Create sorted edge key to prevent duplicates
            const edgeKey = [nodeName, linkedFile].sort().join('|');
            if (!existingEdges.has(edgeKey)) {
              links.push({ source: nodeName, target: linkedFile, value: 1 });
              existingEdges.add(edgeKey);
            }
          }
        }
      }
  
      return { nodes, links };
    } catch (error) {
      console.error('Error loading notes:', error);
      return null;
    }
  }
  
  async function getAllMarkdownFiles(path) {
    const response = await fetch(path);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const files = [];
    const links = Array.from(doc.querySelectorAll('a'));
    
    for (const link of links) {
      const href = link.href;
      if (href.endsWith('/')) {
        files.push(...await getAllMarkdownFiles(href));
      } else if (href.endsWith('.md')) {
        files.push({
          name: href.split('/').pop(),
          path: href.replace(window.location.origin, ''),
          url: href
        });
      }
    }
    return files;
  }
  
  function extractLinks(content) {
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
    return links;
  }