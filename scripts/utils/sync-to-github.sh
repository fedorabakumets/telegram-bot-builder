#!/bin/bash

# Скрипт для синхронизации с GitHub
# Использование: ./sync-to-github.sh "Ваше сообщение коммита"

echo "🚀 Синхронизация с GitHub..."
echo ""

# Получаем сообщение коммита или используем дефолтное
COMMIT_MSG="${1:-Update from Replit - $(date +'%Y-%m-%d %H:%M:%S')}"

# Настраиваем git
git config user.name "fedorabakumets"
git config user.email "fedorabakumets@users.noreply.github.com"

echo "✅ Git конфигурация настроена"
echo ""

# Показываем статус
echo "📝 Текущий статус:"
git status --short
echo ""

# Добавляем все изменения
echo "📦 Добавляем изменения..."
git add .
echo ""

# Создаем коммит
echo "💾 Создаем коммит..."
git commit -m "$COMMIT_MSG"
echo ""

# Push в GitHub
echo "🌐 Отправляем в GitHub..."
git push origin main
echo ""

echo "✨ Готово! Проверьте: https://github.com/fedorabakumets/telegram-bot-builder"
