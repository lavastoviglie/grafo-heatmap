$projectDir = $PSScriptRoot
Push-Location $projectDir

Write-Host "Aggiornamento progetto da GitHub..." -ForegroundColor Yellow
git pull
if (-not $?) {
    Write-Host "ERRORE: impossibile fare git pull. Controlla la connessione." -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "`nAggiornamento dipendenze..." -ForegroundColor Yellow
$venvPython = Join-Path $projectDir "venv" "Scripts" "python.exe"
if (Test-Path $venvPython) {
    & $venvPython -m pip install -r (Join-Path $projectDir "requirements.txt")
    & $venvPython -m spacy download it_core_news_sm
} else {
    Write-Host "Nessun venv trovato. Lancia run.ps1 per configurarlo." -ForegroundColor Yellow
}

Write-Host "`nProgetto aggiornato!" -ForegroundColor Green
Pop-Location
