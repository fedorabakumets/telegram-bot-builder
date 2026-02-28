import { answersave } from './answersave';
import { generateDatabaseVariablesCode } from './Broadcast/generateDatabaseVariables';
import { handleConditionalNavigationAndInputCollection } from './handleConditionalNavigationAndInputCollection';
import { handleNodeNavigationAndInputProcessing } from './handleNodeNavigationAndInputProcessing';
import { generateReplyHideAfterClickHandler } from './Keyboard/generateReplyHideAfterClickHandler';
import { mediafiles } from './MediaHandler/mediafiles';
import { multiselectcheck } from './multiselectcheck';
import { navigateaftersave } from './navigateaftersave';
import { processUserInputWithValidationAndSave } from './processUserInputWithValidationAndSave';
import { skip_button_target, skipDataCollection, skipDataCollectionnavigate } from './skipDataCollection';
import { generateUniversalVariableReplacement } from './utils';
import { hasInputCollection } from './utils/hasInputCollection';
import { generateConditionalInputHandler, hasUrlButtons, generateButtonResponseCheck, generateSelectedOptionSearch, generateResponseDataStructure, generateButtonActionExtract, generateUrlActionHandler, generateFakeMessageCreation, generateCommandHandlers, generateGotoNavigation, generateMediaSkipCheck, generateSkipButtonSearch, generateMediaWaitingCleanup, generateFakeCallbackCreation, generateSkipTargetNavigation, generateWaitingStateCheck, generateDatabaseVarsGet, generateWaitingConfigExtract, generateMediaTypeCheck, generateWaitingConfigLegacyExtract, generateSkipButtonsCheck, generateSkipFakeCallbackCreation, generateSkipNavigation, generateButtonResponseSave, generateButtonResponseCleanup, generateInvalidChoiceHandler, generateMultiselectCheck, generateMinLengthValidation, generateMaxLengthValidation, generateEmailValidation, generateNumberValidation, generatePhoneValidation, generateResponseSave, generateUserIdSave, generateCsvSave, generateSuccessMessage, generateWaitingCleanup, generateAutoNavigationLoop, generateLegacyFormatHandler } from './bot-generator/user-input';

// Функция для проверки наличия кнопок с URL-ссылками импортирована из bot-generator/user-input

