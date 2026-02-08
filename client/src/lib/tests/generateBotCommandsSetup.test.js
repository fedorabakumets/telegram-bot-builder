import { strict as assert } from 'assert';
import { generateBotCommandsSetup } from '../bot-commands-setup';

/**
 * Тестирование функции generateBotCommandsSetup
 * 
 * Эта функция генерирует Python код для настройки меню команд BotFather.
 */
console.log('Running tests for generateBotCommandsSetup...');

// Тест 1: Пустой массив команд
const emptyCommandsCode = generateBotCommandsSetup([]);
assert.strictEqual(emptyCommandsCode, '', 'Empty commands array should return empty string');

// Тест 2: Команды с описанием
const menuCommands = [
  { data: { command: '/start', description: 'Start the bot' } },
  { data: { command: '/help', description: 'Get help' } }
];
const codeWithDescriptions = generateBotCommandsSetup(menuCommands);

// Проверяем, что код содержит необходимые элементы
assert.ok(codeWithDescriptions.includes('# Настройка меню команд'), 'Code should include menu setup comment');
assert.ok(codeWithDescriptions.includes('async def set_bot_commands():'), 'Code should include function definition');
assert.ok(codeWithDescriptions.includes('BotCommand(command="start", description="Start the bot")'), 'Code should include first command');
assert.ok(codeWithDescriptions.includes('BotCommand(command="help", description="Get help")'), 'Code should include second command');
assert.ok(codeWithDescriptions.includes('await bot.set_my_commands(commands)'), 'Code should include command setup call');

// Тест 3: Команда без описания
const commandWithoutDescription = [
  { data: { command: '/about' } } // Нет описания
];
const codeWithoutDescription = generateBotCommandsSetup(commandWithoutDescription);
assert.ok(codeWithoutDescription.includes('BotCommand(command="about", description="Команда бота")'), 'Code should use default description for command without description');

// Тест 4: Команда без слеша
const commandWithoutSlash = [
  { data: { command: 'contact', description: 'Contact us' } }
];
const codeWithoutSlash = generateBotCommandsSetup(commandWithoutSlash);
assert.ok(codeWithoutSlash.includes('BotCommand(command="contact", description="Contact us")'), 'Code should handle command without slash');

// Тест 5: Проверка форматирования
const formattedCommands = [
  { data: { command: '/menu', description: 'Show menu' } }
];
const formattedCode = generateBotCommandsSetup(formattedCommands);

// Проверим, что код правильно отформатирован
assert.ok(formattedCode.includes('# Команда menu - Show menu'), 'Code should include command info comment');
assert.ok(formattedCode.includes('    ]'), 'Code should properly close the commands list');
assert.ok(formattedCode.includes('    await bot.set_my_commands(commands)'), 'Code should properly end with command setup');

console.log('All tests for generateBotCommandsSetup passed!');