/**
 * Модуль для генерации обработчика кнопок множественного выбора с сохранением переменных
 *
 * Этот модуль предоставляет функцию для создания кода обработчика кнопок,
 * которые позволяют пользователю делать несколько выборов и сохранять их в базе данных.
 *
 * @module generateMultiSelectButtonHandlerWithVariableSaving
 */

import { generatorLogger } from '../core/generator-logger';
import { generateBaseCallbackHandlerStructure } from './generateBaseCallbackHandlerStructure';

/**
 * Генерирует обработчик для кнопок множественного выбора с сохранением переменных
 *
 * @param targetNode - Узел, для которого генерируется обработчик
 * @param actualCallbackData - Данные обратного вызова для идентификации кнопки
 * @param code - Исходный код, в который будет добавлен новый функционал
 * @param nodes - Массив всех узлов для проверки существования целевого узла
 * @param button - Объект кнопки с информацией о действии
 * @param node - Текущий узел, содержащий кнопку
 * @returns Обновленный код с добавленной логикой обработки кнопок множественного выбора
 */
export function generateMultiSelectButtonHandlerWithVariableSaving(targetNode: any, actualCallbackData: any, code: string, nodes: any[], button: { action: string; id: any; target: string; text: any; skipDataCollection: boolean; }, node: any) {
    const isDoneHandlerNeeded = targetNode && targetNode.data.allowMultipleSelection && targetNode.data.continueButtonTarget;
    const shortNodeIdForDone = isDoneHandlerNeeded ? actualCallbackData.slice(-10).replace(/^_+/, '') : '';

    /**
     * Определение необходимости обработчика кнопки "Готово"
     * Если узел поддерживает множественный выбор и имеет целевой узел продолжения,
     * добавляем обработчик для кнопки завершения выбора
     */
    if (isDoneHandlerNeeded) {
        code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_") or c.data == "done_${shortNodeIdForDone}")\n`;
        generatorLogger.debug(`КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавлен обработчик кнопки "done_${shortNodeIdForDone}" для узла ${actualCallbackData}`);
    } else {
        code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_"))\n`;
    }

    // Создаем безопасное имя функции на основе target или button ID
    const safeFunctionName = actualCallbackData.replace(/[^a-zA-Z0-9_]/g, '_');

    // Генерируем базовую структуру обработчика обратного вызова
    code = generateBaseCallbackHandlerStructure(code, safeFunctionName);

    /**
     * Обработка кнопки "Готово" для множественного выбора
     * Если включена необходимость обработки кнопки завершения выбора,
     * добавляем логику сохранения выбранных значений и перехода к следующему узлу
     */
    if (isDoneHandlerNeeded) {
        code += '    # Проверяем, является ли это кнопкой "Готово" для множественного выбора\n';
        code += `    if callback_data == "done_${shortNodeIdForDone}":\n`;
        code += '        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n';
        code += '        \n';

        // Сохраняем выбранные значения в базу данных
        const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
        code += '        # Сохраняем выбранные значения в базу данных\n';
        code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
        code += '        if selected_options:\n';
        code += '            selected_text = ", ".join(selected_options)\n';
        code += `            \n`;
        code += `            # Универсальная логика аккумуляции для всех множественных выборов\n`;
        code += `            # Загружаем существующие значения\n`;
        code += `            existing_data = await get_user_data_from_db(user_id, "${multiSelectVariable}")\n`;
        code += `            existing_selections = []\n`;
        code += `            if existing_data and existing_data.strip():\n`;
        code += `                existing_selections = [s.strip() for s in existing_data.split(",") if s.strip()]\n`;
        code += `            \n`;
        code += `            # Объединяем существующие и новые выборы (убираем дубли)\n`;
        code += `            all_selections = list(set(existing_selections + selected_options))\n`;
        code += `            final_text = ", ".join(all_selections)\n`;
        code += `            await update_user_data_in_db(user_id, "${multiSelectVariable}", final_text)\n`;
        code += `            logging.info(f"✅ Аккумулировано в переменную ${multiSelectVariable}: {final_text}")\n`;
        code += '        \n';

        // Очищаем состояние множественного выбора
        code += '        # Очищаем состояние множественного выбора\n';
        code += '        if user_id in user_data:\n';
        code += `            user_data[user_id].pop("multi_select_${actualCallbackData}", None)\n`;
        code += '            user_data[user_id].pop("multi_select_node", None)\n';
        code += '            user_data[user_id].pop("multi_select_type", None)\n';
        code += '            user_data[user_id].pop("multi_select_variable", None)\n';
        code += '        \n';

        /**
         * Логика перехода к следующему узлу
         * Если у узла указан целевой узел для продолжения, выполняем переход
         */
        if (targetNode.data.continueButtonTarget) {
            const nextNodeId = targetNode.data.continueButtonTarget;

            // КРИТИЧЕСКАЯ ОТЛАДКА
            generatorLogger.debug(`CONTINUEBUTTON DEBUG:`);
            generatorLogger.debug(`targetNode.id: ${targetNode.id}`);
            generatorLogger.debug(`targetNode.data.continueButtonTarget: ${targetNode.data.continueButtonTarget}`);
            generatorLogger.debug(`nextNodeId: ${nextNodeId}`);
            generatorLogger.debug(`actualCallbackData: ${actualCallbackData}`);

            code += '        # Переход к следующему узлу\n';
            code += `        next_node_id = "${nextNodeId}"\n`;
            code += `        logging.info(f"🚀 DEBUG: targetNode.id=${targetNode.id}, continueButtonTarget=${targetNode.data.continueButtonTarget}, nextNodeId=${nextNodeId}")\n`;

            // ИСПРАВЛЕНИЕ: Специальная логика для metro_selection -> interests_result
            generatorLogger.debug(`Проверяем metro_selection -> interests_result: targetNode.id=${targetNode.id}, nextNodeId=${nextNodeId}`);
            if (targetNode.id.includes('metro_selection') && nextNodeId === 'interests_result') {
                generatorLogger.debug(`Применяем специальную логику metro_selection -> interests_result`);
                code += '        # ИСПРАВЛЕНИЕ: Сохраняем метро выбор и устанавливаем флаг для показа клавиатуры\n';
                code += `        selected_metro = user_data.get(user_id, {}).get("multi_select_${actualCallbackData}", [])\n`;
                code += '        if user_id not in user_data:\n';
                code += '            user_data[user_id] = {}\n';
                code += '        user_data[user_id]["saved_metro_selection"] = selected_metro\n';
                code += '        user_data[user_id]["show_metro_keyboard"] = True\n';
                code += '        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: targetNode.id={targetNode.id}, nextNodeId={nextNodeId}")\n';
                code += '        logging.info(f"🚇 Сохранили метро выбор: {selected_metro}, установлен флаг show_metro_keyboard=True")\n';
                code += '        \n';
            } else {
                generatorLogger.debug(`Не применяем специальную логику: targetNode.id=${targetNode.id}, nextNodeId=${nextNodeId}`);
            }

            // Проверяем, существует ли целевой узел перед вызовом обработчика
            const targetExists = nodes.some(n => n.id === nextNodeId);
            code += '        try:\n';
            if (targetExists) {
                code += `            await handle_callback_${nextNodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query)\n`;
            } else {
                code += `            logging.warning(f"⚠️ Целевой узел не найден: {next_node_id}, завершаем переход")\n`;
                code += `            await callback_query.message.edit_text("Переход завершен")\n`;
            }
            code += '        except Exception as e:\n';
            code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
            code += `            await callback_query.message.edit_text("Переход завершен")\n`;
        } else {
            code += '        # Завершение множественного выбора\n';
            code += `        await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
        }
        code += '        return\n';
        code += '    \n';
    }

    /**
     * Обработка кнопок "Изменить выбор" и "Начать заново"
     * Эти кнопки должны обрабатываться как обычные goto кнопки к start узлу
     * Реализуем правильную логику сохранения переменной на основе кнопки
     */
    code += `    button_text = "${button.text}"\n`;
    code += '    \n';

    // Определяем переменную для сохранения на основе родительского узла
    const parentNode = node; // Используем текущий узел как родительский

    /**
     * Логика сохранения переменных
     * В зависимости от настроек кнопки и узла, сохраняем информацию в базу данных
     */

    // Проверяем настройку skipDataCollection для кнопки
    const shouldSkipDataCollection = button.skipDataCollection === true;

    if (!shouldSkipDataCollection) {
        /**
         * Сохранение переменной из узла
         * Если у родительского узла есть inputVariable, сохраняем значение
         */
        if (parentNode && parentNode.data.inputVariable) {
            const variableName = parentNode.data.inputVariable;

            // Используем текст кнопки как значение переменной
            const variableValue = 'button_text';

            // Сохраняем переменную (если кнопка не имеет флага skipDataCollection, она сохраняется как обычное значение)
            code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
            code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
            code += '    \n';

            // КРИТИЧЕСКИ ВАЖНО: Очищаем состояние ожидания после сохранения переменной
            code += '    # Очищаем состояние ожидания ввода для этой переменной\n';
            code += '    if user_id in user_data:\n';
            code += '        # Удаляем waiting_for_input чтобы текстовый обработчик не перезаписал данные\n';
            code += '        if "waiting_for_input" in user_data[user_id]:\n';
            code += `            if user_data[user_id]["waiting_for_input"].get("node_id") == "${parentNode.id}":\n`;
            code += '                del user_data[user_id]["waiting_for_input"]\n';
            code += `                logging.info(f"Состояние ожидания ввода очищено для переменной ${variableName} (пользователь {user_id})")\n`;
            code += '    \n';
        } else {
            // Резервный вариант: сохраняем кнопку как есть
            code += '    # Сохраняем кнопку в базу данных\n';
            code += '    timestamp = get_moscow_time()\n';
            code += '    response_data = button_text  # Простое значение\n';
            code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
            code += '    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")\n';
        }
    } else {
        /**
         * Пропуск сохранения данных
         * Если для кнопки установлен флаг skipDataCollection, не сохраняем данные
         */
        code += '    # Кнопка настроена для пропуска сбора данных (skipDataCollection=true)\n';
        code += `    logging.info(f"Кнопка пропущена: {button_text} (не сохраняется из-за skipDataCollection)")\n`;
        code += '    # Устанавливаем флаг, чтобы следующий узел не сохранил переменную\n';
        code += '    user_data[user_id]["skipDataCollectionTransition"] = True\n';
    }
    code += '    \n';
    return code;
}
