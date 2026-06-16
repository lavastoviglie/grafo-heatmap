function buildGroupedData(data) {
  const { word_to_group, word_groups } = data;
  if (!word_groups || Object.keys(word_groups).length === 0) return data;

  const groupedWords = new Set(Object.keys(word_to_group));
  const groupNodes = {};
  for (const [gid, group] of Object.entries(word_groups)) {
    const members = data.nodes.filter(n => word_to_group[n.id] === gid);
    if (members.length === 0) continue;
    const totalFreq = members.reduce((s, n) => s + n.frequency, 0);
    groupNodes[gid] = {
      id: `__group_${gid}`,
      label: group.centroid_word,
      size: Math.max(...members.map(n => n.size)),
      frequency: totalFreq,
      fontSize: 14,
      isGroup: true
    };
  }

  const individualNodes = data.nodes.filter(n => !groupedWords.has(n.id));
  const mergedNodes = [...individualNodes, ...Object.values(groupNodes)];

  const edgeMap = {};
  for (const edge of data.edges) {
    const fg = word_to_group[edge.from];
    const tg = word_to_group[edge.to];
    if (fg !== undefined && tg !== undefined && fg === tg) continue;
    const fid = fg !== undefined ? `__group_${fg}` : edge.from;
    const tid = tg !== undefined ? `__group_${tg}` : edge.to;
    if (fid === tid) continue;
    const key = fid < tid ? `${fid}|${tid}` : `${tid}|${fid}`;
    edgeMap[key] = (edgeMap[key] || 0) + edge.weight;
  }

  const mergedEdges = Object.entries(edgeMap).map(([key, weight]) => {
    const [from, to] = key.split('|');
    return { from, to, weight };
  });

  return { ...data, nodes: mergedNodes, edges: mergedEdges };
}

function renderGraph(data) {
  const container = document.getElementById('graph');
  const threshold = parseInt(document.getElementById('edge-threshold').value) / 100;
  const edgeOpacity = parseInt(document.getElementById('edge-opacity').value) / 100;
  const isLight = document.getElementById('app').classList.contains('theme-light');
  const textColor = isLight ? '#333' : '#e0e0e0';
  const borderColor = isLight ? '#ccc' : '#0f3460';

  const isGrouped = document.getElementById('group-toggle').checked;
  const graphData = (isGrouped && data.word_groups && Object.keys(data.word_groups).length > 0)
    ? buildGroupedData(data) : data;

  const maxFreq = Math.max(...graphData.nodes.map(n => n.frequency), 1);
  const maxEdgeWeight = Math.max(...graphData.edges.map(e => e.weight), 1);

  const nodes = graphData.nodes.map(n => ({
    id: n.id,
    label: n.label,
    value: n.frequency,
    size: n.isGroup ? Math.max(n.size, 25) : n.size,
    font: { size: n.isGroup ? 16 : 9 + 6 * (n.frequency / maxFreq), color: textColor, face: 'Segoe UI', bold: n.isGroup ? true : false },
    borderWidth: n.isGroup ? 2 : 1,
    borderWidthSelected: 3,
    color: n.isGroup ? {
      background: '#e94560',
      border: '#ff6b81',
      highlight: { background: '#ff6b81', border: '#fff' },
      hover: { background: '#ff6b81', border: '#fff' }
    } : {
      background: getNodeColor(n.frequency, graphData.nodes),
      border: borderColor,
      highlight: { background: '#e94560', border: '#fff' },
      hover: { background: '#e94560', border: '#fff' }
    }
  }));

  const filteredEdges = graphData.edges.filter(e => e.weight / maxEdgeWeight >= threshold);
  const edgeColor = `rgba(233,69,96,${edgeOpacity})`;
  const edges = filteredEdges.map(e => ({
    from: e.from,
    to: e.to,
    width: Math.max(0.3, e.weight / maxEdgeWeight * 2),
    color: { color: edgeColor, highlight: '#e94560', hover: '#e94560' },
    smooth: false
  }));

  const visNodes = new vis.DataSet(nodes);
  const visEdges = new vis.DataSet(edges);

  const options = {
    nodes: {
      shape: 'dot',
      scaling: { min: 8, max: 35, label: { min: 8, max: 20, drawThreshold: 4 } },
      font: { size: 11 }
    },
    edges: { smooth: false },
    physics: {
      enabled: physicsEnabled,
      stabilization: { iterations: 50 },
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -40,
        centralGravity: 0.005,
        springLength: parseInt(document.getElementById('node-dist').value),
        springConstant: 0.08,
        damping: 0.4
      },
      maxVelocity: parseInt(document.getElementById('velocity-slider').value),
      minVelocity: 0.01,
      timestep: 0.5
    },
    interaction: {
      hover: true,
      tooltipDelay: 150,
      keyboard: true,
      navigationButtons: true,
      dragNodes: interactionEnabled,
      dragView: interactionEnabled
    },
    layout: { improvedLayout: true }
  };

  if (network) {
    network.setData({ nodes: visNodes, edges: visEdges });
    network.setOptions(options);
  } else {
    network = new vis.Network(container, { nodes: visNodes, edges: visEdges }, options);
  }

  network.off('click');
  network.on('click', onNodeClick);
  network.off('doubleClick');
  network.on('doubleClick', function() {
    closeTextPanel();
    resetGraphHighlight();
  });
}

