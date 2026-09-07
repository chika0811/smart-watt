# Phase 1A Automated Execution Script (PowerShell)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  NoskyTech Phase 1A — PostgreSQL + RLS Schema Spike" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Check Docker availability
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    Write-Host "[1/3] Spinning up PostgreSQL container via docker-compose..." -ForegroundColor Yellow
    docker-compose -f "$PSScriptRoot/../docker-compose.yml" up -d
    
    Write-Host "[2/3] Waiting 5 seconds for PostgreSQL healthcheck..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "[INFO] Docker not found in PATH. Assuming local PostgreSQL instance active on port 5432..." -ForegroundColor Yellow
}

# Run test runner
Write-Host "[3/3] Executing Node.js test runner..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/.."
node ./tests/test_runner.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Phase 1A PostgreSQL + RLS Validation Complete!" -ForegroundColor Green
} else {
    Write-Host "`n[FAILURE] Phase 1A Validation Failed!" -ForegroundColor Red
    exit 1
}
