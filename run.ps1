$venv = Join-Path $PSScriptRoot "venv\Scripts\python.exe"

Write-Host "Avvio server Grafo Heatmap..." -ForegroundColor Green
Write-Host "Apri il browser su: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Per fermare: premi Ctrl+C in questa finestra" -ForegroundColor Yellow

& $venv -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 --app-dir $PSScriptRoot