function getNodeColor(freq, allNodes) {
  const maxFreq = Math.max(...allNodes.map(n => n.frequency), 1);
  const t = freq / maxFreq;
  const scheme = document.getElementById('color-scheme').value;
  const [r, g, b] = (COLORMAPS[scheme] || COLORMAPS.viridis)(t);
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function onNodeClick(params) {
  if (!params.nodes || params.nodes.length === 0) {
    closeTextPanel();
    resetGraphHighlight();
    return;
  }
  const nodeId = params.nodes[0];
  selectedNodeId = nodeId;
  highlightGraph(nodeId);

  if (nodeId.startsWith('__group_') && currentData.word_groups) {
    const gid = nodeId.replace('__group_', '');
    const group = currentData.word_groups[gid];
    if (group) {
      showGroupTextPanel(group);
      return;
    }
  }
  showTextPanel(nodeId);
}

function highlightGraph(nodeId) {
  const connectedNodes = network.getConnectedNodes(nodeId);
  const connectedEdges = network.getConnectedEdges(nodeId);

  const allNodes = network.body.data.nodes.get({ returnType: 'Object' });
  const nBatch = [];
  for (const id in allNodes) {
    nBatch.push({ id: id, opacity: (id === nodeId || connectedNodes.includes(id)) ? 1.0 : 0.12 });
  }
  network.body.data.nodes.update(nBatch);

  const allEdges = network.body.data.edges.get({ returnType: 'Object' });
  const eBatch = [];
  for (const id in allEdges) {
    if (connectedEdges.includes(id)) {
      eBatch.push({ id: id, color: { opacity: 0.9, color: '#e94560' } });
    } else {
      eBatch.push({ id: id, color: { opacity: 0.04, color: 'rgba(233,69,96,0.04)' } });
    }
  }
  network.body.data.edges.update(eBatch);
}

function resetGraphHighlight() {
  if (!network) return;
  const allNodes = network.body.data.nodes.get({ returnType: 'Object' });
  const nBatch = [];
  for (const id in allNodes) {
    nBatch.push({ id: id, opacity: 1.0 });
  }
  network.body.data.nodes.update(nBatch);

  const allEdges = network.body.data.edges.get({ returnType: 'Object' });
  const eBatch = [];
  for (const id in allEdges) {
    eBatch.push({ id: id, color: { opacity: 0.25, color: 'rgba(233,69,96,0.25)' } });
  }
  network.body.data.edges.update(eBatch);
}

function updateSpringLength(val) {
  if (!physicsEnabled) {
    network.setOptions({ physics: { enabled: true } });
    physicsEnabled = true;
    document.getElementById('physics-toggle').checked = true;
    document.getElementById('physics-label').textContent = 'On';
  }
  network.setOptions({
    physics: {
      barnesHut: { springLength: val },
      solver: 'barnesHut'
    }
  });
  network.once('stabilizationIterationsDone', function() {
    network.setOptions({ physics: { enabled: false } });
    physicsEnabled = false;
    document.getElementById('physics-toggle').checked = false;
    document.getElementById('physics-label').textContent = 'Off';
  });
  network.stabilize(10);
}
