#!/usr/bin/env pwsh
# Устанавливаем UTF-8 кодировку для вывода
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "Запуск тестов с UTF-8 кодировкой..." -ForegroundColor Green
Write-Host ""

# Запускаем тесты
npx tsx --tsconfig tsconfig.json client/components/editor/database/dialog/tests/run-simple.ts
