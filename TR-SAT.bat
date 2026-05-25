@echo off
:menu
cls
echo ========================================
echo TR-SAT Mission Control V3 - Unified Menu
echo ========================================
echo 1. Start Web App
echo 2. Start Desktop-like App Window
echo 3. Build Web App
echo 4. Build Desktop EXE
echo 5. Exit
echo ========================================
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" (
    PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\windows\TR-SAT-Start.ps1'"
    pause
    goto menu
)
if "%choice%"=="2" (
    PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\windows\TR-SAT-App.ps1'"
    pause
    goto menu
)
if "%choice%"=="3" (
    PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\windows\TR-SAT-Build.ps1'"
    pause
    goto menu
)
if "%choice%"=="4" (
    PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\windows\TR-SAT-Desktop-Build.ps1'"
    pause
    goto menu
)
if "%choice%"=="5" (
    exit
)
goto menu
