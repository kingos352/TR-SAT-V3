@echo off
color 0B
echo ========================================
echo TR-SAT Mission Control V3 - Web Modu
echo ========================================
echo Web tabanli sistemi baslatiyorum...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0..\scripts\windows\TR-SAT-Start.ps1'"
pause
