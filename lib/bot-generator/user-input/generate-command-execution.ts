/**
 * @fileoverview Генерация кода выполнения команды
 * 
 * Модуль создаёт Python-код для обработки выполнения команд
 * через reply клавиатуру с созданием fake_message.
 * 
 * @module bot-generator/user-input/generate-command-execution
 */

/**
 * Генерирует Python-код для создания fake_message
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код создания fake_message
 */
export function generateFakeMessageCreation(
  indent: string = '                '
): string {
  let code = '';
  code += `${indent}# Выполнение команды\n`;
  code += `${indent}command = option_target\n`;
  code += `${indent}# Создаем фиктивное сообщение для выполнения команды\n`;
  code += `${indent}import types as aiogram_types\n`;
  code += `${indent}fake_message = aiogram_types.SimpleNamespace(\n`;
  code += `${indent}    from_user=message.from_user,\n`;
  code += `${indent}    chat=message.chat,\n`;
  code += `${indent}    text=command,\n`;
  code += `${indent}    message_id=message.message_id\n`;
  code += `${indent})\n`;
  code += `${indent}    \n`;
  return code;
}

/**
 * Тип обработчика команды
 */
export type CommandHandlerType = 'start_handler' | string;

/**
 * Генерирует Python-код для обработки команд
 * 
 * @param commandNodes - Узлы с командами (start/command)
 * @param indent - Отступ для форматирования кода
 * @returns Код обработки команд
 */
export function generateCommandHandlers(
  commandNodes: any[],
  indent: string = '                '
): string {
  let code = '';
  
  commandNodes.forEach((cmdNode, cmdIndex) => {
    const condition = cmdIndex === 0 ? 'if' : 'elif';
    const handlerName = cmdNode.type === 'start' 
      ? 'start_handler' 
      : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`;
    
    code += `${indent}${condition} command == "${cmdNode.data.command}":\n`;
    code += `${indent}    try:\n`;
    code += `${indent}        await ${handlerName}(fake_message)\n`;
    code += `${indent}    except Exception as e:\n`;
    code += `${indent}        logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
  });
  
  if (commandNodes.length > 0) {
    code += `${indent}else:\n`;
    code += `${indent}    logging.warning(f"Неизвестная команда: {command}")\n`;
  }
  
  return code;
}
