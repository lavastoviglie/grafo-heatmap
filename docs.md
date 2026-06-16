# Grafo Heatmap — Documentazione Tecnica

## Panoramica
Web app locale per visualizzare testi come **grafo interattivo** (parole = nodi, co-occorrenze = archi) + **heatmap TF-IDF** (concetti × sezioni). Click su una parola → pannello frasi → click frase → viewer documento originale.

- **Backend**: Python FastAPI + spaCy `it_core_news_sm`
- **Frontend**: JS vanilla + vis-network + Canvas
- **Path**: `D:\grafi heatmap`
- **Avvio**: `run.ps1` → `http://localhost:8000`

---

## Struttura file

```
D:\grafi heatmap\
├── backend\
│   ├── main.py              # Server FastAPI, endpoint /api/analyze, /api/upload
│   └── nlp_processor.py     # NLP: spaCy, co-occorrenza, TF-IDF, word_forms, word_groups
├── frontend\
│   ├── index.html            # Layout sidebar + grafo + heatmap + text panel + doc viewer
│   ├── style.css             # Temi (dark/light/purple/ocean), toggle, search, panel
│   └── app.js                # Tutta la logica frontend
├── run.ps1                   # Avvia uvicorn
├── venv\                     # Virtualenv Python 3.12
└── Istruzione integrata matematico-sci.txt  # Testo di esempio
```

---

## Funzionalità complete

### Backend (`nlp_processor.py`)
- **NLP**: spaCy italiano, filtra ADJ/NOUN/PROPN/VERB, stopword, lunghezza > 2
- **Co-occorrenza**: finestra scorrevole, conteggio coppie, soglia %
- **TF-IDF**: chunks sliding window, heatmap concetti × chunks
- **word_sentences**: ogni parola → lista frasi con offset (start/end char)
- **word_forms**: ogni lemma → tutte le forme superficiali (es. `alunno` → `["alunni", "alunno"]`)
- **word_groups**: raggruppamento parole con stessa radice a piacere (toggle nel frontend)

### Frontend
- **Grafo vis-network**: nodi proporzionali a frequenza, archi co-occorrenza, hover/click/highlight
- **Heatmap Canvas**: TF-IDF a colori, tooltip, colorbar
- **Text panel**: laterale, mostra frasi contenenti la parola cliccata, evidenzia le forme
- **Document viewer**: modale con testo originale + contesto, frase evidenziata
- **Controlli sidebar**: finestra co-occorrenza, soglia archi, opacità archi, concetti heatmap, freq minima, tema sfondo, tavolozza colori, distanza nodi, velocità movimento
- **Toggle**: movimento automatico (physics), interazione manuale (drag), raggruppa parole simili
- **Ricerca parole**: barra di ricerca con suggerimenti dinamici, evidenziazione nodo + zoom
- **Temi**: dark, light, purple, ocean

---

## Barra di Ricerca — Implementazione Dettagliata

### HTML (`index.html`)
```html
<div class="control-group" id="search-group">
  <label for="search-input">Cerca parola nel grafo</label>
  <div class="search-wrap">
    <input type="text" id="search-input" placeholder="Scrivi per cercare..." autocomplete="off">
    <span id="search-count"></span>
    <div id="search-results" class="hidden"></div>
  </div>
</div>
```
- `#search-input`: input text
- `#search-count`: mostra "Nodi totali: X" al focus
- `#search-results`: dropdown dei suggerimenti (nascosto con classe `.hidden`)

### CSS (`style.css`)
```css
#search-group { position: relative; }
.search-wrap { position: relative; }
#search-input { /* stile come gli altri input, focus glow rosso */ }
#search-results {
  position: absolute; top: 100%; left: 0; right: 0;
  max-height: 200px; overflow-y: auto;
  border-radius: 0 0 6px 6px; z-index: 50;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
#search-results.hidden { display: none; }
.search-item { padding: 6px 10px; font-size: 12px; cursor: pointer; }
.search-item:hover, .search-item.selected { background: rgba(233,69,96,0.15); }
.search-item strong { color: #e94560; }
#search-count { display: block; font-size: 10px; margin-top: 3px; opacity: 0.6; }
```
Temi: ogni tema definisce sfondo/bordo per `#search-input` e `#search-results`.

### JS (`app.js`)
**1. Ottenere parole candidate:**
```js
function getSearchWords() {
  if (!currentData || !currentData.nodes) return [];
  return currentData.nodes.map(n => n.id).sort();
}
```
Usa `currentData.nodes` (sempre popolato dopo analisi) per avere tutti gli ID nodo.

