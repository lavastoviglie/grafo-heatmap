const translations = {
  en: {
    loadText: "Load text",
    textPlaceholder: "Paste your text here...",
    analyzeBtn: "Analyze",
    searchLabel: "Search word in graph",
    searchPlaceholder: "Type to search...",
    searchCount: "Total nodes",
    windowSize: "Co-occurrence window",
    heatmapConcepts: "Heatmap concepts",
    minFreq: "Min. word frequency",
    edgeThreshold: "Edge threshold",
    edgeOpacity: "Edge opacity",
    graphics: "Graphics",
    colorPalette: "Color palette",
    background: "Background",
    bgDark: "Dark (default)",
    bgLight: "Light",
    bgPurple: "Purple",
    bgOcean: "Ocean",
    graphSection: "Graph",
    autoMovement: "Auto movement",
    manualInteraction: "Manual interaction",
    nodeDistance: "Node distance",
    movementSpeed: "Movement speed",
    groupWords: "Group similar words",
    info: "Info",
    infoNodes: "Nodes",
    infoEdges: "Edges",
    infoConcepts: "Concepts",
    heatmapTitle: "Heatmap: Concepts \u00D7 Text Sections",
    docViewerTitle: "Original Document",
    language: "Language",
    on: "On",
    off: "Off",
    occurrences: "occurrences in text",
    noSentences: "No sentences found",
    analyzing: "Analyzing...",
    analyzeError: "Error analyzing text.",
    groupLabel: "Group",
    words: "words",
  },
  it: {
    loadText: "Carica testo",
    textPlaceholder: "Incolla il testo qui...",
    analyzeBtn: "Analizza",
    searchLabel: "Cerca parola nel grafo",
    searchPlaceholder: "Scrivi per cercare...",
    searchCount: "Nodi totali",
    windowSize: "Finestra co-occorrenza",
    heatmapConcepts: "Concetti heatmap",
    minFreq: "Freq. minima parole",
    edgeThreshold: "Soglia archi",
    edgeOpacity: "Opacit\u00E0 archi",
    graphics: "Grafica",
    colorPalette: "Tavolozza colori",
    background: "Sfondo",
    bgDark: "Scuro (default)",
    bgLight: "Chiaro",
    bgPurple: "Viola",
    bgOcean: "Oceano",
    graphSection: "Grafo",
    autoMovement: "Movimento automatico",
    manualInteraction: "Interazione manuale",
    nodeDistance: "Distanza nodi",
    movementSpeed: "Velocit\u00E0 movimento",
    groupWords: "Raggruppa parole simili",
    info: "Info",
    infoNodes: "Nodi",
    infoEdges: "Archi",
    infoConcepts: "Concetti",
    heatmapTitle: "Heatmap: Concetti \u00D7 Sezioni del testo",
    docViewerTitle: "Documento originale",
    language: "Lingua",
    on: "On",
    off: "Off",
    occurrences: "occorrenze nel testo",
    noSentences: "Nessuna frase trovata",
    analyzing: "Analizzando...",
    analyzeError: "Errore durante l'analisi del testo.",
    groupLabel: "Gruppo",
    words: "parole",
  }
};

let currentLang = 'en';

function t(key) {
  return translations[currentLang][key] || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  document.getElementById('lang-en').style.display = lang === 'en' ? 'inline' : 'none';
  document.getElementById('lang-it').style.display = lang === 'it' ? 'inline' : 'none';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-label]').forEach(el => {
    const key = el.dataset.i18nLabel;
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) label.textContent = t(key);
  });

  const groupLabel = document.getElementById('group-label');
  groupLabel.textContent = t(document.getElementById('group-toggle').checked ? 'on' : 'off');

  const physicsLabel = document.getElementById('physics-label');
  physicsLabel.textContent = t(document.getElementById('physics-toggle').checked ? 'on' : 'off');

  const interactionLabel = document.getElementById('interaction-label');
  interactionLabel.textContent = t(document.getElementById('interaction-toggle').checked ? 'on' : 'off');
}
