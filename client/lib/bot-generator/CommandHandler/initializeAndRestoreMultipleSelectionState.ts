/**
 * @fileoverview Модуль для инициализации и восстановления состояния множественного выбора в обработчике команды /start
 *
 * Этот модуль предоставляет функцию для генерации Python-кода, которая:
 * - Восстанавливает состояние множественного выбора из базы данных или локального хранилища
 * - Инициализирует состояние множественного выбора для пользователя
 * - Создает клавиатуру с восстановленными галочками для уже выбранных элементов
 * - Обрабатывает кнопки интересов и другие типы кнопок
 *
 * @module initializeAndRestoreMultipleSelectionState
 */

import type { Node, Button } from '@shared/schema';
import { generateButtonText } from '../format';
import { generateUniqueShortId } from '../format/generateUniqueShortId';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { generateAdjustCode } from '../Keyboard/generateKeyboardLayoutCode';

interface NodeWithButtons extends Node {
  data: {
    allowMultipleSelection?: boolean;
    buttons?: Button[];
    continueButtonText?: string;
    [key: string]: any;
  };
}

/**
 * Генерирует Python-код для инициализации и восстановления состояния множественного выбора
 *
 * Функция добавляет в массив codeLines Python-код, который:
 * - Восстанавливает ранее выбранные пользователем интересы из базы данных или локального хранилища
 * - Инициализирует состояние множественного выбора для текущего узла
 * - Создает inline-клавиатуру с восстановленными галочками для уже выбранных элементов
 * - Обрабатывает различные типы кнопок (выбор, команды, переходы, URL)
 *
 * @param node - Узел конфигурации, содержащий настройки и данные команды
 * @param codeLines - Массив строк кода, в который будет добавлен сгенерированный Python-код
 * @param userDatabaseEnabled - Флаг, указывающий на использование базы данных для хранения пользовательских данных
 *
 * @example
 * const node = {
 *   id: "start-node",
 *   data: {
 *     allowMultipleSelection: true,
 *     buttons: [
 *       { text: "Спорт", action: "selection", target: "sport" },
 *       { text: "Музыка", action: "selection", target: "music" },
 *       { text: "/help", action: "goto", target: "help" }
 *     ],
 *     continueButtonText: "Продолжить"
 *   }
 * };
 * const codeLines: string[] = [];
 * initializeAndRestoreMultipleSelectionState(node, codeLines, true);
 * // codeLines теперь содержит Python-код для обработки множественного выбора
 */
