Write-Host "Arresto server Grafo Heatmap..." -ForegroundColor Yellow

$connections = netstat -ano | Select-String ":8000 " | Select-String "LISTENING"
$procIds = @()
foreach ($c in $connections) {
    $parts = $c.ToString().Trim() -split '\s+'
    $procId = $parts[-1]
    # Salta PID inesistenti (netstat a volte ritarda a rimuoverli)
    if ($procId -match '^\d+$' -and $procId -notin $procIds) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) { $procIds += $procId }
    }
}

if ($procIds.Count -eq 0) {
    Write-Host "Nessun server in esecuzione sulla porta 8000." -ForegroundColor Green
    exit 0
}

foreach ($id in $procIds) {
    $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -match 'python') {
        Write-Host ("Arresto processo PID " + $id + " (" + $proc.ProcessName + ")...") -ForegroundColor Yellow
        Stop-Process -Id $id -Force
    }
}

Start-Sleep -Seconds 2

# Verifica che i processi siano effettivamente terminati (non solo netstat obsoleto)
$ancoraVivi = $false
foreach ($id in $procIds) {
    $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
    if ($proc) {
        $ancoraVivi = $true
        Write-Host ("Processo PID " + $id + " ancora in esecuzione.") -ForegroundColor Red
    }
}

if ($ancoraVivi) {
    Write-Host "Impossibile arrestare il server. Prova manualmente: taskkill /F /PID <pid>" -ForegroundColor Red
    exit 1
}

Write-Host "Server arrestato." -ForegroundColor Green
