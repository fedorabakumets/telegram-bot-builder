#!/bin/bash
# /** @fileoverview Отправка изменений через настроенный Git remote без встроенных секретов. */

echo "🔧 Принудительная синхронизация с GitHub..."

# Удаляем все возможные lock файлы
find .git -name "*.lock" -type f -delete 2>/dev/null
rm -f .git/index.lock 2>/dev/null
rm -f .git/config.lock 2>/dev/null
rm -f .git/HEAD.lock 2>/dev/null

# Ждем немного, чтобы файловая система успокоилась
sleep 1

# Настраиваем git
git config --local user.name "fedorabakumets"
git config --local user.email "fedorabakumets@users.noreply.github.com"

# Показываем изменения
echo ""
echo "📝 Текущие изменения:"
git status --short

# Добавляем изменения
echo ""
echo "📦 Добавляем файлы..."
git add -A

# Создаем коммит
COMMIT_MSG="🚀 Update from Replit - $(date +'%Y-%m-%d %H:%M:%S')"
echo ""
echo "💾 Создаем коммит: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" || echo "Нет изменений для коммита"

# Отправляем на GitHub
echo ""
echo "🌐 Отправляем на GitHub..."
git push origin main

echo ""
echo "✨ Готово! Проверьте: https://github.com/fedorabakumets/telegram-bot-builder"
