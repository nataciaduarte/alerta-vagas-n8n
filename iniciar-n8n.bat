@echo off
rem Inicia o n8n forcando IPv4 (necessario para o Telegram nesta rede)
set NODE_OPTIONS=--dns-result-order=ipv4first
cd /d %USERPROFILE%
npx n8n
