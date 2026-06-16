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

function closeTextPanel() {
  document.getElementById('text-panel').classList.add('hidden');
  selectedNodeId = null;
  if (network) resetGraphHighlight();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
