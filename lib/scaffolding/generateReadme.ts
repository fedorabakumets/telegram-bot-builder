import { BotData } from '@shared/schema';
import { generateBotFatherCommands } from "../commands";
import { extractNodesAndConnections } from '../bot-generator/core/extract-nodes-and-connections';

export function generateReadme(
  botData: BotData,
  botName: string,
  projectId?: number,
  tokenId?: number,
  customFileName?: string
): string {
  const { nodes } = extractNodesAndConnections(botData);
  const commandNodes = [
    ...nodes.filter(node => node.type === 'command_trigger' && node.data?.command),
  ].filter((node, index, array) => {
    const command = (node.data?.command || '').trim().toLowerCase();
    if (!command) return false;
    const firstIndex = array.findIndex(candidate => (candidate.data?.command || '').trim().toLowerCase() === command);
    return firstIndex === index;
  });

  // Определяем имя файла бота
  const fileName = customFileName
    ? `${customFileName}.py`
    : projectId !== undefined && tokenId !== undefined
      ? `bot_${projectId}_${tokenId}.py`
      : 'bot.py';

  let readme = '# ' + botName + '\n\n';
  readme += 'Telegram бот, созданный с помощью TelegramBot Builder.\n\n';
  readme += '## Описание\n\n';
  readme += 'Этот бот содержит ' + nodes.length + ' узлов.\n\n';
  readme += '### Команды бота\n\n';

  commandNodes.forEach(node => {
    const command = node.data.command || '/unknown';
    const description = node.data.description || 'Описание отсутствует';
    readme += '- `' + command + '` - ' + description + '\n';

    if (node.data.adminOnly) {
      readme += '  - 🔒 Только для администраторов\n';
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
  readme += '3. Настройте переменные окружения в файле `.env`\n\n';

  readme += '4. Запустите бота:\n';
  readme += '   ```bash\n';
  readme += '   python ' + fileName + '\n';
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
  readme += '<!-- BOTFATHER_COMMANDS_START -->\n';
  readme += '```\n';
  const botFatherCommands = generateBotFatherCommands(nodes);
  readme += botFatherCommands || 'Нет команд для отображения';
  readme += '\n```\n';
  readme += '<!-- BOTFATHER_COMMANDS_END -->\n\n';

  readme += '## Структура проекта\n\n';
  readme += '```\n';
  readme += '📦 ' + botName + '/\n';
  readme += '┣ 📄 ' + fileName + ' — Основной файл бота (имя может отличаться)\n';
  readme += '┣ 📄 project.json — Данные проекта (схема бота)\n';
  readme += '┣ 📄 requirements.txt — Зависимости Python\n';
  readme += '┣ 📄 .env — Переменные окружения\n';
  readme += '┣ 📄 README.md — Документация\n';
  readme += '┗ 📄 Dockerfile — Для контейнеризации (опционально)\n';
  readme += '```\n\n';

  readme += '## Функциональность\n\n';
  readme += '### Статистика\n\n';
  readme += '- **Всего узлов**: ' + nodes.length + '\n';
  readme += '- **Команд**: ' + commandNodes.length + '\n';
  readme += '- **Сообщений**: ' + nodes.filter(n => n && n.type === 'message').length + '\n';
  readme += '- **Кнопок**: ' + (nodes.reduce((sum: number, node: any) => sum + (node?.data?.buttons?.length || 0), 0) as number) + '\n';
  readme += '- **Клавиатур**: ' + nodes.filter(n => n && n.data?.keyboardType !== 'none').length + '\n';
  readme += '- **В меню**: ' + commandNodes.filter(n => n.data?.showInMenu).length + '\n\n';

  readme += '## Лицензия\n\n';
  readme += 'Сгенерировано с помощью TelegramBot Builder\n';

  return readme;
}
