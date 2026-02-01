/**
 * Генерирует логику переходов для завершения множественного выбора в Telegram боте.
 *
 * Эта функция создает обработчики callback'ов для завершения операций множественного выбора.
 * Она анализирует узлы множественного выбора и генерирует соответствующий Python код для:
 *
 * - Определения следующего узла для каждого node_id после завершения выбора
 * - Обработки continueButtonTarget (прямые переходы к узлам)
 * - Обработки соединений между узлами (если continueButtonTarget не указан)
 * - Поддержки различных типов целевых узлов (message, command, start)
 * - Правильной обработки inline клавиатур для целевых узлов
 * - Генерации безопасного кода с логированием и обработкой ошибок
 *
 * Логика переходов:
 * 1. Сначала проверяется continueButtonTarget для прямого перехода
 * 2. Если continueButtonTarget не указан, ищутся соединения из текущего узла
 * 3. Для каждого типа целевого узла генерируется специфичный код:
 *    - message: отправка сообщения с возможной inline клавиатурой
 *    - command: вызов соответствующего обработчика команды
 *    - start: вызов полного обработчика start для главного меню
 * 4. Добавляется обработка ошибок и fallback логика
 *
 * Функция использует глобальные переменные:
 * - multiSelectNodes: массив узлов множественного выбора
 * - nodes: все узлы графа
 * - connections: массив соединений между узлами
 * - allNodeIds: список всех идентификаторов узлов
 * - isLoggingEnabled: функция проверки включения логирования
 * - generateInlineKeyboardCode: функция генерации inline клавиатур
 *
 * @returns {void} Функция модифицирует глобальную переменную code, добавляя сгенерированный Python код
 */
export function generateTransitionLogicForMultiSelectCompletion(
  multiSelectNodes: any[],
  nodes: any[],
  connections: any[],
  allNodeIds: string[],
  isLoggingEnabled: () => boolean,
  generateInlineKeyboardCode: (buttons: any[], prefix: string, nodeId: string, nodeData: any, allNodeIds: string[]) => string,
  code: string
) {
  if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Обрабатываем ${multiSelectNodes.length} узлов множественного выбора для переходов`);
  code += '        # Определяем следующий узел для каждого node_id\n';
  multiSelectNodes.forEach((node: any) => {
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Создаем блок if для узла ${node.id}`);
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget: ${node.data.continueButtonTarget}`);
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: соединения из узла: ${connections.filter(conn => conn.source === node.id).map(c => c.target).join(', ')}`);

    code += `        if node_id == "${node.id}":\n`;

    let hasContent = false;

    // Сначала проверяем continueButtonTarget
    if (node.data.continueButtonTarget) {
      const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
      if (targetNode) {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через continueButtonTarget`);
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Тип целевого узла: ${targetNode.type}`);
        code += `            # Переход к узлу ${targetNode.id}\n`;
        code += `            logging.info(f"🔄 Переходим к узлу ${targetNode.id} (тип: ${targetNode.type})")\n`;
        if (targetNode.type === 'message') {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик, отправляем сообщение`);
          const messageText = targetNode.data.messageText || "Продолжение...";
          const formattedText = formatTextForPython(messageText);
          code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
          code += `            text = ${formattedText}\n`;

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
            code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для целевого узла\n`;
            code += `            # Загружаем пользовательские данные для клавиатуры\n`;
            code += `            user_vars = await get_user_from_db(user_id)\n`;
            code += `            if not user_vars:\n`;
            code += `                user_vars = user_data.get(user_id, {})\n`;
            code += `            if not isinstance(user_vars, dict):\n`;
            code += `                user_vars = {}\n`;
            code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
            code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
          } else {
            code += `            await callback_query.message.answer(text)\n`;
          }
          code += `            return\n`;
          hasContent = true;
        } else if (targetNode.type === 'command') {
          const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Добавляем вызов handle_command_${safeCommandName}`);
          code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
          hasContent = true;
        } else if (targetNode.type === 'start') {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Вызываем полный обработчик start для правильной клавиатуры`);
          code += `            # Вызываем полный обработчик start для правильного отображения главного меню\n`;
          code += `            await handle_command_start(callback_query.message)\n`;
          code += `            return\n`;
          hasContent = true;
        } else {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Неизвестный тип узла ${targetNode.type}, добавляем pass`);
          code += `            logging.warning(f"⚠️ Неизвестный тип узла: ${targetNode.type}")\n`;
          code += `            pass\n`;
          hasContent = true;
        }
      } else {
        if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Целевой узел не найден для continueButtonTarget: ${node.data.continueButtonTarget}`);
        // Если целевой узел не найден, просто завершаем выбор без перехода
        code += `            # Целевой узел не найден, завершаем выбор\n`;
        code += `            logging.warning(f"⚠️ Целевой узел не найден: ${node.data.continueButtonTarget}")\n`;
        code += `            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
        hasContent = true;
      }
    } else {
      // Если нет continueButtonTarget, ищем соединения
      const nodeConnections = connections.filter(conn => conn.source === node.id);
      if (nodeConnections.length > 0) {
        const targetNode = nodes.find(n => n.id === nodeConnections[0].target);
        if (targetNode) {
          if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через соединение`);
          code += `            # Переход к узлу ${targetNode.id} через соединение\n`;
          if (targetNode.type === 'message') {
            if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик через соединение`);
            const messageText = targetNode.data.messageText || "Продолжение...";
            const formattedText = formatTextForPython(messageText);
            code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
            code += `            text = ${formattedText}\n`;

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для соединения ${targetNode.id}`);
              code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для соединения\n`;
              code += `            # Загружаем пользовательские данные для клавиатуры\n`;
              code += `            user_vars = await get_user_from_db(user_id)\n`;
              code += `            if not user_vars:\n`;
              code += `                user_vars = user_data.get(user_id, {})\n`;
              code += `            if not isinstance(user_vars, dict):\n`;
              code += `                user_vars = {}\n`;
              code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
              code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `            await callback_query.message.answer(text)\n`;
            }
            code += `            return\n`;
          } else if (targetNode.type === 'command') {
            const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
            code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
          }
          hasContent = true;
        }
      }
    }

    // Если блок if остался пустым, добавляем return
    if (!hasContent) {
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`⚠️ ГЕНЕРАТОР: Блок if для узла ${node.id} остался пустым, добавляем return`);
      code += `            return\n`;
    } else {
      if (isLoggingEnabled()) isLoggingEnabled() && console.log(`✅ ГЕНЕРАТОР: Блок if для узла ${node.id} заполнен контентом`);
    }
  });

  return code;
}

// Вспомогательная функция для форматирования текста для Python
function formatTextForPython(text: string): string {
  // Экранируем кавычки и переводим строки
  return `"${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}