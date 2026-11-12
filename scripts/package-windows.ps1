# Builds a self-contained Windows folder + zip:
#   dist\M3ak-Windows\        portable app with its own Node.js runtime
#   dist\M3ak-Windows.zip     copy this to any Windows PC, extract, double-click
#
# The bundle needs no installer, no admin rights and no internet on the target
# machine. Build it once on a Windows PC with internet access.
#
# Usage:
#   .\scripts\package-windows.ps1
#   .\scripts\package-windows.ps1 -Rebuild

[CmdletBinding()]
param(
    [switch]$Rebuild
)

. (Join-Path $PSScriptRoot "windows-common.ps1")

Set-Location -LiteralPath $Root

$env:NEXT_TELEMETRY_DISABLED = "1"

$node = Resolve-Node
Write-Note "Using Node.js at $($node.Exe)"

$nextModule = Join-Path $Root "node_modules\next\package.json"
if ($Rebuild -or -not (Test-Path -LiteralPath $nextModule)) {
    Write-Step "Installing dependencies"
    & $node.Npm install --no-audit --no-fund --prefer-offline
    if ($LASTEXITCODE -ne 0) { Stop-WithError "npm install failed." }
}

$buildId = Join-Path $Root ".next\BUILD_ID"
if ($Rebuild -or -not (Test-Path -LiteralPath $buildId)) {
    Write-Step "Building the production app"
    & $node.Npm run build
    if ($LASTEXITCODE -ne 0) { Stop-WithError "The production build failed." }
}

$standalone = Join-Path $Root ".next\standalone"
if (-not (Test-Path -LiteralPath $standalone)) {
    Stop-WithError "No standalone build found. Make sure next.config.ts contains output: 'standalone', then rebuild."
}

# Locate the generated server entrypoint (standalone output can be nested when
# the project sits inside a workspace).
$serverJs = Get-ChildItem -LiteralPath $standalone -Filter "server.js" -Recurse -File |
    Where-Object { $_.FullName -notmatch "\\node_modules\\" } |
    Sort-Object { $_.FullName.Length } |
    Select-Object -First 1

if (-not $serverJs) {
    Stop-WithError "Could not find server.js inside .next\standalone."
}

$appSource = $serverJs.Directory.FullName

$distRoot = Join-Path $Root "dist"
$bundle = Join-Path $distRoot "M3ak-Windows"
$appDest = Join-Path $bundle "app"
$runtimeDest = Join-Path $bundle "runtime"

Write-Step "Assembling portable bundle"
if (Test-Path -LiteralPath $bundle) {
    Remove-Item -LiteralPath $bundle -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $appDest, $runtimeDest | Out-Null

Copy-Item -Path (Join-Path $appSource "*") -Destination $appDest -Recurse -Force
Copy-Item -LiteralPath $node.Exe -Destination (Join-Path $runtimeDest "node.exe") -Force

# Next.js keeps static assets outside the standalone output.
$staticSource = Join-Path $Root ".next\static"
$staticDest = Join-Path $appDest ".next\static"
New-Item -ItemType Directory -Force -Path $staticDest | Out-Null
Copy-Item -Path (Join-Path $staticSource "*") -Destination $staticDest -Recurse -Force

$publicSource = Join-Path $Root "public"
if (Test-Path -LiteralPath $publicSource) {
    Copy-Item -Path (Join-Path $publicSource "*") -Destination (Join-Path $appDest "public") -Recurse -Force
}

$launcher = @'
@echo off
title M3ak
setlocal
cd /d "%~dp0app"
if "%PORT%"=="" set PORT=3000
set NODE_ENV=production
set NEXT_TELEMETRY_DISABLED=1
echo.
echo   M3ak is running at http://localhost:%PORT%
echo   Press Ctrl+C to stop.
echo.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:%PORT%'"
"%~dp0runtime\node.exe" server.js
if errorlevel 1 pause
'@
Set-Content -LiteralPath (Join-Path $bundle "Run M3ak.bat") -Value $launcher -Encoding ASCII

$readme = @'
M3ak - portable Windows build
=============================

1. Double-click "Run M3ak.bat".
2. Your browser opens at http://localhost:3000.

No installation, no admin rights, no internet connection required.
Everything (including the Node.js runtime) is inside this folder.

To use a different port, open a terminal here and run:
    set PORT=4000
    Run M3ak.bat

If Windows SmartScreen asks about the .bat file, choose "More info" >
"Run anyway". The file only starts the local server in this folder.

The demo is deterministic and stores its state in memory: closing the
server resets the demo.
'@
Set-Content -LiteralPath (Join-Path $bundle "Read me.txt") -Value $readme -Encoding ASCII

$zip = Join-Path $distRoot "M3ak-Windows.zip"
if (Test-Path -LiteralPath $zip) {
    Remove-Item -LiteralPath $zip -Force
}

Write-Step "Creating $zip (this can take a minute)"
$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if ($tar) {
    Push-Location -LiteralPath $distRoot
    try {
        & $tar.Source -a -c -f $zip "M3ak-Windows"
        if ($LASTEXITCODE -ne 0) { Stop-WithError "tar failed to create the archive." }
    }
    finally {
        Pop-Location
    }
}
else {
    Compress-Archive -Path $bundle -DestinationPath $zip -Force
}

Write-Host ""
Write-Host "  Portable bundle ready:" -ForegroundColor Green
Write-Host "    $bundle"
Write-Host "    $zip"
Write-Host ""
Write-Host "  Copy the .zip to any Windows PC, extract it, and run 'Run M3ak.bat'." -ForegroundColor DarkGray
Write-Host ""
