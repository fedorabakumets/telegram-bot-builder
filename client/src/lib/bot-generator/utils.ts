import { Node } from '@shared/schema';

// Функция для правильного экранирования строк в Python коде
export function escapeForPython(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Функция для удаления HTML тегов из текста
export function stripHtmlTags(text: string): string {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

// Функция для правильного форматирования текста с поддержкой многострочности
export function formatTextForPython(text: string): string {
  if (!text) return '""';
  
  // Для многострочного текста используем тройные кавычки
  if (text.includes('\n')) {
    return `"""${text}"""`;
  } else {
    // Для однострочного текста экранируем только кавычки
    return `"${text.replace(/"/g, '\\"')}"`;
  }
}

// Функция для получения режима парсинга
export function getParseMode(formatMode: string): string {
  if (formatMode === 'html') {
    return ', parse_mode=ParseMode.HTML';
  } else if (formatMode === 'markdown') {
    return ', parse_mode=ParseMode.MARKDOWN';
  }
  return '';
}

// Функция для конвертации JavaScript boolean в Python boolean
export function toPythonBoolean(value: any): string {
  return value ? 'True' : 'False';
}

// Функция для правильного экранирования строк в JSON контексте
export function escapeForJsonString(text: string): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Генерация проверок безопасности
export function generateSecurityChecks(node: Node, indentLevel: string = '    '): string {
  let code = '';
  
  if (node.data.isPrivateOnly) {
    code += `${indentLevel}if not await is_private_chat(message):\n`;
    code += `${indentLevel}    await message.answer("❌ Эта команда доступна только в приватных чатах")\n`;
    code += `${indentLevel}    return\n`;
  }

  if (node.data.adminOnly) {
    code += `${indentLevel}if not await is_admin(message.from_user.id):\n`;
    code += `${indentLevel}    await message.answer("❌ У вас нет прав для выполнения этой команды")\n`;
    code += `${indentLevel}    return\n`;
  }

  if (node.data.requiresAuth) {
    code += `${indentLevel}if not await check_auth(message.from_user.id):\n`;
    code += `${indentLevel}    await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n`;
    code += `${indentLevel}    return\n`;
  }
  
  return code;
}

// Универсальная генерация сохранения данных пользователя
export function generateUserDataSaving(variable: string, value: string, indentLevel: string = '    '): string {
  let code = '';
  code += `${indentLevel}# Сохраняем данные пользователя\n`;
  code += `${indentLevel}await save_user_data_to_db(user_id, "${variable}", ${value})\n`;
  code += `${indentLevel}user_data[user_id] = user_data.get(user_id, {})\n`;
  code += `${indentLevel}user_data[user_id]["${variable}"] = ${value}\n`;
  return code;
}

// Генерация пользовательской регистрации
export function generateUserRegistration(indentLevel: string = '    '): string {
  let code = '';
  code += `\n${indentLevel}# Регистрируем пользователя в системе\n`;
  code += `${indentLevel}user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
  code += `${indentLevel}user_data[message.from_user.id].update({\n`;
  code += `${indentLevel}    "username": message.from_user.username,\n`;
  code += `${indentLevel}    "first_name": message.from_user.first_name,\n`;
  code += `${indentLevel}    "last_name": message.from_user.last_name,\n`;
  code += `${indentLevel}    "registered_at": message.date\n`;
  code += `${indentLevel}})\n`;
  return code;
}

// Создание безопасного имени функции
export function createSafeFunctionName(text: string, prefix: string = ''): string {
  const safeName = text.replace(/[^a-zA-Z0-9]/g, '_');
  return prefix ? `${prefix}_${safeName}` : safeName;
}