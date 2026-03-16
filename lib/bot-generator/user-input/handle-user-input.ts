import { answersave } from './answersave';
import { handleConditionalNavigationAndInputCollection } from './handleConditionalNavigationAndInputCollection';
import { handleNodeNavigation } from '../node-navigation/handle-node-navigation';
import { generateReplyHideAfterClick } from '../../templates/handlers';
import { mediafiles } from '../MediaHandler/mediafiles';
import { navigateaftersave } from './navigateaftersave';
import { skip_button_target, skipDataCollection, skipDataCollectionnavigate } from './skipDataCollection';
import { generateUniversalVariableReplacement } from '../utils';
import { hasInputCollection } from '../utils/hasInputCollection';
import { hasAutoTransitions } from '../utils/hasAutoTransitions';
import { generateConditionalInputHandler, hasUrlButtons, generateButtonResponseCheck, generateSelectedOptionSearch, generateResponseDataStructure, generateButtonActionExtract, generateUrlActionHandler, generateFakeMessageCreation, generateCommandHandlers, generateGotoNavigation, generateMediaSkipCheck, generateSkipButtonSearch, generateMediaWaitingCleanup, generateFakeCallbackCreation, generateSkipTargetNavigation, generateWaitingStateCheck, generateDatabaseVarsGet, generateWaitingConfigExtract, generateMediaTypeCheck, generateSkipButtonsCheck, generateSkipFakeCallbackCreation, generateSkipFakeCallbackCompletion, generateSkipNavigation, generateButtonResponseSave, generateButtonResponseCleanup, generateInvalidChoiceHandler, generateMultiselectCheck, generateMinLengthValidation, generateMaxLengthValidation, generateEmailValidation, generateNumberValidation, generatePhoneValidation, generateResponseSave, generateAutoNavigationLoop, generateSkipTargetHandlerFunction } from './index';

// Функция для проверки наличия кнопок с URL-ссылками импортирована из bot-generator/user-input

/**
 * Генерирует универсальный обработчик пользовательского ввода с поддержкой условных сообщений,
 * кнопок пропуска, валидации и навигации
 *
 * @param nodes - Массив узлов для обработки
 * @param code - Текущий код
 * @param allNodeIds - Все ID узлов
 * @param connections - Массив соединений
 * @param generateAdHocInputCollectionHandler - Генерация обработчика сбора ввода
 * @param generateContinuationLogicForButtonBasedInput - Генерация логики продолжения
 * @param generateUserInputValidationAndContinuationLogic - Генерация валидации
 * @param generateStateTransitionAndRenderLogic - Генерация навигации
 * @returns Обновлённый код
 */
