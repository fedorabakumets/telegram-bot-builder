/**
 * @fileoverview Генерация логики сохранения переменной
 *
 * Модуль создаёт Python-код для определения имени переменной
 * и её значения для сохранения в базу данных.
 *
 * @module bot-generator/transitions/variable/generate-variable-save-logic
 */

import { generateSaveToDatabaseTable } from '../../database/generateSaveToDatabaseTable';

/**
 * Параметры для генерации сохранения переменной
 */
export interface VariableSaveLogicParams {
  nodeId: string;
  sourceNode: any;
  nodes: any[];
}

/**
 * Генерирует Python-код для логики сохранения переменной
 *
 * @param params - Параметры сохранения
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateVariableSaveLogic(
  params: VariableSaveLogicParams,
  indent: string = '    '
): string {
  const { nodeId, sourceNode: _sourceNode, nodes } = params;

  // ИСПРАВЛЕНИЕ: Не генерируем сохранение если collectUserInput не включен
  const targetNode = nodes.find(n => n.id === nodeId);
  const shouldSave = (
    targetNode?.data?.collectUserInput === true ||
    targetNode?.data?.saveToDatabase === true
  );

  if (!shouldSave) {
    return ''; // Не генерируем код сохранения
  }

  let code = '';
  code += `${indent}\n`;
  code += `${indent}# КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, была ли показана условная клавиатура\n`;
  code += `${indent}# Если да - НЕ сохраняем переменную сейчас, ждём выбора пользователя\n`;
  code += `${indent}# ТАКЖЕ не сохраняем при автопереходе (fake callback)\n`;
  code += `${indent}has_conditional_keyboard_for_save = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)\n`;
  code += `${indent}if not has_conditional_keyboard_for_save and not is_fake_callback:\n`;

  const parentNode = nodes.find(n => n.data?.buttons && n.data.buttons.some((btn: { target: string; }) => btn.target === nodeId));

  let variableName = 'button_click';
  let variableValue = 'button_display_text';

  // КРИТИЧЕСКИ ВАЖНО: специальная логика для шаблона "Федя"
  if (nodeId === 'source_search') {
    variableName = 'источник';
    variableValue = '"🔍 Поиск в интернете"';
  } else if (nodeId === 'source_friends') {
    variableName = 'источник';
    variableValue = '"👥 Друзья"';
  } else if (nodeId === 'source_ads') {
    variableName = 'источник';
    variableValue = '"📱 Реклама"';
  } else if (parentNode && parentNode.data?.inputVariable) {
    variableName = parentNode.data.inputVariable;

    // Ищем конкретную кнопку и её значение
    const button = parentNode.data.buttons.find((btn: { target: string; }) => btn.target === nodeId);
    if (button) {
      // Определяем значение переменной в зависимости от кнопки
      if (button.id === 'btn_search' || nodeId === 'source_search') {
        variableValue = '"из инетя"';
      } else if (button.id === 'btn_friends' || nodeId === 'source_friends') {
        variableValue = '"friends"';
      } else if (button.id === 'btn_ads' || nodeId === 'source_ads') {
        variableValue = '"ads"';
      } else if (variableName === 'пол') {
        // Специальная логика для переменной "пол"
        if (button.text === 'Мужчина' || button.text === '👨 Мужчина') {
          variableValue = '"Мужчина"';
        } else if (button.text === 'Женщина' || button.text === '👩 Женщина') {
          variableValue = '"Женщина"';
        } else {
          variableValue = `f'{button.text!r}'`;
        }
      } else {
        variableValue = 'button_display_text';
      }
    }
  }

  code += `${indent}    # Сохраняем в базу данных с правильным именем переменной\n`;

  // Используем новую универсальную функцию сохранения
  const saveCode = generateSaveToDatabaseTable({
    variableName,
    valueExpression: variableValue,
    indent: indent + '    ',
    isVariableNameDynamic: false
  });
  code += saveCode;
  code += '\n';  // Добавляем перевод строки после saveCode

  code += `${indent}    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
  code += `${indent}else:\n`;
  code += `${indent}    logging.info("⏸️ Пропускаем сохранение переменной: показана условная клавиатура, ждём выбор пользователя")\n`;

  return code;
}