export function initializeAndRestoreMultipleSelectionState(node: NodeWithButtons, codeLines: string[], userDatabaseEnabled: boolean, allNodeIds: string[] = []) {
    if (node && node.data && node.data.allowMultipleSelection) {
        codeLines.push('');
        codeLines.push('    saved_interests = []');
        codeLines.push('');

        if (userDatabaseEnabled) {
            codeLines.push('    # Восстанавливаем состояние множественного выбора из БД');
            codeLines.push('    user_record = await get_user_from_db(user_id)');
            codeLines.push('');
            codeLines.push('    if user_record and isinstance(user_record, dict):');
            codeLines.push('        user_data_field = user_record.get("user_data", {})');
            codeLines.push('        if isinstance(user_data_field, str):');
            codeLines.push('            try:');
            codeLines.push('                user_vars = json.loads(user_data_field)');
            codeLines.push('            except:');
            codeLines.push('                user_vars = {}');
            codeLines.push('        elif isinstance(user_data_field, dict):');
            codeLines.push('            user_vars = user_data_field');
            codeLines.push('        else:');
            codeLines.push('            user_vars = {}');
            codeLines.push('        ');
            codeLines.push('        # Ищем сохраненные интересы');
            codeLines.push('        for var_name, var_data in user_vars.items():');
            codeLines.push('            if "интерес" in var_name.lower() or var_name == "user_interests":');
            codeLines.push('                if isinstance(var_data, str) and var_data:');
            codeLines.push('                    saved_interests = [interest.strip() for interest in var_data.split(",")]');
            codeLines.push('                    logging.info(f"Восстановлены интересы из переменной {var_name}: {saved_interests}")');
            codeLines.push('                    break');
        } else {
            codeLines.push('    # Восстанавливаем состояние из локального хранилища');
            codeLines.push('    if user_id in user_data:');
            codeLines.push('        for var_name, var_data in user_data[user_id].items():');
            codeLines.push('            if "интерес" in var_name.lower() or var_name == "user_interests":');
            codeLines.push('                if isinstance(var_data, str) and var_data:');
            codeLines.push('                    saved_interests = [interest.strip() for interest in var_data.split(",")]');
            codeLines.push('                    logging.info(f"Восстановлены интересы: {saved_interests}")');
            codeLines.push('                    break');
            codeLines.push('                elif isinstance(var_data, list):');
            codeLines.push('                    saved_interests = var_data');
            codeLines.push('                    logging.info(f"Восстановлены интересы: {saved_interests}")');
            codeLines.push('                    break');
        }

        codeLines.push('');
        codeLines.push('    # Инициализируем состояние множественного выбора');
        codeLines.push('    if user_id not in user_data:');
        codeLines.push('        user_data[user_id] = {}');
        codeLines.push(`    user_data[user_id]["multi_select_${node.id || 'unknown'}"] = saved_interests.copy() if saved_interests else []`);
        codeLines.push(`    user_data[user_id]["multi_select_node"] = "${node.id || 'unknown'}"`);
        codeLines.push('    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")');
        codeLines.push('');
    }

    // Создаем клавиатуру с восстановленными галочками для множественного выбора
    if (node && node.data && node.data.allowMultipleSelection) {
        codeLines.push('    # Создаем клавиатуру с восстановленными галочками');
        codeLines.push('    builder = InlineKeyboardBuilder()');
        codeLines.push('');
        codeLines.push('    # Функция для проверки совпадения интересов');
        codeLines.push('    def check_interest_match(button_text, saved_list):');
        codeLines.push('        """Проверяет, есть ли интерес в сохраненном списке"""');
        codeLines.push('        if not saved_list:');
        codeLines.push('            return False');
        codeLines.push('        # Убираем эмодзи и галочки для сравнения');
        codeLines.push('        clean_button = button_text.replace("✅ ", "").replace("⬜ ", "").strip()');
        codeLines.push('        for saved_interest in saved_list:');
        codeLines.push('            clean_saved = saved_interest.replace("✅ ", "").replace("⬜ ", "").strip()');
        codeLines.push('            if clean_button == clean_saved or clean_button in clean_saved or clean_saved in clean_button:');
        codeLines.push('                return True');
        codeLines.push('        return False');
        codeLines.push('');

        // Добавляем кнопки интересов с галочками
        const buttons = (node && node.data && node.data.buttons) ? node.data.buttons : [];
        const interestButtons = buttons.filter(btn => btn.action === 'selection');

        interestButtons.forEach(button => {
            const buttonText = button.text || 'Неизвестно';
            const buttonTarget = button.target || button.id;
            codeLines.push(`    ${buttonTarget}_selected = check_interest_match("${buttonText}", saved_interests)`);
            codeLines.push(`    ${buttonTarget}_text = "✅ ${buttonText}" if ${buttonTarget}_selected else "${buttonText}"`);
            codeLines.push(`    builder.add(InlineKeyboardButton(text=${buttonTarget}_text, callback_data="multi_select_${node.id || 'unknown'}_${buttonTarget}"))`);
            codeLines.push('');
        });

        // Добавляем кнопки команд и другие кнопки ПЕРЕД кнопкой "Готово"
        const allButtons = (node && node.data && node.data.buttons) ? node.data.buttons : [];
        const nonSelectionButtons = allButtons.filter(btn => btn.action !== 'selection');

        nonSelectionButtons.forEach(button => {
            if (button.action === 'command') {
                const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
                codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))`);
            } else if (button.action === 'goto') {
                const callbackData = button.target || button.id || 'no_action';
                codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))`);
            } else if (button.action === 'url') {
                codeLines.push(`    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))`);
            }
        });

        // Добавляем кнопку "Готово"
        const continueText = (node && node.data && node.data.continueButtonText) ? node.data.continueButtonText : 'Готово';
        const shortNodeIdForDone = generateUniqueShortId(node.id || 'unknown', allNodeIds || []);
        codeLines.push(`    builder.add(InlineKeyboardButton(text="${continueText}", callback_data="done_${shortNodeIdForDone}"))`);
        
        // Используем keyboardLayout если есть, иначе 2 колонки
        if (node && node.data && node.data.keyboardLayout && !node.data.keyboardLayout.autoLayout) {
            // Проверяем, есть ли уже done-button в layout
            const hasDoneButton = node.data.keyboardLayout.rows.some((row: any) => 
                row.buttonIds.includes('done-button')
            );
            
            let layoutForAdjust = node.data.keyboardLayout;
            let totalButtons = node.data.buttons.length + 1; // +1 для кнопки "Готово"
            
            if (!hasDoneButton) {
                // Если done-button нет в layout, добавляем его в конец
                layoutForAdjust = {
                    ...node.data.keyboardLayout,
                    rows: [...node.data.keyboardLayout.rows, { buttonIds: ['done_button'] }]
                };
            }
            
            const adjustCode = generateAdjustCode(layoutForAdjust, totalButtons);
            codeLines.push(`    ${adjustCode.trim()}`);
        } else {
            codeLines.push('    builder.adjust(2)  # Используем 2 колонки для консистентности');
        }
        
        codeLines.push('    keyboard = builder.as_markup()');
        codeLines.push('');
    }

    // Применяем автоматическое добавление комментариев ко всему коду
    const processedCodeLines = processCodeWithAutoComments(codeLines, 'initializeAndRestoreMultipleSelectionState.ts');

    // Обновляем оригинальный массив
    codeLines.length = 0;
    codeLines.push(...processedCodeLines);
}
