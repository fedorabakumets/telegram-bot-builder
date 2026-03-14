@echo off
chcp 65001 >nul
set NODE_UTF8=1
echo.
echo Запуск тестов с UTF-8 кодировкой...
echo.
npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/run-simple.ts
pause
