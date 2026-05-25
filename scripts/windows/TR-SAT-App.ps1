$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..\..

# Just call the main start script with the -AppMode flag
& .\scripts\windows\TR-SAT-Start.ps1 -AppMode
