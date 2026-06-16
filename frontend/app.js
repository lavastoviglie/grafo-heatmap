let network = null;
let currentData = null;
let selectedNodeId = null;
let physicsEnabled = true;
let interactionEnabled = true;
let heatmapCanvas = document.getElementById('heatmap-canvas');
let heatmapCtx = heatmapCanvas.getContext('2d');

/* ===== COLOR PALETTES ===== */
const COLORMAPS = {
  viridis: (t) => {
    const c = [
      [0.267,0.004,0.329], [0.282,0.140,0.458], [0.253,0.265,0.530],
      [0.206,0.372,0.553], [0.163,0.471,0.558], [0.128,0.567,0.551],
      [0.134,0.658,0.518], [0.267,0.749,0.441], [0.478,0.821,0.318],
      [0.741,0.873,0.150], [0.993,0.906,0.144]
    ];
    return interp(c, t);
  },
  magma: (t) => {
    const c = [
      [0.001,0.000,0.013], [0.126,0.056,0.198], [0.256,0.087,0.339],
      [0.394,0.094,0.419], [0.536,0.118,0.435], [0.678,0.174,0.394],
      [0.810,0.268,0.304], [0.918,0.393,0.187], [0.991,0.548,0.121],
      [0.995,0.727,0.279], [0.987,0.910,0.580]
    ];
    return interp(c, t);
  },
  plasma: (t) => {
    const c = [
      [0.050,0.030,0.530], [0.190,0.020,0.600], [0.385,0.000,0.580],
      [0.555,0.080,0.490], [0.690,0.200,0.380], [0.790,0.330,0.270],
      [0.870,0.470,0.170], [0.930,0.620,0.090], [0.970,0.780,0.060],
      [0.990,0.930,0.170], [1.000,1.000,1.000]
    ];
    return interp(c, t);
  },
  inferno: (t) => {
    const c = [
      [0.001,0.000,0.013], [0.085,0.062,0.247], [0.200,0.094,0.398],
      [0.356,0.088,0.432], [0.517,0.097,0.368], [0.669,0.157,0.262],
      [0.802,0.257,0.158], [0.910,0.393,0.094], [0.975,0.560,0.107],
      [0.988,0.750,0.290], [0.988,0.930,0.640]
    ];
    return interp(c, t);
  },
  turbo: (t) => {
    const c = [
      [0.190,0.070,0.320], [0.180,0.210,0.570], [0.140,0.370,0.710],
      [0.080,0.530,0.750], [0.040,0.680,0.660], [0.120,0.800,0.500],
      [0.310,0.880,0.340], [0.560,0.920,0.210], [0.800,0.900,0.160],
      [0.960,0.780,0.180], [1.000,0.600,0.200], [0.960,0.380,0.190],
      [0.830,0.180,0.150], [0.620,0.060,0.110]
    ];
    return interp(c, t);
  },
  cividis: (t) => {
    const c = [
      [0.000,0.135,0.302], [0.064,0.196,0.367], [0.105,0.261,0.422],
      [0.126,0.331,0.465], [0.129,0.406,0.493], [0.112,0.487,0.500],
      [0.090,0.571,0.487], [0.118,0.657,0.447], [0.243,0.738,0.378],
      [0.452,0.813,0.274], [0.702,0.871,0.148], [0.949,0.913,0.075]
    ];
    return interp(c, t);
  },
  twilight: (t) => {
    const c = [
      [0.220,0.020,0.340], [0.280,0.150,0.460], [0.280,0.320,0.520],
      [0.220,0.480,0.480], [0.180,0.620,0.380], [0.280,0.750,0.280],
      [0.500,0.830,0.220], [0.730,0.830,0.240], [0.920,0.740,0.280],
      [0.980,0.580,0.300], [0.960,0.380,0.290], [0.850,0.200,0.240],
      [0.640,0.080,0.180], [0.380,0.040,0.180]
    ];
    return interp(c, t);
  },
  bluered: (t) => [t, 0, 1 - t],
  rainbow: (t) => hslToRgb((1 - t) * 0.7, 0.8, 0.5).map(v => v * 255),
  greens: (t) => [t * 50, 100 + t * 155, t * 50]
};

function interp(stops, t) {
  const n = stops.length - 1;
  const idx = t * n;
  const i = Math.min(Math.floor(idx), n - 1);
  const f = idx - i;
  const a = stops[i], b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f].map(v => v * 255);
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [r, g, b];
}

