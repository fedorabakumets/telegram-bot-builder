export function generateKeyboardCode(node: any): string {
  let code = '';
  
  // Early return if no keyboard
  if (node.data.keyboardType === 'none' || !node.data.keyboardType) {
    code += `    await message.answer(text)\n`;
    return code;
  }

  const hasReplyButtons = node.data.buttons && node.data.buttons.length > 0;
  const hasInlineButtons = node.data.inlineButtons && node.data.inlineButtons.length > 0;

  // Handle combined keyboard
  if (node.data.keyboardType === 'combined') {
    if (hasReplyButtons && hasInlineButtons) {
      code += `    
    # Комбинированная клавиатура (Reply + Inline)
    
    # Создаем inline клавиатуру
    inline_builder = InlineKeyboardBuilder()
`;
      node.data.inlineButtons.forEach((button: any) => {
        if (button.action === 'url') {
          code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else {
          code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))\n`;
        }
      });
      
      code += `    inline_keyboard = inline_builder.as_markup()
    
    # Создаем reply клавиатуру
    reply_builder = ReplyKeyboardBuilder()
`;
      node.data.buttons.forEach((button: any) => {
        code += `    reply_builder.add(KeyboardButton(text="${button.text}"))\n`;
      });
      
      code += `    reply_keyboard = reply_builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    
    # Отправляем сообщение с inline кнопками
    await message.answer(text, reply_markup=inline_keyboard)
    
    # Устанавливаем reply клавиатуру
    await message.answer("⚡", reply_markup=reply_keyboard)
`;
    } else if (hasReplyButtons) {
      // Only reply buttons in combined mode - fallback to reply
      code += generateReplyKeyboard(node);
    } else if (hasInlineButtons) {
      // Only inline buttons in combined mode - fallback to inline
      code += generateInlineKeyboard(node);
    } else {
      // No buttons at all
      code += `    await message.answer(text)\n`;
    }
  } else if (node.data.keyboardType === 'reply') {
    code += generateReplyKeyboard(node);
  } else if (node.data.keyboardType === 'inline') {
    code += generateInlineKeyboard(node);
  }

  return code;
}

function generateReplyKeyboard(node: any): string {
  let code = '';
  
  if (node.data.buttons && node.data.buttons.length > 0) {
    code += `    
    builder = ReplyKeyboardBuilder()
`;
    node.data.buttons.forEach((button: any) => {
      code += `    builder.add(KeyboardButton(text="${button.text}"))\n`;
    });
    
    code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
  } else {
    code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
  }
  
  return code;
}

function generateInlineKeyboard(node: any): string {
  let code = '';
  
  // Исправлено: используем inlineButtons вместо buttons для inline клавиатур
  if (node.data.inlineButtons && node.data.inlineButtons.length > 0) {
    code += `    
    builder = InlineKeyboardBuilder()
`;
    node.data.inlineButtons.forEach((button: any) => {
      if (button.action === 'url') {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
      } else {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))\n`;
      }
    });
    
    code += `    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)
`;
  } else {
    code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
  }
  
  return code;
}