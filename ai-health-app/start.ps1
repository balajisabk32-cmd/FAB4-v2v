# Powershell script to run all 3 tiers concurrently on Windows

Write-Host "Cleaning up existing processes on ports 8000, 3001, 3000, 3002..." -ForegroundColor Yellow
$ports = @(8000, 3001, 3000, 3002)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($proc) {
        $pidToKill = $proc[0].OwningProcess
        Write-Host "Killing process $pidToKill on port $port"
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}

# 1. Start FastAPI ML Service
Write-Host "Starting FastAPI ML Service on port 8000..." -ForegroundColor Green
$mlJob = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd ml-service; & .\.venv\Scripts\Activate.ps1; uvicorn main:app --host 127.0.0.1 --port 8000" -PassThru -WindowStyle Minimized

# 2. Start Express Backend
Write-Host "Starting Express Orchestration Backend on port 3001..." -ForegroundColor Green
$expressJob = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd backend; node server.js" -PassThru -WindowStyle Minimized

# 3. Start Next.js Frontend
Write-Host "Starting Next.js Frontend..." -ForegroundColor Green
$frontendJob = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru -WindowStyle Minimized

Write-Host "All tiers started. FastAPI is on port 8000, Express is on 3001, Next.js is on 3000/3002." -ForegroundColor Cyan
Write-Host "You can close the spawned minimized PowerShell windows to terminate the apps." -ForegroundColor Cyan
