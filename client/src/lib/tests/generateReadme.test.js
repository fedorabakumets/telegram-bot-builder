import { strict as assert } from 'assert';
import { generateReadme } from '../scaffolding/generateReadme';

/**
 * Тестирование функции generateReadme
 * 
 * Эта функция генерирует содержимое файла README.md для бота.
 */
console.log('Running tests for generateReadme...');

// Тест 1: Проверка генерации README с пустыми данными
const emptyBotData = { nodes: [], connections: [] };
const emptyReadme = generateReadme(emptyBotData, 'TestBot');
assert.strictEqual(typeof emptyReadme, 'string', 'Function should return a string');
assert.ok(emptyReadme.includes('# TestBot'), 'README should include bot name as title');

// Тест 2: Проверка генерации README с данными
const botData = {
  nodes: [
    { id: '1', type: 'start', data: { command: '/start', description: 'Start the bot' } },
    { id: '2', type: 'message', data: { messageText: 'Hello' } }
  ],
  connections: [
    { id: 'conn1', source: '1', target: '2' }
  ]
};
const readme = generateReadme(botData, 'MyBot');
assert.ok(readme.includes('# MyBot'), 'README should include bot name as title');
assert.ok(readme.includes('Telegram бот, созданный с помощью TelegramBot Builder'), 'README should include description');
assert.ok(readme.includes('2 узлов и 1 соединений'), 'README should include statistics');

// Тест 3: Проверка команд в README
assert.ok(readme.includes('`/start` - Start the bot'), 'README should include commands');

// Тест 4: Проверка установки и настройки
assert.ok(readme.includes('## Установка'), 'README should include installation section');
assert.ok(readme.includes('pip install -r requirements.txt'), 'README should include installation command');

// Тест 5: Проверка структуры проекта
assert.ok(readme.includes('## Структура проекта'), 'README should include project structure section');
assert.ok(readme.includes('`bot.py` - Основной файл бота'), 'README should include project structure details');

// Тест 6: Проверка функциональности
assert.ok(readme.includes('## Функциональность'), 'README should include functionality section');
assert.ok(readme.includes('**Всего узлов**: 2'), 'README should include node count');

// Тест 7: Проверка настройки команд в BotFather
assert.ok(readme.includes('## Настройка команд в @BotFather'), 'README should include BotFather setup section');

// Тест 8: Проверка безопасности
assert.ok(readme.includes('## Безопасность'), 'README should include security section');

console.log('All tests for generateReadme passed!');