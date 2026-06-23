@echo off
cd /d "%~dp0"
echo ========================================
echo  Configurando base de datos Moto Taller
echo ========================================
echo.
echo IMPORTANTE: Cierra el backend (dev.cmd) antes de continuar.
echo.
pause
npm.cmd run db:push
if errorlevel 1 goto error
npm.cmd run db:seed
if errorlevel 1 goto error
echo.
echo Base de datos lista en prisma\dev.db
echo.
pause
exit /b 0

:error
echo.
echo Hubo un error. Si usas OneDrive, pausa la sincronizacion e intenta de nuevo.
pause
exit /b 1
