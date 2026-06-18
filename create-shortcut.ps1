$desktop = [Environment]::GetFolderPath("Desktop")
$projectDir = $PSScriptRoot

$wshell = New-Object -ComObject WScript.Shell
$shortcut = $wshell.CreateShortcut("$desktop\Grafo Heatmap.lnk")
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$projectDir\run.ps1`""
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "Avvia Grafo Heatmap - http://localhost:8000"
$shortcut.WindowStyle = 1
$shortcut.IconLocation = "powershell.exe,0"
$shortcut.Save()

Write-Host "Scorciatoia creata sul desktop: $desktop\Grafo Heatmap.lnk" -ForegroundColor Green
