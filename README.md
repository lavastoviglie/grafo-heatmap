# Grafo Heatmap

> Local web app for visual analysis of Italian-language texts — interactive word co-occurrence graph + TF-IDF heatmap.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688?logo=fastapi&logoColor=white)
![spaCy](https://img.shields.io/badge/spaCy-it__core__news__sm-09a3d5)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Controls & Parameters](#controls--parameters)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

### Word Co-occurrence Graph
- Each **word-concept** is a node; node size reflects its frequency in the text
- **Edges** connect words that frequently appear near each other (configurable sliding window)
- **Click a node** → side panel listing every sentence in which the word appears
- **Click a sentence** → modal document viewer showing the original text with the context highlighted
- Interactive physics layout: drag nodes, zoom, highlight neighbours
- **Morphological grouping**: words sharing a common root (common prefix ≥ 70%) are merged into a single node

### TF-IDF Heatmap
- **Concepts × text chunks** matrix (sliding-window chunks)
- More intense colours = higher TF-IDF relevance
- **Tooltip** on hover showing the exact score
- Number of displayed concepts is configurable

### Interface
- 10 **colour palettes** and 4 **themes** (dark, light, purple, ocean)
- **Search bar** with dynamic suggestions, keyboard navigation, and node focus
- **Language toggle** — switch between English and Italian on the fly
- All parameters adjustable in real time without reloading the page

---

## Requirements

| Dependency | Notes |
|---|---|
| Python 3.12+ | |
| FastAPI | Backend REST server |
| uvicorn | ASGI server |
| spaCy + `it_core_news_sm` | Italian NLP model |
| scikit-learn | TF-IDF computation |
| numpy | Matrix processing |

---

## Installation

```powershell
git clone https://github.com/lavastoviglie/grafo-heatmap.git
cd grafo-heatmap
.\run.ps1
```

Or manually:
```powershell
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m spacy download it_core_news_sm
venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

---

## Usage

### Windows (recommended)

```powershell
.\run.ps1
```

`run.ps1` automatically creates a virtual environment, installs dependencies, downloads the spaCy model, and starts the server.

Then open `http://localhost:8000` in your browser.

### Manual setup (if not using run.ps1)

```bash
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m spacy download it_core_news_sm
venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Stop the server

```powershell
.\stop.ps1
```

Or press `Ctrl+C` in the terminal where the server is running.

### Workflow

1. **Load a text** — paste it into the textarea or upload a `.txt` file
2. **Click "Analyze"** — the backend processes the text and returns graph + heatmap data
3. **Explore the graph** — drag nodes, scroll to zoom, click a node to see its sentences
4. **Open a sentence** — click any sentence in the side panel to view it highlighted in the original document
5. **Inspect the heatmap** — the TF-IDF relevance matrix is shown below the graph
6. **Customise** — use the sidebar controls to adjust any parameter in real time

---

## Controls & Parameters

| Parameter | Description |
|---|---|
| **Co-occurrence window** | Number of words within which two terms are considered neighbours |
| **Edge threshold** | Minimum co-occurrence frequency (%) required to draw an edge |
| **Minimum frequency** | Minimum occurrences for a word to appear as a node |
| **Edge opacity** | Transparency of graph edges |
| **Heatmap concepts** | How many terms to show in the TF-IDF heatmap |
| **Node distance** | Spacing between nodes in the physics layout |
| **Movement speed** | Speed of the physics simulation |
| **Physics** | Enable / disable the physics engine (dynamic layout) |
| **Interaction** | Enable / disable node drag-and-drop |
| **Grouping** | Merge words with the same morphological root |
| **Theme** | dark · light · purple · ocean |
| **Colour palette** | 10 colour schemes for nodes and heatmap |

---

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST server
- [spaCy](https://spacy.io/) + `it_core_news_sm` — NLP, lemmatisation, POS filtering
- [scikit-learn](https://scikit-learn.org/) — TF-IDF on text chunks
- [NumPy](https://numpy.org/) — matrix processing

**Frontend**
- Vanilla JavaScript (no framework)
- [vis-network](https://visjs.github.io/vis-network/docs/network/) — interactive graph rendering
- Canvas API — heatmap rendering
- Custom CSS with variables for the theming system

---

## Project Structure

```
grafo-heatmap/
├── backend/
│   ├── main.py              # FastAPI app, routes for /api/analyze and static files
│   └── nlp_processor.py     # NLP pipeline: spaCy, co-occurrence, TF-IDF, word groups
├── frontend/
│   ├── index.html           # Main SPA layout
│   ├── style.css            # Themes, layout, controls styling
│   └── js/
│       ├── colors.js        # Colour palettes, interpolation, colorbar
│       ├── themes.js        # Theme switching
│       ├── main.js          # State, UI events, analysis logic
│       ├── search.js        # Search bar with suggestions and node focus
│       ├── lang.js          # English/Italian translations and language switch
│       ├── graph.js         # vis-network graph rendering and interaction
│       ├── panels.js        # Text panel, document viewer
│       └── heatmap.js       # Canvas-based TF-IDF heatmap
├── requirements.txt         # Python dependencies
├── run.ps1                  # Windows launch script (auto-setup)
├── stop.ps1                 # Windows stop script
├── docs.md                  # Technical documentation
└── README.md                # This file
```

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
