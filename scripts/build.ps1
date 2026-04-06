# CosmicTasha — Production Build
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$WebDir = Join-Path $ProjectRoot "web"
$DistDir = Join-Path $ProjectRoot "dist"

Write-Host ""
Write-Host "  CosmicTasha — Production Build" -ForegroundColor Magenta
Write-Host "  ===============================" -ForegroundColor DarkGray
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

# Run production build
Write-Host "  Running production build..." -ForegroundColor Cyan
Set-Location $WebDir
npm run build

# Clean dist folder
if (Test-Path $DistDir) {
    Remove-Item -Recurse -Force $DistDir
}

# Copy standalone output
$StandaloneDir = Join-Path $WebDir ".next\standalone"
if (-not (Test-Path $StandaloneDir)) {
    Write-Host ""
    Write-Host "  ERROR: .next/standalone not found." -ForegroundColor Red
    Write-Host "  Ensure next.config has output: 'standalone'" -ForegroundColor Red
    exit 1
}

Write-Host "  Copying standalone build to dist/..." -ForegroundColor Cyan
Copy-Item -Recurse $StandaloneDir $DistDir

# Copy public assets
$PublicDir = Join-Path $WebDir "public"
if (Test-Path $PublicDir) {
    $DestPublic = Join-Path $DistDir "public"
    Copy-Item -Recurse $PublicDir $DestPublic
    Write-Host "  Copied public/ assets" -ForegroundColor Green
}

# Copy static files (required for standalone mode)
$StaticDir = Join-Path $WebDir ".next\static"
if (Test-Path $StaticDir) {
    $DestStatic = Join-Path $DistDir ".next\static"
    New-Item -ItemType Directory -Force -Path (Join-Path $DistDir ".next") | Out-Null
    Copy-Item -Recurse $StaticDir $DestStatic
    Write-Host "  Copied .next/static/ assets" -ForegroundColor Green
}

# Done
Write-Host ""
Write-Host "  Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Deploy the dist/ folder to your production server." -ForegroundColor White
Write-Host ""
Write-Host "  To run:" -ForegroundColor DarkGray
Write-Host "    node dist/server.js" -ForegroundColor Cyan
Write-Host ""
