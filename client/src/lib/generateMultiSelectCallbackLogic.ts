import { z } from 'zod';
import { Node, buttonSchema } from '../../../shared/schema';
import { generateUniqueShortId, generateButtonText } from './format';

export type Button = z.infer<typeof buttonSchema>;

export function generateMultiSelectCallbackLogic(
  multiSelectNodes: Node[],
  allNodeIds: string[],
  isLoggingEnabled: () => boolean,
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
    code += `            button_id = "_".join(parts[2:])
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
          code += `                if button_id == "${buttonValue}":
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
          code += `        if button_id == "${buttonValue}":
`;
          code += `            button_text = "${button.text}"
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

        if (isLoggingEnabled()) console.log(`🔧 ГЕНЕРАТОР: Добавляем ${selectionButtons.length} кнопок выбора для узла ${node.id}`);
        selectionButtons.forEach((button: Button, index: number) => {
          const shortNodeId = generateUniqueShortId(node.id, allNodeIds || []);
          const shortTarget = button.target || button.id || 'btn';
          const callbackData = `ms_${shortNodeId}_${shortTarget}`;
          if (isLoggingEnabled()) console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Кнопка ${index + 1}: "${button.text}" -> callback_data: ${callbackData}`);
          code += `            selected_mark = "✅ " if "${button.text}" in selected_list else ""
`;
          code += `            builder.add(InlineKeyboardButton(text=f"{selected_mark}${button.text}", callback_data="${callbackData}"))
`;
        });

        regularButtons.forEach((button: Button) => {
          if (button.action === 'goto') {
            const callbackData = button.target || button.id || 'no_action';
            code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))
`;
          } else if (button.action === 'url') {
            code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))
`;
          } else if (button.action === 'command') {
            const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
            code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))
`;
          }
        });

        const continueText = node.data.continueButtonText || 'Готово';
        const doneCallbackData = `multi_select_done_${node.id}`;
        if (isLoggingEnabled()) console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем кнопку завершения "${continueText}" с callback_data: ${doneCallbackData}`);
        code += `            builder.add(InlineKeyboardButton(text="${continueText}", callback_data="${doneCallbackData}"))
`;
        code += `            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust(2) для узла ${node.id} (multi-select)")
`;
        code += `            builder.adjust(2)
`;
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
