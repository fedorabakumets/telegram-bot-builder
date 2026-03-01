/**
 * @fileoverview Генерация кода настройки меню команд BotFather
 * 
 * Модуль предоставляет функцию для генерации Python-кода,
 * настраивающего меню команд бота через BotFather API.
 * 
 * @module bot-commands-setup
 */

import type { BotNode } from './bot-generator/types';

/**
 * Команда меню для BotFather
 * 
 * @example
 * const cmd: MenuCommand = {
 *   data: { command: '/start', description: 'Запуск бота' }
 * };
 */
export interface MenuCommand {
  /** Данные команды */
  data: {
    /** Текст команды (например, '/start') */
    command?: string;
    /** Описание команды */
    description?: string;
    /** Дополнительные поля */
    [key: string]: any;
  };
}

/**
 * Генерирует Python-код для настройки меню команд бота через BotFather
 * 
 * @param menuCommands - Массив команд меню
 * @returns Python-код функции set_bot_commands
 * 
 * @example
 * const code = generateBotCommandsSetup([
 *   { data: { command: '/start', description: 'Запуск' } }
 * ]);
 */
export function generateBotCommandsSetup(menuCommands: MenuCommand[]): string {
  if (menuCommands.length === 0) {
    return '';
  }

  let commandCode = '\n# Настройка меню команд\n';
  commandCode += '# Генерируем настройку меню команд для BotFather\n';
  commandCode += 'async def set_bot_commands():\n';
  commandCode += '    commands = [\n';

  menuCommands.forEach(node => {
    const command = node.data.command?.replace('/', '') || '';
    const description = node.data.description || 'Команда бота';
    commandCode += `        # Команда ${command} - ${description}\n`;
    commandCode += `        BotCommand(command="${command}", description="${description}"),\n`;
  });

  commandCode += '    ]\n';
  commandCode += '# Устанавливаем команды для бота\n';
  commandCode += '    await bot.set_my_commands(commands)\n\n';

  return commandCode;
}