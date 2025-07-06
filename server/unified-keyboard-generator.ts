// Унифицированный генератор клавиатур для исправления дублирования
export function generateUnifiedKeyboardCode(node: any): string {
  let code = '';
  
  // Проверяем наличие данных о клавиатуре
  if (!node.data.keyboardType || node.data.keyboardType === 'none') {
    code += '    await message.answer(text)\n';
    return code;
  }

  const hasReplyButtons = node.data.buttons && node.data.buttons.length > 0;
  const hasInlineButtons = node.data.inlineButtons && node.data.inlineButtons.length > 0;

  if (node.data.keyboardType === 'reply' && hasReplyButtons) {
    // Только reply кнопки
    code += '    \n';
    code += '    builder = ReplyKeyboardBuilder()\n';
    node.data.buttons.forEach((button: any) => {
      code += `    builder.add(KeyboardButton(text="${button.text}"))\n`;
    });
    code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard || false}, one_time_keyboard=${node.data.oneTimeKeyboard || false})\n`;
    code += '    await message.answer(text, reply_markup=keyboard)\n';
    
  } else if (node.data.keyboardType === 'inline' && hasInlineButtons) {
    // Только inline кнопки
    code += '    \n';
    code += '    builder = InlineKeyboardBuilder()\n';
    node.data.inlineButtons.forEach((button: any) => {
      if (button.action === 'url') {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
      } else {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))\n`;
      }
    });
    code += '    keyboard = builder.as_markup()\n';
    code += '    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок\n';
    code += '    await message.answer(text, reply_markup=ReplyKeyboardRemove())\n';
    code += '    await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    
  } else if (node.data.keyboardType === 'combined') {
    // Комбинированная клавиатура
    if (hasReplyButtons && hasInlineButtons) {
      // Есть и reply, и inline кнопки
      code += '    \n';
      code += '    # Создаем inline клавиатуру\n';
      code += '    inline_builder = InlineKeyboardBuilder()\n';
      node.data.inlineButtons.forEach((button: any) => {
        if (button.action === 'url') {
          code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else {
          code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))\n`;
        }
      });
      code += '    inline_keyboard = inline_builder.as_markup()\n';
      code += '    \n';
      
      // Создаем reply клавиатуру
      code += '    # Создаем reply клавиатуру\n';
      code += '    reply_builder = ReplyKeyboardBuilder()\n';
      node.data.buttons.forEach((button: any) => {
        code += `    reply_builder.add(KeyboardButton(text="${button.text}"))\n`;
      });
      code += `    reply_keyboard = reply_builder.as_markup(resize_keyboard=${node.data.resizeKeyboard || false}, one_time_keyboard=${node.data.oneTimeKeyboard || false})\n`;
      code += '    \n';
      
      // Отправляем сообщения
      code += '    # Отправляем сообщение с inline кнопками\n';
      code += '    await message.answer(text, reply_markup=inline_keyboard)\n';
      code += '    \n';
      code += '    # Устанавливаем reply клавиатуру\n';
      code += '    await message.answer("⚡", reply_markup=reply_keyboard)\n';
      
    } else if (hasReplyButtons) {
      // Только reply кнопки в комбинированном режиме
      code += '    \n';
      code += '    builder = ReplyKeyboardBuilder()\n';
      node.data.buttons.forEach((button: any) => {
        code += `    builder.add(KeyboardButton(text="${button.text}"))\n`;
      });
      code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard || false}, one_time_keyboard=${node.data.oneTimeKeyboard || false})\n`;
      code += '    await message.answer(text, reply_markup=keyboard)\n';
      
    } else if (hasInlineButtons) {
      // Только inline кнопки в комбинированном режиме
      code += '    \n';
      code += '    builder = InlineKeyboardBuilder()\n';
      node.data.inlineButtons.forEach((button: any) => {
        if (button.action === 'url') {
          code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else {
          code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))\n`;
        }
      });
      code += '    keyboard = builder.as_markup()\n';
      code += '    await message.answer(text, reply_markup=keyboard)\n';
      
    } else {
      // Нет кнопок в комбинированном режиме
      code += '    await message.answer(text)\n';
    }
    
  } else {
    // Нет кнопок или неизвестный тип
    code += '    await message.answer(text)\n';
  }

  return code;
}