# Простой тест API через PowerShell

Write-Host "🧪 ТЕСТ: Генерация бота через API..." -ForegroundColor Green

$testData = @{
    botData = @{
        nodes = @(
            @{
                id = "start-1"
                type = "start"
                position = @{ x = 100; y = 100 }
                data = @{
                    messageText = "Привет! Это тестовый бот после рефакторинга."
                    keyboardType = "none"
                    buttons = @()
                    resizeKeyboard = $true
                    oneTimeKeyboard = $false
                    markdown = $false
                    formatMode = "none"
                    synonyms = @()
                    isPrivateOnly = $false
                    adminOnly = $false
                    isStart = $true
                    command = "/start"
                    description = "Стартовая команда"
                    options = @()
                    messageIdSource = "none"
                    disableNotification = $false
                    userIdSource = "none"
                    mapService = "google"
                    attachedMedia = @()
                    waitForTextInput = $false
                }
            }
        )
        connections = @()
    }
    botName = "RefactoredTestBot"
    groups = @()
    userDatabaseEnabled = $false
    projectId = 1
    enableLogging = $true
}

$json = $testData | ConvertTo-Json -Depth 10
$uri = "http://localhost:5000/api/projects/1/bot/generate"

try {
    Write-Host "📡 Отправляем запрос на $uri" -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $json -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "✅ УСПЕХ: Бот сгенерирован!" -ForegroundColor Green
    Write-Host "📊 Размер кода: $($response.pythonCode.Length) символов" -ForegroundColor Cyan
    Write-Host "📏 Строк кода: $($response.pythonCode.Split("`n").Count)" -ForegroundColor Cyan
    
    # Проверки
    $checks = @(
        @{ name = "Импорты aiogram"; test = $response.pythonCode.Contains("from aiogram import") }
        @{ name = "Импорты Update"; test = $response.pythonCode.Contains("Update") }
        @{ name = "Токен бота"; test = $response.pythonCode.Contains("BOT_TOKEN") }
        @{ name = "Обработчик start"; test = $response.pythonCode.Contains("start_handler") }
        @{ name = "Тестовое сообщение"; test = $response.pythonCode.Contains("Привет! Это тестовый бот после рефакторинга") }
    )
    
    Write-Host "`n🔍 ПРОВЕРКИ СОДЕРЖИМОГО:" -ForegroundColor Yellow
    foreach ($check in $checks) {
        $status = if ($check.test) { "✅" } else { "❌" }
        Write-Host "  $status $($check.name)" -ForegroundColor $(if ($check.test) { "Green" } else { "Red" })
    }
    
    $allPassed = ($checks | Where-Object { -not $_.test }).Count -eq 0
    
    if ($allPassed) {
        Write-Host "`n🎉 ВСЕ ПРОВЕРКИ ПРОШЛИ!" -ForegroundColor Green
        Write-Host "✅ Рефакторинг успешен - генерация работает через API" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОШЛИ" -ForegroundColor Yellow
    }
    
    # Показываем начало кода
    Write-Host "`n📝 НАЧАЛО СГЕНЕРИРОВАННОГО КОДА:" -ForegroundColor Yellow
    Write-Host ("=" * 50) -ForegroundColor Gray
    Write-Host $response.pythonCode.Substring(0, [Math]::Min(500, $response.pythonCode.Length)) -ForegroundColor White
    Write-Host ("=" * 50) -ForegroundColor Gray
    
} catch {
    Write-Host "❌ ОШИБКА: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Убедитесь, что сервер запущен на порту 5000" -ForegroundColor Yellow
}