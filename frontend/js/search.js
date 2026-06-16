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
  document.getElementById('search-count').textContent = `${t('searchCount')}: ${getSearchWords().length}`;
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
