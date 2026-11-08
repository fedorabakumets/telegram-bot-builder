@echo off
rem @fileoverview Запуск собранного production-сервера без загрузчика TypeScript.
cd /d "%~dp0.."
set NODE_ENV=production
node dist/server/index.js
