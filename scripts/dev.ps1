# CosmicTasha — Development Launcher
# Usage: powershell -ExecutionPolicy Bypass -File scripts/dev.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$WebDir = Join-Path $ProjectRoot "web"

Write-Host ""
Write-Host "  CosmicTasha — Development Server" -ForegroundColor Magenta
Write-Host "  =================================" -ForegroundColor DarkGray
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  Node.js:     $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path (Join-Path $WebDir "node_modules"))) {
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    Set-Location $WebDir
    npm install
    Write-Host "  Dependencies installed." -ForegroundColor Green
}

# Check for .env file
$envFile = Join-Path $WebDir ".env.local"
$envExample = Join-Path $WebDir ".env.example"
if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "  Created .env.local from .env.example" -ForegroundColor Yellow
        Write-Host "  Edit web/.env.local to configure database and services" -ForegroundColor Yellow
    }
}

# Show status
Write-Host ""
Write-Host "  Database:    localStorage fallback (no PostgreSQL needed)" -ForegroundColor DarkGray
Write-Host "  biged-rs:    mock fallback (no running instance needed)" -ForegroundColor DarkGray
Write-Host "  AI preview:  template-based mock" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Starting dev server..." -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

# Start the dev server
Set-Location $WebDir
npm run dev
