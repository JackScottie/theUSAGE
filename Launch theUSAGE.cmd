@echo off
setlocal
cd /d "%~dp0"
if "%PORT%"=="" set "PORT=8060"
echo Starting Usage Maps by theUSAGE at http://127.0.0.1:8060
node --env-file-if-exists=.env local_server.js --port %PORT%
