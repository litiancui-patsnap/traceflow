$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root "venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Virtual environment not found at $python"
}

Set-Location $root
& $python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
