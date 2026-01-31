import { Node } from "../../../shared/schema";
import { isLoggingEnabled } from "./bot-generator";
import { formatTextForPython } from "./format";
import { generateInlineKeyboardCode } from "./Keyboard";

/**
 * Генерирует обработчики для узлов с множественным выбором
 */
export function generateMultiSelectHandlers(
  multiSelectNodes: Node[],
  nodes: Node[],
  connections: any[],
  allNodeIds: string[],
  code: string
): string {
  // Добавляем обработчики для множественного выбора ТОЛЬКО если есть узла с множественным выбором
  if (multiSelectNodes.length > 0) {
    code += '\n# Обработчики для множественного выбора\n';

    // Обработчик для inline кнопок множественного выбора
    code += '@dp.callback_query(lambda c: c.data.startswith("ms_") or c.data.startswith("multi_select_"))\n';
    code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
    code += '    await callback_query.answer()\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, callback_query.from_user)\n';
    code += '    \n';
    code += '    callback_data = callback_query.data\n';
    code += '    \n';
    code += '    # Обработка кнопки "Готово"\n';
    code += '    if callback_data.startswith("done_"):\n';
    code += '        # Завершение множественного выбора (новый формат)\n';
    code += '        logging.info(f"🏁 Обработка кнопки Готово: {callback_data}")\n';
    code += '        short_node_id = callback_data.replace("done_", "")\n';
    code += '        # Находим полный node_id по короткому суффиксу\n';
    code += '        node_id = None\n';
    multiSelectNodes.forEach((node: Node) => {
      const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
      code += `        if short_node_id == "${shortNodeId}":\n`;
      code += `            node_id = "${node.id}"\n`;
      code += `            logging.info(f"✅ Найден узел: ${node.id}")\n`;
    });
    code += '    elif callback_data.startswith("multi_select_done_"):\n';
    code += '        # Завершение множественного выбора (старый формат)\n';
    code += '        node_id = callback_data.replace("multi_select_done_", "")\n';
    code += '        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n';
    code += '        \n';
    code += '        # Сохраняем выбранные опции в базу данных\n';
    code += '        if selected_options:\n';
    code += '            selected_text = ", ".join(selected_options)\n';

    // Генерируем сохранение для каждого узла с его переменной
    multiSelectNodes.forEach((node: Node) => {
      const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
      code += `            if node_id == "${node.id}":\n`;
      code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
    });

    code += '            # Резервное сохранение если узел не найден\n';
    code += '            if not any(node_id == node for node in [' + multiSelectNodes.map(n => `"${n.id}"`).join(', ') + ']):\n';
    code += '                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)\n';
    code += '        \n';
    code += '        # Очищаем состояние множественного выбора\n';
    code += '        if user_id in user_data:\n';
    code += '            user_data[user_id].pop(f"multi_select_{node_id}", None)\n';
    code += '            user_data[user_id].pop("multi_select_node", None)\n';
    code += '        \n';
    code += '        # Переходим к следующему узлу, если указан\n';

    // Добавим переходы для узлов с множественным выбором
    if (isLoggingEnabled()) isLoggingEnabled() && console.log(`🔧 ГЕНЕРАТОР: Обрабатываем ${multiSelectNodes.length} узлов множественного выбора для переходов`);
    code += '        # Определяем следующий узел для каждого node_id\n';
    multiSelectNodes.forEach((node: Node) => {
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
  }

  return code;
}