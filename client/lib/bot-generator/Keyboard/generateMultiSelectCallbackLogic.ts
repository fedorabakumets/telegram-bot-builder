import { Node, Button } from '@shared/schema';
import { generateUniqueShortId, generateButtonText } from '../format';
import { calculateOptimalColumns } from './calculateOptimalColumns';
import { generatorLogger } from '../core/generator-logger';
import { generateAdjustCode } from './generateKeyboardLayoutCode';
import { escapePythonString } from '../format/escapePythonString';

export function generateMultiSelectCallbackLogic(
  multiSelectNodes: Node[],
  allNodeIds: string[],
): string {
  let code = '';
  if (multiSelectNodes.length > 0) {
    code += `    # Обработка выбора опции\n`;
    code += `    logging.info(f"📱 Обрабатываем callback_data: {callback_data}")\n`;
    code += `    \n`;
    code += `    # Поддерживаем и новый формат ms_ и старый multi_select_\n`;
    code += `    if callback_data.startswith("ms_"):
`;
    code += `        # Новый короткий формат: ms_shortNodeId_shortTarget
`;
    code += `        parts = callback_data.split("_")
`;
    code += `        if len(parts) >= 3:
`;
    code += `            short_node_id = parts[1]
`;
    code += `            button_id = "_".join(parts[2:])  # Используем полное имя для совместимости
`;
    code += `            # Находим полный node_id по короткому суффиксу
`;
    code += `            node_id = None
`;
    code += `            logging.info(f"🔍 Ищем узел по короткому ID: {short_node_id}")
`;
    code += `            
`;
    code += `            # Для станций метро ищем по содержимому кнопки, а не по короткому ID
`;
    code += `            if short_node_id == "stations":
`;
    code += `                # Проверяем каждый узел станций на наличие нужной кнопки
`;

    let hasStationsCode = false;
    multiSelectNodes.forEach((node: Node) => {
      const shortNodeId = generateUniqueShortId(node.id, allNodeIds);
      if (shortNodeId === 'stations') {
        const selectionButtons = node.data.buttons?.filter((btn: { action: string; }) => btn.action === 'selection') || [];
        code += `                # Проверяем узел ${node.id}\n`;
        selectionButtons.forEach((button: Button) => {
          const buttonValue = button.target || button.id || button.text;
          const buttonValueTruncated = buttonValue.slice(-8);
          code += `                if button_id == "${buttonValue}" or button_id == "${buttonValueTruncated}":
`;
          code += `                    node_id = "${node.id}"
`;
          code += `                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")
`;
          hasStationsCode = true;
        });
      }
    });

    if (!hasStationsCode) {
      code += `                pass\n`;
    }

    code += `            else:
`;
    code += `                # Обычная логика для других узлов
`;

    let hasElseCode = false;
    multiSelectNodes.forEach((node: Node) => {
      const shortNodeId = generateUniqueShortId(node.id, allNodeIds);
      if (shortNodeId !== 'stations') {
        code += `                if short_node_id == "${shortNodeId}":
`;
        code += `                    node_id = "${node.id}"
`;
        code += `                    logging.info(f"✅ Найден узел: {node_id}")
`;
        hasElseCode = true;
      }
    });

    if (!hasElseCode) {
      code += `                pass\n`;
    }
    code += `    elif callback_data.startswith("multi_select_"):
`;
    code += `        # Старый формат для обратной совместимости
`;
    code += `        parts = callback_data.split("_")
`;
    code += `        if len(parts) >= 3:
`;
    code += `            node_id = parts[2]
`;
    code += `            button_id = "_".join(parts[3:]) if len(parts) > 3 else parts[2]
`;
    code += `    else:
`;
    code += `        logging.warning(f"⚠️ Неизвестный формат callback_data: {callback_data}")
`;
    code += `        return
`;
    code += `    
`;
    code += `    if not node_id:
`;
    code += `        # Резервный поиск: ищем узел, который содержит кнопку с target, совпадающим с button_id
`;
    code += `        logging.info(f"🔍 Резервный поиск узла по button_id: {button_id}")
`;
    code += `
`;
    // Добавляем цикл по всем узлам и их кнопкам для поиска совпадения
    multiSelectNodes.forEach((node: Node) => {
      const selectionButtons = node.data.buttons?.filter((btn: { action: string; }) => btn.action === 'selection') || [];
      selectionButtons.forEach((button: Button) => {
        const buttonValue = button.target || button.id || button.text;
        const buttonValueTruncated = buttonValue.slice(-8);
        code += `        if not node_id and (button_id == "${buttonValue}" or button_id == "${buttonValueTruncated}"):
`;
        code += `            node_id = "${node.id}"
`;
        code += `            logging.info(f"✅ Найден узел по target кнопки: {node_id}")
`;
      });
    });
    code += `
`;
    code += `    if not node_id:
`;
    code += `        logging.warning(f"⚠️ Не удалось найти node_id для callback_data: {callback_data}")
`;
    code += `        return
`;
    code += `    
`;
    code += `    logging.info(f"📱 Определили node_id: {node_id}, button_id: {button_id}")
`;
    code += `    
`;
    code += `    # Инициализируем список выбранных опций с восстановлением из БД
`;
    code += `    if user_id not in user_data:
`;
    code += `        user_data[user_id] = {}
`;
    code += `    
`;
    code += `    # Восстанавливаем ранее выбранные опции из базы данных
`;
    code += `    if f"multi_select_{node_id}" not in user_data[user_id]:
`;
    code += `        # Загружаем сохраненные данные из базы
`;
    code += `        user_vars = await get_user_from_db(user_id)
`;
    code += `        saved_selections = []
`;
    code += `        
`;
    code += `        if user_vars:
`;
    code += `            # Ищем переменную с интересами
`;
    code += `            for var_name, var_data in user_vars.items():
`;
    code += `                if "интерес" in var_name.lower() or var_name == "interests" or var_name.startswith("multi_select_"):
`;
    code += `                    if isinstance(var_data, dict) and "value" in var_data:
`;
    code += `                        saved_str = var_data["value"]
`;
    code += `                    elif isinstance(var_data, str):
`;
    code += `                        saved_str = var_data
`;
    code += `                    else:
`;
    code += `                        saved_str = str(var_data) if var_data else ""
`;
    code += `                    
`;
    code += `                    if saved_str:
`;
    code += `                        saved_selections = [item.strip() for item in saved_str.split(",")]
`;
    code += `                        break
`;
    code += `        
`;
    code += `        user_data[user_id][f"multi_select_{node_id}"] = saved_selections
`;
    code += `    
`;
    code += `    # Находим текст кнопки по button_id
`;
    code += `    button_text = None
`;

    multiSelectNodes.forEach((node: Node) => {
      const selectionButtons = node.data.buttons?.filter((btn: { action: string; }) => btn.action === 'selection') || [];
      if (selectionButtons.length > 0) {
        code += `    if node_id == "${node.id}":
`;
        selectionButtons.forEach((button: Button) => {
          const buttonValue = button.target || button.id || button.text;
          const buttonValueTruncated = buttonValue.slice(-8);
          code += `        if button_id == "${buttonValue}" or button_id == "${buttonValueTruncated}":
`;
          code += `            button_text = ${escapePythonString(button.text)}
`;
        });
      }
    });

    code += `    
`;
    code += `    if button_text:
`;
    code += `        logging.info(f"🔘 Обрабатываем кнопку: {button_text}")
`;
    code += `        selected_list = user_data[user_id][f"multi_select_{node_id}"]
`;
    code += `        if button_text in selected_list:
`;
    code += `            selected_list.remove(button_text)
`;
    code += `            logging.info(f"➖ Убрали выбор: {button_text}")
`;
    code += `        else:
`;
    code += `            selected_list.append(button_text)
`;
    code += `            logging.info(f"➕ Добавили выбор: {button_text}")
`;
    code += `        
`;
    code += `        logging.info(f"📋 Текущие выборы: {selected_list}")
`;
    code += `        
`;
    code += `        # Обновляем клавиатуру с галочками
`;
    code += `        builder = InlineKeyboardBuilder()
`;

    multiSelectNodes.forEach((node: Node) => {
      const selectionButtons = node.data.buttons?.filter((btn: { action: string; }) => btn.action === 'selection') || [];
      const regularButtons = node.data.buttons?.filter((btn: { action: string; }) => btn.action !== 'selection') || [];

      if (selectionButtons.length > 0) {
        code += `        if node_id == "${node.id}":
`;

        // Добавляем все кнопки выбора с галочками
        selectionButtons.forEach((button: Button, index: number) => {
          const shortNodeId = generateUniqueShortId(node.id, allNodeIds || []);
          const shortTarget = button.target || button.id || 'btn';
          const callbackData = `ms_${shortNodeId}_${shortTarget}`;
          generatorLogger.debug(`ИСПРАВЛЕНО! Кнопка ${index + 1}: "${button.text}" -> callback_data: ${callbackData}`);
          const escapedText = button.text.replace(/'/g, "\\'");
          code += `            builder.add(InlineKeyboardButton(text=f"{'✅ ' if '${escapedText}' in selected_list else ''}${escapedText}", callback_data="${callbackData}"))
`;
        });

        // Добавляем обычные кнопки
        regularButtons.forEach((button: Button) => {
          if (button.action === 'goto') {
            const callbackData = button.target || button.id || 'no_action';
            code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))
`;
          } else if (button.action === 'url') {
            code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))
`;
          }
        });

        // Находим кнопку "Готово" в данных узла
        const completeButton = node.data.buttons?.find((btn: any) => btn.action === 'complete');
        
        if (completeButton) {
          const shortNodeIdForDone = generateUniqueShortId(node.id, allNodeIds || []);
          const doneCallbackData = `done_${shortNodeIdForDone}`;

          // Добавляем кнопку "Готово" ПЕРЕД вызовом adjust()
          code += `            builder.add(InlineKeyboardButton(text="${completeButton.text}", callback_data="${doneCallbackData}"))
`;

          // Используем keyboardLayout если есть, иначе calculateOptimalColumns
          if (node.data.keyboardLayout && !node.data.keyboardLayout.autoLayout) {
            // Используем layout как есть, кнопка уже в buttons
            code += `            # Вычисляем раскладку с кнопкой "Готово" для узла ${node.id}
`;
            code += `            ${generateAdjustCode(node.data.keyboardLayout, node.data.buttons.length).trim()}
`;
          } else {
            // Применяем adjust() ко всем кнопкам включая "Готово"
            code += `            # Вычисляем оптимальное количество колонок для узла ${node.id} (включая кнопку "Готово": ${node.data.buttons.length} кнопок)
`;
            code += `            total_buttons_with_done = ${node.data.buttons.length}
`;
            code += `            # ИСПРАВЛЕНИЕ: Используем согласованное количество колонок для постоянного расположения кнопок
`;
            code += `            optimal_columns_with_done = calculate_optimal_columns(total_buttons_with_done)
`;
            code += `            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust({optimal_columns_with_done}) для узла ${node.id} (multi-select с кнопкой Готово, всего кнопок: {total_buttons_with_done})")
`;
            code += `            builder.adjust(optimal_columns_with_done)
`;
          }
        }
      }
    });

    code += `        
`;
    code += `        keyboard = builder.as_markup()
`;
    code += `        logging.info(f"🔄 ОБНОВЛЯЕМ клавиатуру для узла {node_id} с галочками")
`;
    code += `        await callback_query.message.edit_reply_markup(reply_markup=keyboard)
`;
    code += `
`;
  }
  return code;
}