function getColor(value, scheme) {
  const t = Math.min(1, Math.max(0, value));
  const [r, g, b] = (COLORMAPS[scheme] || COLORMAPS.viridis)(t);
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

function drawColorbar(scheme) {
  const bar = document.getElementById('heatmap-colorbar');
  const steps = 100;
  let html = '<div style="display:flex;height:100%;border-radius:2px;overflow:hidden;">';
  for (let i = 0; i < steps; i++) {
    html += `<div style="flex:1;background:${getColor(i / (steps - 1), scheme)}"></div>`;
  }
  html += '</div>';
  bar.innerHTML = html;
}

/* ===== THEME ===== */
function applyTheme(theme) {
  const app = document.getElementById('app');
  app.className = app.className.replace(/theme-\w+/g, '').trim();
  app.classList.add(`theme-${theme}`);
}

/* ===== UI EVENTS ===== */
document.getElementById('window-size').addEventListener('input', function() {
  document.getElementById('window-size-val').textContent = this.value;
});
document.getElementById('top-concepts').addEventListener('input', function() {
  document.getElementById('top-concepts-val').textContent = this.value;
});
document.getElementById('min-freq').addEventListener('input', function() {
  document.getElementById('min-freq-val').textContent = this.value;
});
document.getElementById('edge-threshold').addEventListener('input', function() {
  document.getElementById('edge-threshold-val').textContent = this.value;
});
document.getElementById('node-dist').addEventListener('input', function() {
  document.getElementById('node-dist-val').textContent = this.value;
  if (network && currentData) updateSpringLength(parseInt(this.value));
});
document.getElementById('velocity-slider').addEventListener('input', function() {
  document.getElementById('velocity-val').textContent = this.value;
  if (network) {
    network.setOptions({ physics: { maxVelocity: parseInt(this.value) } });
  }
});

document.getElementById('physics-toggle').addEventListener('change', function() {
  physicsEnabled = this.checked;
  document.getElementById('physics-label').textContent = physicsEnabled ? 'On' : 'Off';
  if (network) {
    network.setOptions({ physics: { enabled: physicsEnabled } });
    if (physicsEnabled) {
      network.stabilize(30);
    }
  }
});

document.getElementById('interaction-toggle').addEventListener('change', function() {
  interactionEnabled = this.checked;
  document.getElementById('interaction-label').textContent = interactionEnabled ? 'On' : 'Off';
  if (network) {
    network.setOptions({
      interaction: {
        dragNodes: interactionEnabled,
        dragView: interactionEnabled
      }
    });
  }
});

document.getElementById('group-toggle').addEventListener('change', function() {
  const label = document.getElementById('group-label');
  label.textContent = this.checked ? 'On' : 'Off';
  if (currentData) renderGraph(currentData);
});

document.getElementById('analyze-btn').addEventListener('click', analyzeText);

/* ===== SEARCH ===== */
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchCount = document.getElementById('search-count');
let searchSel = -1;

function getSearchWords() {
  if (!currentData || !currentData.nodes) return [];
  return currentData.nodes.map(n => n.id).sort();
}

function positionSearchResults() {
  const rect = searchInput.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropdownHeight = Math.min(searchResults.scrollHeight || 200, 200);
  if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
    searchResults.style.top = (rect.top - dropdownHeight - 2) + 'px';
    searchResults.style.maxHeight = (rect.top - 10) + 'px';
  } else {
    searchResults.style.top = (rect.bottom + 2) + 'px';
    searchResults.style.maxHeight = Math.min(200, spaceBelow - 10) + 'px';
  }
  searchResults.style.left = rect.left + 'px';
  searchResults.style.width = rect.width + 'px';
}

function showSearchSuggestions(q) {
  const words = getSearchWords();
  if (words.length === 0) {
    searchResults.classList.add('hidden');
    return;
  }
  const ql = q.toLowerCase();
  const matches = ql ? words.filter(w => w.toLowerCase().includes(ql)).slice(0, 50) : words.slice(0, 50);
  if (matches.length === 0) {
    searchResults.classList.add('hidden');
    return;
  }
  let html = '';
  for (const w of matches) {
    const escaped = w.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    if (ql) {
      const idx = w.toLowerCase().indexOf(ql);
      const before = escaped.substring(0, idx);
      const match = escaped.substring(idx, idx + ql.length);
      const after = escaped.substring(idx + ql.length);
      html += `<div class="search-item" data-word="${escaped}">${before}<strong>${match}</strong>${after}</div>`;
    } else {
      html += `<div class="search-item" data-word="${escaped}">${escaped}</div>`;
    }
  }
  searchResults.innerHTML = html;
  positionSearchResults();
  searchResults.classList.remove('hidden');
  searchSel = -1;
}

