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
