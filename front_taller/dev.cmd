@echo off
cd /d "%~dp0"
echo ========================================
echo  Moto Taller - Frontend (Next.js)
echo  Puerto fijo: http://localhost:3000
echo ========================================
echo.
echo NOTA: Este proyecto NO usa el puerto 5173 (ese es de Vite).
echo Si el puerto 3000 esta ocupado, cierra las otras terminales con npm run dev.
echo.
npm.cmd run dev
