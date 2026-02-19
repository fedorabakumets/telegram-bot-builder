/**
 * @fileoverview Утилита для генерации универсальной замены переменных
 *
 * Этот модуль предоставляет функции для генерации
 * универсальной замены переменных в тексте.
 *
 * @module generateUniversalVariableReplacement
 */

import { processCodeWithAutoComments } from "../utils/generateGeneratedComment";
import { replace_variables_in_text } from "./replace_variables_in_text";
import { hasComponentBeenGenerated, markComponentAsGenerated } from "../utils/generation-state";

/**
 * Генерирует код универсальной замены переменных с инициализацией.
 * Генерирует безопасный Python-код, который проверяет наличие
 * 'message' или 'callback_query' в локальной области видимости,
 * прежде чем пытаться получить доступ к ним.
 * @param codeLines - Массив строк для добавления сгенерированного кода
 * @param indentLevel - уровень отступа для генерируемого кода.
 * @param useDirectAccess - использовать прямой доступ к переменной message (для контекстов, где message гарантированно доступен)
 */
export function generateUniversalVariableReplacement(
  codeLines: string[],
  indentLevel: string = '',
  useDirectAccess: boolean = false
) {
  const universalVarCodeLines: string[] = [];

  // Инициализация пользовательских переменных
  codeLines.push('# ┌─────────────────────────────────────────┐');
  codeLines.push('# │      Инициализация пользовательских     │');
  codeLines.push('# │            переменных                   │');
  codeLines.push('# └─────────────────────────────────────────┘');

  universalVarCodeLines.push(`${indentLevel}user_obj = None`);

  if (useDirectAccess) {
    // В контексте, где message гарантированно доступен как параметр функции
    universalVarCodeLines.push(`${indentLevel}# Используем прямой доступ к message (гарантированно доступен как параметр функции)`);
    universalVarCodeLines.push(`${indentLevel}user_obj = message.from_user`);
  } else {
    // Универсальный код для безопасной проверки наличия message или callback_query
    universalVarCodeLines.push(`${indentLevel}# Безопасно проверяем наличие message (для message handlers)`);
    universalVarCodeLines.push(`${indentLevel}if 'message' in locals() and hasattr(locals().get('message'), 'from_user'):`);
    universalVarCodeLines.push(`${indentLevel}    user_obj = locals().get('message').from_user`);
    universalVarCodeLines.push(`${indentLevel}# Безопасно проверяем наличие callback_query (для callback handlers)`);
    universalVarCodeLines.push(`${indentLevel}elif 'callback_query' in locals() and hasattr(locals().get('callback_query'), 'from_user'):`);
    universalVarCodeLines.push(`${indentLevel}    user_obj = locals().get('callback_query').from_user`);
  }

  universalVarCodeLines.push(``);
  universalVarCodeLines.push(`${indentLevel}if user_id not in user_data or 'user_name' not in user_data.get(user_id, {}):`);
  universalVarCodeLines.push(`${indentLevel}    # Проверяем, что user_obj определен и инициализируем переменные пользователя`);
  universalVarCodeLines.push(`${indentLevel}    if user_obj is not None:`);

  // Вызываем уже определенную функцию инициализации пользовательских переменных
  universalVarCodeLines.push(`${indentLevel}        user_name = init_user_variables(user_id, user_obj)`);

  universalVarCodeLines.push(`${indentLevel}# Подставляем все доступные переменные пользователя в текст`);
  universalVarCodeLines.push(`${indentLevel}user_vars = await get_user_from_db(user_id)`);
  universalVarCodeLines.push(`${indentLevel}if not user_vars:`);
  universalVarCodeLines.push(`${indentLevel}    user_vars = user_data.get(user_id, {})`);
  universalVarCodeLines.push(`${indentLevel}# get_user_from_db теперь возвращает уже обработанные user_data`);
  universalVarCodeLines.push(`${indentLevel}if not isinstance(user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    user_vars = user_data.get(user_id, {})`);
  universalVarCodeLines.push(`${indentLevel}# Создаем объединенный словарь переменных из базы данных и локального хранилища`);
  universalVarCodeLines.push(`${indentLevel}all_user_vars = {}`);
  universalVarCodeLines.push(`${indentLevel}# Добавляем переменные из базы данных`);
  universalVarCodeLines.push(`${indentLevel}if user_vars and isinstance(user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    all_user_vars.update(user_vars)`);
  universalVarCodeLines.push(`${indentLevel}# Добавляем переменные из локального хранилища`);
  universalVarCodeLines.push(`${indentLevel}local_user_vars = user_data.get(user_id, {})`);
  universalVarCodeLines.push(`${indentLevel}if isinstance(local_user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    all_user_vars.update(local_user_vars)`);

  // Добавляем функцию замены переменных (только если она еще не была сгенерирована)
  universalVarCodeLines.push(`${indentLevel}# Заменяем все переменные в тексте`);

  // Проверяем, была ли уже сгенерирована функция replace_variables_in_text
  if (!hasComponentBeenGenerated('replace_variables_in_text')) {
    // Вызываем replace_variables_in_text с новой сигнатурой
    replace_variables_in_text(universalVarCodeLines, indentLevel);
    // Отмечаем, что функция была сгенерирована
    markComponentAsGenerated('replace_variables_in_text');
  }

  // Добавляем универсальную замену переменных в тексте
  universalVarCodeLines.push(`${indentLevel}# Заменяем переменные в тексте, если text определена`);
  universalVarCodeLines.push(`${indentLevel}try:`);
  universalVarCodeLines.push(`${indentLevel}    text = replace_variables_in_text(text, all_user_vars)`);
  universalVarCodeLines.push(`${indentLevel}except NameError:`);
  universalVarCodeLines.push(`${indentLevel}    logging.warning("⚠️ Переменная text не определена при попытке замены переменных")`);
  universalVarCodeLines.push(`${indentLevel}    text = ""  # Устанавливаем пустой текст по умолчанию`);

  // Добавляем символ новой строки для разделения вызовов
  universalVarCodeLines.push('');

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(universalVarCodeLines, 'generateUniversalVariableReplacement.ts');

  // Добавляем обработанные строки в исходный массив
  codeLines.push(...commentedCodeLines);
}


