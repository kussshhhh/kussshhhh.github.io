const graphData = {
  nodes: [
    { "id": "go", "group": 10 },
    { "id": "servers", "group": 8 },
    { "id": "scripts", "group": 8 },
    { "id": "projects", "group": 13 },
    { "id": "something", "group": 10 }
  ],
  links: [
    { "source": "go", "target": "servers", "value": 1 },
    { "source": "go", "target": "scripts", "value": 1 },
    { "source": "go", "target": "something", "value": 1 },
    { "source": "go", "target": "projects", "value": 1 }
  ]
};