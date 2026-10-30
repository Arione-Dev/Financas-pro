@echo off
title Backend - Financas API (Java Spring Boot)
cd /d "%~dp0backend"
echo Iniciando Financas API na porta 8080...
java -jar target\financas-api-0.0.1-SNAPSHOT.jar
pause

