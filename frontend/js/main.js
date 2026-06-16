let network = null;
let currentData = null;
let selectedNodeId = null;
let physicsEnabled = true;
let interactionEnabled = true;
let heatmapCanvas = document.getElementById('heatmap-canvas');
let heatmapCtx = heatmapCanvas.getContext('2d');

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

document.getElementById('doc-viewer-close').addEventListener('click', function() {
  document.getElementById('doc-viewer').classList.add('hidden');
});

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

window.addEventListener('load', function() {
  drawColorbar('viridis');
});
