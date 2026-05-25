@echo off
color 0E
echo ========================================
echo TR-SAT Mission Control V3 - Web Modu Derleme
echo ========================================
echo Web tabanli arayuzu guncelliyor ve derliyorum...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0..\scripts\windows\TR-SAT-Build.ps1'"
pause
