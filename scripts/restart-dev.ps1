param(
  [string]$BackendPython = "",
  [string]$CondaEnvName = "hackathon-mutation",
  [int]$BackendPort = 8000,
  [int]$FrontendPort = 3000
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Stop-PortProcess {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port,
    [string]$Label
  )

  $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $listeners) {
    Write-Host "No active listener on port $Port ($Label)." -ForegroundColor DarkGray
    return
  }

  $procIds = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
  foreach ($procId in $procIds) {
    try {
      $proc = Get-Process -Id $procId -ErrorAction Stop
      Write-Host "Stopping $Label process PID=$procId Name=$($proc.ProcessName) on port $Port..." -ForegroundColor Yellow
      Stop-Process -Id $procId -Force -ErrorAction Stop
    } catch {
      Write-Host "Unable to stop PID=$procId on port ${Port}: $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}

Stop-PortProcess -Port $BackendPort -Label "backend"
Stop-PortProcess -Port $FrontendPort -Label "frontend"

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
Write-Host "Dev stack restarted:" -ForegroundColor Green
Write-Host "  Python:   $resolvedBackendPython"
Write-Host "  Backend:  http://127.0.0.1:$BackendPort"
Write-Host "  Frontend: http://localhost:$FrontendPort"
Write-Host ""
Write-Host "Use Ctrl+C in each terminal to stop services." -ForegroundColor Yellow
