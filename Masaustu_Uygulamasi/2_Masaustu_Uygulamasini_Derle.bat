@echo off
color 0E
echo ========================================
echo TR-SAT Mission Control V3 - Masaustu Derleme
echo ========================================
echo Uygulamayi bastan asagiya bagimsiz bir EXE (Portable/Kurulum) olarak paketliyorum...
echo Lutfen bekleyin, bu islem biraz surebilir.
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0..\scripts\windows\TR-SAT-Desktop-Build.ps1'"
pause
