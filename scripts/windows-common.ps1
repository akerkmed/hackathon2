# Shared helpers for the Windows launcher and portable bundler.
# Safe to dot-source from other scripts:
#   . (Join-Path $PSScriptRoot "windows-common.ps1")

$script:Root = Split-Path -Parent $PSScriptRoot
$script:NodeVersion = "22.14.0"
$script:RuntimeRoot = Join-Path $env:LOCALAPPDATA "M3ak\runtime"

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "> $Message" -ForegroundColor Cyan
}

function Write-Note {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor DarkGray
}

function Stop-WithError {
    param([string]$Message)
    Write-Host ""
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Test-NodeExe {
    param([string]$Exe)
    if (-not $Exe -or -not (Test-Path -LiteralPath $Exe)) { return $false }
    try {
        $version = & $Exe --version 2>$null
        if (-not $version) { return $false }
        $major = [int](($version -replace '^v', '') -split '\.')[0]
        return ($major -ge 18)
    }
    catch {
        return $false
    }
}

function Install-PortableNode {
    New-Item -ItemType Directory -Force -Path $RuntimeRoot | Out-Null

    $zip = Join-Path $RuntimeRoot ("node-v{0}-win-x64.zip" -f $NodeVersion)
    $url = "https://nodejs.org/dist/v{0}/node-v{0}-win-x64.zip" -f $NodeVersion

    Write-Step "Downloading portable Node.js $NodeVersion (one time, about 30 MB)"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

    Write-Step "Extracting Node.js"
    Expand-Archive -LiteralPath $zip -DestinationPath $RuntimeRoot -Force
    Remove-Item -LiteralPath $zip -Force -ErrorAction SilentlyContinue
}

# Returns @{ Exe = <node.exe>; Npm = <npm.cmd>; Source = "system" | "portable" }.
# Uses an existing Node.js install when one is available, otherwise downloads a
# portable copy into %LOCALAPPDATA%\M3ak\runtime (no installer, no admin rights).
function Resolve-Node {
    $onPath = Get-Command node -ErrorAction SilentlyContinue
    if ($onPath -and (Test-NodeExe $onPath.Source)) {
        $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
        if ($npm) {
            return [pscustomobject]@{
                Exe    = $onPath.Source
                Npm    = $npm.Source
                Source = "system"
            }
        }
    }

    $portableDir = Join-Path $RuntimeRoot ("node-v{0}-win-x64" -f $NodeVersion)
    $nodeExe = Join-Path $portableDir "node.exe"
    $npmCmd = Join-Path $portableDir "npm.cmd"

    if (-not (Test-NodeExe $nodeExe)) {
        Install-PortableNode
    }

    if (-not (Test-NodeExe $nodeExe)) {
        Stop-WithError "Could not prepare a Node.js runtime at $portableDir"
    }

    return [pscustomobject]@{
        Exe    = $nodeExe
        Npm    = $npmCmd
        Source = "portable"
    }
}

function Test-PortFree {
    param([int]$Candidate)
    $listener = $null
    try {
        $listener = New-Object System.Net.Sockets.TcpListener -ArgumentList ([System.Net.IPAddress]::Loopback), $Candidate
        $listener.Start()
        return $true
    }
    catch {
        return $false
    }
    finally {
        if ($null -ne $listener) { $listener.Stop() }
    }
}

function Resolve-FreePort {
    param([int]$Candidate)
    $start = $Candidate
    while (-not (Test-PortFree $Candidate)) {
        $Candidate++
        if ($Candidate -gt $start + 25) {
            Stop-WithError "No free port found between $start and $($start + 25)."
        }
    }
    if ($Candidate -ne $start) {
        Write-Note "Port $start is busy, using $Candidate instead."
    }
    return $Candidate
}

function Get-LanAddress {
    try {
        $addresses = [System.Net.Dns]::GetHostAddresses($env:COMPUTERNAME)
        foreach ($address in $addresses) {
            if ($address.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
                $address.IPAddressToString -notlike "127.*") {
                return $address.IPAddressToString
            }
        }
    }
    catch { }
    return "localhost"
}
