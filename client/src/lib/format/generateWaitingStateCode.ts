// ============================================================================
// ГЕНЕРАТОРЫ СОСТОЯНИЙ И ИДЕНТИФИКАТОРОВ
// ============================================================================
// Функция для генерации кода установки состояния ожидания ввода
// Автоматически определяет правильное состояние (waiting_for_photo, waiting_for_video и т.д.)

export function generateWaitingStateCode(node: any, indentLevel: string = '    ', userIdSource: string = 'message.from_user.id'): string {
  // Проверяем, что node и node.data существуют
  if (!node || !node.data) {
    console.warn('⚠️ generateWaitingStateCode: node или node.data не определены, возвращаем пустой код');
    return '';
  }

  // Определяем тип ввода и соответствующее состояние
  const waitingStateKey = 'waiting_for_input'; // Всегда используем одно и то же состояние
  let inputVariable = node.data.inputVariable || `response_${node.id}`;

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем массив modes для поддержки нескольких типов ввода
  const modes: string[] = [];

  // Проверяем медиа-типы
  if (node.data.enablePhotoInput) {
    modes.push('photo');
    inputVariable = node.data.photoInputVariable || 'user_photo';
  } else if (node.data.enableVideoInput) {
    modes.push('video');
    inputVariable = node.data.videoInputVariable || 'user_video';
  } else if (node.data.enableAudioInput) {
    modes.push('audio');
    inputVariable = node.data.audioInputVariable || 'user_audio';
  } else if (node.data.enableDocumentInput) {
    modes.push('document');
    inputVariable = node.data.documentInputVariable || 'user_document';
  } else {
    // Для текстовых узлов проверяем наличие кнопок И текстового ввода
    const hasReplyButtons = node.data.keyboardType === 'reply' && node.data.buttons && node.data.buttons.length > 0;
    const hasTextInput = node.data.enableTextInput === true || node.data.collectUserInput === true;

    if (hasReplyButtons) {
      modes.push('button');
    }
    if (hasTextInput || !hasReplyButtons) {
      // Если нет кнопок или включен текстовый ввод - добавляем text
      modes.push('text');
    }
  }

  // Если modes пустой, по умолчанию добавляем text
  if (modes.length === 0) {
    modes.push('text');
  }

  const inputTargetNodeId = node.data.inputTargetNodeId || '';
  const modesStr = modes.map(m => `"${m}"`).join(', ');
  const modesRepr = modes.map(m => `'${m}'`).join(', '); // Для вывода в логи - с одинарными кавычками
  const primaryType = modes[0]; // Первый тип для обратной совместимости

  let code = '';
  code += `${indentLevel}user_data[${userIdSource}] = user_data.get(${userIdSource}, {})\n`;
  code += `${indentLevel}user_data[${userIdSource}]["${waitingStateKey}"] = {\n`;
  code += `${indentLevel}    "type": "${primaryType}",\n`;
  code += `${indentLevel}    "modes": [${modesStr}],\n`;
  code += `${indentLevel}    "variable": "${inputVariable}",\n`;
  code += `${indentLevel}    "save_to_database": True,\n`;
  code += `${indentLevel}    "node_id": "${node.id}",\n`;
  code += `${indentLevel}    "next_node_id": "${inputTargetNodeId}",\n`;
  code += `${indentLevel}    "min_length": ${node.data.minLength || 0},\n`;
  code += `${indentLevel}    "max_length": ${node.data.maxLength || 0},\n`;
  code += `${indentLevel}    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
  code += `${indentLevel}    "success_message": ""\n`;
  code += `${indentLevel}}\n`;
  code += `${indentLevel}logging.info(f"✅ Состояние ожидания настроено: modes=[${modesRepr}] для переменной ${inputVariable} (узел ${node.id})")\n`;

  return code;
}
