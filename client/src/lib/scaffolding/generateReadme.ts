import { BotData } from '@shared/schema';
import { generateBotFatherCommands } from "../commands";


export function generateReadme(botData: BotData, botName: string): string {
  const nodes = botData?.nodes || [];
  const connections = botData?.connections || [];
  const commandNodes = nodes.filter(node => (node.type === 'start' || node.type === 'command') && node.data?.command
  );

  let readme = '# ' + botName + '\n\n';
  readme += 'Telegram бот, созданный с помощью TelegramBot Builder.\n\n';
  readme += '## Описание\n\n';
  readme += 'Этот бот содержит ' + nodes.length + ' узлов и ' + connections.length + ' соединений.\n\n';
  readme += '### Команды бота\n\n';

  commandNodes.forEach(node => {
    const command = node.data.command || '/unknown';
    const description = node.data.description || 'Описание отсутствует';
    readme += '- `' + command + '` - ' + description + '\n';

    if (node.data.adminOnly) {
      readme += '  - 🔒 Только для администраторов\n';
    }
    if (node.data.isPrivateOnly) {
      readme += '  - 👤 Только в приватных чатах\n';
    }
    if (node.data.requiresAuth) {
      readme += '  - 🔐 Требует авторизации\n';
    }
  });

  readme += '\n## Установка\n\n';
  readme += '1. Клонируйте или скачайте файлы проекта\n';
  readme += '2. Установите зависимости:\n';
  readme += '   ```bash\n';
  readme += '   pip install -r requirements.txt\n';
  readme += '   ```\n\n';
  readme += '3. Создайте файл `.env` и добавьте настройки:\n';
  readme += '   ```\n';
  readme += '   BOT_TOKEN=your_bot_token_here\n';
  readme += '   DATABASE_URL=postgresql://user:password@localhost:5432/bot_db\n';
  readme += '   ```\n\n';
  readme += '4. Настройте базу данных PostgreSQL (опционально):\n';
  readme += '   - Создайте базу данных PostgreSQL\n';
  readme += '   - Обновите DATABASE_URL в .env файле\n';
  readme += '   - Бот автоматически создаст необходимые таблицы при запуске\n';
  readme += '   - Если БД недоступна, бот будет использовать локальное хранилище\n\n';
  readme += '5. Запустите бота:\n';
  readme += '   ```bash\n';
  readme += '   python bot.py\n';
  readme += '   ```\n\n';

  readme += '## Настройка\n\n';
  readme += '### Получение токена бота\n\n';
  readme += '1. Найдите [@BotFather](https://t.me/BotFather) в Telegram\n';
  readme += '2. Отправьте команду `/newbot`\n';
  readme += '3. Следуйте инструкциям для создания нового бота\n';
  readme += '4. Скопируйте полученный токен\n\n';

  readme += '### Настройка команд в @BotFather\n\n';
  readme += '1. Отправьте команду `/setcommands` в @BotFather\n';
  readme += '2. Выберите своего бота\n';
  readme += '3. Скопируйте и отправьте следующие команды:\n\n';
  readme += '```\n';
  const botFatherCommands = generateBotFatherCommands(nodes);
  readme += botFatherCommands || '';
  readme += '\n```\n\n';

  readme += '## Структура проекта\n\n';
  readme += '- `bot.py` - Основной файл бота\n';
  readme += '- `requirements.txt` - Зависимости Python\n';
  readme += '- `config.yaml` - Конфигурационный файл\n';
  readme += '- `README.md` - Документация\n';
  readme += '- `Dockerfile` - Для контейнеризации (опционально)\n\n';

  readme += '## Функциональность\n\n';
  readme += '### Статистика\n\n';
  readme += '- **Всего узлов**: ' + nodes.length + '\n';
  readme += '- **Команд**: ' + commandNodes.length + '\n';
  readme += '- **Сообщений**: ' + nodes.filter(n => n.type === 'message').length + '\n';
  readme += '- **Кнопок**: ' + (nodes.reduce((sum: number, node: any) => sum + (node.data?.buttons?.length || 0), 0) as number) + '\n\n';

  readme += '### Безопасность\n\n';
  readme += 'Бот включает следующие функции безопасности:\n';
  readme += '- Проверка администраторских прав\n';
  readme += '- Ограничения на приватные чаты\n';
  readme += '- Система авторизации пользователей\n\n';

  readme += '## Разработка\n\n';
  readme += 'Этот бот создан с использованием:\n';
  readme += '- [aiogram 3.x](https://docs.aiogram.dev/) - современная библиотека для Telegram Bot API\n';
  readme += '- Python 3.8+\n';
  readme += '- Асинхронное программирование\n\n';

  readme += '## Лицензия\n\n';
  readme += 'Сгенерировано с помощью TelegramBot Builder\n';

  return readme;
}
