import { toPythonBoolean } from './utils';

export interface Button {
  text: string;
  id: string;
  action: 'command' | 'location' | 'contact' | 'goto' | 'url' | 'selection';
  target?: string;
  url?: string;
  requestContact?: boolean;
  requestLocation?: boolean;
}

// Универсальная генерация inline клавиатуры
export function generateInlineKeyboard(buttons: Button[], indentLevel: string = '        '): string {
  let code = '';
  code += `${indentLevel}# Создаем inline клавиатуру\n`;
  code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;
  
  buttons.forEach(button => {
    if (button.action === "url") {
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
    } else if (button.action === 'goto') {
      const callbackData = button.target || button.id || 'no_action';
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
    } else if (button.action === 'command') {
      const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${commandCallback}"))\n`;
    } else if (button.action === 'selection') {
      const selectionCallback = `multi_select_${button.id}_${button.text}`;
      code += `${indentLevel}builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${selectionCallback}"))\n`;
    }
  });
  
  code += `${indentLevel}keyboard = builder.as_markup()\n`;
  return code;
}

// Универсальная генерация reply клавиатуры
export function generateReplyKeyboard(buttons: Button[], resizeKeyboard: boolean = true, oneTimeKeyboard: boolean = false, indentLevel: string = '        '): string {
  let code = '';
  code += `${indentLevel}# Создаем reply клавиатуру\n`;
  code += `${indentLevel}builder = ReplyKeyboardBuilder()\n`;
  
  buttons.forEach(button => {
    if (button.action === "contact" && button.requestContact) {
      code += `${indentLevel}builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
    } else if (button.action === "location" && button.requestLocation) {
      code += `${indentLevel}builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
    } else {
      code += `${indentLevel}builder.add(KeyboardButton(text="${button.text}"))\n`;
    }
  });
  
  const resizeParam = toPythonBoolean(resizeKeyboard);
  const oneTimeParam = toPythonBoolean(oneTimeKeyboard);
  code += `${indentLevel}keyboard = builder.as_markup(resize_keyboard=${resizeParam}, one_time_keyboard=${oneTimeParam})\n`;
  return code;
}

// Генерация отправки сообщения с клавиатурой
export function generateMessageWithKeyboard(messageText: string, keyboardType: 'inline' | 'reply' | 'none', buttons: Button[], parseMode: string = '', indentLevel: string = '        '): string {
  let code = '';
  
  if (keyboardType === 'inline' && buttons.length > 0) {
    code += generateInlineKeyboard(buttons, indentLevel);
    code += `${indentLevel}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
  } else if (keyboardType === 'reply' && buttons.length > 0) {
    code += generateReplyKeyboard(buttons, true, false, indentLevel);
    code += `${indentLevel}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
  } else {
    code += `${indentLevel}await message.answer(text${parseMode})\n`;
  }
  
  return code;
}

// Генерация условной клавиатуры для условных сообщений
export function generateConditionalKeyboard(condition: any, indentLevel: string, nodeData?: any): string {
  if (!condition.keyboardType || condition.keyboardType === 'none' || !condition.buttons || condition.buttons.length === 0) {
    return '';
  }

  let code = '';
  
  if (condition.keyboardType === 'inline') {
    code += generateInlineKeyboard(condition.buttons, indentLevel + '    ');
    code += `${indentLevel}    conditional_keyboard = keyboard\n`;
  } else if (condition.keyboardType === 'reply') {
    code += generateReplyKeyboard(condition.buttons, true, false, indentLevel + '    ');
    code += `${indentLevel}    conditional_keyboard = keyboard\n`;
  }
  
  return code;
}