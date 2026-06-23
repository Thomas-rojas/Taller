@echo off
cd /d "%~dp0"
echo.
echo  Asistente de Google Calendar - Moto Taller
echo  ==========================================
echo.
echo  Cierra el backend (dev.cmd) antes de continuar.
echo.
pause
npm.cmd run google:setup
