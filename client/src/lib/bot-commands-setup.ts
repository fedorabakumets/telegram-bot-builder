/**
 * @module bot-commands-setup
 * @description Генерация кода настройки меню команд BotFather
 */

/**
 * Генерирует Python код для настройки меню команд бота через BotFather
 * @param menuCommands Массив команд меню
 * @returns Python код функции set_bot_commands
 */
export function generateBotCommandsSetup(menuCommands: any[]): string {
  /**
   * @description Проверяем, есть ли команды для настройки меню
   * @returns true, если есть команды, false, иначе
   */
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