searchInput.addEventListener('focus', function() {
  if (!currentData) return;
  document.getElementById('search-count').textContent = `Nodi totali: ${getSearchWords().length}`;
  showSearchSuggestions('');
});
searchInput.addEventListener('input', function() {
  if (!currentData) return;
  showSearchSuggestions(this.value);
});
searchInput.addEventListener('blur', function() {
  setTimeout(() => searchResults.classList.add('hidden'), 150);
});
searchInput.addEventListener('keydown', function(e) {
  const items = searchResults.querySelectorAll('.search-item');
  if (e.key === 'Escape') { searchResults.classList.add('hidden'); this.blur(); return; }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (searchSel >= 0 && items[searchSel]) { items[searchSel].click(); return; }
    if (items.length > 0) items[0].click();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (items.length === 0) return;
    items.forEach(el => el.classList.remove('selected'));
    searchSel = Math.min(searchSel + 1, items.length - 1);
    items[searchSel].classList.add('selected');
    items[searchSel].scrollIntoView({ block: 'nearest' });
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (items.length === 0) return;
    items.forEach(el => el.classList.remove('selected'));
    searchSel = Math.max(searchSel - 1, 0);
    items[searchSel].classList.add('selected');
    items[searchSel].scrollIntoView({ block: 'nearest' });
    return;
  }
});
searchResults.addEventListener('mousedown', function(e) {
  const item = e.target.closest('.search-item');
  if (!item) return;
  e.preventDefault();
  const word = item.dataset.word;
  searchResults.classList.add('hidden');
  searchInput.value = word;
  focusNode(word);
});
document.addEventListener('click', function(e) {
  if (!e.target.closest('#search-group')) {
    searchResults.classList.add('hidden');
  }
});

document.getElementById('sidebar').addEventListener('scroll', function() {
  searchResults.classList.add('hidden');
});

window.addEventListener('resize', function() {
  if (!searchResults.classList.contains('hidden')) {
    positionSearchResults();
  }
});

window.addEventListener('scroll', function() {
  searchResults.classList.add('hidden');
});

function focusNode(nodeId) {
  if (!network || !currentData) return;
  closeTextPanel();
  selectedNodeId = nodeId;
  highlightGraph(nodeId);
  showTextPanel(nodeId);
  network.selectNodes([nodeId]);
  network.focus(nodeId, { scale: 1.5, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
}
document.getElementById('file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('text-input').value = ev.target.result;
    analyzeText();
  };
  reader.readAsText(file);
});

document.getElementById('edge-threshold').addEventListener('change', function() {
  document.getElementById('edge-threshold-val').textContent = this.value;
  if (currentData) renderGraph(currentData);
});
document.getElementById('edge-opacity').addEventListener('input', function() {
  document.getElementById('edge-opacity-val').textContent = this.value;
  if (currentData) renderGraph(currentData);
});
document.getElementById('color-scheme').addEventListener('change', function() {
  if (currentData) {
    renderGraph(currentData);
    renderHeatmap(currentData.heatmap);
    drawColorbar(this.value);
  }
});
document.getElementById('bg-theme').addEventListener('change', function() {
  applyTheme(this.value);
  if (currentData) {
    const scheme = document.getElementById('color-scheme').value;
    renderGraph(currentData);
    renderHeatmap(currentData.heatmap);
    drawColorbar(scheme);
  }
});

document.getElementById('text-panel-close').addEventListener('click', closeTextPanel);

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

function closeTextPanel() {
  document.getElementById('text-panel').classList.add('hidden');
  selectedNodeId = null;
  if (network) resetGraphHighlight();
}

/* ===== ANALYSIS ===== */
async function analyzeText() {
  const btn = document.getElementById('analyze-btn');
  btn.textContent = 'Analizzando...';
  btn.disabled = true;
  const textarea = document.getElementById('text-input');
  let text = textarea.value.trim();
  if (!text) {
    const fileInput = document.getElementById('file-input');
    if (fileInput.files.length > 0) {
      const reader = new FileReader();
      reader.onload = async function(ev) {
        textarea.value = ev.target.result;
        await doAnalyze(ev.target.result);
      };
      reader.readAsText(fileInput.files[0]);
      return;
    }
    btn.textContent = 'Analizza';
    btn.disabled = false;
    return;
  }
  await doAnalyze(text);
}

