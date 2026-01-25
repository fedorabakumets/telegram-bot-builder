@echo off
echo ========================================
echo   РЕФАКТОРИНГ BOT-GENERATOR.TS
echo ========================================
echo.

echo Запускаем полный рефакторинг...
node scripts/extract-functions/run-full-refactoring.cjs

echo.
echo ========================================
echo   РЕФАКТОРИНГ ЗАВЕРШЕН
echo ========================================
echo.
echo Проверьте результаты:
echo - client/src/lib/modules/ - новые модули
echo - client/src/lib/bot-generator.ts - рефакторенный файл
echo - scripts/extract-functions/REFACTORING_REPORT.md - отчет
echo.
pause