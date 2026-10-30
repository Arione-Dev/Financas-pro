@echo off
title Enviar Finanças Pro para o Servidor Linux
set SERVER_IP=192.168.0.13
set SERVER_USER=arione
set DEST_DIR=~/app-financas

echo ============================================================
echo   Enviando arquivos do projeto para %SERVER_USER%@%SERVER_IP%
echo ============================================================

ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %DEST_DIR%"

scp -r docker-compose.yml .env .env.example README.md .dockerignore %SERVER_USER%@%SERVER_IP%:%DEST_DIR%/
scp -r backend/src backend/pom.xml backend/Dockerfile %SERVER_USER%@%SERVER_IP%:%DEST_DIR%/backend/
scp -r frontend/src frontend/public frontend/package.json frontend/index.html frontend/vite.config.ts frontend/tailwind.config.js frontend/postcss.config.js frontend/tsconfig.json frontend/nginx.conf frontend/Dockerfile %SERVER_USER%@%SERVER_IP%:%DEST_DIR%/frontend/

echo.
echo ============================================================
echo   Arquivos enviados com sucesso!
echo   Para subir no servidor, acesse via SSH e rode:
echo     cd %DEST_DIR%
echo     docker compose up -d --build
echo ============================================================
pause