async function doAnalyze(text) {
  const btn = document.getElementById('analyze-btn');
  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        window_size: parseInt(document.getElementById('window-size').value),
        top_k_concepts: parseInt(document.getElementById('top-concepts').value),
        min_freq: parseInt(document.getElementById('min-freq').value)
      })
    });
    const data = await resp.json();
    currentData = data;
    closeTextPanel();
    if (data.original_text) {
      document.getElementById('text-input').value = data.original_text;
    }
    renderGraph(data);
    renderHeatmap(data.heatmap);
    drawColorbar(document.getElementById('color-scheme').value);
    document.getElementById('node-count').textContent = `Nodi: ${data.nodes.length}`;
    document.getElementById('edge-count').textContent = `Archi: ${data.edges.length}`;
    document.getElementById('concept-count').textContent = `Concetti: ${data.heatmap.concepts.length}`;
  } catch (err) {
    console.error(err);
    alert("Errore durante l'analisi del testo.");
  } finally {
    btn.textContent = 'Analizza';
    btn.disabled = false;
  }
}

/* ===== GRAPH ===== */
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

/* ===== CLICK ===== */
function onNodeClick(params) {
  if (!params.nodes || params.nodes.length === 0) {
    closeTextPanel();
    resetGraphHighlight();
    return;
  }
  const nodeId = params.nodes[0];
  selectedNodeId = nodeId;
  highlightGraph(nodeId);

  // If group node, show combined text panel for all group members
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

/* ===== TEXT PANEL ===== */
function showTextPanel(nodeId) {
  const panel = document.getElementById('text-panel');
  const title = document.getElementById('text-panel-title');
  const content = document.getElementById('text-panel-content');
  title.textContent = `"${nodeId}"`;
  const sentences = (currentData.word_sentences && currentData.word_sentences[nodeId]) || [];

  const forms = (currentData.word_forms && currentData.word_forms[nodeId]) || [nodeId];
  const escapedForms = forms.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedForms.join('|')})`, 'gi');

  let html = `<div class="text-panel-count">${sentences.length} occorrenze nel testo</div>`;
  if (sentences.length === 0) {
    html += '<div class="no-sentences">Nessuna frase trovata</div>';
  } else {
    for (const sent of sentences) {
      const highlight = sent.text.replace(regex, '<strong>$1</strong>');
      html += `<div class="text-panel-sentence" data-start="${sent.start}" data-end="${sent.end}">${highlight}</div>`;
    }
  }
  content.innerHTML = html;
  panel.classList.remove('hidden');
  panel.scrollTop = 0;

  content.querySelectorAll('.text-panel-sentence').forEach(el => {
    el.addEventListener('click', function() {
      const start = parseInt(this.dataset.start);
      const end = parseInt(this.dataset.end);
      showDocumentViewer(start, end);
    });
  });
}

function showGroupTextPanel(group) {
  const panel = document.getElementById('text-panel');
  const title = document.getElementById('text-panel-title');
  const content = document.getElementById('text-panel-content');
  title.textContent = `Gruppo: "${group.centroid_word}" (${group.words.length} parole)`;

  let html = '';
  for (const word of group.words) {
    const sentences = (currentData.word_sentences && currentData.word_sentences[word]) || [];
    const forms = (currentData.word_forms && currentData.word_forms[word]) || [word];
    const escapedForms = forms.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedForms.join('|')})`, 'gi');

    html += `<div class="group-word-header">${word} (${sentences.length})</div>`;
    for (const sent of sentences) {
      const highlight = sent.text.replace(regex, '<strong>$1</strong>');
      html += `<div class="text-panel-sentence" data-start="${sent.start}" data-end="${sent.end}">${highlight}</div>`;
    }
  }

  if (!html) html = '<div class="no-sentences">Nessuna frase trovata</div>';

  content.innerHTML = html;
  panel.classList.remove('hidden');
  panel.scrollTop = 0;

  content.querySelectorAll('.text-panel-sentence').forEach(el => {
    el.addEventListener('click', function() {
      const start = parseInt(this.dataset.start);
      const end = parseInt(this.dataset.end);
      showDocumentViewer(start, end);
    });
  });
}

