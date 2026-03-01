/**
 * @fileoverview Генерация навигации при пропуске сбора данных (skipDataCollection)
 *
 * Модуль создаёт Python-код для обработки навигации при нажатии кнопок пропуска
 * в узлах сбора пользовательского ввода.
 *
 * @module bot-generator/user-input/generate-skip-navigation
 */

/**
 * Параметры для генерации навигации пропуска
 */
export interface SkipNavigationParams {
  /** Целевой ID узла для перехода */
  skipTarget: string;
  /** Отступ для форматирования кода */
  indent: string;
}

/**
 * Генерирует Python-код для навигации при пропуске сбора данных
 *
 * @param params - Параметры генерации
 * @returns Сгенерированный Python-код
 *
 * @example
 * const code = generateSkipDataCollectionNavigation({
 *   skipTarget: 'next_node',
 *   indent: '        '
 * });
 */
export function generateSkipDataCollectionNavigation(
  params: SkipNavigationParams
): string {
  const { skipTarget, indent } = params;
  let code = '';

  code += `${indent}# Переходим к целевому узлу\n`;
  code += `${indent}if skip_target:\n`;
  code += `${indent}    try:\n`;
  code += `${indent}        logging.info(f"🚀 Переходим к узлу skipDataCollection: {skip_target}")\n`;
  code += `${indent}        import types as aiogram_types\n`;
  code += `${indent}        fake_callback = aiogram_types.SimpleNamespace(\n`;
  code += `${indent}            id="skip_button_nav",\n`;
  code += `${indent}            from_user=message.from_user,\n`;
  code += `${indent}            chat_instance="",\n`;
  code += `${indent}            data=skip_target,\n`;
  code += `${indent}            message=message,\n`;
  code += `${indent}            answer=lambda *args, **kwargs: asyncio.sleep(0)\n`;
  code += `${indent}        )\n`;
  code += `${indent}        \n`;
  code += `${indent}        # Вызываем обработчик целевого узла\n`;
  code += `${indent}        await call_skip_target_handler(fake_callback, skip_target)\n`;
  code += `${indent}        logging.info(f"✅ Переход skipDataCollection выполнен: {skip_target}")\n`;
  code += `${indent}    except Exception as e:\n`;
  code += `${indent}        logging.error(f"Ошибка при переходе skipDataCollection к узлу {skip_target}: {e}")\n`;
  code += `${indent}    return\n`;

  return code;
}

/**
 * Генерирует функцию для вызова обработчика целевого узла
 *
 * @param allNodeIds - Массив всех ID узлов
 * @param indent - Отступ для форматирования
 * @returns Сгенерированный Python-код функции
 *
 * @example
 * const code = generateSkipTargetHandlerFunction(['start', 'node1'], '    ');
 */
export function generateSkipTargetHandlerFunction(
  allNodeIds: string[],
  indent: string = '    '
): string {
  let code = '';

  code += `${indent}async def call_skip_target_handler(fake_callback, skip_target):\n`;
  code += `${indent}    """Вызывает обработчик для целевого узла пропуска\n`;
  code += `${indent}    \n`;
  code += `${indent}    Args:\n`;
  code += `${indent}        fake_callback: Фейковый callback объект\n`;
  code += `${indent}        skip_target: ID целевого узла\n`;
  code += `${indent}    """\n`;
  code += `${indent}    # Генерируем безопасное имя функции\n`;
  code += `${indent}    safe_func_name = skip_target.replace("-", "_").replace(" ", "_")\n`;
  code += `${indent}    handler_func_name = f"handle_callback_{safe_func_name}"\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Проверяем наличие обработчика и вызываем его\n`;
  code += `${indent}    if handler_func_name in globals():\n`;
  code += `${indent}        await globals()[handler_func_name](fake_callback)\n`;
  code += `${indent}    else:\n`;
  code += `${indent}        logging.warning(f"Обработчик {handler_func_name} не найден")\n`;
  code += `${indent}        await fake_callback.message.answer("Переход завершен")\n`;
  code += `${indent}\n`;

  return code;
}
