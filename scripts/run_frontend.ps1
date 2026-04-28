$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$vite = Join-Path $frontend "node_modules\.bin\vite.cmd"

if (-not (Test-Path $vite)) {
    throw "Vite binary not found at $vite. Run npm install in frontend first."
}

Set-Location $frontend
& $vite --host 127.0.0.1 --port 5173
