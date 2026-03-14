/**
 * Генерирует логику переходов для завершения множественного выбора в Telegram боте.
 *
 * Эта функция создает обработчики callback'ов для завершения операций множественного выбора.
 * Она анализирует узлы множественного выбора и генерирует соответствующий Python код.
 *
 * @param code - Исходный код для добавления сгенерированной логики
 * @param multiSelectNodes - Массив узлов множественного выбора
 * @param nodes - Все узлы графа
 * @param connections - Массив соединений между узлами
 * @param allNodeIds - Список всех идентификаторов узлов
 * @param generateInlineKeyboardCode - Функция генерации inline клавиатур
 * @param formatTextForPython - Функция форматирования текста для Python
 * @returns Обновленный код с добавленной логикой переходов
 */

import { generatorLogger } from '../core/generator-logger';
export function generateTransitionLogicForMultiSelectCompletion(
  code: string,
  multiSelectNodes: any[],
  nodes: any[],
  connections: any[],
  allNodeIds: any[],
  generateInlineKeyboardCode: (buttons: any[], indent: string, nodeId: string, nodeData: any, allNodeIds: any[]) => string,
  formatTextForPython: (text: string) => string
): string {
  generatorLogger.debug(`Обрабатываем узлов множественного выбора для переходов: ${multiSelectNodes.length}`);
  code += '        # Определяем следующий узел для каждого node_id\n';
  multiSelectNodes.forEach((node: any) => {
    generatorLogger.debug(`Создаем блок if для узла: ${node.id}`);
    generatorLogger.debug(`continueButtonTarget: ${node.data.continueButtonTarget}`);
    generatorLogger.debug(`соединения из узла: ${connections.filter((conn: any) => conn.source === node.id).map((c: any) => c.target).join(', ')}`);

    code += `        if node_id == "${node.id}":\n`;

    let hasContent = false;

    // Сначала проверяем continueButtonTarget
    if (node.data.continueButtonTarget) {
      const targetNode = nodes.find((n: any) => n.id === node.data.continueButtonTarget);
      if (targetNode) {
        generatorLogger.debug(`Найден целевой узел ${targetNode.id} через continueButtonTarget`);
        generatorLogger.debug(`Тип целевого узла: ${targetNode.type}`);
        code += `            # Переход к узлу ${targetNode.id}\n`;
        code += `            logging.info(f"🔄 Переходим к узлу ${targetNode.id} (тип: ${targetNode.type})")\n`;
        if (targetNode.type === 'message') {
          generatorLogger.debug(`ИСПРАВЛЕНО - НЕ вызываем обработчик, отправляем сообщение`);
          const messageText = targetNode.data.messageText || "Продолжение...";
          const formattedText = formatTextForPython(messageText);
          code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
          code += `            text = ${formattedText}\n`;

          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            generatorLogger.debug(`КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
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
          generatorLogger.debug(`Добавляем вызов handle_command_${safeCommandName}`);
          code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
          hasContent = true;
        } else if (targetNode.type === 'start') {
          generatorLogger.debug(`Вызываем полный обработчик start для правильной клавиатуры`);
          code += `            # Вызываем полный обработчик start для правильного отображения главного меню\n`;
          code += `            await handle_command_start(callback_query.message)\n`;
          code += `            return\n`;
          hasContent = true;
        } else {
          generatorLogger.debug(`Неизвестный тип узла ${targetNode.type}, добавляем pass`);
          code += `            logging.warning(f"⚠️ Неизвестный тип узла: ${targetNode.type}")\n`;
          code += `            pass\n`;
          hasContent = true;
        }
      } else {
        generatorLogger.warn(`Целевой узел не найден для continueButtonTarget: ${node.data.continueButtonTarget}`);
        // Если целевой узел не найден, просто завершаем выбор без перехода
        code += `            # Целевой узел не найден, завершаем выбор\n`;
        code += `            logging.warning(f"⚠️ Целевой узел не найден: ${node.data.continueButtonTarget}")\n`;
        code += `            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
        hasContent = true;
      }
    } else {
      // Если нет continueButtonTarget, ищем соединения
      const nodeConnections = connections.filter((conn: any) => conn.source === node.id);
      if (nodeConnections.length > 0) {
        const targetNode = nodes.find((n: any) => n.id === nodeConnections[0].target);
        if (targetNode) {
          generatorLogger.debug(`Найден целевой узел ${targetNode.id} через соединение`);
          code += `            # Переход к узлу ${targetNode.id} через соединение\n`;
          if (targetNode.type === 'message') {
            generatorLogger.debug(`ИСПРАВЛЕНО - НЕ вызываем обработчик через соединение`);
            const messageText = targetNode.data.messageText || "Продолжение...";
            const formattedText = formatTextForPython(messageText);
            code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
            code += `            text = ${formattedText}\n`;

            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              generatorLogger.debug(`КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для соединения ${targetNode.id}`);
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
      generatorLogger.warn(`Блок if для узла ${node.id} остался пустым, добавляем return`);
      code += `            return\n`;
    } else {
      generatorLogger.debug(`Блок if для узла ${node.id} заполнен контентом`);
    }
  });

  return code;
}