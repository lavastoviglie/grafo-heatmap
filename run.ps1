$venvDir = Join-Path $PSScriptRoot "venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"

# Auto-create venv if missing
if (-not (Test-Path $venvPython)) {
    Write-Host "Creazione ambiente virtuale..." -ForegroundColor Yellow
    python -m venv $venvDir
    if (-not $?) { Write-Host "ERRORE: impossibile creare il venv. Assicurati di avere Python 3.10+ installato." -ForegroundColor Red; exit 1 }
}

# Always ensure dependencies are installed (idempotent)
Write-Host "Installazione / aggiornamento dipendenze..." -ForegroundColor Yellow
& $venvPython -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")
if (-not $?) { Write-Host "ERRORE durante pip install." -ForegroundColor Red; exit 1 }

# Check if spaCy Italian model is installed, download if missing
$modelCheck = & $venvPython -c "import spacy; spacy.load('it_core_news_sm')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Download modello spaCy italiano..." -ForegroundColor Yellow
    & $venvPython -m spacy download it_core_news_sm
    if (-not $?) { Write-Host "ERRORE durante download modello spaCy." -ForegroundColor Red; exit 1 }
}

Write-Host "Avvio server Grafo Heatmap..." -ForegroundColor Green
Write-Host "Apri il browser su: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Per fermare: premi Ctrl+C in questa finestra" -ForegroundColor Yellow

& $venvPython -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 --app-dir $PSScriptRoot
