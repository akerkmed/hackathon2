# One-click local host for M3ak on Windows.
#
# First run: uses an existing Node.js 18+ install, or downloads a portable
# copy into %LOCALAPPDATA%\M3ak\runtime, installs dependencies and builds.
# Later runs start the production server immediately.
#
# Usage:
#   .\scripts\host-windows.ps1                 # http://localhost:3000
#   .\scripts\host-windows.ps1 -Port 4000
#   .\scripts\host-windows.ps1 -Lan            # reachable from phones on the LAN
#   .\scripts\host-windows.ps1 -Rebuild        # force reinstall + rebuild

[CmdletBinding()]
param(
    [int]$Port = 3000,
    [switch]$Lan,
    [switch]$Rebuild,
    [switch]$NoBrowser
)

. (Join-Path $PSScriptRoot "windows-common.ps1")

Set-Location -LiteralPath $Root

$env:NEXT_TELEMETRY_DISABLED = "1"
$env:NODE_ENV = "production"

$node = Resolve-Node
if ($node.Source -eq "portable") {
    Write-Note "Using portable Node.js at $($node.Exe)"
}
else {
    Write-Note "Using Node.js at $($node.Exe)"
}

$nextModule = Join-Path $Root "node_modules\next\package.json"
if ($Rebuild -or -not (Test-Path -LiteralPath $nextModule)) {
    Write-Step "Installing dependencies (one time, needs internet)"
    & $node.Npm install --no-audit --no-fund --prefer-offline
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError "npm install failed. Check your internet connection and try again, or run 'Start M3ak.bat -Rebuild'."
    }
}

$buildId = Join-Path $Root ".next\BUILD_ID"
if ($Rebuild -or -not (Test-Path -LiteralPath $buildId)) {
    Write-Step "Building the production app (one time, takes a minute or two)"
    & $node.Npm run build
    if ($LASTEXITCODE -ne 0) {
        Stop-WithError "The production build failed. Scroll up for the Next.js error output."
    }
}

$Port = Resolve-FreePort $Port

$nextBin = Join-Path $Root "node_modules\next\dist\bin\next"
if (-not (Test-Path -LiteralPath $nextBin)) {
    Stop-WithError "Next.js is missing from node_modules. Run 'Start M3ak.bat -Rebuild'."
}

$serverArgs = @($nextBin, "start", "-p", "$Port")
$displayHost = "localhost"
if ($Lan) {
    $serverArgs += @("-H", "0.0.0.0")
    $displayHost = Get-LanAddress
}

$url = "http://${displayHost}:${Port}"

if (-not $NoBrowser) {
    # Open the browser shortly after the server starts listening.
    $opener = "Start-Sleep -Seconds 3; Start-Process '$url'"
    Start-Process -FilePath "powershell.exe" `
        -ArgumentList @("-NoProfile", "-WindowStyle", "Hidden", "-Command", $opener) `
        -WindowStyle Hidden | Out-Null
}

Write-Host ""
Write-Host "  M3ak is running at $url" -ForegroundColor Green
if ($Lan) {
    Write-Host "  (LAN mode: open the same URL from another device on this network)" -ForegroundColor DarkGray
}
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

& $node.Exe $serverArgs
exit $LASTEXITCODE