export function newgenerateUniversalUserInputHandlerWithConditionalMessagesSkipButtonsValidationAndNavigation(nodes: any[], code: string, allNodeIds: any[], connections: any[], generateAdHocInputCollectionHandler: () => void, generateContinuationLogicForButtonBasedInput: () => string, generateUserInputValidationAndContinuationLogic: () => void, generateStateTransitionAndRenderLogic: () => void) {
  // Проверяем, есть ли кнопки с URL-ссылками в проекте
  const hasUrlButtonsInProject = hasUrlButtons(nodes);

  if (hasInputCollection(nodes || [])) {
    code += '\n\n# Универсальный обработчик пользовательского ввода\n';
    code += '@dp.message(F.text)\n';
    code += 'async def handle_user_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    \n';
    code += '    # Инициализируем базовые переменные пользователя\n';
    code += '    user_name = init_user_variables(user_id, message.from_user)\n';
    code += '    \n';
    const universalVarCodeLines: string[] = [];
    generateUniversalVariableReplacement(universalVarCodeLines, '    ', true);
    code += universalVarCodeLines.join('\n');
    code += '    \n';
    code += '    # Проверяем, является ли сообщение нажатием на reply-кнопку с флагом hideAfterClick\n';
    code += `    ${generateReplyHideAfterClickHandler(nodes)}\n`;
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
    code += '            \n';
    code += '            # Сохраняем в пользовательские данные\n';
    code += '            user_data[user_id][variable_name] = response_data\n';
    code += '            \n';
    code += generateButtonResponseSave('            ');
    code += '            \n';

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
    code += generateDatabaseVariablesCode('        ');
    code += '        \n';

    /**
     * Обработка различных форматов конфигурации
     * Поддерживает новый формат (словарь) и старый формат (строка) для обратной совместимости
     */
    code += '        # Проверяем формат конфигурации - новый (словарь) или старый (строка)\n';
    code += '        if isinstance(waiting_config, dict):\n';
    code += generateWaitingConfigExtract('            ');
    code += generateMediaTypeCheck('            ');
    code += '        else:\n';
    code += generateWaitingConfigLegacyExtract('            ');
    code += '        \n';
    code += '        user_text = message.text\n';
    code += '        \n';

    /**
     * Обработка кнопок skipDataCollection в универсальной системе
     * Проверяет нажатые кнопки и выполняет переход без сохранения данных
     */
    code += generateSkipButtonsCheck('        ');
    code += generateSkipFakeCallbackCreation('            ');

    // Добавляем навигацию для кнопок skipDataCollection
    code += generateSkipNavigation(nodes, '                            ');

    code += '                        except Exception as e:\n';
    code += '                            logging.error(f"Ошибка при переходе к узлу skipDataCollection {skip_target}: {e}")\n';
    code += '                    return\n';
    /**
     * Валидация входных данных
     * Проверяет формат email, номера телефона, числовых значений
     * и ограничения по длине текста
     */
    code += '        \n';
    code += '        # Валидация для нового формата\n';
    code += '        if isinstance(waiting_config, dict):\n';

    /**
     * Валидация длины текста
     * Проверяет минимальную и максимальную длину введенного текста
     */
    code += generateMinLengthValidation('            ');
    code += generateMaxLengthValidation('            ');

    /**
     * Валидация типа ввода
     * Проверяет соответствие введенных данных указанному типу (email, phone, number)
     */
    code += generateEmailValidation('            ');
    code += generateNumberValidation('            ');
    code += generatePhoneValidation('            ');

    /**
     * Сохранение проверенных данных
     * Сохраняет валидированные данные в пользовательские данные и базу данных
     */
    code += generateResponseSave('            ');

    /**
     * Сохранение ID в таблицу user_ids для рассылки
     * Если узел имеет saveToUserIds=true, сохраняем ID в отдельную таблицу
     */
    code += generateUserIdSave('            ');

    /**
     * Сохранение ID в CSV файл
     * Если узел имеет saveToCsv=true, записываем ID в CSV файл проекта
     */
    code += generateCsvSave('            ');

    /**
     * Отправка подтверждающего сообщения
     * Отправляет пользователю сообщение об успешном сохранении данных
     */
    code += generateSuccessMessage('            ');

    /**
     * Очистка состояния ожидания
     * Удаляет состояние ожидания ввода после успешной обработки
     */
    code += generateWaitingCleanup('            ');

    /**
     * Навигация к следующему узлу
     * Переходит к следующему узлу диалога с поддержкой автопереходов
     */
    code += '            # Навигация к следующему узлу для нового формата\n';
    code += '            if next_node_id:\n';
    code += '                try:\n';

    /**
     * Цикл автопереходов
     * Поддерживает последовательные переходы между узлами без участия пользователя
     */
    code += generateAutoNavigationLoop('                    ');

    // Функция для генерации отступов (решение архитектора)
    const getIndents = (baseLevel: number) => {
      const indent = (level: number) => '    '.repeat(level);
      return {
        whileIndent: indent(baseLevel), // 24 пробела - уровень while
        conditionIndent: indent(baseLevel), // 24 пробела - уровень if/elif
        bodyIndent: indent(baseLevel + 1), // 28 пробелов - тело if/elif
      };
    };

    const { conditionIndent, bodyIndent } = getIndents(6);

    // Добавляем навигацию для каждого узла
    code = handleNodeNavigationAndInputProcessing(nodes, code, conditionIndent, bodyIndent, allNodeIds, connections);

    code += '                except Exception as e:\n';
    code += '                    logging.error(f"Ошибка при переходе к узлу: {e}")\n';
    code += '            \n';
    code += '            return  # Завершаем обработку для нового формата\n';
    code += '        \n';
    code += generateLegacyFormatHandler('        ');

    // Генерируем проверку для каждого узла с универсальным сбором ввода (старый формат)
    code = processUserInputWithValidationAndSave(nodes, code, allNodeIds);

    generateAdHocInputCollectionHandler();

    // Добавляем навигацию к целевому узлу
    const navigationCode = generateContinuationLogicForButtonBasedInput();
    // Генерируем обработчики для медиа-файлов
    code = mediafiles(nodes, navigationCode, code);


    generateUserInputValidationAndContinuationLogic();

    // zzенерируем логику навигации для каждого типа узла
    generateStateTransitionAndRenderLogic();
  }
  return code;
}





