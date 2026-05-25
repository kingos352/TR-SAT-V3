@echo off
color 0A
echo ========================================
echo TR-SAT Mission Control V3 - Masaustu Modu
echo ========================================
echo Masaustu uygulamasini (Electron Shell) baslatiyorum...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0..\scripts\windows\TR-SAT-App.ps1'"
pause
