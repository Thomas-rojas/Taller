@echo off
cd /d "%~dp0"
echo Abriendo Prisma Studio...
echo Si no carga, cierra primero el backend (dev.cmd) y vuelve a intentar.
echo.
npm.cmd run db:studio
