param(
  [string]$BackendPython = "",
  [string]$CondaEnvName = "hackathon-mutation"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

$condaPrefix = "C:\Program Files\Anaconda3"
$condaActivateBat = Join-Path $condaPrefix "Scripts\activate.bat"
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if ($BackendPython -and $BackendPython.Trim().Length -gt 0) {
  $resolvedBackendPython = $BackendPython
  $backendCmd = "Set-Location '$repoRoot'; & '$resolvedBackendPython' services/core_mutation_service.py"
  $frontendCmd = "Set-Location '$repoRoot/frontend'; npm run dev"
} elseif (Test-Path $condaActivateBat) {
  $resolvedBackendPython = "conda:$CondaEnvName"
  $backendCmd = "& '$condaActivateBat' '$condaPrefix'; conda activate '$CondaEnvName'; Set-Location '$repoRoot'; python services/core_mutation_service.py"
  $frontendCmd = "& '$condaActivateBat' '$condaPrefix'; conda activate '$CondaEnvName'; Set-Location '$repoRoot/frontend'; npm run dev"
} elseif (Test-Path $venvPython) {
  $resolvedBackendPython = $venvPython
  $backendCmd = "Set-Location '$repoRoot'; & '$resolvedBackendPython' services/core_mutation_service.py"
  $frontendCmd = "Set-Location '$repoRoot/frontend'; npm run dev"
} else {
  $resolvedBackendPython = "python"
  $backendCmd = "Set-Location '$repoRoot'; python services/core_mutation_service.py"
  $frontendCmd = "Set-Location '$repoRoot/frontend'; npm run dev"
}

Write-Host "Launching backend in new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd | Out-Null

Write-Host "Launching frontend in new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd | Out-Null

Write-Host ""
Write-Host "Dev stack started:" -ForegroundColor Green
Write-Host "  Python:   $resolvedBackendPython"
Write-Host "  Backend:  http://127.0.0.1:8000"
Write-Host "  Frontend: http://localhost:3000"
Write-Host ""
Write-Host "Use Ctrl+C in each terminal to stop services." -ForegroundColor Yellow
