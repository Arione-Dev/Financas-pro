@echo off
title Frontend - Financas PWA (React)
cd /d "%~dp0frontend"
echo Iniciando Financas PWA na porta 5173...
call npx vite --host 0.0.0.0 --port 5173
pause

