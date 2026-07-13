@echo off
setlocal
cd /d "%~dp0"
if "%PORT%"=="" set "PORT=8060"
echo Starting theUSAGE local replica at http://127.0.0.1:8060
node local_server.js --port %PORT%