export function newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(nodes: any[], code: string, allNodeIds: any[], connections: any[], generateAdHocInputCollectionHandler: () => void, generateContinuationLogicForButtonBasedInput: () => string, generateUserInputValidationAndContinuationLogic: () => void, generateStateTransitionAndRenderLogic: () => void) {
  // Проверяем, есть ли кнопки с URL-ссылками в проекте
  const hasUrlButtonsInProject = hasUrlButtons(nodes);

  // Генерируем код если есть сбор ввода ИЛИ автопереходы
  const hasInput = hasInputCollection(nodes || []);
  const hasAuto = hasAutoTransitions(nodes || []);

  if (hasInput || hasAuto) {
    code += '\n\n# Универсальный обработчик пользовательского ввода\n';
    code += '@dp.message(F.text)\n';
    code += 'async def handle_user_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = await init_user_variables(user_id, message.from_user)\n';
    code += '    \n';
    const universalVarCodeLines: string[] = [];
    generateUniversalVariableReplacement(universalVarCodeLines, '    ');
    code += universalVarCodeLines.join('\n');
    code += '    \n';
    code += '    # Проверяем, является ли сообщение нажатием на reply-кнопку с флагом hideAfterClick\n';
    code += generateReplyHideAfterClick({ nodes, indentLevel: '    ' });
    code += '    \n';
    
    // Обработчик условных сообщений
    code += generateConditionalInputHandler(nodes, allNodeIds, {
      skipDataCollection,
      skip_button_target,
      skipDataCollectionnavigate,
      answersave,
      navigateaftersave,
      handleConditionalNavigationAndInputCollection
    }, '    ');
    
    /**
     * Обработка кнопочных ответов через reply клавиатуру
     * Обрабатывает выбор пользователя из предложенных вариантов reply клавиатуры
     */
    code += generateButtonResponseCheck('    ');

    /**
     * Поиск выбранного варианта
     * Ищет нажатую кнопку среди доступных опций в конфигурации
     */
    code += generateSelectedOptionSearch('    ');

    /**
     * Обработка выбранного варианта
     * Сохраняет выбор пользователя в структурированном формате
     */
    code += '        if selected_option:\n';
    code += '            selected_value = selected_option["value"]\n';
    code += '            selected_text = selected_option["text"]\n';
    code += '            \n';
    code += '            # Сохраняем ответ пользователя\n';
    code += '            variable_name = config.get("variable", "button_response")\n';
    code += '            timestamp = get_moscow_time()\n';
    code += '            node_id = config.get("node_id", "unknown")\n';
    code += '            \n';

    /**
     * Создание структурированного ответа
     * Формирует объект с метаданными о выборе пользователя
     */
    code += generateResponseDataStructure('        ');
    code += '        \n';
    code += '        # Сохраняем в пользовательские данные\n';
    code += '        user_data[user_id][variable_name] = response_data\n';
    code += '        \n';
    code += generateButtonResponseSave('        ');
    code += '        \n';

    /**
     * Подтверждение выбора
     * Отправляет сообщение об успешном выборе и удаляет клавиатуру
     */
    code += '            # Отправляем сообщение об успехе\n';
    code += '            success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
    code += '            await message.answer(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=ReplyKeyboardRemove())\n';
    code += '            \n';
    code += generateButtonResponseCleanup('            ');

    /**
     * Навигация на основе действия кнопки
     * Выполняет различные действия в зависимости от типа выбранной кнопки
     */
    code += generateButtonActionExtract('            ');

    /**
     * Обработка различных типов действий
     * Поддерживает переходы по URL, выполнение команд и навигацию к узлам
     */
    if (hasUrlButtonsInProject) {
      code += generateUrlActionHandler('            ');
      code += '            elif option_action == "command" and option_target:\n';
    } else {
      code += '            if option_action == "command" and option_target:\n';
    }

    /**
     * Выполнение команды
     * Создает фиктивное сообщение и вызывает соответствующий обработчик команды
     */
    code += generateFakeMessageCreation('                ');

    // Добавляем обработку различных команд для reply клавиатур
    const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
    code += generateCommandHandlers(commandNodes, '                ');

    code += '            elif option_action == "goto" and option_target:\n';
    code += '                # Переход к узлу\n';
    code += '                target_node_id = option_target\n';
    code += '                try:\n';
    code += '                    # Вызываем обработчик для целевого узла\n';

    // Генерируем логику навигации для ответов на кнопки ответов
    code += generateGotoNavigation(nodes, '                    ', 'target_node_id');
    
    code += '                except Exception as e:\n';
    code += '                    logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
    code += '            else:\n';
    code += '                # Fallback к старой системе next_node_id если нет action\n';
    code += '                next_node_id = config.get("next_node_id")\n';
    code += '                if next_node_id:\n';
    code += '                    try:\n';
    code += '                        # Вызываем обработчик для следующего узла\n';

    code += generateGotoNavigation(nodes, '                        ', 'next_node_id');
    
    code += '                    except Exception as e:\n';
    code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '            return\n';
    code += generateInvalidChoiceHandler('        ');
    code += '    \n';
    /**
     * Обработка кнопок пропуска для медиа-узлов
     * Специальная обработка для узлов, ожидающих медиа-файлы (фото/видео/аудио/документы)
     * когда пользователь нажимает reply-кнопку с skipDataCollection
     */
    code += generateMediaSkipCheck('    ');

    /**
     * Поиск нажатой кнопки пропуска
     * Проверяет, была ли нажата одна из кнопок пропуска для медиа-узла
     */
    code += generateSkipButtonSearch('        ');

    /**
     * Очистка состояний ожидания медиа
     * Удаляет все состояния, связанные с ожиданием медиа-файлов
     */
    code += generateMediaWaitingCleanup('            ');

    /**
     * Навигация после пропуска медиа
     * Переходит к целевому узлу после нажатия кнопки пропуска
     */
    code += generateFakeCallbackCreation('                ');

    // Добавляем навигацию для skip_buttons медиа-узлов
    code += generateSkipTargetNavigation(nodes, '                        ');

    code += '                    except Exception as e:\n';
    code += '                        logging.error(f"Ошибка при переходе к узлу skipDataCollection медиа {skip_target}: {e}")\n';
    code += '                return\n';
    code += '    \n';
    /**
     * Проверка состояния множественного выбора
     * Сначала проверяем, находится ли пользователь в режиме множественного выбора
     * Если да, передаем управление специальному обработчику
     */
    code = generateMultiselectCheck(code, nodes, allNodeIds);
    /**
     * Универсальная система ожидания ввода
     * Проверяет состояние ожидания ввода и обрабатывает различные типы входных данных
     */
    code += generateWaitingStateCheck('    ');

    // Добавляем получение переменных из БД перед обработкой
    code += generateDatabaseVarsGet('        ');
    code += '        \n';

    /**
     * Извлечение конфигурации ожидания ввода
     */
    code += '        # Извлекаем конфигурацию из waiting_config (dict)\n';
    code += generateWaitingConfigExtract('        ');
    code += generateMediaTypeCheck('        ');

    /**
     * Обработка кнопок skipDataCollection в универсальной системе
     * Проверяет нажатые кнопки и выполняет переход без сохранения данных
     */
    code += generateSkipButtonsCheck('        ');
    code += generateSkipFakeCallbackCreation('            ');

    // Добавляем навигацию для кнопок skipDataCollection
    code += generateSkipNavigation(nodes, '            ');
    code += generateSkipFakeCallbackCompletion('            ');

    code += '        \n';
    code += '        user_text = message.text\n';
    code += '        \n';

    /**
     * Валидация входных данных
     * Проверяет формат email, номера телефона, числовых значений
     * и ограничения по длине текста
     */
    code += '        # Валидация ввода\n';

    /**
     * Валидация длины текста
     * Проверяет минимальную и максимальную длину введенного текста
     */
    code += generateMinLengthValidation('        ');
    code += generateMaxLengthValidation('        ');

    /**
     * Валидация типа ввода
     * Проверяет соответствие введенных данных указанному типу (email, phone, number)
     */
    code += generateEmailValidation('        ');
    code += generateNumberValidation('        ');
    code += generatePhoneValidation('        ');

    /**
     * Подготовка response_data для сохранения
     */
    code += '        # Подготовка данных для сохранения\n';
    code += '        timestamp = get_moscow_time()\n';
    code += '        response_data = user_text\n';
    code += '        \n';

    /**
     * Сохранение проверенных данных
     * Сохраняет валидированные данные в пользовательские данные и базу данных
     * с учётом режима appendVariable
     */
    code += generateResponseSave('variable_name', 'response_data', 'appendVariable', '        ');

    /**
     * Навигация к следующему узлу
     * Переходит к следующему узлу диалога с поддержкой автопереходов
     */
    code += '        # Навигация к следующему узлу\n';
    code += '        if next_node_id:\n';
    code += '            try:\n';

    /**
     * Цикл автопереходов
     * Поддерживает последовательные переходы между узлами без участия пользователя
     */
    code += generateAutoNavigationLoop('                ');

    // Функция для генерации отступов (решение архитектора)
    const getIndents = (baseLevel: number) => {
      const indent = (level: number) => '    '.repeat(level);
      return {
        whileIndent: indent(baseLevel), // 20 пробелов - уровень while
        conditionIndent: indent(baseLevel), // 20 пробелов - уровень if/elif
        bodyIndent: indent(baseLevel + 1), // 24 пробела - тело if/elif
      };
    };

    const { conditionIndent, bodyIndent } = getIndents(5);

    // Добавляем навигацию для каждого узла
    code += handleNodeNavigation(nodes, conditionIndent, bodyIndent, allNodeIds, connections);

    code += '            except Exception as e:\n';
    code += '                logging.error(f"Ошибка при переходе к узлу: {e}")\n';

    generateAdHocInputCollectionHandler();

    // Добавляем навигацию к целевому узлу
    const navigationCode = generateContinuationLogicForButtonBasedInput();
    // Генерируем обработчики для медиа-файлов
    code = mediafiles(nodes, navigationCode, code);


    generateUserInputValidationAndContinuationLogic();

    // Генерируем логику навигации для каждого типа узла
    generateStateTransitionAndRenderLogic();
  }

  // Добавляем функцию call_skip_target_handler на глобальном уровне
  code += '\n';
  code += generateSkipTargetHandlerFunction(nodes, '');
  code += '\n';

  return code;
}