**2. Mostrare suggerimenti:**
```js
function showSearchSuggestions(q) {
  const words = getSearchWords();
  const ql = q.toLowerCase();
  const matches = ql ? words.filter(w => w.includes(ql)).slice(0, 50) : words.slice(0, 50);
  // costruisce HTML: evidenzia la parte matchata con <strong>
  // escape manuale: .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  searchResults.innerHTML = html;
  searchResults.classList.remove('hidden');
}
```
- Se `q` è vuoto (focus senza digitare): mostra tutti i nodi (max 50)
- Se `q` non è vuoto: filtra con `String.includes()` case-insensitive
- Escape HTML manuale (non usa `escapeHtml()` per evitare dipendenze d'ordine)

**3. Event listeners:**
```js
// Focus: mostra tutti i nodi + conteggio
searchInput.addEventListener('focus', function() {
  document.getElementById('search-count').textContent = `Nodi totali: ${getSearchWords().length}`;
  showSearchSuggestions('');
});

// Input: filtra in tempo reale (nessun debounce, istantaneo)
searchInput.addEventListener('input', function() {
  if (!currentData) return;
  showSearchSuggestions(this.value);
});
```

**4. Navigazione tastiera:**
```js
// Enter: seleziona l'item evidenziato con le frecce, o il primo
// ArrowDown/ArrowUp: naviga, scrolla in view, highlight classe .selected
// Escape: chiude dropdown
```
Mantiene `searchSel` (indice selezione corrente), aggiorna classe `.selected` sugli item.

**5. Click su suggerimento:**
```js
searchResults.addEventListener('mousedown', function(e) {
  const item = e.target.closest('.search-item');
  const word = item.dataset.word;
  searchResults.classList.add('hidden');
  searchInput.value = word;
  focusNode(word);
});
```
Usa `mousedown` invece di `click` per evitare che il blur dell'input chiuda il dropdown prima del click.

**6. Chiusura dropdown:**
```js
document.addEventListener('click', function(e) {
  if (!e.target.closest('#search-group')) {
    searchResults.classList.add('hidden');
  }
});
```
Click fuori dal gruppo di ricerca → chiude dropdown.

**7. Focus nodo (`focusNode`):**
```js
function focusNode(nodeId) {
  closeTextPanel();
  selectedNodeId = nodeId;
  highlightGraph(nodeId);         // opacità nodi non connessi, archi connessi in rosso
  showTextPanel(nodeId);           // pannello frasi laterale
  network.selectNodes([nodeId]);   // seleziona nel grafo
  network.focus(nodeId, { scale: 1.5, animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
}
```
- `highlightGraph`: nodo selezionato + connessi a opacità 1.0, resto a 0.12; archi connessi in rosso, resto sbiadito
- `network.focus`: zoom + animazione centrata sul nodo

---

## Raggruppa Parole Simili — Logica completa

### Backend (`nlp_processor.py`)

**`words_related(w1, w2)`** — determina se due parole hanno la stessa radice:
```python
def words_related(w1, w2):
    if len(w1) > len(w2):
        w1, w2 = w2, w1
    min_len = len(w1)
    lcp = _lcp_len(w1, w2)
    return min_len > 0 and lcp / min_len >= 0.7
```
- Solo **prefisso comune ≥ 70%** della parola più corta
- Niente LCS, niente sottostringa, niente match di suffisso
- Questo evita falsi positivi come `prendere/comprendere`, `mettere/permettere`, `informazione/informatica`, `sociale/artificiale`

**`compute_word_groups(words, pos_map)`**:
1. Per ogni coppia di parole, se entrambe NON sono PROPN e hanno POS compatibili (NOUN-NOUN, ADJ-ADJ, NOUN-ADJ), chiama `words_related`
2. Se matcha → aggiunge arco nel grafo di similarità
3. Trova componenti connesse (gruppi) con BFS
4. Per ogni gruppo, elegge **centroid** = parola con più connessioni interne
5. Restituisce `word_to_group: {word: group_id}` e `word_groups: {group_id: {words, centroid_word}}`

**POS consentiti per gruppo**: solo ADJ e NOUN (esclude PROPN, VERB):
```python
ALLOWED_PAIR_POS = {
    ("ADJ", "ADJ"), ("NOUN", "NOUN"), ("VERB", "VERB"),
    ("ADJ", "NOUN"), ("NOUN", "ADJ"),
}
```

### Frontend
- Toggle "Raggruppa parole simili" nella sidebar
- Quando attivo, `renderGraph` chiama `buildGroupedData(data)` prima di renderizzare
- `buildGroupedData`: fonde nodi dello stesso gruppo in un nodo gruppo (più grande, rosso), aggrega archi (somma pesi)
- Click su nodo gruppo → `showGroupTextPanel` mostra frasi di tutte le parole del gruppo

---

## Dipendenze

```
Python 3.12
spaCy + it_core_news_sm
FastAPI + uvicorn
scikit-learn (TfidfVectorizer)
numpy
vis-network@9.1.9 (CDN)
```
