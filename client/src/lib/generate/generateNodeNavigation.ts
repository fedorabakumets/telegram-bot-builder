import { generateUniversalVariableReplacement } from '../database/generateUniversalVariableReplacement';
import { formatTextForPython } from '../format/formatTextForPython';

/**
 * Функция для генерации кода навигации по узлам
 * @param nodes - Массив узлов для генерации навигации
 * @param baseIndent - Базовый отступ для форматирования
 * @param nextNodeIdVar - Имя переменной, содержащей ID следующего узла
 * @param messageVar - Имя переменной сообщения
 * @param userVarsVar - Имя переменной с пользовательскими данными
 * @returns Сгенерированный код навигации
 */
export function generateNodeNavigation(nodes: any[], baseIndent: string, nextNodeIdVar: string, messageVar: string, userVarsVar: string): string {
  let code = '';

  // Добавляем навигацию для каждого узла - отправляем сообщение напрямую
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      code += `${baseIndent}${condition} ${nextNodeIdVar} == "${targetNode.id}":\n`;

      // Получаем текст сообщения
      const messageText = targetNode.data.messageText || targetNode.data.text || '';
      const formattedText = formatTextForPython(messageText);
      code += `${baseIndent}    text = ${formattedText}\n`;

      // Добавляем замену переменных
      code += `${baseIndent}    # Замена переменных\n`;
      const universalVarCodeLines: string[] = [];
      generateUniversalVariableReplacement(universalVarCodeLines, `${baseIndent}    `);
      code += universalVarCodeLines.join('\n');

      // Проверяем attachedMedia
      const attachedMedia = targetNode.data.attachedMedia || [];
      if (attachedMedia.length > 0 && attachedMedia.includes('photo')) {
        // Отправляем фото с текстом
        code += `${baseIndent}    # Отправляем сохраненное фото с текстом узла\n`;
        code += `${baseIndent}    if "${attachedMedia[0]}" in ${userVarsVar}:\n`;
        code += `${baseIndent}        media_file_id = ${userVarsVar}["${attachedMedia[0]}"]\n`;
        code += `${baseIndent}        if isinstance(media_file_id, dict) and "value" in media_file_id:\n`;
        code += `${baseIndent}            media_file_id = media_file_id["value"]\n`;
        code += `${baseIndent}        await ${messageVar}.answer_photo(media_file_id, caption=text)\n`;
        code += `${baseIndent}        logging.info(f"✅ Отправлено фото из переменной ${attachedMedia[0]} с текстом узла {${nextNodeIdVar}}")\n`;
        code += `${baseIndent}    else:\n`;
        code += `${baseIndent}        await ${messageVar}.answer(text)\n`;
        code += `${baseIndent}        logging.warning(f"⚠️ Переменная ${attachedMedia[0]} не найдена, отправлен только текст")\n`;
      } else {
        // Обычное сообщение
        code += `${baseIndent}    await ${messageVar}.answer(text)\n`;
      }

      // Проверяем автопереход
      if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
        // Проверяем, нужно ли выполнять автопереход - только если collectUserInput=true
        if (targetNode.data.collectUserInput !== false) {
          code += `${baseIndent}    \n`;
          code += `${baseIndent}    # Автопереход к следующему узлу (только если collectUserInput=true)\n`;
          code += `${baseIndent}    auto_next_node_id = "${targetNode.data.autoTransitionTo}"\n`;
          code += `${baseIndent}    logging.info(f"⚡ Автопереход от {${nextNodeIdVar}} к {auto_next_node_id}")\n`;
          code += `${baseIndent}    # Создаем искусственный callback для вызова обработчика\n`;
          code += `${baseIndent}    import types as aiogram_types\n`;
          code += `${baseIndent}    fake_callback = aiogram_types.SimpleNamespace(\n`;
          code += `${baseIndent}        id="auto_transition",\n`;
          code += `${baseIndent}        from_user=${messageVar}.from_user,\n`;
          code += `${baseIndent}        chat_instance="",\n`;
          code += `${baseIndent}        data=auto_next_node_id,\n`;
          code += `${baseIndent}        message=${messageVar},\n`;
          code += `${baseIndent}        answer=lambda: None\n`;
          code += `${baseIndent}    )\n`;

          // Вызываем callback-обработчик вместо инлайн-отправки
          const autoTargetNode = nodes.find(n => n.id === targetNode.data.autoTransitionTo);
          if (autoTargetNode) {
            const safeFuncName = autoTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `${baseIndent}    await handle_callback_${safeFuncName}(fake_callback)\n`;
          } else {
            // Добавляем безопасный код, если целевой узел автоперехода не найден
            code += `${baseIndent}    logging.warning(f"⚠️ Узел автоперехода не найден: {targetNode.data.autoTransitionTo}")\n`;
            code += `${baseIndent}    await fake_callback.message.edit_text("Переход завершен")\n`;
          }
          code += `${baseIndent}    logging.info(f"✅ Автопереход выполнен: {${nextNodeIdVar}} -> {auto_next_node_id}")\n`;
        } else {
          code += `${baseIndent}    # Автопереход пропущен: collectUserInput=false\n`;
          code += `${baseIndent}    logging.info(f"ℹ️ Узел {${nextNodeIdVar}} не собирает ответы (collectUserInput=false)")\n`;
        }
      }
    });
    code += `${baseIndent}else:\n`;
    code += `${baseIndent}    logging.warning(f"Неизвестный следующий узел: {${nextNodeIdVar}}")\n`;
  }

  return code;
}
