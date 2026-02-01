/*
 * Модуль для генерации обработчика условных кнопок в Telegram боте
 */

export function generateConditionalButtonHandlerCode(): string {
  // Возвращаем строку с кодом обработчика условных кнопок на Python
  return `
# Обработчик для условных кнопок
@dp.callback_query(lambda c: c.data.startswith("conditional_"))
async def handle_conditional_button(callback_query: types.CallbackQuery):
    await callback_query.answer()
    
    # Парсим callback_data: conditional_variableName_value
    callback_parts = callback_query.data.split("_", 2)
    if len(callback_parts) >= 3:
        variable_name = callback_parts[1]
        variable_value = callback_parts[2]
        
        user_id = callback_query.from_user.id
        
        # Сохраняем значение в базу данных
        await update_user_data_in_db(user_id, variable_name, variable_value)
        
        # Сохраняем в локальные данные
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id][variable_name] = variable_value
        
        logging.info(f"Условная кнопка: {variable_name} = {variable_value} (пользователь {user_id})")
        
        # После обновления значения автоматически вызываем профиль
        await callback_query.answer(f"✅ {variable_name} обновлено")
        
        # Создаем имитацию сообщения для вызова команды профиль
        class FakeMessage:
            def __init__(self, callback_query):
                self.from_user = callback_query.from_user
                self.chat = callback_query.message.chat
                self.date = callback_query.message.date
                self.message_id = callback_query.message.message_id
            
            async def answer(self, text, parse_mode=None, reply_markup=None):
                if reply_markup:
                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode, reply_markup=reply_markup)
                else:
                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode)
            
            async def edit_text(self, text, parse_mode=None, reply_markup=None):
                try:
                    await bot.edit_message_text(text, self.chat.id, self.message_id, parse_mode=parse_mode, reply_markup=reply_markup)
                except Exception:
                    await self.answer(text, parse_mode, reply_markup)
        
        fake_message = FakeMessage(callback_query)
        
        # Вызываем обработчик профиля
        try:
            await profile_handler(fake_message)
        except Exception as e:
            logging.error(f"Ошибяа вызова profile_handler: {e}")
            await callback_query.message.answer(f"✅ Значение {variable_name} обновлено на: {variable_value}")
    else:
        logging.warning(f"Неверный формат условной кнопки: {callback_query.data}")
        await callback_query.answer("❌ Ошибка обработки кнопки", show_alert=True)
`;
}

// Функция для проверки наличия условных кнопок с префиксом "conditional_"
export function hasConditionalValueButtons(nodes: any[]): boolean {
  // Проверяем, есть ли хотя бы одна нода с условными кнопками
  for (const node of nodes) {
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      for (const button of node.data.buttons) {
        if (button.action === 'setVariable' && button.conditional) {
          return true;
        }
      }
    }
  }
  return false;
}