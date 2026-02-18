import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Модуль для генерации обработчика условных кнопок в Telegram боте
 */

/**
 * Генерирует Python код обработчика условных кнопок для Telegram бота.
 * 
 * Эта функция создает асинхронный обработчик callback-запросов для условных кнопок,
 * который обрабатывает кнопки с префиксом "conditional_" и выполняет следующие действия:
 * 
 * - Парсит callback_data для извлечения имени переменной и её значения
 * - Сохраняет значение переменной в базу данных пользователя
 * - Сохраняет значение в локальном хранилище
 * - Логирует действия пользователя
 * - Создает имитацию сообщения для вызова обработчика профиля
 * - Автоматически вызывает профиль пользователя после обновления данных
 * - Обрабатывает ошибки и предоставляет обратную связь пользователю
 * 
 * @returns Строку с Python кодом обработчика условных кнопок
 * 
 * @example
 * const handlerCode = generateConditionalButtonHandlerCode();
 * // Возвращает Python код для обработки callback_запросов типа "conditional_age_25"
 */
export function generateConditionalButtonHandlerCode(): string {
  // Собираем код в массив строк для автоматической обработки комментариями
  const codeLines: string[] = [];

  // Заголовок и декоратор обработчика
  codeLines.push('# Обработчик для условных кнопок');
  codeLines.push('@dp.callback_query(lambda c: c.data.startswith("conditional_"))');
  codeLines.push('async def handle_conditional_button(callback_query: types.CallbackQuery):');
  
  // Базовый ответ на callback
  codeLines.push('    await callback_query.answer()');
  codeLines.push('');
  
  // Парсинг callback_data
  codeLines.push('    # Парсим callback_data: conditional_variableName_value');
  codeLines.push('    callback_parts = callback_query.data.split("_", 2)');
  codeLines.push('    if len(callback_parts) >= 3:');
  codeLines.push('        variable_name = callback_parts[1]');
  codeLines.push('        variable_value = callback_parts[2]');
  codeLines.push('');
  
  // Получение ID пользователя
  codeLines.push('        user_id = callback_query.from_user.id');
  codeLines.push('');
  
  // Сохранение в базу данных
  codeLines.push('        # Сохраняем значение в базу данных');
  codeLines.push('        await update_user_data_in_db(user_id, variable_name, variable_value)');
  codeLines.push('');
  
  // Сохранение в локальное хранилище
  codeLines.push('        # Сохраняем в локальные данные');
  codeLines.push('        if user_id not in user_data:');
  codeLines.push('            user_data[user_id] = {}');
  codeLines.push('        user_data[user_id][variable_name] = variable_value');
  codeLines.push('');
  
  // Логирование
  codeLines.push('        logging.info(f"Условная кнопка: {variable_name} = {variable_value} (пользователь {user_id})")');
  codeLines.push('');
  
  // Ответ пользователю
  codeLines.push('        # После обновления значения автоматически вызываем профиль');
  codeLines.push('        await callback_query.answer(f"✅ {variable_name} обновлено")');
  codeLines.push('');
  
  // Создание имитации сообщения
  codeLines.push('        # Создаем имитацию сообщения для вызова команды профиль');
  codeLines.push('        class FakeMessage:');
  codeLines.push('            def __init__(self, callback_query):');
  codeLines.push('                self.from_user = callback_query.from_user');
  codeLines.push('                self.chat = callback_query.message.chat');
  codeLines.push('                self.date = callback_query.message.date');
  codeLines.push('                self.message_id = callback_query.message.message_id');
  codeLines.push('            ');
  codeLines.push('            async def answer(self, text, parse_mode=None, reply_markup=None):');
  codeLines.push('                if reply_markup:');
  codeLines.push('                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode, reply_markup=reply_markup)');
  codeLines.push('                else:');
  codeLines.push('                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode)');
  codeLines.push('            ');
  codeLines.push('            async def edit_text(self, text, parse_mode=None, reply_markup=None):');
  codeLines.push('                try:');
  codeLines.push('                    await bot.edit_message_text(text, self.chat.id, self.message_id, parse_mode=parse_mode, reply_markup=reply_markup)');
  codeLines.push('                except Exception:');
  codeLines.push('                    await self.answer(text, parse_mode, reply_markup)');
  codeLines.push('        ');
  codeLines.push('        fake_message = FakeMessage(callback_query)');
  codeLines.push('        ');
  
  // Вызов обработчика профиля (только если он существует)
  codeLines.push('        # Вызываем обработчик профиля если он существует');
  codeLines.push('        try:');
  codeLines.push('            func = globals().get("profile_handler")');
  codeLines.push('            if func:');
  codeLines.push('                await func(fake_message)');
  codeLines.push('            else:');
  codeLines.push('                # Если profile_handler не существует, просто показываем сообщение');
  codeLines.push('                await callback_query.message.answer(f"✅ Значение {variable_name} обновлено на: {variable_value}")');
  codeLines.push('        except Exception as e:');
  codeLines.push('            logging.error(f"Ошибка вызова profile_handler: {e}")');
  codeLines.push('            await callback_query.message.answer(f"✅ Значение {variable_name} обновлено на: {variable_value}")');
  
  // Обработка ошибок формата
  codeLines.push('    else:');
  codeLines.push('        logging.warning(f"Неверный формат условной кнопки: {callback_query.data}")');
  codeLines.push('        await callback_query.answer("❌ Ошибка обработки кнопки", show_alert=True)');

  // Применяем автоматическое добавление комментариев о генерации
  const processedCode = processCodeWithAutoComments(codeLines, 'conditional-button-handler.ts');
  
  return processedCode.join('\n');
}

/**
 * Утилитарная функция для проверки наличия условных кнопок в массиве узлов.
 * 
 * Эта функция анализирует массив узлов конфигурации бота и определяет,
 * содержится ли хотя бы одна кнопка с типом 'setVariable' и флагом conditional.
 * Функция используется для определения необходимости генерации обработчика
 * условных кнопок в итоговом Python коде бота.
 * 
 * @param nodes - Массив узлов конфигурации бота для анализа
 * @returns true если найдена хотя бы одна условная кнопка, иначе false
 * 
 * @example
 * const nodes = [
 *   {
 *     data: {
 *       buttons: [
 *         { 
 *           text: "Возраст 18+", 
 *           action: "setVariable", 
 *           variableName: "age", 
 *           variableValue: "18",
 *           conditional: true 
 *         },
 *         { 
 *           text: "Обычная кнопка", 
 *           action: "goto", 
 *           target: "next_node" 
 *         }
 *       ]
 *     }
 *   }
 * ];
 * 
 * const hasConditional = hasConditionalValueButtons(nodes);
 * console.log(hasConditional); // true
 */
export function hasConditionalValueButtons(nodes: any[]): boolean {
  // Проверяем наличие массива узлов
  if (!nodes || !Array.isArray(nodes)) {
    return false;
  }

  // Итерация по всем узлам для поиска условных кнопок
  for (const node of nodes) {
    // Проверяем наличие кнопок в узле
    if (node?.data?.buttons && Array.isArray(node.data.buttons)) {
      // Анализируем каждую кнопку
      for (const button of node.data.buttons) {
        // Ищем кнопки с типом 'setVariable' и флагом conditional
        if (button?.action === 'setVariable' && button?.conditional === true) {
          return true;
        }
      }
    }
  }
  
  return false;
}