function showDocumentViewer(start, end) {
  const text = currentData.original_text;
  if (!text || start < 0 || end > text.length) return;

  const before = text.substring(0, start);
  const highlighted = text.substring(start, end);
  const after = text.substring(end);

  const viewer = document.getElementById('doc-viewer');
  const content = document.getElementById('doc-viewer-content');

  const html = `<div class="doc-full">${escapeHtml(before)}<span class="doc-highlight">${escapeHtml(highlighted)}</span>${escapeHtml(after)}</div>`;

  content.innerHTML = html;
  viewer.classList.remove('hidden');

  setTimeout(() => {
    const hl = content.querySelector('.doc-highlight');
    if (hl) hl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 50);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.getElementById('doc-viewer-close').addEventListener('click', function() {
  document.getElementById('doc-viewer').classList.add('hidden');
});

/* ===== HEATMAP ===== */
function renderHeatmap(heatmap) {
  if (!heatmap || !heatmap.matrix || heatmap.matrix.length === 0) return;

  const wrapper = document.getElementById('heatmap-wrapper');
  const container = document.getElementById('heatmap-container');
  const headerH = document.getElementById('heatmap-header').offsetHeight || 24;
  const colorbarH = 18;
  const availH = container.offsetHeight - headerH - colorbarH - 16;
  const availW = wrapper.offsetWidth - 14;

  const rows = heatmap.matrix.length;
  const cols = heatmap.concepts.length;
  if (rows === 0 || cols === 0) return;

  const isLight = document.getElementById('app').classList.contains('theme-light');
  const bgColor = isLight ? '#fafafa' : '#1a1a2e';
  const textColor = isLight ? '#555' : '#a8b2d1';
  const textColor2 = isLight ? '#666' : '#8892b0';

  const cellH = Math.max(14, Math.min(24, (availH - 24) / rows));
  const cellW = Math.max(26, Math.min(64, (availW - 90) / cols));
  const labelW = 80;
  const labelH = 60;

  heatmapCanvas.width = labelW + cols * cellW;
  heatmapCanvas.height = labelH + rows * cellH;

  const ctx = heatmapCtx;
  ctx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

  const scheme = document.getElementById('color-scheme').value;
  const allValues = heatmap.matrix.flat();
  const maxVal = Math.max(...allValues, 0.001);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = heatmap.matrix[r][c] / maxVal;
      ctx.fillStyle = getColor(val, scheme);
      ctx.fillRect(labelW + c * cellW, labelH + r * cellH, cellW - 1, cellH - 1);
    }
  }

  ctx.fillStyle = textColor;
  ctx.font = '9px Segoe UI';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < rows; r++) {
    ctx.fillText(`#${r + 1}`, labelW - 4, labelH + r * cellH + cellH / 2);
  }

  ctx.save();
  ctx.translate(labelW / 2, labelH - 4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = 'bold 9px Segoe UI';
  ctx.fillStyle = textColor2;
  ctx.fillText('Chunk', 0, 0);
  ctx.restore();

  ctx.save();
  ctx.font = '8px Segoe UI';
  ctx.fillStyle = textColor2;
  for (let c = 0; c < cols; c++) {
    ctx.save();
    ctx.translate(labelW + c * cellW + cellW / 2, labelH - 2);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = textColor;
    ctx.fillText(heatmap.concepts[c], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  heatmapCanvas.onmousemove = function(e) {
    const rect = heatmapCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const c = Math.floor((mx - labelW) / cellW);
    const r = Math.floor((my - labelH) / cellH);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const val = heatmap.matrix[r][c];
      const pct = maxVal > 0 ? (val / maxVal * 100).toFixed(1) : '0.0';
      const tooltip = document.getElementById('heatmap-tooltip');
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX - wrapper.getBoundingClientRect().left + 10) + 'px';
      tooltip.style.top = (e.clientY - wrapper.getBoundingClientRect().top - 24) + 'px';
      tooltip.innerHTML = `<b>${heatmap.concepts[c]}</b> in #${r + 1}<br>Rilevanza: ${pct}%`;
    } else {
      document.getElementById('heatmap-tooltip').style.display = 'none';
    }
  };
  heatmapCanvas.onmouseleave = function() {
    document.getElementById('heatmap-tooltip').style.display = 'none';
  };
}

/* ===== INIT ===== */
window.addEventListener('load', function() {
  drawColorbar('viridis');
});
