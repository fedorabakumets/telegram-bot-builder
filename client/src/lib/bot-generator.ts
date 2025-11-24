import { BotData, Node, BotGroup, buttonSchema } from '@shared/schema';
import { generateBotFatherCommands } from './commands';
import { z } from 'zod';

type Button = z.infer<typeof buttonSchema>;

// Функция для сбора всех узлов и связей из всех листов проекта
function extractNodesAndConnections(botData: BotData) {
  if (!botData) return { nodes: [], connections: [] };
  
  if ((botData as any).sheets && Array.isArray((botData as any).sheets)) {
    // Многолистовой проект - собираем узлы и связи из всех листов
    let allNodes: any[] = [];
    let allConnections: any[] = [];
    
    (botData as any).sheets.forEach((sheet: any) => {
      if (sheet.nodes && Array.isArray(sheet.nodes)) {
        allNodes = allNodes.concat(sheet.nodes);
      }
      if (sheet.connections && Array.isArray(sheet.connections)) {
        allConnections = allConnections.concat(sheet.connections);
      }
    });
    
    return { nodes: allNodes, connections: allConnections };
  } else {
    // Обычный проект
    return { 
      nodes: botData.nodes || [], 
      connections: botData.connections || [] 
    };
  }
}

// Функция для создания безопасного имени функции Python
function createSafeFunctionName(nodeId: string): string {
  let safeName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
  // Python функции не могут начинаться с цифры
  if (/^\d/.test(safeName)) {
    safeName = 'node_' + safeName;
  }
  return safeName;
}

// Функция для правильного экранирования строк в Python коде
function escapeForPython(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Функция для удаления HTML тегов из текста
function stripHtmlTags(text: string): string {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

// Функция для правильного форматирования текста с поддержкой многострочности
function formatTextForPython(text: string): string {
  if (!text) return '""';
  
  // Для многострочного текста используем тройные кавычки
  if (text.includes('\n')) {
    return `"""${text}"""`;
  } else {
    // Для однострочного текста экранируем только кавычки
    return `"${text.replace(/"/g, '\\"')}"`;
  }
}

// Функция для получения режима парсинга
function getParseMode(formatMode: string): string {
  if (formatMode === 'html') {
    return ', parse_mode=ParseMode.HTML';
  } else if (formatMode === 'markdown') {
    return ', parse_mode=ParseMode.MARKDOWN';
  }
  return '';
}

// Функция для проверки наличия геолокационных элементов в боте
function hasLocationFeatures(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  
  // Проверяем наличие узлов типа location
  const hasLocationNode = nodes.some(node => node.type === 'location');
  
  // Проверяем наличие кнопок с requestLocation
  const hasLocationButton = nodes.some(node => {
    const buttons = node.data.buttons;
    if (!buttons || !Array.isArray(buttons)) return false;
    return buttons.some((button: Button) => 
      button.action === 'location' && button.requestLocation
    );
  });
  
  return hasLocationNode || hasLocationButton;
}

// Функция для генерации текста кнопки с поддержкой переменных
function generateButtonText(buttonText: string): string {
  // Проверяем, есть ли в тексте переменные (паттерн {переменная})
  if (buttonText.includes('{') && buttonText.includes('}')) {
    // Экранируем текст для Python и оборачиваем в replace_variables_in_text
    const escapedText = escapeForPython(buttonText);
    return `replace_variables_in_text("${escapedText}", user_vars)`;
  } else {
    // Обычный текст без переменных
    return `"${escapeForPython(buttonText)}"`;
  }
}

// Функция для проверки наличия узлов с множественным выбором
function hasMultiSelectNodes(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => node.data.allowMultipleSelection);
}

// Функция для проверки наличия автопереходов
function hasAutoTransitions(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => node.data.enableAutoTransition && node.data.autoTransitionTo);
}

// Функция для проверки наличия inline кнопок (callback)
function hasInlineButtons(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  
  return nodes.some(node => {
    // Проверяем основные inline кнопки
    const hasMainInlineButtons = node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0;
    
    // Проверяем inline кнопки в conditionalMessages (любые кнопки с callback действиями)
    const hasConditionalInlineButtons = node.data.conditionalMessages && 
      node.data.conditionalMessages.some((condition: any) => 
        condition.buttons && condition.buttons.length > 0
      );
    
    return hasMainInlineButtons || hasConditionalInlineButtons;
  });
}

// Функция для проверки наличия узлов со сбором пользовательского ввода
function hasInputCollection(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  
  // Проверяем узлы с collectUserInput
  const hasCollectInput = nodes.some(node => node.data.collectUserInput);
  
  // Проверяем узлы с enableTextInput
  const hasTextInput = nodes.some(node => node.data.enableTextInput);
  
  // Проверяем узлы с enablePhotoInput
  const hasPhotoInput = nodes.some(node => node.data.enablePhotoInput);
  
  // Проверяем узлы с enableVideoInput
  const hasVideoInput = nodes.some(node => node.data.enableVideoInput);
  
  // Проверяем узлы с enableAudioInput
  const hasAudioInput = nodes.some(node => node.data.enableAudioInput);
  
  // Проверяем узлы с enableDocumentInput
  const hasDocumentInput = nodes.some(node => node.data.enableDocumentInput);
  
  // Проверяем условные сообщения с waitForTextInput
  const hasConditionalInput = nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;
    return conditions.some((cond: any) => cond.waitForTextInput);
  });
  
  return hasCollectInput || hasTextInput || hasPhotoInput || hasVideoInput || hasAudioInput || hasDocumentInput || hasConditionalInput;
}

// Функция для проверки наличия медиа-файлов
function hasMediaNodes(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  return nodes.some(node => 
    node.type === 'photo' || 
    node.type === 'video' || 
    node.type === 'audio' || 
    node.type === 'document' ||
    node.type === 'animation'
  );
}

// Функция для проверки наличия условных кнопок с callback_data формата "conditional_"
function hasConditionalButtons(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  
  return nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;
    
    return conditions.some((cond: any) => {
      if (!cond.buttons || !Array.isArray(cond.buttons)) return false;
      // Проверяем, есть ли кнопки команд в условных сообщениях с переменными
      return cond.buttons.some((button: Button) => 
        button.action === 'command' && (cond.variableName || cond.variableNames)
      );
    });
  });
}

// Функция для проверки наличия кнопок команд
function hasCommandButtons(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;
  
  // Проверяем обычные кнопки
  const hasRegularCommandButtons = nodes.some(node => {
    if (!node.data.buttons || !Array.isArray(node.data.buttons)) return false;
    return node.data.buttons.some((button: Button) => button.action === 'command');
  });
  
  // Проверяем кнопки в условных сообщениях (но не те, что создают conditional_ callbacks)
  const hasConditionalCommandButtons = nodes.some(node => {
    const conditions = node.data.conditionalMessages;
    if (!conditions || !Array.isArray(conditions)) return false;
    
    return conditions.some((cond: any) => {
      if (!cond.buttons || !Array.isArray(cond.buttons)) return false;
      // Только кнопки команд БЕЗ переменных (они не создают conditional_ callbacks)
      return cond.buttons.some((button: Button) => 
        button.action === 'command' && !cond.variableName && !cond.variableNames
      );
    });
  });
  
  return hasRegularCommandButtons || hasConditionalCommandButtons;
}

// Функция для сбора всех медиапеременных из узлов
function collectMediaVariables(nodes: Node[]): Map<string, { type: string; variable: string }> {
  const mediaVars = new Map<string, { type: string; variable: string }>();
  
  if (!nodes || nodes.length === 0) return mediaVars;
  
  nodes.forEach(node => {
    // Собираем переменные из узлов с фото
    if (node.data.enablePhotoInput && node.data.photoInputVariable) {
      mediaVars.set(node.data.photoInputVariable, {
        type: 'photo',
        variable: node.data.photoInputVariable
      });
    }
    
    // Собираем переменные из узлов с видео
    if (node.data.enableVideoInput && node.data.videoInputVariable) {
      mediaVars.set(node.data.videoInputVariable, {
        type: 'video',
        variable: node.data.videoInputVariable
      });
    }
    
    // Собираем переменные из узлов с аудио
    if (node.data.enableAudioInput && node.data.audioInputVariable) {
      mediaVars.set(node.data.audioInputVariable, {
        type: 'audio',
        variable: node.data.audioInputVariable
      });
    }
    
    // Собираем переменные из узлов с документами
    if (node.data.enableDocumentInput && node.data.documentInputVariable) {
      mediaVars.set(node.data.documentInputVariable, {
        type: 'document',
        variable: node.data.documentInputVariable
      });
    }
  });
  
  return mediaVars;
}

// Функция для поиска медиапеременных в тексте сообщения
function findMediaVariablesInText(text: string, mediaVariables: Map<string, { type: string; variable: string }>): Array<{ variable: string; type: string }> {
  if (!text || mediaVariables.size === 0) return [];
  
  const foundMedia: Array<{ variable: string; type: string }> = [];
  
  // Регулярное выражение для поиска переменных формата {variable_name}
  const variableRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  let match;
  
  while ((match = variableRegex.exec(text)) !== null) {
    const variableName = match[1];
    const mediaInfo = mediaVariables.get(variableName);
    
    if (mediaInfo) {
      // Проверяем, не добавили ли мы уже эту переменную
      if (!foundMedia.some(m => m.variable === variableName)) {
        foundMedia.push({
          variable: variableName,
          type: mediaInfo.type
        });
      }
    }
  }
  
  return foundMedia;
}

// Функция для конвертации JavaScript boolean в Python boolean
function toPythonBoolean(value: any): string {
  return value ? 'True' : 'False';
}

// Функция для генерации кода установки состояния ожидания ввода
// Автоматически определяет правильное состояние (waiting_for_photo, waiting_for_video и т.д.)
function generateWaitingStateCode(node: any, indentLevel: string = '    ', userIdSource: string = 'message.from_user.id'): string {
  // Определяем тип ввода и соответствующее состояние
  let waitingStateKey = 'waiting_for_input';
  let inputType = node.data.inputType || 'text';
  let inputVariable = node.data.inputVariable || `response_${node.id}`;
  
  // Проверяем медиа-типы и устанавливаем правильное состояние
  if (node.data.enablePhotoInput) {
    waitingStateKey = 'waiting_for_photo';
    inputType = 'photo';
    inputVariable = node.data.photoInputVariable || 'user_photo';
  } else if (node.data.enableVideoInput) {
    waitingStateKey = 'waiting_for_video';
    inputType = 'video';
    inputVariable = node.data.videoInputVariable || 'user_video';
  } else if (node.data.enableAudioInput) {
    waitingStateKey = 'waiting_for_audio';
    inputType = 'audio';
    inputVariable = node.data.audioInputVariable || 'user_audio';
  } else if (node.data.enableDocumentInput) {
    waitingStateKey = 'waiting_for_document';
    inputType = 'document';
    inputVariable = node.data.documentInputVariable || 'user_document';
  }
  
  const inputTargetNodeId = node.data.inputTargetNodeId || '';
  
  let code = '';
  code += `${indentLevel}user_data[${userIdSource}] = user_data.get(${userIdSource}, {})\n`;
  code += `${indentLevel}user_data[${userIdSource}]["${waitingStateKey}"] = {\n`;
  code += `${indentLevel}    "type": "${inputType}",\n`;
  code += `${indentLevel}    "variable": "${inputVariable}",\n`;
  code += `${indentLevel}    "save_to_database": True,\n`;
  code += `${indentLevel}    "node_id": "${node.id}",\n`;
  code += `${indentLevel}    "next_node_id": "${inputTargetNodeId}",\n`;
  code += `${indentLevel}    "min_length": ${node.data.minLength || 0},\n`;
  code += `${indentLevel}    "max_length": ${node.data.maxLength || 0},\n`;
  code += `${indentLevel}    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
  code += `${indentLevel}    "success_message": ""\n`;
  code += `${indentLevel}}\n`;
  code += `${indentLevel}logging.info(f"✅ Состояние ожидания настроено: ${inputType} ввод для переменной ${inputVariable} (узел ${node.id})")\n`;
  
  return code;
}

// Функция для создания уникальных коротких ID для узлов
function generateUniqueShortId(nodeId: string, allNodeIds: string[]): string {
  if (!nodeId) return 'node';
  
  // Особая обработка для узлов интересов
  if (nodeId.endsWith('_interests')) {
    const prefix = nodeId.replace('_interests', '');
    // Возвращаем первые 5-6 символов префикса для уникальности
    return prefix.substring(0, Math.min(6, prefix.length));
  }
  
  // Для метро и других узлов используем старую логику
  const baseShortId = nodeId.slice(-10).replace(/^_+/, '');
  
  // Проверяем уникальность среди всех узлов
  const conflicts = allNodeIds.filter(id => {
    const otherShortId = id.slice(-10).replace(/^_+/, '');
    return otherShortId === baseShortId && id !== nodeId;
  });
  
  // Если конфликтов нет, возвращаем базовый ID
  if (conflicts.length === 0) {
    return baseShortId;
  }
  
  // Если есть конфликты, берем более уникальную часть
  return nodeId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
}

// Функция для правильного экранирования строк в JSON контексте
function escapeForJsonString(text: string): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Функция для вычисления оптимального количества колонок для кнопок
function calculateOptimalColumns(buttons: any[], nodeData?: any): number {
  if (!buttons || buttons.length === 0) return 1;
  
  const totalButtons = buttons.length;
  
  // Если это множественный выбор, всегда используем 2 колонки для красивого вида
  if (nodeData?.allowMultipleSelection) {
    return 2;
  }
  
  // Стандартная логика для обычных кнопок
  if (totalButtons >= 6) {
    return 2; // Для 6+ кнопок - 2 колонки
  } else if (totalButtons >= 3) {
    return 1; // Для 3-5 кнопок - 1 колонка для удобочитаемости
  } else {
    return 1; // Для 1-2 кнопок - 1 колонка
  }
}

// Функция для генерации inline клавиатуры с автоматической настройкой колонок
function generateInlineKeyboardCode(buttons: any[], indentLevel: string, nodeId?: string, nodeData?: any, allNodeIds?: string[]): string {
  if (!buttons || buttons.length === 0) return '';
  
  let code = '';
  
  // Проверяем, есть ли кнопки выбора (selection) - если да, то это множественный выбор
  const hasSelectionButtons = buttons.some(button => button.action === 'selection');
  const isMultipleSelection = nodeData?.allowMultipleSelection === true;
  
  // Если есть множественный выбор, добавляем инициализацию состояния
  if (hasSelectionButtons && isMultipleSelection) {
    console.log(`🔧 ГЕНЕРАТОР: ИНИЦИАЛИЗИРУЕМ состояние множественного выбора для узла ${nodeId}`);
    const multiSelectVariable = nodeData?.multiSelectVariable || 'user_interests';
    
    code += `${indentLevel}# Инициализация состояния множественного выбора\n`;
    code += `${indentLevel}if user_id not in user_data:\n`;
    code += `${indentLevel}    user_data[user_id] = {}\n`;
    code += `${indentLevel}\n`;
    code += `${indentLevel}# Загружаем ранее выбранные варианты\n`;
    code += `${indentLevel}saved_selections = []\n`;
    code += `${indentLevel}if user_vars:\n`;
    code += `${indentLevel}    for var_name, var_data in user_vars.items():\n`;
    code += `${indentLevel}        if var_name == "${multiSelectVariable}":\n`;
    code += `${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:\n`;
    code += `${indentLevel}                selections_str = var_data["value"]\n`;
    code += `${indentLevel}            elif isinstance(var_data, str):\n`;
    code += `${indentLevel}                selections_str = var_data\n`;
    code += `${indentLevel}            else:\n`;
    code += `${indentLevel}                continue\n`;
    code += `${indentLevel}            if selections_str and selections_str.strip():\n`;
    code += `${indentLevel}                saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]\n`;
    code += `${indentLevel}                break\n`;
    code += `${indentLevel}\n`;
    code += `${indentLevel}# Инициализируем состояние если его нет\n`;
    code += `${indentLevel}if "multi_select_${nodeId}" not in user_data[user_id]:\n`;
    code += `${indentLevel}    user_data[user_id]["multi_select_${nodeId}"] = saved_selections.copy()\n`;
    code += `${indentLevel}user_data[user_id]["multi_select_node"] = "${nodeId}"\n`;
    code += `${indentLevel}user_data[user_id]["multi_select_type"] = "inline"\n`;
    code += `${indentLevel}user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
    code += `${indentLevel}logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")\n`;
    code += `${indentLevel}\n`;
  }
  
  code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;
  
  console.log(`🔧 ГЕНЕРАТОР: generateInlineKeyboardCode для узла ${nodeId}`);
  console.log(`🔧 ГЕНЕРАТОР: nodeData.allowMultipleSelection = ${nodeData?.allowMultipleSelection}`);
  console.log(`🔧 ГЕНЕРАТОР: hasSelectionButtons = ${hasSelectionButtons}, isMultipleSelection = ${isMultipleSelection}`);
  console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget = ${nodeData?.continueButtonTarget}`);
  console.log(`🔧 ГЕНЕРАТОР: Полный объект nodeData:`, JSON.stringify(nodeData, null, 2));
  console.log(`🔧 ГЕНЕРАТОР: Проверяем условие инициализации: hasSelectionButtons=${hasSelectionButtons} && isMultipleSelection=${isMultipleSelection}`);
  console.log(`🔧 ГЕНЕРАТОР: Результат проверки: ${hasSelectionButtons && isMultipleSelection}`);
  
  buttons.forEach((button, index) => {
    if (button.action === "url") {
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
    } else if (button.action === 'goto') {
      const baseCallbackData = button.target || button.id || 'no_action';
      // Для кнопок goto всегда используем target как callback_data без суффиксов
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${baseCallbackData}"))\n`;
    } else if (button.action === 'command') {
      const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
      code += `${indentLevel}logging.info(f"Создана кнопка команды: ${button.text} -> ${commandCallback}")\n`;
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
    } else if (button.action === 'selection') {
      // Укорачиваем callback_data для соблюдения лимита Telegram в 64 байта
      const shortNodeId = nodeId ? generateUniqueShortId(nodeId, allNodeIds || []) : 'sel';
      const shortTarget = button.target || button.id || 'btn'; // Используем полный target без обрезки для совместимости с обработчиком
      const callbackData = `ms_${shortNodeId}_${shortTarget}`;
      console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Создана кнопка selection: ${button.text} -> ${callbackData} (shortNodeId: ${shortNodeId}) (длина: ${callbackData.length})`);
      
      // Добавляем галочки для множественного выбора
      console.log(`🔧 ГЕНЕРАТОР: 🔍 ПРОВЕРЯЕМ галочки для ${button.text}: isMultipleSelection=${isMultipleSelection}`);
      if (isMultipleSelection) {
        console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ ГАЛОЧКИ для кнопки selection: ${button.text} (узел: ${nodeId})`);
        console.log(`🔧 ГЕНЕРАТОР: 📋 ДАННЫЕ КНОПКИ: text="${button.text}", target="${button.target}", id="${button.id}"`);
        code += `${indentLevel}# Кнопка выбора с галочками: ${button.text}\n`;
        code += `${indentLevel}logging.info(f"🔧 ПРОВЕРЯЕМ ГАЛОЧКУ: ищем '${button.text}' в списке: {user_data[user_id]['multi_select_${nodeId}']}")\n`;
        code += `${indentLevel}selected_mark = "✅ " if "${button.text}" in user_data[user_id]["multi_select_${nodeId}"] else ""\n`;
        code += `${indentLevel}logging.info(f"🔍 РЕЗУЛЬТАТ ГАЛОЧКИ для '${button.text}': selected_mark='{selected_mark}'")\n`;
        code += `${indentLevel}final_text = f"{selected_mark}${button.text}"\n`;
        code += `${indentLevel}logging.info(f"📱 СОЗДАЕМ КНОПКУ: text='{final_text}', callback_data='${callbackData}'")\n`;
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=final_text, callback_data="${callbackData}"))\n`;
        console.log(`🔧 ГЕНЕРАТОР: ✅ СГЕНЕРИРОВАН КОД ГАЛОЧЕК для ${button.text} с детальным логированием`);
      } else {
        console.log(`🔧 ГЕНЕРАТОР: ❌ НЕ добавляем галочки для ${button.text} (isMultipleSelection=${isMultipleSelection})`);
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      }
    } else {
      const callbackData = button.target || button.id || 'no_action';
      code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
    }
  });
  
  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ДОБАВЛЯЕМ кнопку "Готово" для множественного выбора
  if (hasSelectionButtons && isMultipleSelection) {
    const continueText = nodeData?.continueButtonText || 'Готово';
    const callbackData = `multi_select_done_${nodeId}`;
    console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ кнопку "${continueText}" для узла ${nodeId} с callback_data: ${callbackData}`);
    code += `${indentLevel}# Добавляем кнопку "Готово" для множественного выбора\n`;
    code += `${indentLevel}builder.add(InlineKeyboardButton(text="${continueText}", callback_data="${callbackData}"))\n`;
  }
  
  // Автоматическое распределение колонок с учетом данных узла и кнопки "Готово"
  let allButtons = [...buttons];
  if (hasSelectionButtons && isMultipleSelection) {
    // Добавляем виртуальную кнопку "Готово" для правильного подсчета колонок
    allButtons.push({ text: nodeData?.continueButtonText || 'Готово' });
  }
  const columns = calculateOptimalColumns(allButtons, nodeData);
  code += `${indentLevel}builder.adjust(${columns})\n`;
  code += `${indentLevel}keyboard = builder.as_markup()\n`;
  
  return code;
}

// Функция для генерации замены переменных в тексте
function generateVariableReplacement(variableName: string, indentLevel: string): string {
  let code = '';
  code += `${indentLevel}    # Подставляем значения переменных\n`;
  code += `${indentLevel}    if "{${variableName}}" in text:\n`;
  code += `${indentLevel}        if variable_value is not None:\n`;
  code += `${indentLevel}            text = text.replace("{${variableName}}", str(variable_value))\n`;
  code += `${indentLevel}        else:\n`;
  code += `${indentLevel}            # Если переменная не найдена, отображаем как простой текст\n`;
  code += `${indentLevel}            text = text.replace("{${variableName}}", "${variableName}")\n`;
  return code;
}

// Функция для генерации замены всех переменных в тексте
function generateUniversalVariableReplacement(indentLevel: string): string {
  let code = '';
  code += `${indentLevel}# Подставляем все доступные переменные пользователя в текст\n`;
  code += `${indentLevel}user_vars = await get_user_from_db(user_id)\n`;
  code += `${indentLevel}if not user_vars:\n`;
  code += `${indentLevel}    user_vars = user_data.get(user_id, {})\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# get_user_from_db теперь возвращает уже обработанные user_data\n`;
  code += `${indentLevel}if not isinstance(user_vars, dict):\n`;
  code += `${indentLevel}    user_vars = {}\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Заменяем все переменные в тексте\n`;
  code += `${indentLevel}import re\n`;
  code += `${indentLevel}def replace_variables_in_text(text_content, variables_dict):\n`;
  code += `${indentLevel}    if not text_content or not variables_dict:\n`;
  code += `${indentLevel}        return text_content\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    for var_name, var_data in variables_dict.items():\n`;
  code += `${indentLevel}        placeholder = "{" + var_name + "}"\n`;
  code += `${indentLevel}        if placeholder in text_content:\n`;
  code += `${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:\n`;
  code += `${indentLevel}                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n`;
  code += `${indentLevel}            elif var_data is not None:\n`;
  code += `${indentLevel}                var_value = str(var_data)\n`;
  code += `${indentLevel}            else:\n`;
  code += `${indentLevel}                var_value = var_name  # Показываем имя переменной если значения нет\n`;
  code += `${indentLevel}            text_content = text_content.replace(placeholder, var_value)\n`;
  code += `${indentLevel}    return text_content\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}text = replace_variables_in_text(text, user_vars)\n`;
  return code;
}

// Функция для генерации кода отправки медиа из attachedMedia
function generateAttachedMediaSendCode(
  attachedMedia: string[],
  mediaVariablesMap: Map<string, { type: string; variable: string }>,
  text: string,
  parseMode: string,
  keyboard: string,
  nodeId: string,
  indentLevel: string,
  autoTransitionTo?: string
): string {
  if (!attachedMedia || attachedMedia.length === 0) {
    return '';
  }

  // Пока поддерживаем только первую медиапеременную
  const firstMediaVar = attachedMedia[0];
  const mediaInfo = mediaVariablesMap.get(firstMediaVar);
  
  if (!mediaInfo) {
    console.log(`⚠️ ГЕНЕРАТОР: Медиапеременная ${firstMediaVar} не найдена в mediaVariablesMap`);
    return '';
  }

  const { type: mediaType, variable: mediaVariable } = mediaInfo;
  
  let code = '';
  code += `${indentLevel}# Проверяем наличие прикрепленного медиа из переменной ${mediaVariable}\n`;
  code += `${indentLevel}attached_media = None\n`;
  code += `${indentLevel}if user_vars and "${mediaVariable}" in user_vars:\n`;
  code += `${indentLevel}    media_data = user_vars["${mediaVariable}"]\n`;
  code += `${indentLevel}    if isinstance(media_data, dict) and "value" in media_data:\n`;
  code += `${indentLevel}        attached_media = media_data["value"]\n`;
  code += `${indentLevel}    elif isinstance(media_data, str):\n`;
  code += `${indentLevel}        attached_media = media_data\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Если медиа найдено, отправляем с медиа, иначе обычное сообщение\n`;
  code += `${indentLevel}if attached_media and str(attached_media).strip():\n`;
  code += `${indentLevel}    logging.info(f"📎 Отправка ${mediaType} медиа из переменной ${mediaVariable}: {attached_media}")\n`;
  code += `${indentLevel}    try:\n`;
  
  // Генерируем код отправки в зависимости от типа медиа
  const keyboardParam = keyboard !== 'None' ? ', reply_markup=keyboard' : '';
  const parseModeParam = parseMode ? `, parse_mode=ParseMode.${parseMode.toUpperCase()}` : '';
  
  switch (mediaType) {
    case 'photo':
      code += `${indentLevel}        await bot.send_photo(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    case 'video':
      code += `${indentLevel}        await bot.send_video(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    case 'audio':
      code += `${indentLevel}        await bot.send_audio(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    case 'document':
      code += `${indentLevel}        await bot.send_document(callback_query.from_user.id, attached_media, caption=text${parseModeParam}${keyboardParam})\n`;
      break;
    default:
      code += `${indentLevel}        # Неизвестный тип медиа: ${mediaType}, fallback на обычное сообщение\n`;
      const autoTransitionFlagDefault = autoTransitionTo ? ', is_auto_transition=True' : '';
      code += `${indentLevel}        await safe_edit_or_send(callback_query, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlagDefault}${parseMode})\n`;
  }
  
  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход после отправки медиа
  if (autoTransitionTo) {
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indentLevel}        \n`;
    code += `${indentLevel}        # ⚡ Автопереход к узлу ${autoTransitionTo}\n`;
    code += `${indentLevel}        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")\n`;
    code += `${indentLevel}        await handle_callback_${safeAutoTargetId}(callback_query)\n`;
    code += `${indentLevel}        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")\n`;
    code += `${indentLevel}        return\n`;
  }
  
  code += `${indentLevel}    except Exception as e:\n`;
  code += `${indentLevel}        logging.error(f"Ошибка отправки ${mediaType}: {e}")\n`;
  code += `${indentLevel}        # Fallback на обычное сообщение при ошибке\n`;
  const autoTransitionFlag = autoTransitionTo ? ', is_auto_transition=True' : '';
  code += `${indentLevel}        await safe_edit_or_send(callback_query, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlag}${parseMode})\n`;
  code += `${indentLevel}else:\n`;
  code += `${indentLevel}    # Медиа не найдено, отправляем обычное текстовое сообщение\n`;
  code += `${indentLevel}    logging.info(f"📝 Медиа ${mediaVariable} не найдено, отправка текстового сообщения")\n`;
  code += `${indentLevel}    await safe_edit_or_send(callback_query, text, node_id="${nodeId}", reply_markup=${keyboard}${autoTransitionFlag}${parseMode})\n`;
  
  // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, добавляем переход и для случая без медиа
  if (autoTransitionTo) {
    const safeAutoTargetId = autoTransitionTo.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `${indentLevel}    \n`;
    code += `${indentLevel}    # ⚡ Автопереход к узлу ${autoTransitionTo}\n`;
    code += `${indentLevel}    logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTo}")\n`;
    code += `${indentLevel}    await handle_callback_${safeAutoTargetId}(callback_query)\n`;
    code += `${indentLevel}    logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTo}")\n`;
    code += `${indentLevel}    return\n`;
  }
  
  return code;
}

// Функция для генерации клавиатуры для условного сообщения
function generateConditionalKeyboard(condition: any, indentLevel: string, nodeData?: any): string {
  if (!condition.keyboardType || condition.keyboardType === 'none' || !condition.buttons || condition.buttons.length === 0) {
    return '';
  }

  let code = '';
  
  if (condition.keyboardType === 'inline') {
    code += `${indentLevel}# Создаем inline клавиатуру для условного сообщения\n`;
    code += `${indentLevel}builder = InlineKeyboardBuilder()\n`;
    
    condition.buttons.forEach((button: Button) => {
      if (button.action === "url") {
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      } else if (button.action === 'command') {
        // Для кнопок команд в условных сообщениях, которые должны сохранять данные
        // Создаем специальную callback_data с переменной и значением из условного сообщения
        const conditionalVariableName = condition.variableName || condition.variableNames?.[0] || (nodeData && nodeData.inputVariable);
        if (conditionalVariableName) {
          const conditionalCallback = `conditional_${conditionalVariableName}_${button.text}`;
          code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${conditionalCallback}"))\n`;
        } else {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
        }
      } else {
        const callbackData = button.target || button.id || 'no_action';
        code += `${indentLevel}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      }
    });
    
    // Автоматическое распределение колонок для inline клавиатуры
    const columns = calculateOptimalColumns(condition.buttons, nodeData);
    code += `${indentLevel}builder.adjust(${columns})\n`;
    code += `${indentLevel}keyboard = builder.as_markup()\n`;
    code += `${indentLevel}conditional_keyboard = keyboard\n`;
    
  } else if (condition.keyboardType === 'reply') {
    code += `${indentLevel}# Создаем reply клавиатуру для условного сообщения\n`;
    code += `${indentLevel}builder = ReplyKeyboardBuilder()\n`;
    
    condition.buttons.forEach((button: Button) => {
      if (button.action === "contact" && button.requestContact) {
        code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
      } else if (button.action === "location" && button.requestLocation) {
        code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
      } else {
        code += `${indentLevel}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
      }
    });
    
    code += `${indentLevel}keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)\n`;
    code += `${indentLevel}conditional_keyboard = keyboard\n`;
  }
  
  return code;
}

// Функция для генерации логики условных сообщений
function generateConditionalMessageLogic(conditionalMessages: any[], indentLevel: string = '    ', nodeData?: any): string {
  if (!conditionalMessages || conditionalMessages.length === 0) {
    return '';
  }

  let code = '';
  const sortedConditions = [...conditionalMessages].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // НЕ инициализируем conditional_parse_mode и conditional_keyboard здесь
  // Они должны быть инициализированы вызывающей функцией ПЕРЕД вызовом generateConditionalMessageLogic
  
  // Получаем user_vars для подстановки в кнопки условных сообщений
  code += `${indentLevel}# Подставляем все доступные переменные пользователя в текст кнопок\n`;
  code += `${indentLevel}user_vars = await get_user_from_db(user_id)\n`;
  code += `${indentLevel}if not user_vars:\n`;
  code += `${indentLevel}    user_vars = user_data.get(user_id, {})\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# get_user_from_db теперь возвращает уже обработанные user_data\n`;
  code += `${indentLevel}if not isinstance(user_vars, dict):\n`;
  code += `${indentLevel}    user_vars = {}\n`;
  code += `${indentLevel}\n`;
  code += `${indentLevel}# Заменяем все переменные в тексте\n`;
  code += `${indentLevel}import re\n`;
  code += `${indentLevel}def replace_variables_in_text(text_content, variables_dict):\n`;
  code += `${indentLevel}    if not text_content or not variables_dict:\n`;
  code += `${indentLevel}        return text_content\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    for var_name, var_data in variables_dict.items():\n`;
  code += `${indentLevel}        placeholder = "{" + var_name + "}"\n`;
  code += `${indentLevel}        if placeholder in text_content:\n`;
  code += `${indentLevel}            if isinstance(var_data, dict) and "value" in var_data:\n`;
  code += `${indentLevel}                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n`;
  code += `${indentLevel}            elif var_data is not None:\n`;
  code += `${indentLevel}                var_value = str(var_data)\n`;
  code += `${indentLevel}            else:\n`;
  code += `${indentLevel}                var_value = var_name  # Показываем имя переменной если значения нет\n`;
  code += `${indentLevel}            text_content = text_content.replace(placeholder, var_value)\n`;
  code += `${indentLevel}    return text_content\n`;
  code += `${indentLevel}\n`;
  
  // Генерируем единую функцию проверки переменных
  code += `${indentLevel}# Функция для проверки переменных пользователя\n`;
  code += `${indentLevel}def check_user_variable(var_name, user_data_dict):\n`;
  code += `${indentLevel}    """Проверяет существование и получает значение переменной пользователя"""\n`;
  code += `${indentLevel}    # Сначала проверяем в поле user_data (из БД)\n`;
  code += `${indentLevel}    if "user_data" in user_data_dict and user_data_dict["user_data"]:\n`;
  code += `${indentLevel}        try:\n`;
  code += `${indentLevel}            import json\n`;
  code += `${indentLevel}            parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n`;
  code += `${indentLevel}            if var_name in parsed_data:\n`;
  code += `${indentLevel}                raw_value = parsed_data[var_name]\n`;
  code += `${indentLevel}                if isinstance(raw_value, dict) and "value" in raw_value:\n`;
  code += `${indentLevel}                    var_value = raw_value["value"]\n`;
  code += `${indentLevel}                    # Проверяем, что значение действительно существует и не пустое\n`;
  code += `${indentLevel}                    if var_value is not None and str(var_value).strip() != "":\n`;
  code += `${indentLevel}                        return True, str(var_value)\n`;
  code += `${indentLevel}                else:\n`;
  code += `${indentLevel}                    # Проверяем, что значение действительно существует и не пустое\n`;
  code += `${indentLevel}                    if raw_value is not None and str(raw_value).strip() != "":\n`;
  code += `${indentLevel}                        return True, str(raw_value)\n`;
  code += `${indentLevel}        except (json.JSONDecodeError, TypeError):\n`;
  code += `${indentLevel}            pass\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    # Проверяем в локальных данных (без вложенности user_data)\n`;
  code += `${indentLevel}    if var_name in user_data_dict:\n`;
  code += `${indentLevel}        variable_data = user_data_dict.get(var_name)\n`;
  code += `${indentLevel}        if isinstance(variable_data, dict) and "value" in variable_data:\n`;
  code += `${indentLevel}            var_value = variable_data["value"]\n`;
  code += `${indentLevel}            # Проверяем, что значение действительно существует и не пустое\n`;
  code += `${indentLevel}            if var_value is not None and str(var_value).strip() != "":\n`;
  code += `${indentLevel}                return True, str(var_value)\n`;
  code += `${indentLevel}        elif variable_data is not None and str(variable_data).strip() != "":\n`;
  code += `${indentLevel}            return True, str(variable_data)\n`;
  code += `${indentLevel}    \n`;
  code += `${indentLevel}    return False, None\n`;
  code += `${indentLevel}\n`;
  
  // Создаем единую if/elif/else структуру для всех условий
  for (let i = 0; i < sortedConditions.length; i++) {
    const condition = sortedConditions[i];
    // Если текст условного сообщения не указан или пустой, используем основной текст узла
    let messageToUse = condition.messageText || '';
    const cleanedConditionText = stripHtmlTags(messageToUse).trim();
    // Если после очистки текст пустой, используем основной текст узла
    let finalMessageText = '';
    if (!cleanedConditionText) {
      // Используем основной текст узла если условное сообщение пустое
      finalMessageText = nodeData?.messageText || '';
    } else {
      finalMessageText = cleanedConditionText;
    }
    const conditionText = formatTextForPython(finalMessageText);
    const conditionKeyword = i === 0 ? 'if' : 'elif';
    
    // Get variable names - support both new array format and legacy single variable
    const variableNames = condition.variableNames && condition.variableNames.length > 0 
      ? condition.variableNames 
      : (condition.variableName ? [condition.variableName] : []);
    
    const logicOperator = condition.logicOperator || 'AND';
    
    code += `${indentLevel}# Условие ${i + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}\n`;
    
    switch (condition.condition) {
      case 'user_data_exists':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками ВНУТРИ
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          code += `${indentLevel}    check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
        }
        code += `${indentLevel}):\n`;
        
        // Внутри блока условия собираем значения переменных
        code += `${indentLevel}    # Собираем значения переменных\n`;
        code += `${indentLevel}    variable_values = {}\n`;
        for (const varName of variableNames) {
          code += `${indentLevel}    _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
        }
        
        // Только переопределяем text если условное сообщение не пустое
        const conditionTextValue = finalMessageText.trim();
        if (conditionTextValue) {
          code += `${indentLevel}    text = ${conditionText}\n`;
        } else {
          code += `${indentLevel}    # Условное сообщение пустое, используем основной текст узла (text уже инициализирован)\n`;
        }
        
        // Устанавливаем parse_mode для условного сообщения
        const parseMode1 = getParseMode(condition.formatMode || 'text');
        if (parseMode1) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode1}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Заменяем переменные в тексте
        for (const varName of variableNames) {
          code += `${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
          code += `${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // ИСПРАВЛЕНИЕ: Проверяем, нужно ли ждать ввода ДАЖЕ ЕСЛИ переменная существует
        code += `${indentLevel}    # Настраиваем ожидание ввода для условного сообщения с waitForTextInput\n`;
        if (condition.waitForTextInput) {
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода (переменная существует, но ждём новое значение): {conditional_message_config}")\n`;
          code += `${indentLevel}        # ВАЖНО: Переменная существует, но waitForTextInput=true, поэтому НЕ делаем автопереход\n`;
          code += `${indentLevel}        # Сбрасываем флаг условия чтобы fallback показал сообщение и дождался ввода\n`;
          code += `${indentLevel}        # НО мы уже установили waiting_for_conditional_input, так что НЕ нужно делать break\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} (${logicOperator})")\n`;
        break;
        
      case 'user_data_not_exists':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками ВНУТРИ (инвертированными)
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          if (logicOperator === 'AND') {
            code += `${indentLevel}    not check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
          } else {
            code += `${indentLevel}    not check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
          }
        }
        code += `${indentLevel}):\n`;
        
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode2 = getParseMode(condition.formatMode || 'text');
        if (parseMode2) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode2}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для user_data_not_exists
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные ${variableNames} не существуют (${logicOperator})")\n`;
        break;
        
      case 'user_data_equals':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками равенства ВНУТРИ
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          code += `${indentLevel}    check_user_variable("${varName}", user_data_dict)[1] == "${condition.expectedValue || ''}"${operator}\n`;
        }
        code += `${indentLevel}):\n`;
        
        // Внутри блока условия собираем значения переменных
        code += `${indentLevel}    # Собираем значения переменных\n`;
        code += `${indentLevel}    variable_values = {}\n`;
        for (const varName of variableNames) {
          code += `${indentLevel}    _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
        }
        
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode3 = getParseMode(condition.formatMode || 'text');
        if (parseMode3) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode3}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Заменяем переменные в тексте
        for (const varName of variableNames) {
          code += `${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
          code += `${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для user_data_equals
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} равны '${condition.expectedValue || ''}' (${logicOperator})")\n`;
        break;
        
      case 'user_data_contains':
        if (variableNames.length === 0) {
          code += `${indentLevel}${conditionKeyword} False:  # Нет переменных для проверки\n`;
          code += `${indentLevel}    pass\n`;
          break;
        }
        
        // Создаем единый блок условия с проверками содержания ВНУТРИ
        code += `${indentLevel}${conditionKeyword} (\n`;
        for (let j = 0; j < variableNames.length; j++) {
          const varName = variableNames[j];
          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
          code += `${indentLevel}    (check_user_variable("${varName}", user_data_dict)[1] is not None and "${condition.expectedValue || ''}" in str(check_user_variable("${varName}", user_data_dict)[1]))${operator}\n`;
        }
        code += `${indentLevel}):\n`;
        
        // Внутри блока условия собираем значения переменных
        code += `${indentLevel}    # Собираем значения переменных\n`;
        code += `${indentLevel}    variable_values = {}\n`;
        for (const varName of variableNames) {
          code += `${indentLevel}    _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
        }
        
        code += `${indentLevel}    text = ${conditionText}\n`;
        // Устанавливаем parse_mode для условного сообщения
        const parseMode4 = getParseMode(condition.formatMode || 'text');
        if (parseMode4) {
          code += `${indentLevel}    conditional_parse_mode = "${parseMode4}"\n`;
        } else {
          code += `${indentLevel}    conditional_parse_mode = None\n`;
        }
        
        // Заменяем переменные в тексте
        for (const varName of variableNames) {
          code += `${indentLevel}    if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
          code += `${indentLevel}        text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
        }
        
        // Добавляем генерацию клавиатуры для условного сообщения
        code += generateConditionalKeyboard(condition, indentLevel + '    ', nodeData);
        
        // Добавляем логику для настройки ожидания текстового ввода
        code += `${indentLevel}    # Настраиваем ожидание текстового ввода для условного сообщения\n`;
        code += `${indentLevel}    conditional_message_config = {\n`;
        code += `${indentLevel}        "condition_id": "${condition.id}",\n`;
        code += `${indentLevel}        "wait_for_input": ${toPythonBoolean(condition.waitForTextInput)},\n`;
        code += `${indentLevel}        "input_variable": "${condition.textInputVariable || ''}",\n`;
        code += `${indentLevel}        "next_node_id": "${condition.nextNodeAfterInput || ''}",\n`;
        code += `${indentLevel}        "source_type": "conditional_message"\n`;
        code += `${indentLevel}    }\n`;
        
        // Добавляем код для активации состояния условного ввода для user_data_contains
        if (condition.waitForTextInput) {
          code += `${indentLevel}    \n`;
          code += `${indentLevel}    # Если есть условное сообщение с ожиданием ввода\n`;
          code += `${indentLevel}    if conditional_message_config and conditional_message_config.get("wait_for_input"):\n`;
          code += `${indentLevel}        if user_id not in user_data:\n`;
          code += `${indentLevel}            user_data[user_id] = {}\n`;
          code += `${indentLevel}        user_data[user_id]["waiting_for_conditional_input"] = conditional_message_config\n`;
          code += `${indentLevel}        logging.info(f"Активировано ожидание условного ввода: {conditional_message_config}")\n`;
        }
        
        code += `${indentLevel}    logging.info(f"Условие выполнено: переменные {variable_values} содержат '${condition.expectedValue || ''}' (${logicOperator})")\n`;
        break;
        
      default:
        code += `${indentLevel}${conditionKeyword} False:  # Неизвестное условие: ${condition.condition}\n`;
        code += `${indentLevel}    pass\n`;
        break;
    }
  }
  
  // НЕ добавляем else блок здесь - он будет добавлен основной функцией
  return code;
}

// Функция для парсинга Python кода обратно в JSON (улучшенная версия)
export function parsePythonCodeToJson(pythonCode: string): { nodes: Node[]; connections: any[] } {
  const nodes: Node[] = [];
  const nodeIdMap = new Map<string, Node>();
  
  // Ищем все NODE_START и NODE_END блоки
  const nodePattern = /# @@NODE_START:([a-zA-Z0-9_@]+)@@\n([\s\S]*?)# @@NODE_END:\1@@/g;
  let match;
  let xPosition = 50;
  
  while ((match = nodePattern.exec(pythonCode)) !== null) {
    const nodeId = match[1];
    const nodeContent = match[2];
    
    // Определяем тип узла по декораторам и контексту
    let nodeType = 'message';
    if (nodeId === 'start') {
      nodeType = 'start';
    } else if (nodeContent.includes('F.photo') || nodeContent.includes('@dp.message(F.photo)')) {
      nodeType = 'photo';
    } else if (nodeContent.includes('F.video') || nodeContent.includes('@dp.message(F.video)')) {
      nodeType = 'video';
    } else if (nodeContent.includes('F.audio') || nodeContent.includes('@dp.message(F.audio)')) {
      nodeType = 'audio';
    } else if (nodeContent.includes('F.voice') || nodeContent.includes('@dp.message(F.voice)')) {
      nodeType = 'voice';
    } else if (nodeContent.includes('F.document') || nodeContent.includes('@dp.message(F.document)')) {
      nodeType = 'document';
    } else if (nodeContent.includes('F.sticker') || nodeContent.includes('@dp.message(F.sticker)')) {
      nodeType = 'sticker';
    } else if (nodeContent.includes('F.animation') || nodeContent.includes('@dp.message(F.animation)')) {
      nodeType = 'animation';
    } else if (nodeContent.includes('commands=') || nodeContent.includes('F.command')) {
      nodeType = 'command';
    }
    
    // Извлекаем текст сообщения (поддержка многострочного текста)
    let messageText = '';
    // Сначала пробуем найти многострочный текст в тройных кавычках
    let textMatch = /text\s*=\s*"""([\s\S]*?)"""/m.exec(nodeContent);
    if (!textMatch) {
      // Потом пробуем однострочный текст
      textMatch = /text\s*=\s*"([^"]*)"/.exec(nodeContent);
    }
    if (!textMatch) {
      // Пробуем текст с экранированием
      textMatch = /text\s*=\s*'([^']*)'/.exec(nodeContent);
    }
    if (textMatch) {
      messageText = textMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\t/g, '\t');
    }
    
    // Извлекаем команду и описание для command узлов
    let command = '';
    let description = '';
    const commandMatch = /commands?\s*=\s*\["([^"]+)"\]/.exec(nodeContent);
    if (commandMatch) {
      command = commandMatch[1].startsWith('/') ? commandMatch[1] : '/' + commandMatch[1];
    }
    const descriptionMatch = /description\s*=\s*"([^"]*)"/.exec(nodeContent);
    if (descriptionMatch) {
      description = descriptionMatch[1];
    }
    
    // Извлекаем Inline кнопки
    const buttons: any[] = [];
    const inlineButtonMatches = nodeContent.matchAll(/InlineKeyboardButton\s*\(\s*text\s*=\s*([^,]+)\s*,\s*callback_data\s*=\s*"([^"]+)"\s*\)/g);
    for (const btnMatch of inlineButtonMatches) {
      let btnText = btnMatch[1].replace(/["'`]/g, '').trim();
      // Убираем префиксы типа 'replace_variables_in_text('
      if (btnText.includes('(')) {
        const innerMatch = /\("([^"]+)"\)/.exec(btnText);
        if (innerMatch) {
          btnText = innerMatch[1];
        }
      }
      const callbackData = btnMatch[2];
      buttons.push({
        id: `btn_${nodeId}_${buttons.length}`,
        text: btnText,
        action: 'goto',
        target: callbackData,
        buttonType: 'normal'
      });
    }
    
    // Извлекаем Reply кнопки
    const replyButtonMatches = nodeContent.matchAll(/KeyboardButton\s*\(\s*text\s*=\s*([^)]+)\s*\)/g);
    for (const btnMatch of replyButtonMatches) {
      let btnText = btnMatch[1].replace(/["'`]/g, '').trim();
      // Убираем функции типа replace_variables_in_text
      if (btnText.includes('(')) {
        const innerMatch = /\("([^"]+)"\)/.exec(btnText);
        if (innerMatch) {
          btnText = innerMatch[1];
        }
      }
      if (!buttons.find(b => b.text === btnText)) {
        buttons.push({
          id: `btn_${nodeId}_${buttons.length}`,
          text: btnText,
          action: 'default',
          buttonType: 'normal'
        });
      }
    }
    
    // Определяем тип клавиатуры
    let keyboardType = 'none';
    if (nodeContent.includes('InlineKeyboardMarkup')) {
      keyboardType = 'inline';
    } else if (nodeContent.includes('ReplyKeyboardMarkup')) {
      keyboardType = 'reply';
    }
    
    // Извлекаем настройки ввода текста
    const collectUserInput = nodeContent.includes('collect_user_input') || nodeContent.includes('enableTextInput');
    const waitForTextInput = nodeContent.includes('input_variable') || nodeContent.includes('waiting_for_input');
    const inputVariable = /input_variable\s*=\s*"([^"]*)"/.exec(nodeContent)?.[1] || '';
    
    // Создаем узел
    const node: Node = {
      id: nodeId,
      type: nodeType as any,
      position: { x: xPosition, y: 50 },
      data: {
        messageText: messageText || `Узел ${nodeId}`,
        keyboardType: keyboardType,
        buttons: buttons,
        showInMenu: (nodeType === 'start' || nodeType === 'command') && !nodeContent.includes('showInMenu=False'),
        command: command,
        description: description,
        allowMultipleSelection: nodeContent.includes('allowMultipleSelection=True'),
        formatMode: nodeContent.includes('parse_mode=ParseMode.HTML') ? 'html' : 
                   nodeContent.includes('parse_mode=ParseMode.MARKDOWN') ? 'markdown' : 'text',
        enablePhotoInput: nodeContent.includes('enablePhotoInput'),
        enableVideoInput: nodeContent.includes('enableVideoInput'),
        enableAudioInput: nodeContent.includes('enableAudioInput'),
        enableDocumentInput: nodeContent.includes('enableDocumentInput'),
        waitForTextInput: waitForTextInput,
        inputVariable: inputVariable,
        collectUserInput: collectUserInput,
        conditionalMessages: [],
        synonyms: [],
        attachedMedia: []
      }
    };
    
    nodes.push(node);
    nodeIdMap.set(nodeId, node);
    xPosition += 280;
  }
  
  // Восстанавливаем connections на основе кнопок и контекста
  const connections: any[] = [];
  const addedConnections = new Set<string>();
  
  nodes.forEach(node => {
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      node.data.buttons.forEach(button => {
        if (button.target && button.action === 'goto') {
          const connectionId = `${node.id}-${button.target}`;
          if (!addedConnections.has(connectionId) && nodeIdMap.has(button.target)) {
            connections.push({
              id: connectionId,
              source: node.id,
              target: button.target
            });
            addedConnections.add(connectionId);
          }
        }
      });
    }
  });
  
  return { nodes, connections };
}

export function generatePythonCode(botData: BotData, botName: string = "MyBot", groups: BotGroup[] = [], userDatabaseEnabled: boolean = false, projectId: number | null = null): string {
  const { nodes, connections } = extractNodesAndConnections(botData);
  
  // Собираем все ID узлов для генерации уникальных коротких ID
  const allNodeIds = nodes ? nodes.map(node => node.id) : [];
  
  // Собираем все медиапеременные из узлов для поддержки attachedMedia
  const mediaVariablesMap = collectMediaVariables(nodes || []);
  console.log(`🔧 ГЕНЕРАТОР: Собрано медиапеременных: ${mediaVariablesMap.size}`);
  if (mediaVariablesMap.size > 0) {
    console.log('🔧 ГЕНЕРАТОР: Медиапеременные:', Array.from(mediaVariablesMap.entries()));
  }
  
  // ЛОГИРОВАНИЕ ГЕНЕРАТОРА: Подробная информация о данных бота
  console.log(`🔧 ГЕНЕРАТОР НАЧАЛ РАБОТУ: узлов - ${nodes?.length || 0}, связей - ${connections?.length || 0}`);
  
  // Логируем все узлы с их свойствами
  if (nodes && nodes.length > 0) {
    console.log('🔧 ГЕНЕРАТОР: Анализируем все узлы:');
    nodes.forEach((node, index) => {
      const hasMultiSelect = node.data.allowMultipleSelection;
      const hasButtons = node.data.buttons && node.data.buttons.length > 0;
      const continueTarget = node.data.continueButtonTarget;
      
      console.log(`🔧 ГЕНЕРАТОР: Узел ${index + 1}: "${node.id}" (тип: ${node.type})`);
      console.log(`🔧 ГЕНЕРАТОР:   - allowMultipleSelection: ${node.data.allowMultipleSelection}`);
      console.log(`🔧 ГЕНЕРАТОР:   - hasMultiSelect: ${hasMultiSelect}`);
      console.log(`🔧 ГЕНЕРАТОР:   - кнопок: ${node.data.buttons?.length || 0}`);
      console.log(`🔧 ГЕНЕРАТОР:   - keyboardType: ${node.data.keyboardType || 'нет'}`);
      console.log(`🔧 ГЕНЕРАТОР:   - continueButtonTarget: ${continueTarget || 'нет'}`);
      
      if (node.id === 'interests_result') {
        console.log(`🚨 ГЕНЕРАТОР: НАЙДЕН interests_result!`);
        console.log(`🚨 ГЕНЕРАТОР: interests_result полные данные:`, JSON.stringify(node.data, null, 2));
      }
    });
    
    // Проверим связи
    if (connections && connections.length > 0) {
      console.log('🔧 ГЕНЕРАТОР: Анализируем связи:');
      connections.forEach((conn, index) => {
        console.log(`🔧 ГЕНЕРАТОР: Связь ${index + 1}: ${conn.source} -> ${conn.target}`);
      });
    }
  }
  
  let code = '"""\n';
  code += `${botName} - Telegram Bot\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\n';
  
  const botFatherCommands = generateBotFatherCommands(nodes);
  if (botFatherCommands) {
    code += '\nКоманды для @BotFather:\n';
    code += botFatherCommands;
  }
  
  code += '"""\n\n';
  
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'import os\n';
  code += 'import sys\n';
  code += 'import locale\n';
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.exceptions import TelegramBadRequest\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile\n';
  code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
  code += 'from aiogram.enums import ParseMode\n';
  code += 'from typing import Optional\n';
  code += 'import asyncpg\n';
  code += 'from datetime import datetime, timezone, timedelta\n';
  code += 'import json\n';
  code += 'import aiohttp\n\n';
  
  // Добавляем safe_edit_or_send если есть inline кнопки ИЛИ автопереходы
  if (hasInlineButtons(nodes || []) || hasAutoTransitions(nodes || [])) {
    code += '# Safe helper for editing messages with fallback to new message\n';
    code += 'async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):\n';
    code += '    """\n';
    code += '    Безопасное редактирование сообщения с fallback на новое сообщение\n';
    code += '    При автопереходе сразу отправляет новое сообщение без попытки редактирования\n';
    code += '    """\n';
    code += '    result = None\n';
    code += '    user_id = None\n';
    code += '    \n';
    code += '    # Получаем user_id для сохранения\n';
    code += '    if hasattr(cbq, "from_user") and cbq.from_user:\n';
    code += '        user_id = str(cbq.from_user.id)\n';
    code += '    elif hasattr(cbq, "message") and cbq.message and hasattr(cbq.message, "chat"):\n';
    code += '        user_id = str(cbq.message.chat.id)\n';
    code += '    \n';
    code += '    try:\n';
    code += '        # При автопереходе сразу отправляем новое сообщение без редактирования\n';
    code += '        if is_auto_transition:\n';
    code += '            logging.info(f"⚡ Автопереход: отправляем новое сообщение вместо редактирования")\n';
    code += '            if hasattr(cbq, "message") and cbq.message:\n';
    code += '                result = await cbq.message.answer(text, **kwargs)\n';
    code += '            else:\n';
    code += '                raise Exception("Cannot send message in auto-transition")\n';
    code += '        else:\n';
    code += '            # Пробуем редактировать сообщение\n';
    code += '            if hasattr(cbq, "edit_text") and callable(getattr(cbq, "edit_text")):\n';
    code += '                result = await cbq.edit_text(text, **kwargs)\n';
    code += '            elif (hasattr(cbq, "message") and cbq.message):\n';
    code += '                result = await cbq.message.edit_text(text, **kwargs)\n';
    code += '            else:\n';
    code += '                raise Exception("No valid edit method found")\n';
    code += '    except Exception as e:\n';
    code += '        # При любой ошибке отправляем новое сообщение\n';
    code += '        if is_auto_transition:\n';
    code += '            logging.info(f"⚡ Автопереход: {e}, отправляем новое сообщение")\n';
    code += '        else:\n';
    code += '            logging.warning(f"Не удалось отредактировать сообщение: {e}, отправляем новое")\n';
    code += '        if hasattr(cbq, "message") and cbq.message:\n';
    code += '            result = await cbq.message.answer(text, **kwargs)\n';
    code += '        else:\n';
    code += '            logging.error("Не удалось ни отредактировать, ни отправить новое сообщение")\n';
    code += '            raise\n';
    code += '    \n';
    code += '    # Сохраняем сообщение в базу данных\n';
    code += '    if result and user_id:\n';
    code += '        message_data_obj = {"message_id": result.message_id if hasattr(result, "message_id") else None}\n';
    code += '        \n';
    code += '        # Извлекаем кнопки из reply_markup\n';
    code += '        if "reply_markup" in kwargs:\n';
    code += '            try:\n';
    code += '                reply_markup = kwargs["reply_markup"]\n';
    code += '                buttons_data = []\n';
    code += '                # Обработка inline клавиатуры\n';
    code += '                if hasattr(reply_markup, "inline_keyboard"):\n';
    code += '                    for row in reply_markup.inline_keyboard:\n';
    code += '                        for btn in row:\n';
    code += '                            button_info = {"text": btn.text}\n';
    code += '                            if hasattr(btn, "url") and btn.url:\n';
    code += '                                button_info["url"] = btn.url\n';
    code += '                            if hasattr(btn, "callback_data") and btn.callback_data:\n';
    code += '                                button_info["callback_data"] = btn.callback_data\n';
    code += '                            buttons_data.append(button_info)\n';
    code += '                    if buttons_data:\n';
    code += '                        message_data_obj["buttons"] = buttons_data\n';
    code += '                        message_data_obj["keyboard_type"] = "inline"\n';
    code += '                # Обработка reply клавиатуры\n';
    code += '                elif hasattr(reply_markup, "keyboard"):\n';
    code += '                    for row in reply_markup.keyboard:\n';
    code += '                        for btn in row:\n';
    code += '                            button_info = {"text": btn.text}\n';
    code += '                            if hasattr(btn, "request_contact") and btn.request_contact:\n';
    code += '                                button_info["request_contact"] = True\n';
    code += '                            if hasattr(btn, "request_location") and btn.request_location:\n';
    code += '                                button_info["request_location"] = True\n';
    code += '                            buttons_data.append(button_info)\n';
    code += '                    if buttons_data:\n';
    code += '                        message_data_obj["buttons"] = buttons_data\n';
    code += '                        message_data_obj["keyboard_type"] = "reply"\n';
    code += '            except Exception as btn_error:\n';
    code += '                logging.warning(f"Не удалось извлечь кнопки в safe_edit_or_send: {btn_error}")\n';
    code += '        \n';
    code += '        await save_message_to_api(\n';
    code += '            user_id=user_id,\n';
    code += '            message_type="bot",\n';
    code += '            message_text=text,\n';
    code += '            node_id=node_id,\n';
    code += '            message_data=message_data_obj\n';
    code += '        )\n';
    code += '    \n';
    code += '    return result\n\n';
  }
  
  code += '# Токен вашего бота (получите у @BotFather)\n';
  code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';
  
  code += '# Настройка логирования\n';
  code += 'logging.basicConfig(level=logging.INFO)\n\n';
  
  code += '# Создание бота и диспетчера\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n\n';
  
  code += '# Список администраторов (добавьте свой Telegram ID)\n';
  code += 'ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов\n\n';
  
  // Блок логирования сообщений генерируется только если включена БД
  if (userDatabaseEnabled) {
  code += '# API configuration для сохранения сообщений\n';
  code += 'API_BASE_URL = os.getenv("REPLIT_DEV_DOMAIN", "http://localhost:5000")\n';
  code += `PROJECT_ID = int(os.getenv("PROJECT_ID", "${projectId || 0}"))  # ID проекта в системе\n\n`;
  
  code += '# Функция для сохранения сообщений в базу данных через API\n';
  code += 'async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):\n';
  code += '    """Сохраняет сообщение в базу данных через API"""\n';
  code += '    try:\n';
  code += '        # Формируем полный URL для API\n';
  code += '        if API_BASE_URL.startswith("http"):\n';
  code += '            api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"\n';
  code += '        else:\n';
  code += '            api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"\n';
  code += '        \n';
  code += '        payload = {\n';
  code += '            "userId": str(user_id),\n';
  code += '            "messageType": message_type,\n';
  code += '            "messageText": message_text,\n';
  code += '            "nodeId": node_id,\n';
  code += '            "messageData": message_data or {}\n';
  code += '        }\n';
  code += '        \n';
  code += '        logging.debug(f"💾 Отправка сообщения в API: {payload}")\n';
  code += '        async with aiohttp.ClientSession() as session:\n';
  code += '            async with session.post(api_url, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as response:\n';
  code += '                if response.status == 200:\n';
  code += '                    logging.info(f"✅ Сообщение сохранено: {message_type} от {user_id}")\n';
  code += '                    response_data = await response.json()\n';
  code += '                    return response_data.get("data")  # Возвращаем сохраненное сообщение с id\n';
  code += '                else:\n';
  code += '                    error_text = await response.text()\n';
  code += '                    logging.error(f"❌ Не удалось сохранить сообщение: {response.status} - {error_text}")\n';
  code += '                    logging.error(f"Отправленный payload: {payload}")\n';
  code += '                    return None\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка при сохранении сообщения: {e}")\n';
  code += '        return None\n\n';
  
  code += '# Middleware для сохранения входящих сообщений\n';
  code += 'async def message_logging_middleware(handler, event: types.Message, data: dict):\n';
  code += '    """Middleware для автоматического сохранения входящих сообщений от пользователей"""\n';
  code += '    try:\n';
  code += '        # Сохраняем входящее сообщение от пользователя\n';
  code += '        user_id = str(event.from_user.id)\n';
  code += '        message_text = event.text or event.caption or "[медиа]"\n';
  code += '        message_data = {"message_id": event.message_id}\n';
  code += '        \n';
  code += '        # Проверяем наличие фото\n';
  code += '        photo_file_id = None\n';
  code += '        if event.photo:\n';
  code += '            # Берем фото наибольшего размера (последнее в списке)\n';
  code += '            largest_photo = event.photo[-1]\n';
  code += '            photo_file_id = largest_photo.file_id\n';
  code += '            message_data["photo"] = {\n';
  code += '                "file_id": largest_photo.file_id,\n';
  code += '                "file_unique_id": largest_photo.file_unique_id,\n';
  code += '                "width": largest_photo.width,\n';
  code += '                "height": largest_photo.height,\n';
  code += '                "file_size": largest_photo.file_size if hasattr(largest_photo, "file_size") else None\n';
  code += '            }\n';
  code += '            if not message_text or message_text == "[медиа]":\n';
  code += '                message_text = "[Фото]"\n';
  code += '        \n';
  code += '        # Сохраняем сообщение в базу данных\n';
  code += '        saved_message = await save_message_to_api(\n';
  code += '            user_id=user_id,\n';
  code += '            message_type="user",\n';
  code += '            message_text=message_text,\n';
  code += '            message_data=message_data\n';
  code += '        )\n';
  code += '        \n';
  code += '        # Если есть фото и сообщение сохранено, регистрируем медиа\n';
  code += '        if photo_file_id and saved_message and "id" in saved_message:\n';
  code += '            try:\n';
  code += '                if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):\n';
  code += '                    media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '                else:\n';
  code += '                    media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '                \n';
  code += '                media_payload = {\n';
  code += '                    "messageId": saved_message["id"],\n';
  code += '                    "fileId": photo_file_id,\n';
  code += '                    "botToken": BOT_TOKEN,\n';
  code += '                    "mediaType": "photo"\n';
  code += '                }\n';
  code += '                \n';
  code += '                async with aiohttp.ClientSession() as session:\n';
  code += '                    async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:\n';
  code += '                        if response.status == 200:\n';
  code += '                            message_id = saved_message.get("id")\n';
  code += '                            logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")\n';
  code += '                        else:\n';
  code += '                            error_text = await response.text()\n';
  code += '                            logging.warning(f"⚠️ Не удалось зарегистрировать медиа: {response.status} - {error_text}")\n';
  code += '            except Exception as media_error:\n';
  code += '                logging.warning(f"Ошибка при регистрации медиа: {media_error}")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка в middleware сохранения сообщений: {e}")\n';
  code += '    \n';
  code += '    # Продолжаем обработку сообщения\n';
  code += '    return await handler(event, data)\n\n';
  
  // Добавляем callback_query middleware только если в боте есть inline кнопки
  if (hasInlineButtons(nodes || [])) {
    code += '# Middleware для сохранения нажатий на кнопки\n';
    code += 'async def callback_query_logging_middleware(handler, event: types.CallbackQuery, data: dict):\n';
    code += '    """Middleware для автоматического сохранения нажатий на кнопки"""\n';
    code += '    try:\n';
    code += '        user_id = str(event.from_user.id)\n';
    code += '        callback_data = event.data or ""\n';
    code += '        \n';
    code += '        # Пытаемся найти текст кнопки из сообщения\n';
    code += '        button_text = None\n';
    code += '        if event.message and hasattr(event.message, "reply_markup"):\n';
    code += '            reply_markup = event.message.reply_markup\n';
    code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
    code += '                for row in reply_markup.inline_keyboard:\n';
    code += '                    for btn in row:\n';
    code += '                        if hasattr(btn, "callback_data") and btn.callback_data == callback_data:\n';
    code += '                            button_text = btn.text\n';
    code += '                            break\n';
    code += '                    if button_text:\n';
    code += '                        break\n';
    code += '        \n';
    code += '        # Сохраняем информацию о нажатии кнопки\n';
    code += '        message_text_to_save = f"[Нажата кнопка: {button_text}]" if button_text else "[Нажата кнопка]"\n';
    code += '        await save_message_to_api(\n';
    code += '            user_id=user_id,\n';
    code += '            message_type="user",\n';
    code += '            message_text=message_text_to_save,\n';
    code += '            message_data={\n';
    code += '                "button_clicked": True,\n';
    code += '                "button_text": button_text,\n';
    code += '                "callback_data": callback_data\n';
    code += '            }\n';
    code += '        )\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка в middleware сохранения нажатий кнопок: {e}")\n';
    code += '    \n';
    code += '    # Продолжаем обработку callback query\n';
    code += '    return await handler(event, data)\n\n';
  }
  
  code += '# Обертка для сохранения исходящих сообщений\n';
  code += 'original_send_message = bot.send_message\n';
  code += 'async def send_message_with_logging(chat_id, text, *args, node_id=None, **kwargs):\n';
  code += '    """Обертка для bot.send_message с автоматическим сохранением"""\n';
  code += '    result = await original_send_message(chat_id, text, *args, **kwargs)\n';
  code += '    \n';
  code += '    # Извлекаем информацию о кнопках из reply_markup\n';
  code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
  code += '    if "reply_markup" in kwargs:\n';
  code += '        try:\n';
  code += '            reply_markup = kwargs["reply_markup"]\n';
  code += '            buttons_data = []\n';
  code += '            # Обработка inline клавиатуры\n';
  code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
  code += '                for row in reply_markup.inline_keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "url") and btn.url:\n';
  code += '                            button_info["url"] = btn.url\n';
  code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
  code += '                            button_info["callback_data"] = btn.callback_data\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "inline"\n';
  code += '            # Обработка reply клавиатуры\n';
  code += '            elif hasattr(reply_markup, "keyboard"):\n';
  code += '                for row in reply_markup.keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "request_contact") and btn.request_contact:\n';
  code += '                            button_info["request_contact"] = True\n';
  code += '                        if hasattr(btn, "request_location") and btn.request_location:\n';
  code += '                            button_info["request_location"] = True\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "reply"\n';
  code += '        except Exception as e:\n';
  code += '            logging.warning(f"Не удалось извлечь кнопки: {e}")\n';
  code += '    \n';
  code += '    # Сохраняем синхронно для гарантии доставки\n';
  code += '    await save_message_to_api(\n';
  code += '        user_id=str(chat_id),\n';
  code += '        message_type="bot",\n';
  code += '        message_text=text,\n';
  code += '        node_id=node_id,\n';
  code += '        message_data=message_data_obj\n';
  code += '    )\n';
  code += '    return result\n\n';
  code += 'bot.send_message = send_message_with_logging\n\n';
  
  code += '# Обертка для message.answer с сохранением\n';
  code += 'original_answer = types.Message.answer\n';
  code += 'async def answer_with_logging(self, text, *args, node_id=None, **kwargs):\n';
  code += '    """Обертка для message.answer с автоматическим сохранением"""\n';
  code += '    result = await original_answer(self, text, *args, **kwargs)\n';
  code += '    \n';
  code += '    # Извлекаем информацию о кнопках из reply_markup\n';
  code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
  code += '    if "reply_markup" in kwargs:\n';
  code += '        try:\n';
  code += '            reply_markup = kwargs["reply_markup"]\n';
  code += '            buttons_data = []\n';
  code += '            # Обработка inline клавиатуры\n';
  code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
  code += '                for row in reply_markup.inline_keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "url") and btn.url:\n';
  code += '                            button_info["url"] = btn.url\n';
  code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
  code += '                            button_info["callback_data"] = btn.callback_data\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "inline"\n';
  code += '            # Обработка reply клавиатуры\n';
  code += '            elif hasattr(reply_markup, "keyboard"):\n';
  code += '                for row in reply_markup.keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "request_contact") and btn.request_contact:\n';
  code += '                            button_info["request_contact"] = True\n';
  code += '                        if hasattr(btn, "request_location") and btn.request_location:\n';
  code += '                            button_info["request_location"] = True\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "reply"\n';
  code += '        except Exception as e:\n';
  code += '            logging.warning(f"Не удалось извлечь кнопки: {e}")\n';
  code += '    \n';
  code += '    # Сохраняем синхронно для гарантии доставки\n';
  code += '    await save_message_to_api(\n';
  code += '        user_id=str(self.chat.id),\n';
  code += '        message_type="bot",\n';
  code += '        message_text=text if isinstance(text, str) else str(text),\n';
  code += '        node_id=node_id,\n';
  code += '        message_data=message_data_obj\n';
  code += '    )\n';
  code += '    return result\n\n';
  code += 'types.Message.answer = answer_with_logging\n\n';
  
  code += '# Обертка для bot.send_photo с сохранением\n';
  code += 'original_send_photo = bot.send_photo\n';
  code += 'async def send_photo_with_logging(chat_id, photo, *args, caption=None, node_id=None, **kwargs):\n';
  code += '    """Обертка для bot.send_photo с автоматическим сохранением"""\n';
  code += '    result = await original_send_photo(chat_id, photo, *args, caption=caption, **kwargs)\n';
  code += '    \n';
  code += '    # Создаем message_data с информацией о фото\n';
  code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
  code += '    \n';
  code += '    # Сохраняем информацию о фото\n';
  code += '    if result and hasattr(result, "photo") and result.photo:\n';
  code += '        largest_photo = result.photo[-1]\n';
  code += '        message_data_obj["photo"] = {\n';
  code += '            "file_id": largest_photo.file_id,\n';
  code += '            "file_unique_id": largest_photo.file_unique_id,\n';
  code += '            "width": largest_photo.width,\n';
  code += '            "height": largest_photo.height\n';
  code += '        }\n';
  code += '    # Если photo это строка (URL), сохраняем URL\n';
  code += '    elif isinstance(photo, str):\n';
  code += '        message_data_obj["photo_url"] = photo\n';
  code += '    \n';
  code += '    # Извлекаем информацию о кнопках из reply_markup\n';
  code += '    if "reply_markup" in kwargs:\n';
  code += '        try:\n';
  code += '            reply_markup = kwargs["reply_markup"]\n';
  code += '            buttons_data = []\n';
  code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
  code += '                for row in reply_markup.inline_keyboard:\n';
  code += '                    for btn in row:\n';
  code += '                        button_info = {"text": btn.text}\n';
  code += '                        if hasattr(btn, "url") and btn.url:\n';
  code += '                            button_info["url"] = btn.url\n';
  code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
  code += '                            button_info["callback_data"] = btn.callback_data\n';
  code += '                        buttons_data.append(button_info)\n';
  code += '                if buttons_data:\n';
  code += '                    message_data_obj["buttons"] = buttons_data\n';
  code += '                    message_data_obj["keyboard_type"] = "inline"\n';
  code += '        except Exception as e:\n';
  code += '            logging.warning(f"Не удалось извлечь кнопки из send_photo: {e}")\n';
  code += '    \n';
  code += '    # Сохраняем сообщение в базу данных\n';
  code += '    saved_message = await save_message_to_api(\n';
  code += '        user_id=str(chat_id),\n';
  code += '        message_type="bot",\n';
  code += '        message_text=caption or "[Фото]",\n';
  code += '        node_id=node_id,\n';
  code += '        message_data=message_data_obj\n';
  code += '    )\n';
  code += '    \n';
  code += '    # Если фото отправлено от бота с file_id, регистрируем медиа\n';
  code += '    if result and hasattr(result, "photo") and result.photo and saved_message and "id" in saved_message:\n';
  code += '        try:\n';
  code += '            largest_photo = result.photo[-1]\n';
  code += '            if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):\n';
  code += '                media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '            else:\n';
  code += '                media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
  code += '            \n';
  code += '            media_payload = {\n';
  code += '                "messageId": saved_message["id"],\n';
  code += '                "fileId": largest_photo.file_id,\n';
  code += '                "botToken": BOT_TOKEN,\n';
  code += '                "mediaType": "photo"\n';
  code += '            }\n';
  code += '            \n';
  code += '            async with aiohttp.ClientSession() as session:\n';
  code += '                async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:\n';
  code += '                    if response.status == 200:\n';
  code += '                        bot_message_id = saved_message.get("id")\n';
  code += '                        logging.info(f"✅ Медиа бота зарегистрировано для сообщения {bot_message_id}")\n';
  code += '                    else:\n';
  code += '                        error_text = await response.text()\n';
  code += '                        logging.warning(f"⚠️ Не удалось зарегистрировать медиа бота: {response.status} - {error_text}")\n';
  code += '        except Exception as media_error:\n';
  code += '            logging.warning(f"Ошибка при регистрации медиа бота: {media_error}")\n';
  code += '    \n';
  code += '    return result\n\n';
  code += 'bot.send_photo = send_photo_with_logging\n\n';
  }  // Закрываем if (userDatabaseEnabled) для блока логирования
  
  // Добавляем конфигурацию групп
  if (groups && groups.length > 0) {
    code += '# Подключенные группы\n';
    code += 'CONNECTED_GROUPS = {\n';
    groups.forEach((group, index) => {
      const groupId = group.groupId || 'None';
      const isLast = index === groups.length - 1;
      code += `    "${group.name}": {\n`;
      code += `        "id": ${groupId === 'None' ? 'None' : `"${groupId}"`},\n`;
      code += `        "url": "${group.url}",\n`;
      code += `        "is_admin": ${group.isAdmin ? 'True' : 'False'},\n`;
      code += `        "chat_type": "${group.chatType || 'group'}",\n`;
      if (group.adminRights) {
        code += `        "admin_rights": ${JSON.stringify(group.adminRights, null, 12).replace(/"/g, "'")},\n`;
      }
      code += `        "description": "${group.description || ''}"\n`;
      code += `    }${isLast ? '' : ','}\n`;
    });
    code += '}\n\n';
  }
  
  // user_data всегда нужен для временного хранения состояний даже при включенной БД
  // ИСПРАВЛЕНИЕ: Создаем user_data всегда, так как он используется в callback handlers
  code += '# Хранилище пользователей (временное состояние)\n';
  code += 'user_data = {}\n\n';

  // Добавляем функции для работы с базой данных только если БД включена
  if (userDatabaseEnabled) {
    code += '# Настройки базы данных\n';
    code += 'DATABASE_URL = os.getenv("DATABASE_URL")\n\n';
    
    code += '# Пул соединений с базой данных\n';
    code += 'db_pool = None\n\n';

    code += '\n# Функции для работы с базой данных\n';
    code += 'async def init_database():\n';
  code += '    """Инициализация подключения к базе данных и создание таблиц"""\n';
  code += '    global db_pool\n';
  code += '    try:\n';
  code += '        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)\n';
  code += '        # Создаем таблицу пользователей если её нет\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            await conn.execute("""\n';
  code += '                CREATE TABLE IF NOT EXISTS bot_users (\n';
  code += '                    user_id BIGINT PRIMARY KEY,\n';
  code += '                    username TEXT,\n';
  code += '                    first_name TEXT,\n';
  code += '                    last_name TEXT,\n';
  code += '                    registered_at TIMESTAMP DEFAULT NOW(),\n';
  code += '                    last_interaction TIMESTAMP DEFAULT NOW(),\n';
  code += '                    interaction_count INTEGER DEFAULT 0,\n';
  code += '                    user_data JSONB DEFAULT \'{}\',\n';
  code += '                    is_active BOOLEAN DEFAULT TRUE\n';
  code += '                );\n';
  code += '            """)\n';
  code += '            # Создаем таблицу сообщений если её нет\n';
  code += '            await conn.execute("""\n';
  code += '                CREATE TABLE IF NOT EXISTS bot_messages (\n';
  code += '                    id SERIAL PRIMARY KEY,\n';
  code += '                    project_id INTEGER,\n';
  code += '                    user_id TEXT NOT NULL,\n';
  code += '                    message_type TEXT NOT NULL,\n';
  code += '                    message_text TEXT,\n';
  code += '                    message_data JSONB,\n';
  code += '                    node_id TEXT,\n';
  code += '                    created_at TIMESTAMP DEFAULT NOW()\n';
  code += '                );\n';
  code += '            """)\n';
  code += '        logging.info("✅ База данных инициализирована")\n';
  code += '    except Exception as e:\n';
  code += '        logging.warning(f"⚠️ Не удалось подключиться к БД: {e}. Используем локальное хранилище.")\n';
  code += '        db_pool = None\n\n';

  // Добавляем функцию для получения московского времени
  code += 'def get_moscow_time():\n';
  code += '    """Возвращает текущее время в московском часовом поясе"""\n';
  code += '    from datetime import datetime, timezone, timedelta\n';
  code += '    moscow_tz = timezone(timedelta(hours=3))\n';
  code += '    return datetime.now(moscow_tz).isoformat()\n\n';

  code += 'async def save_user_to_db(user_id: int, username: Optional[str] = None, first_name: Optional[str] = None, last_name: Optional[str] = None):\n';
  code += '    """Сохраняет пользователя в базу данных"""\n';
  code += '    if not db_pool:\n';
  code += '        return False\n';
  code += '    try:\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            await conn.execute("""\n';
  code += '                INSERT INTO bot_users (user_id, username, first_name, last_name)\n';
  code += '                VALUES ($1, $2, $3, $4)\n';
  code += '                ON CONFLICT (user_id) DO UPDATE SET\n';
  code += '                    username = EXCLUDED.username,\n';
  code += '                    first_name = EXCLUDED.first_name,\n';
  code += '                    last_name = EXCLUDED.last_name,\n';
  code += '                    last_interaction = NOW(),\n';
  code += '                    interaction_count = bot_users.interaction_count + 1\n';
  code += '            """, user_id, username, first_name, last_name)\n';
  code += '        return True\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка сохранения пользователя в БД: {e}")\n';
  code += '        return False\n\n';

  code += 'async def get_user_from_db(user_id: int):\n';
  code += '    """Получает данные пользователя из базы данных"""\n';
  code += '    if not db_pool:\n';
  code += '        return None\n';
  code += '    try:\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            row = await conn.fetchrow("SELECT * FROM bot_users WHERE user_id = $1", user_id)\n';
  code += '            if row:\n';
  code += '                # Преобразуем Record в словарь\n';
  code += '                row_dict = {key: row[key] for key in row.keys()}\n';
  code += '                # Если есть user_data, возвращаем его содержимое\n';
  code += '                if "user_data" in row_dict and row_dict["user_data"]:\n';
  code += '                    user_data = row_dict["user_data"]\n';
  code += '                    if isinstance(user_data, str):\n';
  code += '                        try:\n';
  code += '                            import json\n';
  code += '                            return json.loads(user_data)\n';
  code += '                        except (json.JSONDecodeError, TypeError):\n';
  code += '                            return {}\n';
  code += '                    elif isinstance(user_data, dict):\n';
  code += '                        return user_data\n';
  code += '                    else:\n';
  code += '                        return {}\n';
  code += '                # Если нет user_data, возвращаем полную запись\n';
  code += '                return row_dict\n';
  code += '        return None\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка получения пользователя из БД: {e}")\n';
  code += '        return None\n\n';

  // Добавляем функции handle_command_ как алиасы для handlers
  code += '# Алиас функции для callback обработчиков\n';
  code += 'async def handle_command_start(message):\n';
  code += '    """Алиас для start_handler, используется в callback обработчиках"""\n';
  code += '    await start_handler(message)\n\n';
  
  // Добавляем алиасы для всех команд
  const commandAliasNodes = (nodes || []).filter(node => node.type === 'command' && node.data.command);
  commandAliasNodes.forEach(node => {
    const command = node.data.command.replace('/', '');
    const functionName = command.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `async def handle_command_${functionName}(message):\n`;
    code += `    """Алиас для ${functionName}_handler, используется в callback обработчиках"""\n`;
    code += `    await ${functionName}_handler(message)\n\n`;
  });

  code += 'async def update_user_data_in_db(user_id: int, data_key: str, data_value):\n';
  code += '    """Обновляет пользовательские данные в базе данных"""\n';
  code += '    if not db_pool:\n';
  code += '        return False\n';
  code += '    try:\n';
  code += '        import json\n';
  code += '        async with db_pool.acquire() as conn:\n';
  code += '            # Сначала создаём или получаем существующую запись\n';
  code += '            await conn.execute("""\n';
  code += '                INSERT INTO bot_users (user_id) \n';
  code += '                VALUES ($1) \n';
  code += '                ON CONFLICT (user_id) DO NOTHING\n';
  code += '            """, user_id)\n';
  code += '            \n';
  code += '            # Обновляем данные пользователя\n';
  code += '            update_data = {data_key: data_value}\n';
  code += '            await conn.execute("""\n';
  code += '                UPDATE bot_users \n';
  code += '                SET user_data = COALESCE(user_data, \'{}\'::jsonb) || $2::jsonb,\n';
  code += '                    last_interaction = NOW()\n';
  code += '                WHERE user_id = $1\n';
  code += '            """, user_id, json.dumps(update_data))\n';
  code += '        return True\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка обновления данных пользователя: {e}")\n';
  code += '        return False\n\n';

  // Добавляем алиас функции для обратной совместимости
  code += 'async def save_user_data_to_db(user_id: int, data_key: str, data_value):\n';
  code += '    """Алиас для update_user_data_in_db для обратной совместимости"""\n';
  code += '    return await update_user_data_in_db(user_id, data_key, data_value)\n\n';

    code += 'async def update_user_variable_in_db(user_id: int, variable_name: str, variable_value: str):\n';
    code += '    """Сохраняет переменную пользователя в базу данных"""\n';
    code += '    if not db_pool:\n';
    code += '        return False\n';
    code += '    try:\n';
    code += '        import json\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            # Сначала создаём или получаем существующую запись\n';
    code += '            await conn.execute("""\n';
    code += '                INSERT INTO bot_users (user_id) \n';
    code += '                VALUES ($1) \n';
    code += '                ON CONFLICT (user_id) DO NOTHING\n';
    code += '            """, user_id)\n';
    code += '            \n';
    code += '            # Обновляем переменную пользователя\n';
    code += '            update_data = {variable_name: variable_value}\n';
    code += '            await conn.execute("""\n';
    code += '                UPDATE bot_users \n';
    code += '                SET user_data = COALESCE(user_data, \'{}\'::jsonb) || $2::jsonb,\n';
    code += '                    last_interaction = NOW()\n';
    code += '                WHERE user_id = $1\n';
    code += '            """, user_id, json.dumps(update_data))\n';
    code += '        return True\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка сохранения переменной пользователя: {e}")\n';
    code += '        return False\n\n';

    code += 'async def log_message(user_id: int, message_type: str, message_text: str = None, message_data: dict = None, node_id: str = None):\n';
    code += '    """Логирует сообщение в базу данных"""\n';
    code += '    if not db_pool:\n';
    code += '        return False\n';
    code += '    try:\n';
    code += '        import json\n';
    code += '        async with db_pool.acquire() as conn:\n';
    code += '            await conn.execute("""\n';
    code += '                INSERT INTO bot_messages (user_id, message_type, message_text, message_data, node_id)\n';
    code += '                VALUES ($1, $2, $3, $4, $5)\n';
    code += '            """, str(user_id), message_type, message_text, json.dumps(message_data) if message_data else None, node_id)\n';
    code += '        return True\n';
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка логирования сообщения: {e}")\n';
    code += '        return False\n\n';
  }

  // Добавляем утилитарные функции
  code += '\n# Утилитарные функции\n';
  code += 'async def is_admin(user_id: int) -> bool:\n';
  code += '    return user_id in ADMIN_IDS\n\n';
  
  code += 'async def is_private_chat(message: types.Message) -> bool:\n';
  code += '    return message.chat.type == "private"\n\n';
  
  if (userDatabaseEnabled) {
    code += 'async def check_auth(user_id: int) -> bool:\n';
    code += '    # Проверяем наличие пользователя в БД или локальном хранилище\n';
    code += '    if db_pool:\n';
    code += '        user = await get_user_from_db(user_id)\n';
    code += '        return user is not None\n';
    code += '    return user_id in user_data\n\n';
  } else {
    // Простая версия без БД - проверяем только локальное хранилище
    code += 'async def check_auth(user_id: int) -> bool:\n';
    code += '    return user_id in user_data\n\n';
  }
  
  // Функции для работы с файлами - только если есть медиа
  if (hasMediaNodes(nodes || [])) {
    code += 'def is_local_file(url: str) -> bool:\n';
    code += '    """Проверяет, является ли URL локальным загруженным файлом"""\n';
    code += '    return url.startswith("/uploads/") or url.startswith("uploads/")\n\n';
    
    code += 'def get_local_file_path(url: str) -> str:\n';
    code += '    """Получает локальный путь к файлу из URL"""\n';
    code += '    if url.startswith("/"):\n';
    code += '        return url[1:]  # Убираем ведущий слеш\n';
    code += '    return url\n\n';
  }

  // Добавляем функции для работы с картографическими сервисами только если есть геолокационные элементы
  if (hasLocationFeatures(nodes || [])) {
    code += 'def extract_coordinates_from_yandex(url: str) -> tuple:\n';
    code += '    """Извлекает координаты из ссылки Яндекс.Карт"""\n';
    code += '    import re\n';
    code += '    # Ищем координаты в формате ll=longitude,latitude\n';
    code += '    match = re.search(r"ll=([\\d.-]+),([\\d.-]+)", url)\n';
    code += '    if match:\n';
    code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
    code += '    # Ищем координаты в формате /longitude,latitude/\n';
    code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
    code += '    if match:\n';
    code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
    code += '    return None, None\n\n';

    code += 'def extract_coordinates_from_google(url: str) -> tuple:\n';
    code += '    """Извлекает координаты из ссылки Google Maps"""\n';
    code += '    import re\n';
    code += '    # Ищем координаты в формате @latitude,longitude\n';
    code += '    match = re.search(r"@([\\d.-]+),([\\d.-]+)", url)\n';
    code += '    if match:\n';
    code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
    code += '    # Ищем координаты в формате /latitude,longitude/\n';
    code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
    code += '    if match:\n';
    code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
    code += '    return None, None\n\n';

    code += 'def extract_coordinates_from_2gis(url: str) -> tuple:\n';
    code += '    """Извлекает координаты из ссылки 2ГИС"""\n';
    code += '    import re\n';
    code += '    # Ищем координаты в различных форматах 2ГИС\n';
    code += '    # Формат: center/longitude,latitude\n';
    code += '    match = re.search(r"center/([\\d.-]+),([\\d.-]+)", url)\n';
    code += '    if match:\n';
    code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
    code += '    # Формат: /longitude,latitude/\n';
    code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
    code += '    if match:\n';
    code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
    code += '    return None, None\n\n';

    code += 'def generate_map_urls(latitude: float, longitude: float, title: str = "") -> dict:\n';
    code += '    """Генерирует ссылки на различные картографические сервисы"""\n';
    code += '    import urllib.parse\n';
    code += '    \n';
    code += '    encoded_title = urllib.parse.quote(title) if title else ""\n';
    code += '    \n';
    code += '    return {\n';
    code += '        "yandex": f"https://yandex.ru/maps/?ll={longitude},{latitude}&z=15&l=map&pt={longitude},{latitude}",\n';
    code += '        "google": f"https://maps.google.com/?q={latitude},{longitude}",\n';
    code += '        "2gis": f"https://2gis.ru/geo/{longitude},{latitude}",\n';
    code += '        "openstreetmap": f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}&zoom=15"\n';
    code += '    }\n\n';
  }

  // Настройка меню команд для BotFather
  const menuCommands = (nodes || []).filter(node => 
    (node.type === 'start' || node.type === 'command') && 
    node.data.showInMenu && 
    node.data.command
  );

  if (menuCommands.length > 0) {
    code += '\n# Настройка меню команд\n';
    code += 'async def set_bot_commands():\n';
    code += '    commands = [\n';
    
    menuCommands.forEach(node => {
      const command = node.data.command?.replace('/', '') || '';
      const description = node.data.description || 'Команда бота';
      code += `        BotCommand(command="${command}", description="${description}"),\n`;
    });
    
    code += '    ]\n';
    code += '    await bot.set_my_commands(commands)\n\n';
  }

  // Generate handlers for each node
  (nodes || []).forEach((node: Node) => {
    // Добавляем маркер начала узла для отслеживания позиции в коде
    code += `\n# @@NODE_START:${node.id}@@\n`;
    
    if (node.type === "start") {
      code += generateStartHandler(node, userDatabaseEnabled);
    } else if (node.type === "command") {
      code += generateCommandHandler(node, userDatabaseEnabled);
    } else if (node.type === "photo") {
      code += generatePhotoHandler(node);
    } else if (node.type === "video") {
      code += generateVideoHandler(node);
    } else if (node.type === "audio") {
      code += generateAudioHandler(node);
    } else if (node.type === "document") {
      code += generateDocumentHandler(node);
    } else if (node.type === "sticker") {
      code += generateStickerHandler(node);
    } else if (node.type === "voice") {
      code += generateVoiceHandler(node);
    } else if (node.type === "animation") {
      code += generateAnimationHandler(node);
    } else if (node.type === "location") {
      code += generateLocationHandler(node);
    } else if (node.type === "contact") {
      code += generateContactHandler(node);
    } else if (node.type === "pin_message") {
      code += generatePinMessageHandler(node);
    } else if (node.type === "unpin_message") {
      code += generateUnpinMessageHandler(node);
    } else if (node.type === "delete_message") {
      code += generateDeleteMessageHandler(node);
    } else if (node.type === "ban_user") {
      code += generateBanUserHandler(node);
    } else if (node.type === "unban_user") {
      code += generateUnbanUserHandler(node);
    } else if (node.type === "mute_user") {
      code += generateMuteUserHandler(node);
    } else if (node.type === "unmute_user") {
      code += generateUnmuteUserHandler(node);
    } else if (node.type === "kick_user") {
      code += generateKickUserHandler(node);
    } else if (node.type === "promote_user") {
      code += generatePromoteUserHandler(node);
    } else if (node.type === "demote_user") {
      code += generateDemoteUserHandler(node);
    } else if (node.type === "admin_rights") {
      code += generateAdminRightsHandler(node);
    }
    // Note: user-input and message nodes are handled via callback handlers, not as separate command handlers
    
    // Добавляем маркер конца узла
    code += `# @@NODE_END:${node.id}@@\n`;
  });

  // Generate synonym handlers for all nodes
  const nodesWithSynonyms = (nodes || []).filter(node => 
    node.data.synonyms && 
    node.data.synonyms.length > 0
  );

  if (nodesWithSynonyms.length > 0) {
    code += '\n# Обработчики синонимов\n';
    nodesWithSynonyms.forEach(node => {
      if (node.data.synonyms) {
        node.data.synonyms.forEach((synonym: string) => {
          // Добавляем маркер для синонимов того же узла
          code += `# @@NODE_START:${node.id}@@\n`;
          
          if (node.type === 'start' || node.type === 'command') {
            code += generateSynonymHandler(node, synonym);
          } else if (node.type === 'ban_user' || node.type === 'unban_user' || node.type === 'mute_user' || node.type === 'unmute_user' || 
                     node.type === 'kick_user' || node.type === 'promote_user' || node.type === 'demote_user' || node.type === 'admin_rights') {
            code += generateUserManagementSynonymHandler(node, synonym);
          } else {
            code += generateMessageSynonymHandler(node, synonym);
          }
          
          code += `# @@NODE_END:${node.id}@@\n`;
        });
      }
    });
  }

  // Generate callback handlers for inline buttons AND input target nodes
  const inlineNodes = (nodes || []).filter(node => 
    node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
  );

  // Also collect all target nodes from user input collections
  const inputTargetNodeIds = new Set<string>();
  (nodes || []).forEach(node => {
    if (node.data.inputTargetNodeId) {
      inputTargetNodeIds.add(node.data.inputTargetNodeId);
    }
  });

  // Collect all referenced node IDs and conditional message buttons
  const allReferencedNodeIds = new Set<string>();
  const allConditionalButtons = new Set<string>();
  
  // Add nodes from inline buttons
  inlineNodes.forEach(node => {
    node.data.buttons.forEach(button => {
      if (button.action === 'goto' && button.target) {
        allReferencedNodeIds.add(button.target);
      }
    });
    
    // Also add continueButtonTarget for multi-select nodes
    if (node.data.continueButtonTarget) {
      allReferencedNodeIds.add(node.data.continueButtonTarget);
    }
  });
  
  // Collect buttons from conditional messages
  (nodes || []).forEach(node => {
    if (node.data.conditionalMessages) {
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: Button) => {
            if (button.action === 'goto' && button.target) {
              allConditionalButtons.add(button.target);
            }
          });
        }
      });
    }
  });
  
  // Add input target nodes
  inputTargetNodeIds.forEach(nodeId => {
    allReferencedNodeIds.add(nodeId);
  });

  // Add all connection targets to ensure every connected node gets a handler
  console.log(`🔗 ГЕНЕРАТОР: Обрабатываем ${connections.length} соединений`);
  connections.forEach((connection, index) => {
    console.log(`🔗 ГЕНЕРАТОР: Соединение ${index}: source=${connection.source} -> target=${connection.target}`);
    if (connection.target) {
      allReferencedNodeIds.add(connection.target);
      console.log(`✅ ГЕНЕРАТОР: Добавлен target ${connection.target} в allReferencedNodeIds`);
    }
  });
  console.log(`🎯 ГЕНЕРАТОР: Финальный allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);

  // Генерируем обработчики только если есть inline кнопки или условные кнопки
  if (inlineNodes.length > 0 || allReferencedNodeIds.size > 0 || allConditionalButtons.size > 0) {
    // Комментарий "Обработчики inline кнопок" только если действительно есть inline кнопки
    if (inlineNodes.length > 0 || allConditionalButtons.size > 0) {
      code += '\n# Обработчики inline кнопок\n';
    } else {
      // Для автопереходов используем специальный комментарий
      code += '\n# Обработчики автопереходов\n';
    }
    const processedCallbacks = new Set<string>();
    
    // Skip conditional placeholder handlers - they conflict with main handlers
    // Main callback handlers below will handle all button interactions properly
    
    // Then, handle inline button nodes - create handlers for each unique button ID
    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.id) {
          const callbackData = button.id; // Use button ID as callback_data
          
          // Avoid duplicate handlers for button IDs (not target IDs)
          if (processedCallbacks.has(callbackData)) return;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Избегаем дублированных обработчиков для target узлов
          if (button.target && processedCallbacks.has(button.target)) {
            console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
            return;
          }
          
          // Find target node (может быть null если нет target)
          const targetNode = button.target ? nodes.find(n => n.id === button.target) : null;
          
          // Создаем обработчик для каждой кнопки используя target как callback_data
          const actualCallbackData = button.target || callbackData;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем target узел перед созданием обработчика
          if (button.target && processedCallbacks.has(button.target)) {
            console.log(`🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: ПРОПУСКАЕМ дублирующий обработчик для target ${button.target} - уже создан`);
            return;
          }
          
          // Mark this button ID as processed
          processedCallbacks.add(callbackData);
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем target в processedCallbacks СРАЗУ, чтобы избежать дублирования
          if (button.target) {
            processedCallbacks.add(button.target);
            console.log(`🔧 ГЕНЕРАТОР: Узел ${button.target} добавлен в processedCallbacks ДО создания обработчика`);
          }
          
          // ОТЛАДКА: Проверяем если это interests_result или metro_selection
          if (button.target === 'interests_result') {
            console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для interests_result в основном цикле');
            console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
          }
          if (button.target === 'metro_selection') {
            console.log('🔧 ГЕНЕРАТОР DEBUG: Создаем ПЕРВЫЙ обработчик для metro_selection в основном цикле');
            console.log('🔧 ГЕНЕРАТОР DEBUG: processedCallbacks до добавления:', Array.from(processedCallbacks));
          }
          
          // Если целевой узел имеет множественный выбор, добавляем обработку кнопки "done_"
          const isDoneHandlerNeeded = targetNode && targetNode.data.allowMultipleSelection && targetNode.data.continueButtonTarget;
          const shortNodeIdForDone = isDoneHandlerNeeded ? actualCallbackData.slice(-10).replace(/^_+/, '') : '';
          
          // ЛОГИРОВАНИЕ: Отслеживаем создание обработчиков для interests_result
          if (actualCallbackData === 'interests_result') {
            console.log('🚨 ГЕНЕРАТОР ОСНОВНОЙ ЦИКЛ: Создаем обработчик для interests_result!');
            console.log('🚨 ГЕНЕРАТОР: Текущие processedCallbacks:', Array.from(processedCallbacks));
          }
          
          if (isDoneHandlerNeeded) {
            code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_") or c.data == "multi_select_done_${shortNodeIdForDone}")\n`;
            console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавлен обработчик кнопки "multi_select_done_${shortNodeIdForDone}" для узла ${actualCallbackData}`);
          } else {
            code += `\n@dp.callback_query(lambda c: c.data == "${actualCallbackData}" or c.data.startswith("${actualCallbackData}_btn_"))\n`;
          }
          // Создаем безопасное имя функции на основе target или button ID
          const safeFunctionName = actualCallbackData.replace(/[^a-zA-Z0-9_]/g, '_');
          
          if (actualCallbackData === 'interests_result') {
            console.log('🚨 ГЕНЕРАТОР: Создаем функцию handle_callback_interests_result в ОСНОВНОМ ЦИКЛЕ');
          }
          
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    try:\n';
          code += '        await callback_query.answer()\n';
          code += '    except Exception:\n';
          code += '        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    callback_data = callback_query.data\n';
          code += `    logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
          code += '    \n';
          
          // Добавляем обработку кнопки "done_" для множественного выбора
          if (isDoneHandlerNeeded) {
            code += '    # Проверяем, является ли это кнопкой "Готово" для множественного выбора\n';
            code += `    if callback_data == "multi_select_done_${shortNodeIdForDone}":\n`;
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
            
            // Переход к следующему узлу
            if (targetNode.data.continueButtonTarget) {
              const nextNodeId = targetNode.data.continueButtonTarget;
              
              // КРИТИЧЕСКАЯ ОТЛАДКА
              console.log(`🚨 ГЕНЕРАТОР CONTINUEBUTTON DEBUG:`);
              console.log(`🚨 ГЕНЕРАТОР: targetNode.id = "${targetNode.id}"`);
              console.log(`🚨 ГЕНЕРАТОР: targetNode.data.continueButtonTarget = "${targetNode.data.continueButtonTarget}"`);
              console.log(`🚨 ГЕНЕРАТОР: nextNodeId = "${nextNodeId}"`);
              console.log(`🚨 ГЕНЕРАТОР: actualCallbackData = "${actualCallbackData}"`);
              
              code += '        # Переход к следующему узлу\n';
              code += `        next_node_id = "${nextNodeId}"\n`;
              code += `        logging.info(f"🚀 DEBUG: targetNode.id=${targetNode.id}, continueButtonTarget=${targetNode.data.continueButtonTarget}, nextNodeId=${nextNodeId}")\n`;
              
              // ИСПРАВЛЕНИЕ: Специальная логика для metro_selection -> interests_result
              console.log(`🔧 ГЕНЕРАТОР: Проверяем metro_selection -> interests_result: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
              if (targetNode.id.includes('metro_selection') && nextNodeId === 'interests_result') {
                console.log(`🔧 ГЕНЕРАТОР: ✅ Применяем специальную логику metro_selection -> interests_result`);
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
                console.log(`🔧 ГЕНЕРАТОР: ❌ Не применяем специальную логику: targetNode.id="${targetNode.id}", nextNodeId="${nextNodeId}"`);
              }
              
              code += '        try:\n';
              code += `            await handle_callback_${nextNodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query)\n`;
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
          
          // Специальная обработка для кнопок "Изменить выбор" и "Начать заново"
          // Эти кнопки должны обрабатываться как обычные goto кнопки к start узлу
          
          // Правильная логика сохранения переменной на основе кнопки
          code += `    button_text = "${button.text}"\n`;
          code += '    \n';
          
          // Определяем переменную для сохранения на основе родительского узла
          const parentNode = node; // Используем текущий узел как родительский
          
          // Проверяем настройку skipDataCollection для кнопки
          const shouldSkipDataCollection = button.skipDataCollection === true;
          
          if (!shouldSkipDataCollection) {
            if (parentNode && parentNode.data.inputVariable) {
              const variableName = parentNode.data.inputVariable;
              
              // Используем текст кнопки как значение переменной
              const variableValue = 'button_text';
              
              code += '    # Сохраняем правильную переменную в базу данных\n';
              code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
              code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
              code += '    \n';
              
              // КРИТИЧЕСКИ ВАЖНО: Очищаем состояние ожидания после сохранения переменной
              code += '    # Очищаем состояние ожидания ввода для этой переменной\n';
              code += '    if user_id in user_data:\n';
              code += '        # Удаляем waiting_for_input чтобы текстовый обработчик не перезаписал данные\n';
              code += '        if "waiting_for_input" in user_data[user_id]:\n';
              code += `            if user_data[user_id]["waiting_for_input"] == "${parentNode.id}":\n`;
              code += '                del user_data[user_id]["waiting_for_input"]\n';
              code += `                logging.info(f"Состояние ожидания ввода очищено для переменной ${variableName} (пользователь {user_id})")\n`;
              code += '    \n';
            } else {
              // Fallback: сохраняем кнопку как есть
              code += '    # Сохраняем кнопку в базу данных\n';
              code += '    timestamp = get_moscow_time()\n';
              code += '    response_data = button_text  # Простое значение\n';
              code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
              code += '    logging.info(f"Кнопка сохранена: {button_text} (пользователь {user_id})")\n';
            }
          } else {
            code += '    # Кнопка настроена для пропуска сбора данных (skipDataCollection=true)\n';
            code += `    logging.info(f"Кнопка пропущена: {button_text} (не сохраняется из-за skipDataCollection)")\n`;
          }
          code += '    \n';
          
          if (targetNode) {
            
            // Handle message nodes with variable saving action
            if (targetNode.type === 'message' && targetNode.data.action === 'save_variable') {
              const action = targetNode.data.action || 'none';
              const variableName = targetNode.data.variableName || '';
              const variableValue = targetNode.data.variableValue || '';
              const successMessage = targetNode.data.successMessage || 'Успешно сохранено!';
              
              if (action === 'save_variable' && variableName && variableValue) {
                code += `    # Сохраняем переменную "${variableName}" = "${variableValue}"\n`;
                code += `    user_data[user_id]["${variableName}"] = "${variableValue}"\n`;
                code += `    await update_user_variable_in_db(user_id, "${variableName}", "${variableValue}")\n`;
                code += `    logging.info(f"Переменная сохранена: ${variableName} = ${variableValue} (пользователь {user_id})")\n`;
                code += '    \n';
                
                if (successMessage.includes('\n')) {
                  code += `    success_text = """${successMessage}"""\n`;
                } else {
                  const escapedMessage = successMessage.replace(/"/g, '\\"');
                  code += `    success_text = "${escapedMessage}"\n`;
                }
                
                // Добавляем замену переменных в сообщении об успехе
                code += `    # Подставляем значения переменных в текст сообщения\n`;
                code += `    if "{${variableName}}" in success_text:\n`;
                code += `        success_text = success_text.replace("{${variableName}}", "${variableValue}")\n`;
                
                code += '    await callback_query.message.edit_text(success_text)\n';
              }
            }
            // Handle regular message nodes (like source_friends, source_search, etc.)
            else if (targetNode.type === 'message') {
              const messageText = targetNode.data.messageText || "Сообщение";
              const cleanedMessageText = stripHtmlTags(messageText);
              const formattedText = formatTextForPython(cleanedMessageText);
              const parseMode = getParseMode(targetNode.data.formatMode);
              
              code += `    # Отправляем сообщение для узла ${targetNode.id}\n`;
              code += `    text = ${formattedText}\n`;
              
              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              
              // Добавляем поддержку условных сообщений
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений\n';
                code += '    conditional_parse_mode = None\n';
                code += '    conditional_keyboard = None\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default
                code += '    # Используем условное сообщение если есть подходящее условие\n';
                code += '    if "text" not in locals():\n';
                code += `        text = ${formattedText}\n`;
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    if conditional_keyboard is not None:\n';
                code += '        keyboard = conditional_keyboard\n';
                code += '    else:\n';
                code += '        keyboard = None\n';
              } else {
                code += '    \n';
                code += '    # Без условных сообщений - используем обычную клавиатуру\n';
                code += '    keyboard = None\n';
              }
              
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем множественный выбор ИЛИ обычные inline кнопки
              const hasMultipleSelection = targetNode.data.allowMultipleSelection && targetNode.data.buttons && targetNode.data.buttons.length > 0;
              const hasRegularInlineButtons = targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0;
              
              console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} - allowMultipleSelection: ${targetNode.data.allowMultipleSelection}, кнопок: ${targetNode.data.buttons?.length}, keyboardType: ${targetNode.data.keyboardType}`);
              
              if (hasMultipleSelection || hasRegularInlineButtons) {
                console.log(`🔧 ГЕНЕРАТОР: ✅ СОЗДАЕМ клавиатуру для узла ${targetNode.id} (множественный выбор: ${hasMultipleSelection})`);
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if keyboard is None:\n';
                code += '        # ИСПРАВЛЕНИЕ: Используем универсальную функцию создания клавиатуры\n';
                // ИСПРАВЛЕНИЕ: Используем универсальную функцию generateInlineKeyboardCode
                const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
                code += keyboardCode;
              } else if (targetNode.data.keyboardType !== "inline") {
                // Сохраняем keyboard = None только если это не inline клавиатура
                code += '    if keyboard is None:\n';
                code += '        keyboard = None\n';
              }
              
              // Добавляем настройку ожидания текстового ввода для условных сообщений
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    # Настраиваем ожидание текстового ввода для условных сообщений\n';
                code += '    if "conditional_message_config" in locals():\n';
                code += '        # Проверяем, включено ли ожидание текстового ввода\n';
                code += '        wait_for_input = conditional_message_config.get("wait_for_input", False)\n';
                code += '        if wait_for_input:\n';
                code += '            # Получаем следующий узел из условного сообщения или подключений\n';
                code += '            conditional_next_node = conditional_message_config.get("next_node_id")\n';
                code += '            if conditional_next_node:\n';
                code += '                next_node_id = conditional_next_node\n';
                code += '            else:\n';
                const currentNodeConnections = connections.filter(conn => conn.source === targetNode.id);
                if (currentNodeConnections.length > 0) {
                  const nextNodeId = currentNodeConnections[0].target;
                  code += `                next_node_id = "${nextNodeId}"\n`;
                } else {
                  code += '                next_node_id = None\n';
                }
                code += '            \n';
                code += '            # Получаем переменную для сохранения ввода\n';
                code += '            input_variable = conditional_message_config.get("input_variable")\n';
                code += '            if not input_variable:\n';
                code += '                input_variable = f"conditional_response_{conditional_message_config.get(\'condition_id\', \'unknown\')}"\n';
                code += '            \n';
                code += '            # Устанавливаем состояние ожидания текстового ввода\n';
                code += '            if user_id not in user_data:\n';
                code += '                user_data[user_id] = {}\n';
                code += '            user_data[user_id]["waiting_for_conditional_input"] = {\n';
                code += '                "node_id": callback_query.data,\n';
                code += '                "condition_id": conditional_message_config.get("condition_id"),\n';
                code += '                "next_node_id": next_node_id,\n';
                code += '                "input_variable": input_variable,\n';
                code += '                "source_type": "conditional_message"\n';
                code += '            }\n';
                code += '            logging.info(f"Установлено ожидание ввода для условного сообщения: {conditional_message_config}")\n';
                code += '    \n';
              }
              
              // Отправляем сообщение с учетом всех условий
              // Проверяем наличие прикрепленных медиа
              const attachedMedia = targetNode.data.attachedMedia || [];
              
              if (attachedMedia.length > 0) {
                console.log(`🔧 ГЕНЕРАТОР: Узел ${targetNode.id} имеет attachedMedia:`, attachedMedia);
                // Генерируем код отправки с медиа
                const parseModeStr = targetNode.data.formatMode || '';
                const keyboardStr = 'keyboard if keyboard is not None else None';
                const mediaCode = generateAttachedMediaSendCode(
                  attachedMedia,
                  mediaVariablesMap,
                  'text',
                  parseModeStr,
                  keyboardStr,
                  targetNode.id,
                  '    ',
                  targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo ? targetNode.data.autoTransitionTo : undefined
                );
                
                if (mediaCode) {
                  code += '    # Отправляем сообщение (с проверкой прикрепленного медиа)\n';
                  code += mediaCode;
                } else {
                  // Fallback если не удалось сгенерировать код медиа
                  code += '    # Отправляем сообщение (обычное)\n';
                  const autoFlag1 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
                  code += `    await safe_edit_or_send(callback_query, text, node_id="${targetNode.id}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag1}${parseMode})\n`;
                  
                  // АВТОПЕРЕХОД для fallback случая
                  if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                    const autoTargetId = targetNode.data.autoTransitionTo;
                    const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                    code += `    # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                    code += `    logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                    code += `    await handle_node_${safeAutoTargetId}(callback_query)\n`;
                    code += `    return\n`;
                  }
                }
              } else {
                // Обычное сообщение без медиа
                code += '    # Отправляем сообщение\n';
                const autoFlag2 = (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) ? ', is_auto_transition=True' : '';
                code += `    await safe_edit_or_send(callback_query, text, node_id="${targetNode.id}", reply_markup=keyboard if keyboard is not None else None, is_auto_transition=True${autoFlag2}${parseMode})\n`;
                
                // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу переходим к следующему узлу
                // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если установлено waiting_for_conditional_input
                if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                  const autoTargetId = targetNode.data.autoTransitionTo;
                  const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                  code += '    \n';
                  code += '    # Проверяем, не ждем ли мы условный ввод перед автопереходом\n';
                  code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
                  code += '        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем условный ввод для узла ${targetNode.id}")\n';
                  code += '    else:\n';
                  code += `        # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                  code += `        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                  code += `        await handle_node_${safeAutoTargetId}(callback_query)\n`;
                  code += `        return\n`;
                }
              }
              
              // КРИТИЧЕСКИ ВАЖНАЯ ЛОГИКА: Если этот узел имеет collectUserInput, настраиваем состояние ожидания
              if (targetNode.data.collectUserInput === true) {
                const inputType = targetNode.data.inputType || 'text';
                const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
                const inputTargetNodeId = targetNode.data.inputTargetNodeId;
                
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если у узла есть inline кнопки И НЕТ текстового/медиа ввода, НЕ настраиваем ожидание ввода
                // Для reply кнопок ВСЕГДА настраиваем ожидание ввода если enableTextInput === true
                const hasInputEnabled = targetNode.data.enableTextInput || targetNode.data.enablePhotoInput || 
                                         targetNode.data.enableVideoInput || targetNode.data.enableAudioInput || 
                                         targetNode.data.enableDocumentInput;
                
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0 && !hasInputEnabled) {
                  code += '    \n';
                  code += `    logging.info(f"✅ Узел ${targetNode.id} имеет inline кнопки БЕЗ текстового/медиа ввода - НЕ настраиваем ожидание ввода")\n`;
                  code += `    # ИСПРАВЛЕНИЕ: У узла есть inline кнопки без текстового/медиа ввода\n`;
                } else {
                  code += '    \n';
                  code += '    # КРИТИЧЕСКИ ВАЖНО: Настраиваем ожидание ввода для message узла с collectUserInput\n';
                  code += '    # Используем универсальную функцию для определения правильного типа ввода (text/photo/video/audio/document)\n';
                  // ИСПРАВЛЕНИЕ: Используем generateWaitingStateCode с правильным контекстом callback_query
                  code += generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
                }
              }
            }
            // Handle different target node types
            else if (targetNode.type === 'photo') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "📸 Фото";
              const imageUrl = targetNode.data.imageUrl || "https://picsum.photos/800/600?random=1";
              
              code += `    # Отправляем фото для узла ${targetNode.id}\n`;
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              // Применяем универсальную замену переменных для подписи
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              code += '    caption = replace_variables_in_text(caption, user_vars)\n';
              
              // Добавляем поддержку условных сообщений для фото
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для фото\n';
                code += '    conditional_parse_mode = None\n';
                code += '    conditional_keyboard = None\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default caption
                code += '    # Используем условное сообщение как подпись если есть подходящее условие\n';
                code += '    if "text" in locals():\n';
                code += '        caption = text\n';
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    conditional_keyboard_for_photo = conditional_keyboard\n';
              }
              
              code += `    photo_url = "${imageUrl}"\n`;
              code += '    photo_url = replace_variables_in_text(photo_url, user_vars)\n';
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(photo_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(photo_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                photo_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            photo_file = photo_url\n';
              code += '        \n';
              
              // Проверяем условную клавиатуру или обычную
              code += '        # Определяем клавиатуру для фото\n';
              code += '        keyboard = None\n';
              
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '        if conditional_keyboard_for_photo is not None:\n';
                code += '            keyboard = conditional_keyboard_for_photo\n';
                code += '        elif '
              } else {
                code += '        if ';
              }
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += 'True:  # У узла есть обычные кнопки\n';
                code += '            builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для кнопок команд создаем специальную callback_data
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '            builder.adjust(2)  # Используем 2 колонки для консистентности\n';
                code += '            keyboard = builder.as_markup()\n';
              } else {
                code += 'False:  # Нет кнопок\n';
                code += '            pass\n';
              }
              
              code += '        \n';
              code += '        if keyboard is not None:\n';
              code += '            await bot.send_photo(callback_query.from_user.id, photo_file, caption=caption, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            await bot.send_photo(callback_query.from_user.id, photo_file, caption=caption)\n';
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки фото: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось загрузить фото\\n{caption}")\n';
              
              // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу переходим к следующему узлу
              // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если установлено waiting_for_conditional_input
              if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                const autoTargetId = targetNode.data.autoTransitionTo;
                const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                code += '    \n';
                code += '    # Проверяем, не ждем ли мы условный ввод перед автопереходом\n';
                code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
                code += '        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем условный ввод для узла ${targetNode.id}")\n';
                code += '    else:\n';
                code += `        # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                code += `        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                code += `        await handle_node_${safeAutoTargetId}(callback_query)\n`;
                code += `        return\n`;
              }
              
            } else if (targetNode.type === 'video') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "🎥 Видео";
              const videoUrl = targetNode.data.videoUrl || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4";
              
              code += `    # Отправляем видео для узла ${targetNode.id}\n`;
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              // Применяем универсальную замену переменных для подписи
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              code += '    caption = replace_variables_in_text(caption, user_vars)\n';
              
              // Добавляем поддержку условных сообщений для видео
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для видео\n';
                code += '    conditional_parse_mode = None\n';
                code += '    conditional_keyboard = None\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default caption
                code += '    # Используем условное сообщение как подпись если есть подходящее условие\n';
                code += '    if "text" in locals():\n';
                code += '        caption = text\n';
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    conditional_keyboard_for_video = conditional_keyboard\n';
              }
              
              code += `    video_url = "${videoUrl}"\n`;
              code += '    video_url = replace_variables_in_text(video_url, user_vars)\n';
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(video_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(video_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                video_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            video_file = video_url\n';
              code += '        \n';
              
              // Проверяем условную клавиатуру или обычную
              code += '        # Определяем клавиатуру для видео\n';
              code += '        keyboard = None\n';
              
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '        if conditional_keyboard_for_video is not None:\n';
                code += '            keyboard = conditional_keyboard_for_video\n';
                code += '        elif '
              } else {
                code += '        if ';
              }
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += 'True:  # У узла есть обычные кнопки\n';
                code += '            builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для кнопок команд создаем специальную callback_data
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '            builder.adjust(2)  # Используем 2 колонки для консистентности\n';
                code += '            keyboard = builder.as_markup()\n';
              } else {
                code += 'False:  # Нет кнопок\n';
                code += '            pass\n';
              }
              
              code += '        \n';
              code += '        if keyboard is not None:\n';
              code += '            await bot.send_video(callback_query.from_user.id, video_file, caption=caption, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            await bot.send_video(callback_query.from_user.id, video_file, caption=caption)\n';
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки видео: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось загрузить видео\\n{caption}")\n';
              
              // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу переходим к следующему узлу
              // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если установлено waiting_for_conditional_input
              if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                const autoTargetId = targetNode.data.autoTransitionTo;
                const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                code += '    \n';
                code += '    # Проверяем, не ждем ли мы условный ввод перед автопереходом\n';
                code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
                code += '        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем условный ввод для узла ${targetNode.id}")\n';
                code += '    else:\n';
                code += `        # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                code += `        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                code += `        await handle_node_${safeAutoTargetId}(callback_query)\n`;
                code += `        return\n`;
              }
              
            } else if (targetNode.type === 'audio') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "🎵 Аудио";
              const audioUrl = targetNode.data.audioUrl || "https://www.soundjay.com/misc/beep-07a.wav";
              
              code += `    # Отправляем аудио для узла ${targetNode.id}\n`;
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              // Применяем универсальную замену переменных для подписи
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              code += '    caption = replace_variables_in_text(caption, user_vars)\n';
              
              // Добавляем поддержку условных сообщений для аудио
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для аудио\n';
                code += '    conditional_parse_mode = None\n';
                code += '    conditional_keyboard = None\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default caption
                code += '    # Используем условное сообщение как подпись если есть подходящее условие\n';
                code += '    if "text" in locals():\n';
                code += '        caption = text\n';
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    conditional_keyboard_for_audio = conditional_keyboard\n';
              }
              
              code += `    audio_url = "${audioUrl}"\n`;
              code += '    audio_url = replace_variables_in_text(audio_url, user_vars)\n';
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(audio_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(audio_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                audio_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            audio_file = audio_url\n';
              code += '        \n';
              
              // Проверяем условную клавиатуру или обычную
              code += '        # Определяем клавиатуру для аудио\n';
              code += '        keyboard = None\n';
              
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '        if conditional_keyboard_for_audio is not None:\n';
                code += '            keyboard = conditional_keyboard_for_audio\n';
                code += '        elif '
              } else {
                code += '        if ';
              }
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += 'True:  # У узла есть обычные кнопки\n';
                code += '            builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для audio nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `            # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '            keyboard = builder.as_markup()\n';
              } else {
                code += 'False:  # Нет кнопок\n';
                code += '            pass\n';
              }
              
              code += '        \n';
              code += '        if keyboard is not None:\n';
              code += '            await bot.send_audio(callback_query.from_user.id, audio_file, caption=caption, reply_markup=keyboard)\n';
              code += '        else:\n';
              code += '            await bot.send_audio(callback_query.from_user.id, audio_file, caption=caption)\n';
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки аудио: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось загрузить аудио\\n{caption}")\n';
              
              // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу переходим к следующему узлу
              // ИСПРАВЛЕНИЕ: НЕ делаем автопереход если установлено waiting_for_conditional_input
              if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
                const autoTargetId = targetNode.data.autoTransitionTo;
                const safeAutoTargetId = autoTargetId.replace(/-/g, '_');
                code += '    \n';
                code += '    # Проверяем, не ждем ли мы условный ввод перед автопереходом\n';
                code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
                code += '        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем условный ввод для узла ${targetNode.id}")\n';
                code += '    else:\n';
                code += `        # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                code += `        logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
                code += `        await handle_node_${safeAutoTargetId}(callback_query)\n`;
                code += `        return\n`;
              }
              
            } else if (targetNode.type === 'document') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "📄 Документ";
              const documentUrl = targetNode.data.documentUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    document_url = "${documentUrl}"\n`;
              code += '    document_url = replace_variables_in_text(document_url, user_vars)\n';
              const documentName = targetNode.data.documentName || "document.pdf";
              code += `    document_name = "${documentName}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(document_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(document_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                document_file = FSInputFile(file_path, filename=document_name)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            document_file = URLInputFile(document_url, filename=document_name)\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для document nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_document(callback_query.from_user.id, document_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_document(callback_query.from_user.id, document_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки документа: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось загрузить документ\\n{caption}")\n';
              
            } else if (targetNode.type === 'sticker') {
              const stickerUrl = targetNode.data.stickerUrl || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";
              
              code += `    sticker_url = "${stickerUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(sticker_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(sticker_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                sticker_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL или file_id для стикеров\n';
              code += '            sticker_file = sticker_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для sticker nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить стикер")\n';
              
            } else if (targetNode.type === 'voice') {
              const voiceUrl = targetNode.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
              const duration = targetNode.data.duration || 30;
              
              code += `    voice_url = "${voiceUrl}"\n`;
              code += `    duration = ${duration}\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(voice_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(voice_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                voice_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            voice_file = voice_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для voice nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить голосовое сообщение")\n';
              
            } else if (targetNode.type === 'animation') {
              const caption = targetNode.data.mediaCaption || "🎬 Анимация";
              const animationUrl = targetNode.data.animationUrl || "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    animation_url = "${animationUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(animation_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(animation_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                animation_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            animation_file = animation_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command' && btn.target) {
                    // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд для animation nodes
                    const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                    code += `        # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить анимацию\\n{caption}")\n';
              
            } else if (targetNode.type === 'location') {
              let latitude = targetNode.data.latitude || 55.7558;
              let longitude = targetNode.data.longitude || 37.6176;
              const title = targetNode.data.title || "";
              const address = targetNode.data.address || "";
              const city = targetNode.data.city || "";
              const country = targetNode.data.country || "";
              const mapService = targetNode.data.mapService || 'custom';
              const generateMapPreview = targetNode.data.generateMapPreview !== false;
              
              code += '    # Определяем координаты на основе выбранного сервиса карт\n';
              
              if (mapService === 'yandex' && targetNode.data.yandexMapUrl) {
                code += `    yandex_url = "${targetNode.data.yandexMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === 'google' && targetNode.data.googleMapUrl) {
                code += `    google_url = "${targetNode.data.googleMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === '2gis' && targetNode.data.gisMapUrl) {
                code += `    gis_url = "${targetNode.data.gisMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else {
                code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
              }
              
              if (title) code += `    title = "${title}"\n`;
              if (address) code += `    address = "${address}"\n`;
              
              code += '    try:\n';
              code += '        # Удаляем старое сообщение\n';
              
              code += '        # Отправляем геолокацию\n';
              if (title || address) {
                code += '        await bot.send_venue(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude,\n';
                code += '            title=title,\n';
                code += '            address=address\n';
                code += '        )\n';
              } else {
                code += '        await bot.send_location(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude\n';
                code += '        )\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию")\n';
              
              // Генерируем кнопки для картографических сервисов если включено
              if (generateMapPreview) {
                code += '        \n';
                code += '        # Генерируем ссылки на картографические сервисы\n';
                code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
                code += '        \n';
                code += '        # Создаем кнопки для различных карт\n';
                code += '        map_builder = InlineKeyboardBuilder()\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';
                
                if (targetNode.data.showDirections) {
                  code += '        # Добавляем кнопки для построения маршрута\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
                }
                
                code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
                code += '        map_keyboard = map_builder.as_markup()\n';
                code += '        \n';
                code += '        await bot.send_message(\n';
                code += '            callback_query.from_user.id,\n';
                if (targetNode.data.showDirections) {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
                } else {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
                }
                code += '            reply_markup=map_keyboard\n';
                code += '        )\n';
              }
              
              // Добавляем дополнительные кнопки если они есть
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        \n';
                code += '        # Отправляем дополнительные кнопки\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки местоположения: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")\n';
              
            } else if (targetNode.type === 'contact') {
              const phoneNumber = targetNode.data.phoneNumber || "+7 999 123 45 67";
              const firstName = targetNode.data.firstName || "Контакт";
              const lastName = targetNode.data.lastName || "";
              const userId = targetNode.data.userId || null;
              const vcard = targetNode.data.vcard || "";
              
              code += `    phone_number = "${phoneNumber}"\n`;
              code += `    first_name = "${firstName}"\n`;
              if (lastName) code += `    last_name = "${lastName}"\n`;
              if (userId) code += `    user_id = ${userId}\n`;
              if (vcard) code += `    vcard = """${vcard}"""\n`;
              
              code += '    try:\n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard, reply_markup=keyboard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, reply_markup=keyboard)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, reply_markup=keyboard)\n';
                }
              } else {
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name)\n';
                }
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
              code += '        await safe_edit_or_send(callback_query, f"❌ Не удалось отправить контакт")\n';
              
            } else if (targetNode.type === 'user-input') {
              // Handle user-input nodes
              const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
              const responseType = targetNode.data.responseType || 'text';
              const inputType = targetNode.data.inputType || 'text';
              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const responseOptions = targetNode.data.responseOptions || [];
              const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
              const inputValidation = targetNode.data.inputValidation || '';
              const minLength = targetNode.data.minLength || 0;
              const maxLength = targetNode.data.maxLength || 0;
              const inputTimeout = targetNode.data.inputTimeout || 60;
              const inputRequired = targetNode.data.inputRequired !== false;
              const allowSkip = targetNode.data.allowSkip || false;
              const saveToDatabase = targetNode.data.saveToDatabase || false;
              const inputRetryMessage = targetNode.data.inputRetryMessage || "Пожалуйста, попробуйте еще раз.";
              const inputSuccessMessage = targetNode.data.inputSuccessMessage || "";
              const placeholder = targetNode.data.placeholder || "";
              
              code += '    # Удаляем старое сообщение\n';
              code += '    \n';
              
              // Отправляем запрос пользователю
              const formattedPrompt = formatTextForPython(inputPrompt);
              code += `    text = ${formattedPrompt}\n`;
              
              if (responseType === 'buttons' && responseOptions.length > 0) {
                // Обработка кнопочного ответа
                const buttonType = targetNode.data.buttonType || 'inline';
                code += '    \n';
                code += '    # Создаем кнопки для выбора ответа\n';
                
                if (buttonType === 'reply') {
                  code += '    builder = ReplyKeyboardBuilder()\n';
                  
                  responseOptions.forEach((option: string, index: number) => {
                    code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
                  });
                  
                  if (allowSkip) {
                    code += `    builder.add(KeyboardButton(text="⏭️ Пропустить"))\n`;
                  }
                  
                  code += '    keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=True)\n';
                  code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                } else {
                  code += '    builder = InlineKeyboardBuilder()\n';
                  
                  responseOptions.forEach((option: string, index: number) => {
                    const optionValue = option.value || option.text;
                    code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="response_${targetNode.id}_${index}"))\n`;
                  });
                  
                  if (allowSkip) {
                    code += `    builder.add(InlineKeyboardButton(text="⏭️ Пропустить", callback_data="skip_${targetNode.id}"))\n`;
                  }
                  
                  code += '    keyboard = builder.as_markup()\n';
                  code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
                }
                code += '    \n';
                code += '    # Инициализируем пользовательские данные если их нет\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                // Find the next node to navigate to after successful input
                const nextConnection = connections.find(conn => conn.source === targetNode.id);
                const nextNodeId = nextConnection ? nextConnection.target : null;
                
                code += '    # Сохраняем настройки для обработки ответа\n';
                code += '    user_data[callback_query.from_user.id]["button_response_config"] = {\n';
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
                code += `        "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
                code += `        "next_node_id": "${nextNodeId || ''}",\n`;
                code += '        "options": [\n';
                responseOptions.forEach((option: string, index: number) => {
                  const optionValue = option.value || option.text;
                  const optionAction = option.action || 'goto';
                  const optionTarget = option.target || '';
                  const optionUrl = option.url || '';
                  code += `            {"index": ${index}, "text": "${escapeForJsonString(option.text)}", "value": "${escapeForJsonString(optionValue)}", "action": "${optionAction}", "target": "${optionTarget}", "url": "${escapeForJsonString(optionUrl)}"},\n`;
                });
                code += '        ],\n';
                code += `        "selected": []\n`;
                code += '    }\n';
                
              } else {
                // Обработка текстового ввода (оригинальная логика)
                if (placeholder) {
                  code += `    placeholder_text = "${placeholder}"\n`;
                  code += '    text += f"\\n\\n💡 {placeholder_text}"\n';
                }
                
                if (allowSkip) {
                  code += '    text += "\\n\\n⏭️ Нажмите /skip чтобы пропустить"\n';
                }
                
                code += '    await bot.send_message(callback_query.from_user.id, text)\n';
                code += '    \n';
                code += '    # Инициализируем пользовательские данные если их нет\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                // Find the next node to navigate to after successful input
                const nextConnection = connections.find(conn => conn.source === targetNode.id);
                const nextNodeId = nextConnection ? nextConnection.target : null;
                
                code += '    # Настраиваем ожидание ввода\n';
                code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                code += `        "type": "${inputType}",\n`;
                code += `        "variable": "${inputVariable}",\n`;
                code += `        "validation": "${inputValidation}",\n`;
                code += `        "min_length": ${minLength},\n`;
                code += `        "max_length": ${maxLength},\n`;
                code += `        "timeout": ${inputTimeout},\n`;
                code += `        "required": ${toPythonBoolean(inputRequired)},\n`;
                code += `        "allow_skip": ${toPythonBoolean(allowSkip)},\n`;
                code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
                code += `        "retry_message": "${escapeForJsonString(inputRetryMessage)}",\n`;
                code += `        "success_message": "${escapeForJsonString(inputSuccessMessage)}",\n`;
                code += `        "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
                code += `        "node_id": "${targetNode.id}",\n`;
                code += `        "next_node_id": "${nextNodeId || ''}"\n`;
                code += '    }\n';
              }
              
            } else if (targetNode.type === 'start') {
              // Handle start nodes in callback queries - show start message with buttons
              const messageText = targetNode.data.messageText || "Добро пожаловать!";
              const cleanedMessageText = stripHtmlTags(messageText);
              const formattedText = formatTextForPython(cleanedMessageText);
              const parseMode = getParseMode(targetNode.data.formatMode);
              
              code += `    # Обрабатываем узел start: ${targetNode.id}\n`;
              code += `    text = ${formattedText}\n`;
              
              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              
              // Добавляем поддержку условных сообщений для start узлов
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    \n';
                code += '    # Проверка условных сообщений для start узла\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                
                // Use conditional message if available, otherwise use default
                code += '    # Используем условное сообщение если есть подходящее условие\n';
                code += '    if "text" not in locals():\n';
                code += `        text = ${formattedText}\n`;
                code += '    \n';
                code += '    # Используем условную клавиатуру если есть\n';
                code += '    if conditional_keyboard is not None:\n';
                code += '        keyboard = conditional_keyboard\n';
                code += '    else:\n';
                code += '        keyboard = None\n';
              } else {
                code += '    \n';
                code += '    # Без условных сообщений - используем обычную клавиатуру\n';
                code += '    keyboard = None\n';
              }
              
              // Создаем inline клавиатуру для start узла (только если нет условной клавиатуры)
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Проверяем, есть ли условная клавиатура\n';
                code += '    if keyboard is None:\n';
                code += '        # Создаем inline клавиатуру для start узла\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    // Создаем уникальный callback_data для каждой кнопки
                    const baseCallbackData = btn.target || btn.id || 'no_action';
                    const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    // Для кнопок команд создаем специальную callback_data
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                // Добавляем настройку колонок для консистентности
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `        builder.adjust(${columns})\n`;
                code += '        keyboard = builder.as_markup()\n';
              }
              
              // Отправляем сообщение start узла
              code += '    # Отправляем сообщение start узла\n';
              code += '    try:\n';
              code += '        if keyboard is not None:\n';
              code += `            await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})\n`;
              code += '        else:\n';
              code += `            await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})\n`;
              code += '    except Exception:\n';
              code += '        if keyboard is not None:\n';
              code += `            await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
              code += '        else:\n';
              code += `            await callback_query.message.answer(text${parseMode})\n`;
              
            } else if (targetNode.type === 'command') {
              // Handle command nodes in callback queries
              const command = targetNode.data.command || '/start';
              const commandMessage = targetNode.data.messageText || `Выполняем команду ${command}`;
              const cleanedCommandMessage = stripHtmlTags(commandMessage);
              const formattedCommandText = formatTextForPython(cleanedCommandMessage);
              const parseMode = getParseMode(targetNode.data.formatMode);
              
              code += `    # Обрабатываем узел command: ${targetNode.id}\n`;
              code += `    text = ${formattedCommandText}\n`;
              
              // Применяем универсальную замену переменных
              code += '    \n';
              code += generateUniversalVariableReplacement('    ');
              
              // Создаем inline клавиатуру для command узла если есть кнопки
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                code += '    # Создаем inline клавиатуру для command узла\n';
                code += '    builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach((btn: Button, index: number) => {
                  if (btn.action === "url") {
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const baseCallbackData = btn.target || btn.id || 'no_action';
                    const callbackData = `${baseCallbackData}_btn_${index}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                  } else if (btn.action === 'command') {
                    const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                    code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                  }
                });
                // Добавляем настройку колонок для консистентности
                const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                code += `    builder.adjust(${columns})\n`;
                code += '    keyboard = builder.as_markup()\n';
                code += '    # Отправляем сообщение command узла с клавиатурой\n';
                code += '    try:\n';
                code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard, is_auto_transition=True${parseMode})\n`;
                code += '    except Exception:\n';
                code += `        await callback_query.message.answer(text, reply_markup=keyboard${parseMode})\n`;
              } else {
                code += '    # Отправляем сообщение command узла без клавиатуры\n';
                code += '    try:\n';
                code += `        await safe_edit_or_send(callback_query, text, is_auto_transition=True${parseMode})\n`;
                code += '    except Exception:\n';
                code += `        await callback_query.message.answer(text${parseMode})\n`;
              }
              
            } else {
              // Universal handler for all other node types (message, photo, document, etc.)
              code += `    # Обрабатываем узел типа ${targetNode.type}: ${targetNode.id}\n`;
              
              if (targetNode.type === 'photo') {
                // Handle photo nodes
                const photoUrl = targetNode.data.photoUrl || targetNode.data.imageUrl || "";
                const caption = targetNode.data.caption || targetNode.data.messageText || "";
                const cleanedCaption = stripHtmlTags(caption);
                const formattedCaption = formatTextForPython(cleanedCaption);
                const parseMode = getParseMode(targetNode.data.formatMode);
                
                code += `    # Отправляем фото\n`;
                code += `    photo_url = "${photoUrl}"\n`;
                code += `    caption = ${formattedCaption}\n`;
                
                // Применяем универсальную замену переменных в подписи
                code += generateUniversalVariableReplacement('    ');
                code += '    photo_url = replace_variables_in_text(photo_url, user_vars)\n';
                
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += '    # Создаем inline клавиатуру для фото\n';
                  code += '    builder = InlineKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn: Button, index: number) => {
                    if (btn.action === "url") {
                      code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                    } else if (btn.action === 'goto') {
                      const baseCallbackData = btn.target || btn.id || 'no_action';
                      const callbackData = `${baseCallbackData}_btn_${index}`;
                      code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                    }
                  });
                  code += '    keyboard = builder.as_markup()\n';
                  code += `    await bot.send_photo(callback_query.from_user.id, photo=photo_url, caption=caption, reply_markup=keyboard${parseMode})\n`;
                } else {
                  code += `    await bot.send_photo(callback_query.from_user.id, photo=photo_url, caption=caption${parseMode})\n`;
                }
                
              } else {
                // Handle message and other text-based nodes
                const targetText = targetNode.data.messageText || "Сообщение";
                const cleanedText = stripHtmlTags(targetText);
                const formattedTargetText = formatTextForPython(cleanedText);
                const parseMode = getParseMode(targetNode.data.formatMode);
                
                code += `    text = ${formattedTargetText}\n`;
                
                // Добавляем замену переменных в тексте
                code += generateUniversalVariableReplacement('    ');
                
                // Добавляем поддержку условных сообщений для keyboard узлов с collectUserInput
                if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                  code += '    \n';
                  code += '    # Проверка условных сообщений для keyboard узла\n';
                  code += '    user_record = await get_user_from_db(callback_query.from_user.id)\n';
                  code += '    if not user_record:\n';
                  code += '        user_record = user_data.get(callback_query.from_user.id, {})\n';
                  code += '    user_data_dict = user_record if user_record else user_data.get(callback_query.from_user.id, {})\n';
                  code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                  code += '    \n';
                  
                  // Use conditional message if available, otherwise use default
                  code += '    # Используем условное сообщение если есть подходящее условие\n';
                  code += '    if "text" not in locals():\n';
                  code += `        text = ${formattedTargetText}\n`;
                  code += '    \n';
                  code += '    # Используем условную клавиатуру если есть\n';
                  code += '    if conditional_keyboard is not None:\n';
                  code += '        keyboard = conditional_keyboard\n';
                  code += '    else:\n';
                  code += '        keyboard = None\n';
                  code += '    \n';
                }
              }
            
              // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла (основной цикл)
              if (targetNode.data.collectUserInput === true) {
                // Настраиваем сбор пользовательского ввода
                code += '    # Активируем сбор пользовательского ввода (основной цикл)\n';
                code += '    if callback_query.from_user.id not in user_data:\n';
                code += '        user_data[callback_query.from_user.id] = {}\n';
                code += '    \n';
                // Используем helper функцию с правильным контекстом callback_query
                code += generateWaitingStateCode(targetNode, '    ', 'callback_query.from_user.id');
                code += '    \n';
                
                // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок с проверкой условной клавиатуры
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли условная клавиатуря для этого узла\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем inline клавиатуру с кнопками (+ сбор ввода включен)\n';
                  code += '        builder = InlineKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn: Button, index: number) => {
                    if (btn.action === "url") {
                      code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                    } else if (btn.action === 'goto') {
                      // Создаем уникальный callback_data для каждой кнопки
                      const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                      const uniqueCallbackData = `${callbackData}_btn_${targetNode.data.buttons.indexOf(btn)}`;
                      code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${uniqueCallbackData}"))\n`;
                    } else if (btn.action === 'command') {
                      // Для кнопок команд создаем специальную callback_data
                      const commandCallback = `cmd_${btn.target ? btn.target.replace('/', '') : 'unknown'}`;
                      code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                    }
                  });
                  // Добавляем настройку колонок для консистентности
                  const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
                  code += `        builder.adjust(${columns})\n`;
                  code += '        keyboard = builder.as_markup()\n';
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    await safe_edit_or_send(callback_query, text, reply_markup=keyboard${parseModeTarget})\n`;
                }
                code += '    \n';
              } else {
                // Обычное отображение сообщения без сбора ввода
                
                // Handle keyboard for target node
                code += `    # DEBUG: Узел ${targetNode.id} - hasRegularButtons=${toPythonBoolean(targetNode.data.buttons && targetNode.data.buttons.length > 0)}, hasInputCollection=False\n`;
                code += `    logging.info(f"DEBUG: Узел ${targetNode.id} обработка кнопок - keyboardType=${targetNode.data.keyboardType}, buttons=${targetNode.data.buttons ? targetNode.data.buttons.length : 0}")\n`;
                if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                  code += `    logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${targetNode.id} с ${targetNode.data.buttons.length} кнопками")\n`;
                  code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # ИСПРАВЛЕНИЕ: Используем универсальную функцию создания клавиатуры\n';
                  // ИСПРАВЛЕНИЕ: Используем универсальную функцию generateInlineKeyboardCode
                  const keyboardCode = generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
                  code += keyboardCode;
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    await safe_edit_or_send(callback_query, text, reply_markup=keyboard${parseModeTarget})\n`;
                } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
                  code += '    # Проверяем, есть ли уже клавиатура из условных сообщений\n';
                  code += '    if "keyboard" not in locals() or keyboard is None:\n';
                  code += '        # Создаем reply клавиатуру\n';
                  code += '        builder = ReplyKeyboardBuilder()\n';
                  targetNode.data.buttons.forEach((btn: Button, index: number) => {
                    code += `        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                  });
                  const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
                  const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
                  code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                  code += '    # Для reply клавиатуры отправляем новое сообщение и удаляем старое\n';
                  code += '    try:\n';
                  code += '    except:\n';
                  code += '        pass  # Игнорируем ошибки удаления\n';
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  code += `    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})\n`;
                } else {
                  // Определяем режим форматирования для целевого узла
                  let parseModeTarget = '';
                  if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                    parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
                  } else if (targetNode.data.formatMode === 'html') {
                    parseModeTarget = ', parse_mode=ParseMode.HTML';
                  }
                  // Для автопереходов отправляем новое сообщение вместо редактирования
                  code += `    await callback_query.message.answer(text${parseModeTarget})\n`;
                }
              } // Закрываем else блок для обычного отображения (основной цикл)
            } // Закрываем else блок для обычных текстовых сообщений (основной цикл)
          } else {
            // Кнопка без цели - просто уведомляем пользователя
            code += '    # Кнопка пока никуда не ведет\n';
            code += '    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)\n';
          }
        } else if (button.action === 'command' && button.id) {
          // Обработка кнопок с действием "command"
          const callbackData = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          
          // Avoid duplicate handlers
          if (processedCallbacks.has(callbackData)) return;
          processedCallbacks.add(callbackData);
          
          code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
          const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9_]/g, '_');
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += `    button_text = "${button.text}"\n`;
          code += '    \n';
          code += '    # Сохраняем кнопку в базу данных\n';
          code += '    timestamp = get_moscow_time()\n';
          code += '    response_data = button_text\n';
          code += '    await update_user_data_in_db(user_id, button_text, response_data)\n';
          code += `    logging.info(f"Команда ${button.target || 'неизвестная'} выполнена через callback кнопку (пользователь {user_id})")\n`;
          code += '    \n';
          
          // Создаем правильный вызов команды для callback кнопок
          if (button.target) {
            // Определяем команду - убираем ведущий слеш если есть
            const command = button.target.startsWith('/') ? button.target.replace('/', '') : button.target;
            const handlerName = `${command}_handler`;
            
            code += `    # Вызываем ${handlerName} правильно через edit_text\n`;
            code += '    # Создаем специальный объект для редактирования сообщения\n';
            code += '    class FakeMessageEdit:\n';
            code += '        def __init__(self, callback_query):\n';
            code += '            self.from_user = callback_query.from_user\n';
            code += '            self.chat = callback_query.message.chat\n';
            code += '            self.date = callback_query.message.date\n';
            code += '            self.message_id = callback_query.message.message_id\n';
            code += '            self._callback_query = callback_query\n';
            code += '        \n';
            code += '        async def answer(self, text, parse_mode=None, reply_markup=None):\n';
            code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
            code += '        \n';
            code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
            code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
            code += '    \n';
            code += '    fake_edit_message = FakeMessageEdit(callback_query)\n';
            code += `    await ${handlerName}(fake_edit_message)\n`;
          } else {
            code += '    await callback_query.message.edit_text("❌ Команда не найдена")\n';
          }
        }
      });
    });
    
    // CRITICAL FIX: Ensure interests_result gets a handler BUT avoid duplicates
    console.log('🔧 ГЕНЕРАТОР CRITICAL FIX: Проверяем interests_result обработчик');
    console.log('🔧 ГЕНЕРАТОР: processedCallbacks перед check:', Array.from(processedCallbacks));
    
    // Проверяем, был ли interests_result уже обработан в основном цикле
    const wasInterestsResultProcessed = processedCallbacks.has('interests_result');
    console.log('🔧 ГЕНЕРАТОР: interests_result уже обработан в основном цикле?', wasInterestsResultProcessed);
    
    // ИСПРАВЛЕНИЕ: НЕ создаем дублирующий обработчик если он уже есть
    if (wasInterestsResultProcessed) {
      console.log('🔧 ГЕНЕРАТОР: ПРОПУСКАЕМ создание дублирующего обработчика для interests_result');
      console.log('🔧 ГЕНЕРАТОР: interests_result уже обработан в основном цикле, избегаем конфликта клавиатур');
    } else {
      console.log('🔧 ГЕНЕРАТОР: Создаем обработчик для interests_result (не найден в основном цикле)');
      processedCallbacks.add('interests_result');
      const interestsResultNode = nodes.find(n => n.id === 'interests_result');
      if (interestsResultNode) {
        processedCallbacks.add('interests_result');
        code += `\n@dp.callback_query(lambda c: c.data == "interests_result" or c.data.startswith("interests_result_btn_"))\n`;
        code += `async def handle_callback_interests_result(callback_query: types.CallbackQuery):\n`;
        code += '    await callback_query.answer()\n';
        code += '    # Handle interests_result node\n';
        code += '    user_id = callback_query.from_user.id\n';
        
        // Add the full message handling for interests_result node
        const messageText = interestsResultNode.data.messageText || "Результат";
        const cleanedMessageText = stripHtmlTags(messageText);
        const formattedText = formatTextForPython(cleanedMessageText);
        
        code += `    text = ${formattedText}\n`;
        code += '    \n';
        code += generateUniversalVariableReplacement('    ');
        
        // ИСПРАВЛЕНИЕ: Специальная логика для interests_result - показываем метро клавиатуру
        console.log('🔧 ГЕНЕРАТОР: Обрабатываем interests_result узел - добавляем метро клавиатуру');
        code += '    # ИСПРАВЛЕНИЕ: Проверяем, нужно ли показать метро клавиатуру\n';
        code += '    logging.info("🔧 ГЕНЕРАТОР DEBUG: Вошли в узел interests_result")\n';
        code += '    # Загружаем флаг из базы данных, если он там есть\n';
        code += '    user_vars = await get_user_from_db(user_id)\n';
        code += '    if not user_vars:\n';
        code += '        user_vars = user_data.get(user_id, {})\n';
        code += '        logging.info("🔧 ГЕНЕРАТОР DEBUG: user_vars загружены из user_data")\n';
        code += '    else:\n';
        code += '        logging.info("🔧 ГЕНЕРАТОР DEBUG: user_vars загружены из базы данных")\n';
        code += '    \n';
        code += '    show_metro_keyboard = False\n';
        code += '    if isinstance(user_vars, dict):\n';
        code += '        if "show_metro_keyboard" in user_vars:\n';
        code += '            show_metro_keyboard = str(user_vars["show_metro_keyboard"]).lower() == "true"\n';
        code += '            logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Нашли show_metro_keyboard в user_vars: {show_metro_keyboard}")\n';
        code += '    \n';
        code += '    # Также проверяем локальное хранилище\n';
        code += '    if not show_metro_keyboard:\n';
        code += '        show_metro_keyboard = user_data.get(user_id, {}).get("show_metro_keyboard", False)\n';
        code += '        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Проверили локальное хранилище: {show_metro_keyboard}")\n';
        code += '    \n';
        code += '    saved_metro = user_data.get(user_id, {}).get("saved_metro_selection", [])\n';
        code += '    logging.info(f"🚇 interests_result: show_metro_keyboard={show_metro_keyboard}, saved_metro={saved_metro}")\n';
        code += '    \n';
        
        // Находим узел metro_selection для восстановления его кнопок
        const metroNode = nodes.find(n => n.id.includes('metro_selection'));
        console.log(`🔧 ГЕНЕРАТОР: Поиск узла metro_selection - найден: ${metroNode ? 'да' : 'нет'}`);
        if (metroNode && metroNode.data.buttons) {
          console.log(`🔧 ГЕНЕРАТОР: Узел metro_selection найден: ${metroNode.id}, кнопок: ${metroNode.data.buttons.length}`);
          code += '    # Создаем метро клавиатуру если нужно\n';
          code += '    if show_metro_keyboard:\n';
          code += '        logging.info("🚇 ПОКАЗЫВАЕМ метро клавиатуру в interests_result")\n';
          code += '        builder = InlineKeyboardBuilder()\n';
          
          // Добавляем кнопки метро
          metroNode.data.buttons.forEach((btn: Button, index: number) => {
            const shortNodeId = metroNode.id.slice(-10).replace(/^_+/, '');
            const callbackData = `ms_${shortNodeId}_${btn.target || `btn_${index}`}`;
            code += `        # Кнопка метро: ${btn.text}\n`;
            code += `        selected_metro = "${btn.text}" in saved_metro\n`;
            code += `        button_text = "✅ " + "${btn.text}" if selected_metro else "${btn.text}"\n`;
            code += `        builder.add(InlineKeyboardButton(text=button_text, callback_data="${callbackData}"))\n`;
          });
          
          // Добавляем кнопку "Готово" с правильным callback_data для handle_multi_select_done
          const metroCallbackData = `multi_select_done_${metroNode.id}`;
          code += `        builder.add(InlineKeyboardButton(text="✅ Готово", callback_data="${metroCallbackData}"))\n`;
          code += '        builder.adjust(2)  # 2 кнопки в ряд\n';
          code += '        metro_keyboard = builder.as_markup()\n';
          code += '        \n';
          
          // Обычные кнопки interests_result
          code += '        # Добавляем обычные кнопки interests_result\n';
          if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
            code += '        result_builder = InlineKeyboardBuilder()\n';
            interestsResultNode.data.buttons.forEach((btn: Button, index: number) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `        result_builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `        result_builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
              } else if (btn.action === "url") {
                code += `        result_builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
              }
            });
            code += '        result_keyboard = result_builder.as_markup()\n';
            code += '        \n';
            code += '        # Объединяем клавиатуры\n';
            code += '        combined_keyboard = InlineKeyboardMarkup(inline_keyboard=metro_keyboard.inline_keyboard + result_keyboard.inline_keyboard)\n';
            code += '        await bot.send_message(user_id, text, reply_markup=combined_keyboard)\n';
          } else {
            code += '        await bot.send_message(user_id, text, reply_markup=metro_keyboard)\n';
          }
          
          code += '        # НЕ сбрасываем флаг show_metro_keyboard, чтобы клавиатура оставалась активной\n';
          code += '        logging.info("🚇 Клавиатура метро показана и остается активной")\n';
          code += '    else:\n';
          code += '        # Обычная логика без метро клавиатуры\n';
          
          // Handle buttons if any (без метро клавиатуры)
          if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
            code += '        builder = InlineKeyboardBuilder()\n';
            interestsResultNode.data.buttons.forEach((btn: Button, index: number) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
              } else if (btn.action === "url") {
                code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
              }
            });
            code += '        keyboard = builder.as_markup()\n';
            code += '        await bot.send_message(user_id, text, reply_markup=keyboard)\n';
          } else {
            code += '        await bot.send_message(user_id, text)\n';
          }
        } else {
          console.log('🔧 ГЕНЕРАТОР: Узел metro_selection НЕ найден или у него нет кнопок');
          // Обычная логика если узла метро нет
          code += '    logging.info("🚇 Узел metro_selection не найден, используем обычную логику")\n';
          if (interestsResultNode.data.buttons && interestsResultNode.data.buttons.length > 0) {
            code += '    builder = InlineKeyboardBuilder()\n';
            interestsResultNode.data.buttons.forEach((btn: Button, index: number) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
              } else if (btn.action === "url") {
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
              }
            });
            code += '    keyboard = builder.as_markup()\n';
            code += '    await bot.send_message(user_id, text, reply_markup=keyboard)\n';
          } else {
            code += '    await bot.send_message(user_id, text)\n';
          }
        }
        code += '\n';
      }
    }

    // Now generate callback handlers for all remaining referenced nodes that don't have inline buttons
    console.log(`🔍 ГЕНЕРАТОР: Обработка allReferencedNodeIds: ${Array.from(allReferencedNodeIds).join(', ')}`);
    console.log(`🔍 ГЕНЕРАТОР: Уже обработанные callbacks: ${Array.from(processedCallbacks).join(', ')}`);
    
    allReferencedNodeIds.forEach(nodeId => {
      console.log(`🔎 ГЕНЕРАТОР: Проверяем узел ${nodeId}`);
      if (!processedCallbacks.has(nodeId)) {
        console.log(`✅ ГЕНЕРАТОР: Узел ${nodeId} НЕ был обработан ранее, создаем обработчик`);
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          console.log(`📋 ГЕНЕРАТОР: Найден узел ${nodeId}, тип: ${targetNode.type}`);
          console.log(`📋 ГЕНЕРАТОР: allowMultipleSelection: ${targetNode.data.allowMultipleSelection}`);
          console.log(`📋 ГЕНЕРАТОР: keyboardType: ${targetNode.data.keyboardType}`);
          console.log(`📋 ГЕНЕРАТОР: кнопок: ${targetNode.data.buttons?.length || 0}`);
          console.log(`📋 ГЕНЕРАТОР: continueButtonTarget: ${targetNode.data.continueButtonTarget || 'нет'}`);
          
          if (nodeId === 'interests_result') {
            console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: СОЗДАЕМ ТРЕТИЙ ОБРАБОТЧИК ДЛЯ interests_result!`);
            console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: interests_result данные:`, JSON.stringify(targetNode.data, null, 2));
            console.log(`🚨 ГЕНЕРАТОР ALL_REFERENCED: ЭТО МОЖЕТ БЫТЬ ИСТОЧНИКОМ КОНФЛИКТА КЛАВИАТУР!`);
          }
          
          // ВАЖНО: Не создаваем обработчик для "start", если он уже был создан ранее (избегаем дублирования)
          if (nodeId === 'start') {
            console.log(`Пропускаем создание дублированной функции для узла ${nodeId} - уже создана ранее`);
            return; // Пропускаем создание дублированной функции
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Также проверяем interests_result и metro_selection
          if (nodeId === 'interests_result') {
            console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для interests_result - уже создан в основном цикле`);
            return; // Избегаем дублирования обработчика interests_result
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Пропускаем дублирующий обработчик для metro_selection
          if (nodeId === 'metro_selection') {
            console.log(`🚨 ГЕНЕРАТОР: ПРОПУСКАЕМ дублирующий обработчик для metro_selection - уже создан в основном цикле`);
            return; // Избегаем дублирования обработчика metro_selection
          }
          
          processedCallbacks.add(nodeId);
          
          // Create callback handler for this node that can handle multiple buttons AND multi-select "done" button
          const safeFunctionName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
          const shortNodeIdForDone = nodeId.slice(-10).replace(/^_+/, ''); // Такой же как в генерации кнопки
          code += `\n@dp.callback_query(lambda c: c.data == "${nodeId}" or c.data.startswith("${nodeId}_btn_") or c.data == "done_${shortNodeIdForDone}")\n`;
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    try:\n';
          code += '        await callback_query.answer()\n';
          code += '    except Exception:\n';
          code += '        pass  # Игнорируем ошибку если callback уже был обработан (при вызове через автопереход)\n';
          code += '    user_id = callback_query.from_user.id\n';
          code += '    callback_data = callback_query.data\n';
          code += `    logging.info(f"🔵 Вызван callback handler: handle_callback_${safeFunctionName} для пользователя {user_id}")\n`;
          code += '    \n';
          
          // Добавляем обработку кнопки "Готово" для множественного выбора
          if (targetNode.data.allowMultipleSelection) {
            code += '    # Проверяем, является ли это кнопкой "Готово"\n';
            code += `    if callback_data == "done_${shortNodeIdForDone}":\n`;
            code += '        logging.info(f"🏁 Обработка кнопки Готово для множественного выбора: {callback_data}")\n';
            code += '        \n';
            
            // Сохраняем выбранные значения в базу данных
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            code += '        # Сохраняем выбранные значения в базу данных\n';
            code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${nodeId}", [])\n`;
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
            code += `            user_data[user_id].pop("multi_select_${nodeId}", None)\n`;
            code += '            user_data[user_id].pop("multi_select_node", None)\n';
            code += '            user_data[user_id].pop("multi_select_type", None)\n';
            code += '            user_data[user_id].pop("multi_select_variable", None)\n';
            code += '        \n';
            
            // Переход к следующему узлу
            if (targetNode.data.continueButtonTarget) {
              const nextNodeId = targetNode.data.continueButtonTarget;
              code += '        # Переход к следующему узлу\n';
              code += `        next_node_id = "${nextNodeId}"\n`;
              code += '        try:\n';
              code += `            await handle_callback_${nextNodeId.replace(/[^a-zA-Z0-9_]/g, '_')}(callback_query)\n`;
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
          
          // Обычная обработка узлов без специальной логики
          
          // Определяем переменную для сохранения на основе родительского узла  
          if (targetNode && targetNode.data.inputVariable) {
            const variableName = targetNode.data.inputVariable;
            const variableValue = 'callback_query.data';
            
            code += '    # Сохраняем правильную переменную в базу данных\n';
            code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
            code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
            code += '    \n';
          }
          
          code += `    # Обрабатываем узел ${nodeId}: ${nodeId}\n`;
          const messageText = targetNode.data.messageText || "Сообщение не задано";
          const formattedText = formatTextForPython(messageText);
          code += `    text = ${formattedText}\n`;
          code += '    \n';
          code += generateUniversalVariableReplacement('    ');
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем поддержку условных сообщений
          if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
            code += '    \n';
            code += '    # Проверка условных сообщений для навигации\n';
            code += '    conditional_parse_mode = None\n';
            code += '    conditional_keyboard = None\n';
            code += '    user_record = await get_user_from_db(user_id)\n';
            code += '    if not user_record:\n';
            code += '        user_record = user_data.get(user_id, {})\n';
            code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
            code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
            code += '    \n';
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, есть ли условная клавиатура
          // Не оборачиваем код в if - вместо этого просто используем условную клавиатуру при отправке
          
          // ИСПРАВЛЕНИЕ: Добавляем специальную обработку для узлов с множественным выбором
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Все узлы с кнопками selection обрабатываются как множественный выбор
          const hasSelectionButtons = targetNode.data.buttons && targetNode.data.buttons.some(btn => btn.action === 'selection');
          if (targetNode.data.allowMultipleSelection || hasSelectionButtons) {
            // Узел с множественным выбором - создаем специальную клавиатуру
            console.log(`🎯 ГЕНЕРАТОР: ========================================`);
            const reason = hasSelectionButtons ? 'ИМЕЕТ КНОПКИ SELECTION' : 'ИМЕЕТ allowMultipleSelection=true';
            console.log(`🎯 ГЕНЕРАТОР: УЗЕЛ ${nodeId} ${reason}`);
            console.log(`🎯 ГЕНЕРАТОР: ЭТО ПРАВИЛЬНЫЙ ПУТЬ ВЫПОЛНЕНИЯ!`);
            console.log(`🔘 ГЕНЕРАТОР: Кнопки узла ${nodeId}:`, targetNode.data.buttons?.map(b => `${b.text} (action: ${b.action})`)?.join(', ') || 'НЕТ КНОПОК');
            console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget для ${nodeId}: ${targetNode.data.continueButtonTarget}`);
            console.log(`🔧 ГЕНЕРАТОР: multiSelectVariable для ${nodeId}: ${targetNode.data.multiSelectVariable}`);
            console.log(`🔧 ГЕНЕРАТОР: hasSelectionButtons: ${hasSelectionButtons}`);
            console.log(`🎯 ГЕНЕРАТОР: ========================================`);
            
            // Добавляем логику инициализации множественного выбора
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            
            code += '    # Инициализация состояния множественного выбора\n';
            code += '    if user_id not in user_data:\n';
            code += '        user_data[user_id] = {}\n';
            code += '    \n';
            code += '    # Загружаем ранее выбранные варианты\n';
            code += '    saved_selections = []\n';
            code += '    if user_vars:\n';
            code += `        for var_name, var_data in user_vars.items():\n`;
            code += `            if var_name == "${multiSelectVariable}":\n`;
            code += '                if isinstance(var_data, dict) and "value" in var_data:\n';
            code += '                    selections_str = var_data["value"]\n';
            code += '                elif isinstance(var_data, str):\n';
            code += '                    selections_str = var_data\n';
            code += '                else:\n';
            code += '                    continue\n';
            code += '                if selections_str and selections_str.strip():\n';
            code += '                    saved_selections = [sel.strip() for sel in selections_str.split(",") if sel.strip()]\n';
            code += '                    break\n';
            code += '    \n';
            code += '    # Инициализируем состояние если его нет\n';
            code += `    if "multi_select_${nodeId}" not in user_data[user_id]:\n`;
            code += `        user_data[user_id]["multi_select_${nodeId}"] = saved_selections.copy()\n`;
            code += `    user_data[user_id]["multi_select_node"] = "${nodeId}"\n`;
            code += `    user_data[user_id]["multi_select_type"] = "inline"\n`;
            code += `    user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
            code += '    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_selections)} элементами")\n';
            code += '    \n';
            
            // Создаем inline клавиатуру с кнопками выбора
            code += '    # Создаем inline клавиатуру с поддержкой множественного выбора\n';
            code += '    builder = InlineKeyboardBuilder()\n';
            
            // Разделяем кнопки на опции выбора и обычные кнопки
            console.log(`🔧 ГЕНЕРАТОР: targetNode.data.buttons:`, targetNode.data.buttons);
            
            let buttonsToUse = targetNode.data.buttons || [];
            
            const selectionButtons = buttonsToUse.filter(button => button.action === 'selection');
            const regularButtons = buttonsToUse.filter(button => button.action !== 'selection');
            console.log(`🔧 ГЕНЕРАТОР: Найдено ${selectionButtons.length} кнопок выбора и ${regularButtons.length} обычных кнопок`);
            
            // Добавляем кнопки выбора с отметками о состоянии
            console.log(`🔧 ГЕНЕРАТОР: Создаем ${selectionButtons.length} кнопок выбора для узла ${nodeId}`);
            selectionButtons.forEach((button, index) => {
              // Используем короткие callback_data
              const shortNodeId = generateUniqueShortId(nodeId, allNodeIds || []); // Используем новую функцию
              const shortTarget = (button.target || button.id || 'btn').slice(-8);
              const callbackData = `ms_${shortNodeId}_${shortTarget}`;
              console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Кнопка ${index + 1}: "${button.text}" -> ${callbackData} (shortNodeId: ${shortNodeId}) (длина: ${callbackData.length})`);
              code += `    # Кнопка выбора ${index + 1}: ${button.text}\n`;
              code += `    logging.info(f"🔘 Создаем кнопку: ${button.text} -> ${callbackData}")\n`;
              code += `    selected_mark = "✅ " if "${button.text}" in user_data[user_id]["multi_select_${nodeId}"] else ""\n`;
              code += `    builder.add(InlineKeyboardButton(text=f"{selected_mark}${button.text}", callback_data="${callbackData}"))\n`;
            });
            
            // Добавляем кнопку "Готово" для множественного выбора
            console.log(`🔧 ГЕНЕРАТОР: НАЧИНАЕМ создание кнопки "Готово" для узла ${nodeId}`);
            console.log(`🔧 ГЕНЕРАТОР: allowMultipleSelection = ${targetNode.data.allowMultipleSelection}`);
            console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget = ${targetNode.data.continueButtonTarget}`);
            console.log(`🔧 ГЕНЕРАТОР: selectionButtons.length = ${selectionButtons.length}`);
            
            // ВСЕГДА добавляем кнопку "Готово" если есть кнопки выбора
            if (selectionButtons.length > 0) {
              console.log(`🔧 ГЕНЕРАТОР: ✅ ДОБАВЛЯЕМ кнопку "Готово" (есть ${selectionButtons.length} кнопок выбора)`);
              code += '    # Кнопка "Готово" для множественного выбора\n';
              const shortNodeIdDone = nodeId.slice(-10).replace(/^_+/, ''); // Убираем ведущие underscores
              const doneCallbackData = `done_${shortNodeIdDone}`;
              console.log(`🔧 ГЕНЕРАТОР: Кнопка "Готово" -> ${doneCallbackData} (длина: ${doneCallbackData.length})`);
              console.log(`🔧 ГЕНЕРАТОР: ГЕНЕРИРУЕМ код кнопки "Готово"!`);
              
              code += `    logging.info(f"🔘 Создаем кнопку Готово -> ${doneCallbackData}")\n`;
              code += `    builder.add(InlineKeyboardButton(text="Готово", callback_data="${doneCallbackData}"))\n`;
              
              console.log(`🔧 ГЕНЕРАТОР: ✅ УСПЕШНО добавили кнопку "Готово" в код генерации`);
            } else {
              console.log(`🔧 ГЕНЕРАТОР: ❌ НЕ добавляем кнопку "Готово" - нет кнопок выбора`);
            }  
            
            // Добавляем обычные кнопки (navigation и другие)
            regularButtons.forEach((btn: Button, index: number) => {
              if (btn.action === "goto" && btn.target) {
                const btnCallbackData = `${btn.target}_btn_${index}`;
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
              } else if (btn.action === "url") {
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
              }
            });
            
            // Автоматическое распределение колонок для множественного выбора
            const totalButtons = selectionButtons.length + (targetNode.data.continueButtonTarget ? 1 : 0) + regularButtons.length;
            // Для множественного выбора всегда используем nodeData с включенным флагом
            const multiSelectNodeData = { ...targetNode.data, allowMultipleSelection: true };
            const columns = calculateOptimalColumns(selectionButtons, multiSelectNodeData);
            code += `    builder.adjust(${columns})\n`;
            code += '    keyboard = builder.as_markup()\n';
            
          } else if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            // Обычные кнопки без множественного выбора
            // ИСПРАВЛЕНИЕ: Проверяем keyboardType узла и генерируем соответствующую клавиатуру
            if (targetNode.data.keyboardType === 'reply') {
              // Генерируем reply клавиатуру
              code += '    # Create reply keyboard\n';
              code += '    # Удаляем старое сообщение и отправляем новое с reply клавиатурой\n';
              code += '    builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button) => {
                if (btn.action === "contact" && btn.requestContact) {
                  code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
                } else if (btn.action === "location" && btn.requestLocation) {
                  code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
                } else {
                  code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
                }
              });
              const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
              const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
              code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              code += '    # Для reply клавиатуры нужно отправить новое сообщение\n';
              code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
              
              // Проверяем автопереход для reply клавиатуры
              const currentNodeForReplyAutoTransition = nodes.find(n => n.id === nodeId);
              let replyAutoTransitionTarget: string | null = null;
              if (currentNodeForReplyAutoTransition?.data.enableAutoTransition && currentNodeForReplyAutoTransition?.data.autoTransitionTo) {
                replyAutoTransitionTarget = currentNodeForReplyAutoTransition.data.autoTransitionTo;
              } else if (currentNodeForReplyAutoTransition && (!currentNodeForReplyAutoTransition.data.buttons || currentNodeForReplyAutoTransition.data.buttons.length === 0)) {
                const outgoingConnections = connections.filter(conn => conn.source === nodeId);
                if (outgoingConnections.length === 1) {
                  replyAutoTransitionTarget = outgoingConnections[0].target;
                }
              }
              
              if (replyAutoTransitionTarget) {
                const safeFunctionName = replyAutoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
                code += '    \n';
                code += '    # АВТОПЕРЕХОД после reply клавиатуры\n';
                code += `    logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${replyAutoTransitionTarget}")\n`;
                code += `    await handle_callback_${safeFunctionName}(callback_query)\n`;
                code += `    logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${replyAutoTransitionTarget}")\n`;
              }
              
              code += '    return  # Возвращаемся чтобы не отправить сообщение дважды\n';
            } else {
              // Генерируем inline клавиатуру (по умолчанию)
              code += '    # Create inline keyboard\n';
              code += '    builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "goto" && btn.target) {
                  const btnCallbackData = `${btn.target}_btn_${index}`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btnCallbackData}"))\n`;
                } else if (btn.action === "url") {
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === "command" && btn.target) {
                  // ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд
                  const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                  code += `    # Кнопка команды: ${btn.text} -> ${btn.target}\n`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
                } else if (btn.action === "selection") {
                  // Добавляем поддержку кнопок выбора для обычных узлов
                  const callbackData = `multi_select_${nodeId}_${btn.target || btn.id}`;
                  code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              code += '    keyboard = builder.as_markup()\n';
            }
          } else {
            code += '    keyboard = None\n';
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем условную клавиатуру и используем её если есть
          code += '    \n';
          code += '    # Проверяем, есть ли условная клавиатура для использования\n';
          code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';
          code += '        keyboard = conditional_keyboard\n';
          code += '        logging.info("✅ Используем условную клавиатуру для навигации")\n';
          code += '    \n';
          
          // Send message with keyboard
          code += '    # Отправляем сообщение\n';
          code += '    try:\n';
          code += '        if keyboard:\n';
          code += '            await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n';
          code += '        else:\n';
          code += '            # Для узлов без кнопок просто отправляем новое сообщение (избегаем дубликатов при автопереходах)\n';
          code += '            await callback_query.message.answer(text)\n';
          code += '    except Exception as e:\n';
          code += '        logging.debug(f"Ошибка отправки сообщения: {e}")\n';
          code += '        if keyboard:\n';
          code += '            await callback_query.message.answer(text, reply_markup=keyboard)\n';
          code += '        else:\n';
          code += '            await callback_query.message.answer(text)\n';
          code += '    \n';
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем автопереход сразу после отправки сообщения
          const currentNodeForAutoTransition = nodes.find(n => n.id === nodeId);
          
          // Для узлов без кнопок проверяем автопереход либо по флагу enableAutoTransition, либо по единственному соединению
          let autoTransitionTarget: string | null = null;
          
          // Сначала проверяем явный автопереход через флаг
          if (currentNodeForAutoTransition?.data.enableAutoTransition && currentNodeForAutoTransition?.data.autoTransitionTo) {
            autoTransitionTarget = currentNodeForAutoTransition.data.autoTransitionTo;
            console.log(`✅ ГЕНЕРАТОР: Узел ${nodeId} имеет явный автопереход к ${autoTransitionTarget}`);
          } 
          // Если узел не имеет кнопок и имеет ровно одно исходящее соединение, делаем автопереход
          else if (currentNodeForAutoTransition && (!currentNodeForAutoTransition.data.buttons || currentNodeForAutoTransition.data.buttons.length === 0)) {
            const outgoingConnections = connections.filter(conn => conn.source === nodeId);
            console.log(`🔍 ГЕНЕРАТОР: Узел ${nodeId} без кнопок, проверяем соединения: ${outgoingConnections.length}`);
            if (outgoingConnections.length === 1) {
              autoTransitionTarget = outgoingConnections[0].target;
              console.log(`🔗 ГЕНЕРАТОР: Узел ${nodeId} без кнопок имеет одно соединение к ${autoTransitionTarget}, делаем автопереход`);
            }
          }
          
          if (autoTransitionTarget) {
            const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
            console.log(`✅ ГЕНЕРАТОР АВТОПЕРЕХОД: Добавляем код автоперехода для узла ${nodeId} -> ${autoTransitionTarget}`);
            code += '    # АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла\n';
            code += '    user_id = callback_query.from_user.id\n';
            code += '    if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n';
            code += `        logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${nodeId}")\n`;
            code += '    else:\n';
            code += `        # ⚡ Автопереход к узлу ${autoTransitionTarget}\n`;
            code += `        logging.info(f"⚡ Автопереход от узла ${nodeId} к узлу ${autoTransitionTarget}")\n`;
            code += `        await handle_callback_${safeFunctionName}(callback_query)\n`;
            code += `        logging.info(f"✅ Автопереход выполнен: ${nodeId} -> ${autoTransitionTarget}")\n`;
            code += `        return\n`;
            code += '    \n';
          }
          
          // Сохраняем нажатие кнопки в базу данных ТОЛЬКО если это реальная кнопка
          code += '    user_id = callback_query.from_user.id\n';
          code += '    \n';
          
          // Генерируем код для поиска текста кнопки
          const sourceNode = nodes.find(n => 
            n.data.buttons && n.data.buttons.some(btn => btn.target === nodeId)
          );
          
          // Если к узлу ведут несколько кнопок, нужно определить, какую именно нажали
          let buttonsToTargetNode = [];
          if (sourceNode) {
            buttonsToTargetNode = sourceNode.data.buttons.filter(btn => btn.target === nodeId);
          }
          
          // Сохраняем button_click ТОЛЬКО если есть sourceNode (реальная кнопка, а не автопереход)
          if (sourceNode) {
            code += '    # Сохраняем нажатие кнопки в базу данных\n';
            code += '    # Ищем текст кнопки по callback_data\n';
            
            if (buttonsToTargetNode.length > 1) {
              // Несколько кнопок ведут к одному узлу - создаем логику определения по callback_data
              code += `    # Определяем текст кнопки по callback_data\n`;
              code += `    button_display_text = "Неизвестная кнопка"\n`;
              buttonsToTargetNode.forEach((button, index) => {
                // Проверяем по суффиксу _btn_index в callback_data
                code += `    if callback_query.data.endswith("_btn_${index}"):\n`;
                code += `        button_display_text = "${button.text}"\n`;
              });
              
              // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ищем кнопку по точному соответствию callback_data с nodeId
              code += `    # Дополнительная проверка по точному соответствию callback_data\n`;
              buttonsToTargetNode.forEach((button) => {
                code += `    if callback_query.data == "${nodeId}":\n`;
                // Для случая когда несколько кнопок ведут к одному узлу, используем первую найденную
                code += `        button_display_text = "${button.text}"\n`;
              });
            } else {
              const button = sourceNode.data.buttons.find(btn => btn.target === nodeId);
              if (button) {
                code += `    button_display_text = "${button.text}"\n`;
              } else {
                code += `    button_display_text = "Кнопка ${nodeId}"\n`;
              }
            }
            code += '    \n';
            code += '    # Сохраняем ответ в базу данных\n';

            code += '    timestamp = get_moscow_time()\n';
            code += '    \n';
            code += '    response_data = button_display_text  # Простое значение\n';
            code += '    \n';
            code += '    # Сохраняем в пользовательские данные\n';
            code += '    if user_id not in user_data:\n';
            code += '        user_data[user_id] = {}\n';
            code += '    user_data[user_id]["button_click"] = button_display_text\n';
          }
          
          // Определяем переменную для сохранения на основе кнопки (ТОЛЬКО если есть sourceNode)
          if (sourceNode) {
            code += '    \n';
            const parentNode = nodes.find(n => 
              n.data.buttons && n.data.buttons.some(btn => btn.target === nodeId)
            );
            
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
            } else if (parentNode && parentNode.data.inputVariable) {
              variableName = parentNode.data.inputVariable;
              
              // Ищем конкретную кнопку и её значение
              const button = parentNode.data.buttons.find(btn => btn.target === nodeId);
              if (button) {
                // Определяем значение переменной в зависимости от кнопки
                if (button.id === 'btn_search' || nodeId === 'source_search') {
                  variableValue = '"из инета"';
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
                    variableValue = `"${button.text}"`;
                  }
                } else {
                  variableValue = 'button_display_text';
                }
              }
            }
            
            code += '    # Сохраняем в базу данных с правильным именем переменной\n';
            code += `    await update_user_data_in_db(user_id, "${variableName}", ${variableValue})\n`;
            code += `    logging.info(f"Переменная ${variableName} сохранена: " + str(${variableValue}) + f" (пользователь {user_id})")\n`;
            code += '    \n';
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Для узлов с множественным выбором НЕ делаем автоматической переадресации
          const currentNode = nodes.find(n => n.id === nodeId);
          
          // Для узлов с множественным выбором - НЕ делаем автоматический переход при первичном заходе в узел
          // ИСПРАВЛЕНИЕ: редирект только для узлов с кнопками, чтобы избежать дублирования сообщений при автопереходах
          const hasButtons = currentNode && currentNode.data.buttons && currentNode.data.buttons.length > 0;
          const shouldRedirect = hasButtons && !(currentNode && currentNode.data.allowMultipleSelection);
          console.log(`🔧 ГЕНЕРАТОР КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Узел ${nodeId} hasButtons: ${hasButtons}, allowMultipleSelection: ${currentNode?.data.allowMultipleSelection}, shouldRedirect: ${shouldRedirect}`);
          
          let redirectTarget = nodeId; // По умолчанию остаемся в том же узле
          
          if (shouldRedirect) {
            if (currentNode && currentNode.data.continueButtonTarget) {
              // Для обычных узлов используем continueButtonTarget если есть
              redirectTarget = currentNode.data.continueButtonTarget;
              console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит к continueButtonTarget ${redirectTarget}`);
            } else {
              // Для обычных узлов ищем следующий узел через соединения
              const nodeConnections = connections.filter(conn => conn.source === nodeId);
              if (nodeConnections.length > 0) {
                redirectTarget = nodeConnections[0].target;
                console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} переходит через соединение к ${redirectTarget}`);
              } else {
                console.log(`🔧 ГЕНЕРАТОР REDIRECTTARGET: Узел ${nodeId} остается в том же узле (нет соединений)`);
              }
            }
          } else {
            console.log(`🔧 ГЕНЕРАТОР: Узел ${nodeId} без кнопок или с множественным выбором - НЕ делаем автоматическую переадресацию`);
          }
          
          if (shouldRedirect && redirectTarget && redirectTarget !== nodeId) {
            code += '    # ПЕРЕАДРЕСАЦИЯ: Переходим к следующему узлу после сохранения данных\n';
            code += `    next_node_id = "${redirectTarget}"\n`;
            code += '    try:\n';
            code += '        logging.info(f"🚀 Переходим к следующему узлу после выбора кнопки: {next_node_id}")\n';
            
            // Добавляем навигацию для каждого узла
            if (nodes.length > 0) {
              nodes.forEach((navTargetNode, index) => {
                const condition = index === 0 ? 'if' : 'elif';
                code += `        ${condition} next_node_id == "${navTargetNode.id}":\n`;
                
                if (navTargetNode.type === 'message') {
                  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                  if (navTargetNode.data.allowMultipleSelection === true) {
                    // Для узлов с множественным выбором вызываем полноценный обработчик
                    const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
                    code += `            # Узел с множественным выбором - вызываем полноценный обработчик\n`;
                    code += `            logging.info(f"🔧 Callback навигация к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                    code += `            await handle_callback_${safeFunctionName}(callback_query)\n`;
                  } else {
                    // Проверяем, есть ли условные сообщения для этого узла
                    const hasConditionalMessages = navTargetNode.data.enableConditionalMessages && 
                                                  navTargetNode.data.conditionalMessages && 
                                                  navTargetNode.data.conditionalMessages.length > 0;
                    
                    if (hasConditionalMessages && navTargetNode.data.collectUserInput === true) {
                      // Для узлов с условными сообщениями вызываем полноценный обработчик
                      const safeFunctionName = navTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
                      code += `            # Узел с условными сообщениями - вызываем полноценный обработчик\n`;
                      code += `            logging.info(f"🔧 Callback навигация к узлу с условными сообщениями: ${navTargetNode.id}")\n`;
                      code += `            await handle_node_${safeFunctionName}(callback_query.message)\n`;
                    } else {
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `            nav_text = ${formattedText}\n`;
                      
                      // Добавляем замену переменных в nav_text
                      code += '            # Подставляем переменные пользователя в текст\n';
                      code += '            nav_user_vars = await get_user_from_db(callback_query.from_user.id)\n';
                      code += '            if not nav_user_vars:\n';
                      code += '                nav_user_vars = user_data.get(callback_query.from_user.id, {})\n';
                      code += '            if not isinstance(nav_user_vars, dict):\n';
                      code += '                nav_user_vars = {}\n';
                      code += '            # Заменяем переменные в nav_text\n';
                      code += '            for var_name, var_data in nav_user_vars.items():\n';
                      code += '                placeholder = "{" + var_name + "}"\n';
                      code += '                if placeholder in nav_text:\n';
                      code += '                    if isinstance(var_data, dict) and "value" in var_data:\n';
                      code += '                        var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n';
                      code += '                    elif var_data is not None:\n';
                      code += '                        var_value = str(var_data)\n';
                      code += '                    else:\n';
                      code += '                        var_value = var_name\n';
                      code += '                    nav_text = nav_text.replace(placeholder, var_value)\n';
                      
                      // Проверяем, есть ли прикрепленные медиа
                      const hasAttachedMedia = navTargetNode.data.attachedMedia && navTargetNode.data.attachedMedia.length > 0;
                      
                      if (hasAttachedMedia) {
                        // Генерируем код для отправки медиа
                        const attachedMedia = navTargetNode.data.attachedMedia;
                        code += '            # Проверяем наличие прикрепленного медиа\n';
                        code += `            nav_attached_media = None\n`;
                        code += `            if nav_user_vars and "${attachedMedia[0]}" in nav_user_vars:\n`;
                        code += `                media_data = nav_user_vars["${attachedMedia[0]}"]\n`;
                        code += `                if isinstance(media_data, dict) and "value" in media_data:\n`;
                        code += `                    nav_attached_media = media_data["value"]\n`;
                        code += `                elif isinstance(media_data, str):\n`;
                        code += `                    nav_attached_media = media_data\n`;
                        code += `            if nav_attached_media and str(nav_attached_media).strip():\n`;
                        code += `                logging.info(f"📎 Отправка фото из переменной ${attachedMedia[0]}: {nav_attached_media}")\n`;
                        code += `                await bot.send_photo(callback_query.from_user.id, nav_attached_media, caption=nav_text)\n`;
                        code += `            else:\n`;
                        code += `                logging.info("📝 Медиа не найдено, отправка текстового сообщения")\n`;
                        code += `                await callback_query.message.edit_text(nav_text)\n`;
                      } else {
                        // Проверяем, есть ли reply кнопки
                        if (navTargetNode.data.keyboardType === 'reply' && navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                          code += '            # Удаляем старое сообщение и отправляем новое с reply клавиатурой\n';
                          code += '            builder = ReplyKeyboardBuilder()\n';
                          navTargetNode.data.buttons.forEach((button: Button) => {
                            if (button.action === "contact" && button.requestContact) {
                              code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                            } else if (button.action === "location" && button.requestLocation) {
                              code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                            } else {
                              code += `            builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                            }
                          });
                          const resizeKeyboard = toPythonBoolean(navTargetNode.data.resizeKeyboard);
                          const oneTimeKeyboard = toPythonBoolean(navTargetNode.data.oneTimeKeyboard);
                          code += `            keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
                          code += '            await bot.send_message(callback_query.from_user.id, nav_text, reply_markup=keyboard)\n';
                        } else {
                          code += '            await callback_query.message.edit_text(nav_text)\n';
                        }
                      }
                      
                      // Если узел message собирает ввод, настраиваем ожидание
                      if (navTargetNode.data.collectUserInput === true) {
                        const inputType = navTargetNode.data.inputType || 'text';
                        // ИСПРАВЛЕНИЕ: Берем inputVariable именно из целевого узла, а не из родительского
                        const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                        const inputTargetNodeId = navTargetNode.data.inputTargetNodeId;
                        
                        code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                        code += '            user_id = callback_query.from_user.id\n';
                        code += '            if user_id not in user_data:\n';
                        code += '                user_data[user_id] = {}\n';
                        code += `            # Проверяем, не была ли переменная ${inputVariable} уже сохранена\n`;
                        code += `            if "${inputVariable}" not in user_data[user_id] or not user_data[user_id]["${inputVariable}"]:\n`;
                        code += '                # Переменная не сохранена - используем универсальную функцию для настройки ожидания ввода\n';
                        // ИСПРАВЛЕНИЕ: Используем generateWaitingStateCode с правильным контекстом callback_query
                        code += generateWaitingStateCode(navTargetNode, '                ', 'callback_query.from_user.id').split('\n').map(line => line ? '            ' + line : '').join('\n');
                        code += '            else:\n';
                        code += `                logging.info(f"⏭️ Переменная ${inputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                      }
                      
                      // АВТОПЕРЕХОД: Если у узла есть enableAutoTransition, переходим к следующему узлу
                      if (navTargetNode.data.enableAutoTransition && navTargetNode.data.autoTransitionTo) {
                        const autoTargetId = navTargetNode.data.autoTransitionTo;
                        const safeAutoTargetId = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
                        code += '            \n';
                        code += '            # Проверяем, не ждем ли мы ввод перед автопереходом\n';
                        code += '            if user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n';
                        code += `                logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${navTargetNode.id}")\n`;
                        code += '            else:\n';
                        code += `                # ⚡ Автопереход к узлу ${autoTargetId}\n`;
                        code += `                logging.info(f"⚡ Автопереход от узла ${navTargetNode.id} к узлу ${autoTargetId}")\n`;
                        code += `                await handle_callback_${safeAutoTargetId}(callback_query)\n`;
                        code += `                logging.info(f"✅ Автопереход выполнен: ${navTargetNode.id} -> ${autoTargetId}")\n`;
                        code += '                return\n';
                      }
                    }
                  }
                } else if (navTargetNode.type === 'command') {
                  // Для узлов команд вызываем соответствующий обработчик
                  const commandName = navTargetNode.data.command?.replace('/', '') || 'unknown';
                  const handlerName = `${commandName}_handler`;
                  code += `            # Выполняем команду ${navTargetNode.data.command}\n`;
                  code += '            from types import SimpleNamespace\n';
                  code += '            fake_message = SimpleNamespace()\n';
                  code += '            fake_message.from_user = callback_query.from_user\n';
                  code += '            fake_message.chat = callback_query.message.chat\n';
                  code += '            fake_message.date = callback_query.message.date\n';
                  code += '            fake_message.answer = callback_query.message.answer\n';
                  code += `            await ${handlerName}(fake_message)\n`;
                } else if (navTargetNode.type === 'keyboard' && (navTargetNode.data.enableTextInput || 
                                                                  navTargetNode.data.enablePhotoInput || 
                                                                  navTargetNode.data.enableVideoInput || 
                                                                  navTargetNode.data.enableAudioInput || 
                                                                  navTargetNode.data.enableDocumentInput)) {
                  // Обрабатываем узлы ввода текста/медиа с поддержкой условных сообщений
                  const messageText = navTargetNode.data.messageText || 'Введите ваш ответ:';
                  const inputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                  const inputTargetNodeId = navTargetNode.data.inputTargetNodeId || '';
                  
                  // Проверяем, есть ли условные сообщения для этого узла
                  const hasConditionalMessages = navTargetNode.data.enableConditionalMessages && 
                                                navTargetNode.data.conditionalMessages && 
                                                navTargetNode.data.conditionalMessages.length > 0;
                  
                  if (hasConditionalMessages) {
                    // Если есть условные сообщения, генерируем их обработку
                    code += '            # Узел с условными сообщениями - проверяем условия\n';
                    code += '            user_id = callback_query.from_user.id\n';
                    code += '            user_data_dict = await get_user_from_db(user_id) or {}\n';
                    code += '            user_data_dict.update(user_data.get(user_id, {}))\n\n';
                    
                    // Добавляем определение функции check_user_variable в локальную область видимости
                    code += '            # Функция для проверки переменных пользователя\n';
                    code += '            def check_user_variable(var_name, user_data_dict):\n';
                    code += '                """Проверяет существование и получает значение переменной пользователя"""\n';
                    code += '                # Сначала проверяем в поле user_data (из БД)\n';
                    code += '                if "user_data" in user_data_dict and user_data_dict["user_data"]:\n';
                    code += '                    try:\n';
                    code += '                        import json\n';
                    code += '                        parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n';
                    code += '                        if var_name in parsed_data:\n';
                    code += '                            raw_value = parsed_data[var_name]\n';
                    code += '                            if isinstance(raw_value, dict) and "value" in raw_value:\n';
                    code += '                                var_value = raw_value["value"]\n';
                    code += '                                # Проверяем, что значение действительно существует и не пустое\n';
                    code += '                                if var_value is not None and str(var_value).strip() != "":\n';
                    code += '                                    return True, str(var_value)\n';
                    code += '                            else:\n';
                    code += '                                # Проверяем, что значение действительно существует и не пустое\n';
                    code += '                                if raw_value is not None and str(raw_value).strip() != "":\n';
                    code += '                                    return True, str(raw_value)\n';
                    code += '                    except (json.JSONDecodeError, TypeError):\n';
                    code += '                        pass\n';
                    code += '                \n';
                    code += '                # Проверяем в локальных данных (без вложенности user_data)\n';
                    code += '                if var_name in user_data_dict:\n';
                    code += '                    variable_data = user_data_dict.get(var_name)\n';
                    code += '                    if isinstance(variable_data, dict) and "value" in variable_data:\n';
                    code += '                        var_value = variable_data["value"]\n';
                    code += '                        # Проверяем, что значение действительно существует и не пустое\n';
                    code += '                        if var_value is not None and str(var_value).strip() != "":\n';
                    code += '                            return True, str(var_value)\n';
                    code += '                    elif variable_data is not None and str(variable_data).strip() != "":\n';
                    code += '                        return True, str(variable_data)\n';
                    code += '                \n';
                    code += '                return False, None\n\n';
                    
                    // Генерируем условную логику для этого узла
                    const conditionalMessages = navTargetNode.data.conditionalMessages.sort((a, b) => (b.priority || 0) - (a.priority || 0));
                    
                    // Создаем единую if/elif/else структуру для всех условий
                    for (let i = 0; i < conditionalMessages.length; i++) {
                      const condition = conditionalMessages[i];
                      const cleanedConditionText = stripHtmlTags(condition.messageText);
                      const conditionText = formatTextForPython(cleanedConditionText);
                      const conditionKeyword = i === 0 ? 'if' : 'elif';
                      
                      // Get variable names - support both new array format and legacy single variable
                      const variableNames = condition.variableNames && condition.variableNames.length > 0 
                        ? condition.variableNames 
                        : (condition.variableName ? [condition.variableName] : []);
                      
                      const logicOperator = condition.logicOperator || 'AND';
                      
                      code += `            # Условие ${i + 1}: ${condition.condition} для переменных: ${variableNames.join(', ')}\n`;
                      
                      if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                        // Создаем единый блок условия с проверками ВНУТРИ
                        code += `            ${conditionKeyword} (\n`;
                        for (let j = 0; j < variableNames.length; j++) {
                          const varName = variableNames[j];
                          const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                          code += `                check_user_variable("${varName}", user_data_dict)[0]${operator}\n`;
                        }
                        code += `            ):\n`;
                        
                        // Внутри блока условия собираем значения переменных
                        code += `                # Собираем значения переменных\n`;
                        code += `                variable_values = {}\n`;
                        for (const varName of variableNames) {
                          code += `                _, variable_values["${varName}"] = check_user_variable("${varName}", user_data_dict)\n`;
                        }
                        
                        code += `                text = ${conditionText}\n`;
                        
                        // Заменяем переменные в тексте
                        for (const varName of variableNames) {
                          code += `                if "{${varName}}" in text and variable_values["${varName}"] is not None:\n`;
                          code += `                    text = text.replace("{${varName}}", variable_values["${varName}"])\n`;
                        }
                        
                        // Генерируем клавиатуру для условного сообщения если она есть
                        if (condition.keyboardType && condition.keyboardType !== 'none' && condition.buttons && condition.buttons.length > 0) {
                          code += '                # Создаем клавиатуру для условного сообщения\n';
                          
                          if (condition.keyboardType === 'inline') {
                            code += '                builder = InlineKeyboardBuilder()\n';
                            condition.buttons.forEach((button: Button) => {
                              if (button.action === "url") {
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
                              } else if (button.action === 'goto') {
                                const callbackData = button.target || button.id || 'no_action';
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                              } else if (button.action === 'command') {
                                // Для кнопок команд создаем специальную callback_data
                                const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
                              } else {
                                const callbackData = button.target || button.id || 'no_action';
                                code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
                              }
                            });
                            code += '                conditional_keyboard = builder.as_markup()\n';
                            code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                          } else if (condition.keyboardType === 'reply') {
                            code += '                builder = ReplyKeyboardBuilder()\n';
                            condition.buttons.forEach((button: Button) => {
                              if (button.action === "contact" && button.requestContact) {
                                code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
                              } else if (button.action === "location" && button.requestLocation) {
                                code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
                              } else {
                                code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
                              }
                            });
                            code += '                conditional_keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)\n';
                            code += '                await bot.send_message(user_id, text, reply_markup=conditional_keyboard)\n';
                          }
                        } else {
                          // Нет клавиатуры - отправляем только текст
                          code += '                await bot.send_message(user_id, text)\n';
                        }
                        
                        // Настраиваем ожидание текстового ввода для условного сообщения (если нужно)
                        if (condition.waitForTextInput) {
                          // ИСПРАВЛЕНИЕ: Используем переменную из условия или из целевого узла
                          const conditionalInputVariable = condition.textInputVariable || navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                          code += `                # Настраиваем ожидание текстового ввода для условного сообщения\n`;
                          code += `                user_data[user_id]["waiting_for_input"] = {\n`;
                          code += `                    "type": "text",\n`;
                          code += `                    "variable": "${conditionalInputVariable}",\n`;
                          code += `                    "save_to_database": True,\n`;
                          code += `                    "node_id": "${navTargetNode.id}",\n`;
                          code += `                    "next_node_id": "${condition.nextNodeAfterInput || inputTargetNodeId}"\n`;
                          code += `                }\n`;
                          code += `                logging.info(f"🔧 Настроено условное ожидание ввода для переменной: ${conditionalInputVariable} (узел ${navTargetNode.id})")\n`;
                        }
                      }
                    }
                    
                    // Fallback сообщение
                    code += `            else:\n`;
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      // Для узлов с множественным выбором создаем прямую навигацию
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `                # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                      code += `                logging.info(f"🔧 Fallback переход к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                      code += `                text = ${formattedText}\n`;
                      
                      // Замена переменных
                      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
                      code += generateUniversalVariableReplacement('                ');
                      
                      // Инициализируем состояние множественного выбора
                      code += `                # Инициализируем состояние множественного выбора\n`;
                      code += `                user_data[user_id]["multi_select_${navTargetNode.id}"] = []\n`;
                      code += `                user_data[user_id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                      code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
                      if (navTargetNode.data.multiSelectVariable) {
                        code += `                user_data[user_id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                      }
                      
                      // Создаем inline клавиатуру с кнопками выбора
                      if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(navTargetNode.data.buttons, '                ', navTargetNode.id, navTargetNode.data, allNodeIds);
                        code += `                await bot.send_message(user_id, text, reply_markup=keyboard)\n`;
                      } else {
                        code += `                await bot.send_message(user_id, text)\n`;
                      }
                      code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполнена")\n`;
                    } else {
                      const formattedText = formatTextForPython(messageText);
                      // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                      const fallbackInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                      code += `                # Fallback сообщение\n`;
                      code += `                nav_text = ${formattedText}\n`;
                      // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                      if (navTargetNode.data.collectUserInput === true) {
                      code += `                # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n`;
                      code += `                if "${fallbackInputVariable}" not in user_data[user_id] or not user_data[user_id]["${fallbackInputVariable}"]:\n`;
                      code += `                    # Настраиваем ожидание ввода\n`;
                      code += `                    user_data[user_id]["waiting_for_input"] = {\n`;
                      code += `                        "type": "text",\n`;
                      code += `                        "variable": "${fallbackInputVariable}",\n`;
                      code += `                        "save_to_database": True,\n`;
                      code += `                        "node_id": "${navTargetNode.id}",\n`;
                      code += `                        "next_node_id": "${inputTargetNodeId}"\n`;
                      code += `                    }\n`;
                      code += `                    logging.info(f"🔧 Настроено fallback ожидание ввода для переменной: ${fallbackInputVariable} (узел ${navTargetNode.id})")\n`;
                      code += `                else:\n`;
                        code += `                    logging.info(f"⏭️ Переменная ${fallbackInputVariable} уже сохранена, пропускаем fallback ожидание ввода")\n`;
                      } else {
                        code += `                logging.info(f"Fallback переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                      }
                      code += `                await bot.send_message(user_id, nav_text)\n`;
                    }
                  } else {
                    // Обычный узел без условных сообщений
                    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
                    if (navTargetNode.data.allowMultipleSelection === true) {
                      // Для узлов с множественным выбором создаем прямую навигацию
                      const messageText = navTargetNode.data.messageText || 'Сообщение';
                      const formattedText = formatTextForPython(messageText);
                      code += `            # Прямая навигация к узлу с множественным выбором ${navTargetNode.id}\n`;
                      code += `            logging.info(f"🔧 Переходим к узлу с множественным выбором: ${navTargetNode.id}")\n`;
                      code += `            text = ${formattedText}\n`;
                      
                      // Замена переменных
                      code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                      code += generateUniversalVariableReplacement('            ');
                      
                      // Инициализируем состояние множественного выбора
                      code += `            # Инициализируем состояние множественного выбора\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_${navTargetNode.id}"] = []\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_node"] = "${navTargetNode.id}"\n`;
                      code += `            user_data[callback_query.from_user.id]["multi_select_type"] = "selection"\n`;
                      if (navTargetNode.data.multiSelectVariable) {
                        code += `            user_data[callback_query.from_user.id]["multi_select_variable"] = "${navTargetNode.data.multiSelectVariable}"\n`;
                      }
                      
                      // Создаем inline клавиатуру с кнопками выбора
                      if (navTargetNode.data.buttons && navTargetNode.data.buttons.length > 0) {
                        code += generateInlineKeyboardCode(navTargetNode.data.buttons, '            ', navTargetNode.id, navTargetNode.data, allNodeIds);
                        code += `            await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n`;
                      } else {
                        code += `            await bot.send_message(callback_query.from_user.id, text)\n`;
                      }
                      code += `            logging.info(f"✅ Прямая навигация к узлу множественного выбора ${navTargetNode.id} выполнена")\n`;
                    } else {
                      const formattedText = formatTextForPython(messageText);
                      code += `            nav_text = ${formattedText}\n`;
                    
                      // ВАЖНО: Проверяем, включен ли сбор пользовательского ввода для этого узла
                      if (navTargetNode.data.collectUserInput === true) {
                        // ИСПРАВЛЕНИЕ: Используем переменную из целевого узла
                        const regularInputVariable = navTargetNode.data.inputVariable || `response_${navTargetNode.id}`;
                        code += '            # ИСПРАВЛЕНИЕ: Проверяем, не была ли переменная уже сохранена inline кнопкой\n';
                        code += '            user_data[callback_query.from_user.id] = user_data.get(callback_query.from_user.id, {})\n';
                        code += `            if "${regularInputVariable}" not in user_data[callback_query.from_user.id] or not user_data[callback_query.from_user.id]["${regularInputVariable}"]:\n`;
                        code += '                # Настраиваем ожидание ввода\n';
                        code += '                user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
                        code += '                    "type": "text",\n';
                        code += `                    "variable": "${regularInputVariable}",\n`;
                        code += '                    "save_to_database": True,\n';
                        code += `                    "node_id": "${navTargetNode.id}",\n`;
                        code += `                    "next_node_id": "${inputTargetNodeId}"\n`;
                        code += '                }\n';
                        code += `                logging.info(f"🔧 Настроено ожидание ввода для переменной: ${regularInputVariable} (узел ${navTargetNode.id})")\n`;
                        code += '            else:\n';
                        code += `                logging.info(f"⏭️ Переменная ${regularInputVariable} уже сохранена, пропускаем ожидание ввода")\n`;
                      } else {
                        code += `            logging.info(f"Переход к узлу ${navTargetNode.id} без сбора ввода")\n`;
                      }
                      code += '            await bot.send_message(callback_query.from_user.id, nav_text)\n';
                    }
                  }
                } else {
                  code += `            logging.info("Переход к узлу ${navTargetNode.id}")\n`;
                }
              });
              
              code += '        else:\n';
              code += '            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
            } else {
              code += '        # No nodes available for navigation\n';
              code += '        logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
            }
            
            code += '    except Exception as e:\n';
            code += '        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
            code += '    \n';
            code += '    return  # Завершаем обработку после переадресации\n';
          }
          code += '    \n';
          
          // Generate response based on node type
          if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
            // Handle input collection nodes
            const inputPrompt = targetNode.data.messageText || targetNode.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
            const responseType = targetNode.data.responseType || 'text';
            const inputType = targetNode.data.inputType || 'text';
            const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const saveToDatabase = targetNode.data.saveToDatabase || false;
            
            code += '    # Удаляем старое сообщение\n';
            code += '    \n';
            
            const formattedPrompt = formatTextForPython(inputPrompt);
            code += `    text = ${formattedPrompt}\n`;
            
            if (responseType === 'text') {
              // Find next node through connections
              const nextConnection = connections.find(conn => conn.source === targetNode.id);
              const nextNodeId = nextConnection ? nextConnection.target : null;
              
              code += '    # Настраиваем ожидание ввода\n';
              code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
              code += `        "type": "${inputType}",\n`;
              code += `        "variable": "${inputVariable}",\n`;
              code += `        "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
              code += `        "node_id": "${targetNode.id}",\n`;
              code += `        "next_node_id": "${nextNodeId || ''}"\n`;
              code += '    }\n';
              code += '    await bot.send_message(callback_query.from_user.id, text)\n';
            }
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем обязательный return в конец функции
          code += '    return\n';
        }
      }
    });
  }
  
  // Generate handlers for reply keyboard buttons
  const replyNodes = (nodes || []).filter(node => 
    node.data.keyboardType === 'reply' && node.data.buttons && node.data.buttons.length > 0
  );
  
  if (replyNodes.length > 0) {
    code += '\n# Обработчики reply кнопок\n';
    const processedReplyButtons = new Set<string>();
    
    replyNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.target) {
          const buttonText = button.text;
          
          // Avoid duplicate handlers
          if (processedReplyButtons.has(buttonText)) return;
          processedReplyButtons.add(buttonText);
          
          // Find target node
          const targetNode = nodes.find(n => n.id === button.target);
          if (targetNode) {
            code += `\n@dp.message(lambda message: message.text == "${buttonText}")\n`;
            // Создаем безопасное имя функции на основе button ID
            const safeFunctionName = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `async def handle_reply_${safeFunctionName}(message: types.Message):\n`;
            
            // Generate response for target node
            const targetText = targetNode.data.messageText || "Сообщение";
            const formattedTargetText = formatTextForPython(targetText);
            code += `    text = ${formattedTargetText}\n`;
            
            // Добавляем замену переменных для reply кнопок
            code += '    user_id = message.from_user.id\n';
            code += generateUniversalVariableReplacement('    ');
            
            // Handle keyboard for target node
            if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
              code += '    builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                code += `    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
              });
              const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
              const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
              code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              // Определяем режим форматирования для целевого узла
              let parseModeTarget = '';
              if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
              } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
              }
              code += `    await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
            
            // Дополнительно: сохраняем нажатие reply кнопки если включен сбор ответов
            code += '    \n';
            code += '    # Сохраняем нажатие reply кнопки если включен сбор ответов\n';
            code += '    user_id = message.from_user.id\n';
            code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
            code += '        import datetime\n';
            code += '        timestamp = get_moscow_time()\n';
            code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
            code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
            code += '        \n';
            code += '        response_data = {\n';
            code += `            "value": "${buttonText}",\n`;
            code += '            "type": "reply_button",\n';
            code += '            "timestamp": timestamp,\n';
            code += '            "nodeId": input_node_id,\n';
            code += '            "variable": input_variable,\n';
            code += '            "source": "reply_button_click"\n';
            code += '        }\n';
            code += '        \n';
            code += '        user_data[user_id][f"{input_variable}_button"] = response_data\n';
            code += '        logging.info(f"Reply кнопка сохранена: {input_variable}_button = ${buttonText} (пользователь {user_id})")\n';
            
            } else if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              // Добавляем поддержку условных сообщений для целевого узла
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    # Проверка условных сообщений для целевого узла\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
                code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
                code += '    use_conditional_keyboard = conditional_keyboard is not None\n';
              } else {
                code += '    # Инициализируем переменную для проверки условной клавиатуры\n';
                code += '    use_conditional_keyboard = False\n';
                code += '    conditional_keyboard = None\n';
              }
              
              code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
              code += '    if use_conditional_keyboard:\n';
              // Определяем режим форматирования для целевого узла
              let parseModeTarget = '';
              if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
              } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
              }
              code += `        await message.answer(text, reply_markup=conditional_keyboard${parseModeTarget})\n`;
              code += '    else:\n';
              code += '        builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach((btn: Button, index: number) => {
                if (btn.action === "url") {
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  // Если есть target, используем его, иначе используем ID кнопки как callback_data
                  const baseCallbackData = btn.target || btn.id || 'no_action'; const callbackData = `${baseCallbackData}_btn_${index}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                } else if (btn.action === 'command') {
                  // Для команд создаем специальный callback_data с префиксом cmd_
                  const commandName = btn.target ? btn.target.replace('/', '') : 'unknown';
                  const callbackData = `cmd_${commandName}`;
                  code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
                }
              });
              // Добавляем настройку колонок для консистентности
              const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
              code += `        builder.adjust(${columns})\n`;
              code += '        keyboard = builder.as_markup()\n';
              code += `        await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
            
            // Дополнительно: сохраняем нажатие reply кнопки если включен сбор ответов
            code += '    \n';
            code += '    # Сохраняем нажатие reply кнопки если включен сбор ответов\n';
            code += '    user_id = message.from_user.id\n';
            code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
            code += '        import datetime\n';
            code += '        timestamp = get_moscow_time()\n';
            code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
            code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
            code += '        \n';
            code += '        response_data = {\n';
            code += `            "value": "${buttonText}",\n`;
            code += '            "type": "reply_button",\n';
            code += '            "timestamp": timestamp,\n';
            code += '            "nodeId": input_node_id,\n';
            code += '            "variable": input_variable,\n';
            code += '            "source": "reply_button_click"\n';
            code += '        }\n';
            code += '        \n';
            code += '        user_data[user_id][f"{input_variable}_button"] = response_data\n';
            code += '        logging.info(f"Reply кнопка сохранена: {input_variable}_button = ${buttonText} (пользователь {user_id})")\n';
            
            } else {
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем проверку условных сообщений для узлов без кнопок
              if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
                code += '    # Проверка условных сообщений для целевого узла\n';
                code += '    conditional_parse_mode = None\n';
                code += '    conditional_keyboard = None\n';
                code += '    user_record = await get_user_from_db(user_id)\n';
                code += '    if not user_record:\n';
                code += '        user_record = user_data.get(user_id, {})\n';
                code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
                code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '    ');
                code += '    \n';
              }
              
              code += '    # Отправляем сообщение с учетом условной клавиатуры\n';
              code += '    if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n';
              code += '        # Используем условную клавиатуру\n';
              // Определяем режим форматирования для целевого узла
              let parseModeTarget = '';
              if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
                parseModeTarget = ', parse_mode=ParseMode.MARKDOWN';
              } else if (targetNode.data.formatMode === 'html') {
                parseModeTarget = ', parse_mode=ParseMode.HTML';
              }
              code += `        await message.answer(text, reply_markup=conditional_keyboard${parseModeTarget})\n`;
              code += '    else:\n';
              code += '        # Удаляем предыдущие reply клавиатуры если они были\n';
              code += `        await message.answer(text, reply_markup=ReplyKeyboardRemove()${parseModeTarget})\n`;
              
              // CRITICAL FIX: Если целевой узел требует пользовательского ввода (любого типа: text/photo/video/audio/document), устанавливаем состояние ожидания
              if (targetNode.data.collectUserInput === true || 
                  targetNode.data.enableTextInput === true || 
                  targetNode.data.enablePhotoInput === true || 
                  targetNode.data.enableVideoInput === true || 
                  targetNode.data.enableAudioInput === true || 
                  targetNode.data.enableDocumentInput === true) {
                code += '    \n';
                code += '    # Настраиваем ожидание ввода для целевого узла (универсальная функция определит тип: text/photo/video/audio/document)\n';
                code += generateWaitingStateCode(targetNode, '    ', 'message.from_user.id');
              }
            }
          }
        }
      });
    });
  }

  // Generate handlers for contact and location buttons
  const contactButtons = replyNodes.flatMap(node => 
    node.data.buttons.filter(button => button.action === 'contact')
  );
  
  const locationButtons = replyNodes.flatMap(node => 
    node.data.buttons.filter(button => button.action === 'location')
  );
  
  if (contactButtons.length > 0 || locationButtons.length > 0) {
    code += '\n# Обработчики специальных кнопок\n';
    
    if (contactButtons.length > 0) {
      code += '\n@dp.message(F.contact)\n';
      code += 'async def handle_contact(message: types.Message):\n';
      code += '    contact = message.contact\n';
      code += '    text = f"Спасибо за контакт!\\n"\n';
      code += '    text += f"Имя: {contact.first_name}\\n"\n';
      code += '    text += f"Телефон: {contact.phone_number}"\n';
      code += '    await message.answer(text)\n';
    }
    
    if (locationButtons.length > 0) {
      code += '\n@dp.message(F.location)\n';
      code += 'async def handle_location(message: types.Message):\n';
      code += '    location = message.location\n';
      code += '    text = f"Спасибо за геолокацию!\\n"\n';
      code += '    text += f"Широта: {location.latitude}\\n"\n';
      code += '    text += f"Долгота: {location.longitude}"\n';
      code += '    await message.answer(text)\n';
    }
  }

  // Добавляем обработчики кнопочных ответов для узлов сбора ввода
  const userInputNodes = (nodes || []).filter(node => 
    node.type === 'message' && 
    node.data.responseType === 'buttons' && 
    Array.isArray(node.data.responseOptions) && 
    node.data.responseOptions.length > 0
  );

  if (userInputNodes.length > 0) {
    code += '\n# Обработчики кнопочных ответов для сбора пользовательского ввода\n';
    
    userInputNodes.forEach(node => {
      const responseOptions = node.data.responseOptions || [];
      
      // Обработчики для каждого варианта ответа
      responseOptions.forEach((option: string, index: number) => {
        code += `\n@dp.callback_query(F.data == "response_${node.id}_${index}")\n`;
        const safeFunctionName = `${node.id}_${index}`.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `async def handle_response_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
        code += '    user_id = callback_query.from_user.id\n';
        code += '    \n';
        code += '    # Проверяем настройки кнопочного ответа\n';
        code += '    if user_id not in user_data or "button_response_config" not in user_data[user_id]:\n';
        code += '        await callback_query.answer("⚠️ Сессия истекла, попробуйте снова", show_alert=True)\n';
        code += '        return\n';
        code += '    \n';
        code += '    config = user_data[user_id]["button_response_config"]\n';
        code += `    selected_value = "${option.value || option.text}"\n`;
        code += `    selected_text = "${option.text}"\n`;
        code += '    \n';
        code += '    # Обработка множественного выбора\n';
        code += '    if config.get("allow_multiple"):\n';
        code += '        # Проверяем, является ли это кнопкой "Готово" для завершения выбора\n';
        code += '        if selected_value == "done":\n';
        code += '            # Завершаем множественный выбор\n';
        code += '            if len(config["selected"]) > 0:\n';
        code += '                # Сохраняем все выбранные элементы\n';
        code += '                variable_name = config.get("variable", "user_response")\n';
        code += '                import datetime\n';
        code += '                import pytz\n';
        code += '                timestamp = datetime.datetime.now(moscow_tz).isoformat()\n';
        code += '                node_id = config.get("node_id", "unknown")\n';
        code += '                \n';
        code += '                # Создаем структурированный ответ для множественного выбора\n';
        code += '                response_data = {\n';
        code += '                    "value": [item["value"] for item in config["selected"]],\n';
        code += '                    "text": [item["text"] for item in config["selected"]],\n';
        code += '                    "type": "multiple_choice",\n';
        code += '                    "timestamp": timestamp,\n';
        code += '                    "nodeId": node_id,\n';
        code += '                    "variable": variable_name\n';
        code += '                }\n';
        code += '                \n';
        code += '                # Сохраняем в пользовательские данные\n';
        code += '                user_data[user_id][variable_name] = response_data\n';
        code += '                \n';
        code += '                # Сохраняем в базу данных если включено\n';
        code += '                if config.get("save_to_database"):\n';
        code += '                    saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
        code += '                    if saved_to_db:\n';
        code += '                        logging.info(f"✅ Множественный выбор сохранен в БД: {variable_name} = {response_data[\'text\']} (пользователь {user_id})")\n';
        code += '                    else:\n';
        code += '                        logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
        code += '                \n';
        code += '                # Отправляем сообщение об успехе\n';
        code += '                success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
        code += '                selected_items = ", ".join([item["text"] for item in config["selected"]])\n';
        code += '                await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_items}")\n';
        code += '                \n';
        code += '                logging.info(f"Получен множественный выбор: {variable_name} = {[item[\'text\'] for item in config[\'selected\']]}")\n';
        code += '                \n';
        code += '                # Очищаем состояние\n';
        code += '                del user_data[user_id]["button_response_config"]\n';
        code += '                \n';
        code += '                # Автоматическая навигация к следующему узлу\n';
        code += '                next_node_id = config.get("next_node_id")\n';
        code += '                if next_node_id:\n';
        code += '                    try:\n';
        code += '                        # Вызываем обработчик для следующего узла\n';
        
        // Add navigation for done button
        if (nodes.length > 0) {
          nodes.forEach((btnNode, btnIndex) => {
            const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
            const condition = btnIndex === 0 ? 'if' : 'elif';
            code += `                        ${condition} next_node_id == "${btnNode.id}":\n`;
            code += `                            await handle_callback_${safeFunctionName}(callback_query)\n`;
          });
          
          code += '                        else:\n';
          code += '                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
        } else {
          code += '                        # No nodes available for navigation\n';
          code += '                        logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
        }
        code += '                    except Exception as e:\n';
        code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
        code += '                return\n';
        code += '            else:\n';
        code += '                # Если ничего не выбрано, показываем предупреждение\n';
        code += '                await callback_query.answer("⚠️ Выберите хотя бы один вариант перед завершением", show_alert=True)\n';
        code += '                return\n';
        code += '        else:\n';
        code += '            # Обычная логика множественного выбора\n';
        code += '            if selected_value not in config["selected"]:\n';
        code += '                config["selected"].append({"text": selected_text, "value": selected_value})\n';
        code += '                await callback_query.answer(f"✅ Выбрано: {selected_text}")\n';
        code += '            else:\n';
        code += '                config["selected"] = [item for item in config["selected"] if item["value"] != selected_value]\n';
        code += '                await callback_query.answer(f"❌ Убрано: {selected_text}")\n';
        code += '            return  # Не завершаем сбор, позволяем выбрать еще\n';
        code += '    \n';
        code += '    # Сохраняем одиночный выбор\n';
        code += '    variable_name = config.get("variable", "user_response")\n';
        code += '    import datetime\n';
        code += '    timestamp = get_moscow_time()\n';
        code += '    node_id = config.get("node_id", "unknown")\n';
        code += '    \n';
        code += '    # Создаем структурированный ответ\n';
        code += '    response_data = {\n';
        code += '        "value": selected_value,\n';
        code += '        "text": selected_text,\n';
        code += '        "type": "button_choice",\n';
        code += '        "timestamp": timestamp,\n';
        code += '        "nodeId": node_id,\n';
        code += '        "variable": variable_name\n';
        code += '    }\n';
        code += '    \n';
        code += '    # Сохраняем в пользовательские данные\n';
        code += '    user_data[user_id][variable_name] = response_data\n';
        code += '    \n';
        code += '    # Сохраняем в базу данных если включено\n';
        code += '    if config.get("save_to_database"):\n';
        code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
        code += '        if saved_to_db:\n';
        code += '            logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n';
        code += '        else:\n';
        code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
        code += '    \n';
        code += '    # Отправляем сообщение об успехе\n';
        code += '    success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
        code += '    await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}")\n';
        code += '    \n';
        code += '    # Очищаем состояние\n';
        code += '    del user_data[user_id]["button_response_config"]\n';
        code += '    \n';
        code += '    logging.info(f"Получен кнопочный ответ: {variable_name} = {selected_text}")\n';
        code += '    \n';
        code += '    # Навигация на основе индивидуальных настроек кнопки\n';
        code += '    # Находим настройки для этого конкретного варианта ответа\n';
        code += '    options = config.get("options", [])\n';
        code += `    current_option = None\n`;
        code += `    for option in options:\n`;
        code += `        if option.get("callback_data") == "response_${node.id}_${index}":\n`;
        code += `            current_option = option\n`;
        code += `            break\n`;
        code += '    \n';
        code += '    if current_option:\n';
        code += '        option_action = current_option.get("action", "goto")\n';
        code += '        option_target = current_option.get("target", "")\n';
        code += '        option_url = current_option.get("url", "")\n';
        code += '        \n';
        code += '        if option_action == "url" and option_url:\n';
        code += '            # Открываем ссылку\n';
        code += '            from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup\n';
        code += '            keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
        code += '                [InlineKeyboardButton(text="🔗 Открыть ссылку", url=option_url)]\n';
        code += '            ])\n';
        code += '            await callback_query.message.edit_text(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=keyboard)\n';
        code += '        elif option_action == "command" and option_target:\n';
        code += '            # Выполняем команду\n';
        code += '            command = option_target\n';
        code += '            if not command.startswith("/"):\n';
        code += '                command = "/" + command\n';
        code += '            \n';
        code += '            # Создаем фиктивное сообщение для выполнения команды\n';
        code += '            import aiogram.types as aiogram_types\n';
        code += '            fake_message = aiogram_types.SimpleNamespace(\n';
        code += '                from_user=callback_query.from_user,\n';
        code += '                chat=callback_query.message.chat,\n';
        code += '                text=command,\n';
        code += '                message_id=callback_query.message.message_id\n';
        code += '            )\n';
        code += '            \n';
        
        // Добавляем обработку различных команд для button responses
        const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
        commandNodes.forEach((cmdNode, cmdIndex) => {
          const condition = cmdIndex === 0 ? 'if' : 'elif';
          code += `            ${condition} command == "${cmdNode.data.command}":\n`;
          code += `                try:\n`;
          code += `                    await ${cmdNode.type === 'start' ? 'start_handler' : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`}(fake_message)\n`;
          code += `                except Exception as e:\n`;
          code += `                    logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
        });
        if (commandNodes.length > 0) {
          code += `            else:\n`;
          code += `                logging.warning(f"Неизвестная команда: {command}")\n`;
        }
        code += '        elif option_action == "goto" and option_target:\n';
        code += '            # Переход к узлу\n';
        code += '            target_node_id = option_target\n';
        code += '            try:\n';
        code += '                # Вызываем обработчик для целевого узла\n';
        
        // Generate navigation logic for button responses  
        if (nodes.length > 0) {
          nodes.forEach((btnNode, btnIndex) => {
            const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
            const condition = btnIndex === 0 ? 'if' : 'elif';
            code += `                ${condition} target_node_id == "${btnNode.id}":\n`;
            code += `                    await handle_callback_${safeFunctionName}(callback_query)\n`;
          });
          code += '                else:\n';
          code += '                    logging.warning(f"Неизвестный целевой узел: {target_node_id}")\n';
        } else {
          code += '                pass  # No nodes to handle\n';
        }
        code += '            except Exception as e:\n';
        code += '                logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
        code += '    else:\n';
        code += '        # Fallback к старой системе next_node_id если нет настроек кнопки\n';
        code += '        next_node_id = config.get("next_node_id")\n';
        code += '        if next_node_id:\n';
        code += '            try:\n';
        code += '                # Вызываем обработчик для следующего узла\n';
          
          if (nodes.length > 0) {
            nodes.forEach((btnNode, btnIndex) => {
              const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
              const condition = btnIndex === 0 ? 'if' : 'elif';
              code += `                ${condition} next_node_id == "${btnNode.id}":\n`;
              code += `                    await handle_callback_${safeFunctionName}(callback_query)\n`;
            });
            code += '                else:\n';
            code += '                    logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
          } else {
            code += '                pass  # No nodes to handle\n';
          }
          code += '            except Exception as e:\n';
          code += '                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
      });
      
      // Обработчик для кнопки "Пропустить"
      if (node.data.allowSkip) {
        code += `\n@dp.callback_query(F.data == "skip_${node.id}")\n`;
        code += `async def handle_skip_${node.id}(callback_query: types.CallbackQuery):\n`;
        code += '    user_id = callback_query.from_user.id\n';
        code += '    \n';
        code += '    # Проверяем настройки\n';
        code += '    if user_id not in user_data or "button_response_config" not in user_data[user_id]:\n';
        code += '        await callback_query.answer("⚠️ Сессия истекла", show_alert=True)\n';
        code += '        return\n';
        code += '    \n';
        code += '    await callback_query.message.edit_text("⏭️ Ответ пропущен")\n';
        code += '    del user_data[user_id]["button_response_config"]\n';
        code += '    \n';
        code += '    logging.info(f"Пользователь {user_id} пропустил кнопочный ответ")\n';
      }
    });
  }

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем reply button обработчики ПЕРЕД универсальным обработчиком текста
  // Это гарантирует, что специфичные обработчики кнопок срабатывают раньше общего обработчика
  const replyGotoButtons: Array<{text: string, target: string, nodeId: string, keyboardType: string}> = [];
  console.log('🔍 НАЧИНАЕМ СБОР REPLY КНОПОК С GOTO из', nodes.length, 'узлов');
  
  nodes.forEach(node => {
    // Обычные кнопки узла
    if (node.data.buttons) {
      node.data.buttons.forEach((button: Button) => {
        if (button.action === 'goto' && button.target && node.data.keyboardType === 'reply') {
          console.log(`✅ НАЙДЕНА reply goto кнопка: "${button.text}" -> ${button.target} в узле ${node.id}`);
          replyGotoButtons.push({
            text: button.text,
            target: button.target,
            nodeId: node.id,
            keyboardType: node.data.keyboardType
          });
        }
      });
    }
    
    // Кнопки в условных сообщениях
    if (node.data.conditionalMessages) {
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: Button) => {
            // Для conditional messages берем keyboardType из самой кнопки или condition
            const keyboardType = condition.keyboardType || button.keyboardType || node.data.keyboardType || 'inline';
            if (button.action === 'goto' && button.target && keyboardType === 'reply') {
              console.log(`✅ НАЙДЕНА reply goto кнопка в conditional message: "${button.text}" -> ${button.target} в узле ${node.id}`);
              replyGotoButtons.push({
                text: button.text,
                target: button.target,
                nodeId: node.id,
                keyboardType: keyboardType
              });
            }
          });
        }
      });
    }
  });
  
  console.log(`🎯 ИТОГО найдено reply goto кнопок: ${replyGotoButtons.length}`);
  
  if (replyGotoButtons.length > 0) {
    code += '\n# Обработчики для reply кнопок с переходами (goto)\n';
    code += `# Найдено ${replyGotoButtons.length} reply goto кнопок\n`;
    code += '# ВАЖНО: Эти обработчики должны быть ВЫШЕ универсального обработчика текста\n';
    
    // Группируем по тексту, чтобы избежать дубликатов
    const uniqueButtons = new Map<string, typeof replyGotoButtons[0]>();
    replyGotoButtons.forEach(btn => {
      if (!uniqueButtons.has(btn.text)) {
        uniqueButtons.set(btn.text, btn);
      }
    });
    
    uniqueButtons.forEach((button, buttonText) => {
      const safeFunctionName = button.text.replace(/[^a-zA-Z0-9_а-яА-Я]/g, '_');
      const safeNodeFunctionName = button.target.replace(/[^a-zA-Z0-9_]/g, '_');
      
      code += `\n@dp.message(lambda message: message.text == ${formatTextForPython(button.text)})\n`;
      code += `async def handle_reply_button_${safeFunctionName}_${safeNodeFunctionName}(message: types.Message):\n`;
      code += `    user_id = message.from_user.id\n`;
      code += `    logging.info(f"📱 Получена reply кнопка: ${button.text} от {{user_id}}, переход к узлу ${button.target}")\n`;
      code += `    \n`;
      
      const targetNode = nodes.find(n => n.id === button.target);
      if (targetNode) {
        if (targetNode.type === 'start') {
          code += `    # Вызываем start handler напрямую\n`;
          code += `    await start_handler(message)\n`;
        } else if (targetNode.type === 'command') {
          const commandName = targetNode.data.command?.replace('/', '') || 'unknown';
          code += `    # Вызываем command handler напрямую\n`;
          code += `    await ${commandName}_handler(message)\n`;
        } else {
          // Для обычных message узлов создаём fake callback и вызываем callback обработчик
          code += `    # Создаём fake callback для вызова callback обработчика\n`;
          code += `    import types as aiogram_types\n`;
          code += `    \n`;
          code += `    # Функции для fake сообщения\n`;
          code += `    async def fake_send(*args, **kwargs):\n`;
          code += `        return await bot.send_message(message.from_user.id, *args, **kwargs)\n`;
          code += `    async def fake_noop(*args, **kwargs):\n`;
          code += `        return None\n`;
          code += `    \n`;
          code += `    # Создаём минимальный message объект\n`;
          code += `    fake_message = aiogram_types.SimpleNamespace(\n`;
          code += `        chat=aiogram_types.SimpleNamespace(id=message.from_user.id),\n`;
          code += `        message_id=message.message_id,\n`;
          code += `        delete=fake_noop,\n`;
          code += `        edit_text=fake_send,\n`;
          code += `        answer=fake_send\n`;
          code += `    )\n`;
          code += `    fake_callback = aiogram_types.SimpleNamespace(\n`;
          code += `        id="reply_button_nav",\n`;
          code += `        from_user=message.from_user,\n`;
          code += `        chat_instance="",\n`;
          code += `        data="${button.target}",\n`;
          code += `        message=fake_message,\n`;
          code += `        answer=fake_noop\n`;
          code += `    )\n`;
          code += `    \n`;
          code += `    # Вызываем callback обработчик целевого узла\n`;
          code += `    try:\n`;
          code += `        await handle_callback_${safeNodeFunctionName}(fake_callback)\n`;
          code += `    except Exception as e:\n`;
          code += `        logging.error(f"Ошибка при вызове обработчика узла ${button.target}: {{e}}")\n`;
          code += `        await message.answer("Произошла ошибка при обработке кнопки")\n`;
        }
      } else {
        code += `    logging.warning(f"Целевой узел ${button.target} не найден")\n`;
        code += `    await message.answer("Ошибка: узел не найден")\n`;
      }
    });
  }

  // Добавляем универсальный обработчик пользовательского ввода только если есть сбор данных
  if (hasInputCollection(nodes || [])) {
    code += '\n\n# Универсальный обработчик пользовательского ввода\n';
    code += '@dp.message(F.text)\n';
    code += 'async def handle_user_input(message: types.Message):\n';
  code += '    user_id = message.from_user.id\n';
  code += '    \n';
  code += '    # Проверяем, ожидаем ли мы ввод для условного сообщения\n';
  code += '    if user_id in user_data and "waiting_for_conditional_input" in user_data[user_id]:\n';
  code += '        config = user_data[user_id]["waiting_for_conditional_input"]\n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Сохраняем текстовый ввод для условного сообщения\n';
  code += '        condition_id = config.get("condition_id", "unknown")\n';
  code += '        next_node_id = config.get("next_node_id")\n';
  code += '        \n';
  code += '        # Сохраняем ответ пользователя\n';
  code += '        timestamp = get_moscow_time()\n';
  code += '        # Используем переменную из конфигурации или создаем автоматическую\n';
  code += '        input_variable = config.get("input_variable", "")\n';
  code += '        if input_variable:\n';
  code += '            variable_name = input_variable\n';
  code += '        else:\n';
  code += '            variable_name = f"conditional_response_{condition_id}"\n';
  code += '        \n';
  code += '        # Сохраняем в пользовательские данные\n';
  code += '        user_data[user_id][variable_name] = user_text\n';
  code += '        \n';
  code += '        # Сохраняем в базу данных\n';
  code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, user_text)\n';
  code += '        if saved_to_db:\n';
  code += '            logging.info(f"✅ Условный ответ сохранен в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
  code += '        else:\n';
  code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '        \n';
  code += '        # Очищаем состояние ожидания\n';
  code += '        del user_data[user_id]["waiting_for_conditional_input"]\n';
  code += '        \n';
  code += '        logging.info(f"Получен ответ на условное сообщение: {variable_name} = {user_text}")\n';
  code += '        \n';
  code += '        # Переходим к следующему узлу если указан\n';
  code += '        if next_node_id:\n';
  code += '            try:\n';
  code += '                logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
  code += '                \n';
  code += '                # Проверяем, является ли это командой\n';
  code += '                if next_node_id == "profile_command":\n';
  code += '                    logging.info("Переход к команде /profile")\n';
  code += '                    await profile_handler(message)\n';
  code += '                else:\n';
  code += '                    # Создаем фиктивный callback для навигации к обычному узлу\n';
  code += '                    import types as aiogram_types\n';
  code += '                    fake_callback = aiogram_types.SimpleNamespace(\n';
  code += '                        id="conditional_nav",\n';
  code += '                        from_user=message.from_user,\n';
  code += '                        chat_instance="",\n';
  code += '                        data=next_node_id,\n';
  code += '                        message=message,\n';
  code += '                        answer=lambda text="", show_alert=False: asyncio.sleep(0)\n';
  code += '                    )\n';
  code += '                    \n';
  
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      const safeFunctionName = targetNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      code += `                    ${condition} next_node_id == "${targetNode.id}":\n`;
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
      if (targetNode.data.allowMultipleSelection === true) {
        // Для узлов с множественным выбором создаем прямую навигацию
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                        # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
        code += `                        logging.info(f"🔧 Условная навигация к узлу с множественным выбором: ${targetNode.id}")\n`;
        code += `                        text = ${formattedText}\n`;
        
        // Замена переменных
        code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
        code += generateUniversalVariableReplacement('                        ');
        
        // Инициализируем состояние множественного выбора
        code += `                        # Инициализируем состояние множественного выбора\n`;
        code += `                        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
        code += `                        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
        code += `                        user_data[user_id]["multi_select_type"] = "selection"\n`;
        if (targetNode.data.multiSelectVariable) {
          code += `                        user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
        }
        
        // Создаем inline клавиатуру с кнопками выбора
        if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
          code += `                        await message.answer(text, reply_markup=keyboard)\n`;
        } else {
          code += `                        await message.answer(text)\n`;
        }
        code += `                        logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
      } else {
        // Для обычных узлов проверяем сначала, собирают ли они ввод
        if (targetNode.data.collectUserInput === true) {
          // Проверяем, есть ли условные сообщения для этого узла
          const hasConditionalMessages = targetNode.data.enableConditionalMessages && 
                                        targetNode.data.conditionalMessages && 
                                        targetNode.data.conditionalMessages.length > 0;
          
          if (hasConditionalMessages) {
            // Для узлов с условными сообщениями генерируем встроенную логику проверки
            code += `                        # Узел с условными сообщениями - проверяем условия\n`;
            code += `                        logging.info(f"🔧 Условная навигация к узлу с условными сообщениями: ${targetNode.id}")\n`;
            code += `                        user_data_dict = await get_user_from_db(user_id) or {}\n`;
            code += `                        user_data_dict.update(user_data.get(user_id, {}))\n`;
            
            // Генерируем логику проверки условий встроенно
            const conditionalMessages = targetNode.data.conditionalMessages.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            
            code += `                        # Функция для проверки переменных пользователя\n`;
            code += `                        def check_user_variable_inline(var_name, user_data_dict):\n`;
            code += `                            if "user_data" in user_data_dict and user_data_dict["user_data"]:\n`;
            code += `                                try:\n`;
            code += `                                    import json\n`;
            code += `                                    parsed_data = json.loads(user_data_dict["user_data"]) if isinstance(user_data_dict["user_data"], str) else user_data_dict["user_data"]\n`;
            code += `                                    if var_name in parsed_data:\n`;
            code += `                                        raw_value = parsed_data[var_name]\n`;
            code += `                                        if isinstance(raw_value, dict) and "value" in raw_value:\n`;
            code += `                                            var_value = raw_value["value"]\n`;
            code += `                                            if var_value is not None and str(var_value).strip() != "":\n`;
            code += `                                                return True, str(var_value)\n`;
            code += `                                        else:\n`;
            code += `                                            if raw_value is not None and str(raw_value).strip() != "":\n`;
            code += `                                                return True, str(raw_value)\n`;
            code += `                                except (json.JSONDecodeError, TypeError):\n`;
            code += `                                    pass\n`;
            code += `                            if var_name in user_data_dict:\n`;
            code += `                                variable_data = user_data_dict.get(var_name)\n`;
            code += `                                if isinstance(variable_data, dict) and "value" in variable_data:\n`;
            code += `                                    var_value = variable_data["value"]\n`;
            code += `                                    if var_value is not None and str(var_value).strip() != "":\n`;
            code += `                                        return True, str(var_value)\n`;
            code += `                                elif variable_data is not None and str(variable_data).strip() != "":\n`;
            code += `                                    return True, str(variable_data)\n`;
            code += `                            return False, None\n`;
            code += `                        \n`;
            
            // Генерируем условия
            code += `                        conditional_met = False\n`;
            for (let i = 0; i < conditionalMessages.length; i++) {
              const condition = conditionalMessages[i];
              const variableNames = condition.variableNames && condition.variableNames.length > 0 
                ? condition.variableNames 
                : (condition.variableName ? [condition.variableName] : []);
              const logicOperator = condition.logicOperator || 'AND';
              const conditionKeyword = i === 0 ? 'if' : 'elif';
              
              if (condition.condition === 'user_data_exists' && variableNames.length > 0) {
                code += `                        ${conditionKeyword} (\n`;
                for (let j = 0; j < variableNames.length; j++) {
                  const varName = variableNames[j];
                  const operator = (j === variableNames.length - 1) ? '' : (logicOperator === 'AND' ? ' and' : ' or');
                  code += `                            check_user_variable_inline("${varName}", user_data_dict)[0]${operator}\n`;
                }
                code += `                        ):\n`;
                code += `                            conditional_met = True\n`;
                
                // Генерируем текст и клавиатуру для условия
                const cleanedText = stripHtmlTags(condition.messageText);
                const formattedText = formatTextForPython(cleanedText);
                code += `                            text = ${formattedText}\n`;
                
                // Заменяем переменные
                for (const varName of variableNames) {
                  code += `                            _, var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} = check_user_variable_inline("${varName}", user_data_dict)\n`;
                  code += `                            if "{${varName}}" in text and var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')} is not None:\n`;
                  code += `                                text = text.replace("{${varName}}", var_value_${varName.replace(/[^a-zA-Z0-9]/g, '_')})\n`;
                }
                
                // Когда условие выполнено (переменная уже есть), отмечаем это
                code += `                            conditional_met = True\n`;
                code += `                            logging.info(f"✅ Условие выполнено: переменная существует")\n`;
                
                // ИСПРАВЛЕНИЕ: Проверяем, нужно ли ждать ввода
                const shouldWaitForInput = condition.waitForTextInput === true;
                
                if (shouldWaitForInput) {
                  // Показываем сообщение и настраиваем ожидание ввода
                  code += `                            # waitForTextInput=true: показываем сообщение и ждем ввода\n`;
                  
                  const inputVariable = condition.textInputVariable || targetNode.data.inputVariable || `response_${targetNode.id}`;
                  const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;
                  
                  // Проверяем, есть ли кнопки в условном сообщении
                  const hasConditionalButtons = condition.buttons && condition.buttons.length > 0;
                  
                  if (hasConditionalButtons) {
                    // Генерируем клавиатуру с кнопками из условного сообщения
                    code += `                            # Генерируем клавиатуру с кнопками из условного сообщения\n`;
                    code += `                            builder = ReplyKeyboardBuilder()\n`;
                    
                    for (const button of condition.buttons) {
                      let buttonText = button.text || 'Кнопка';
                      const safeButtonId = button.id.replace(/[^a-zA-Z0-9]/g, '_');
                      
                      // Заменяем переменные в тексте кнопки
                      let hasVariable = false;
                      for (const varName of variableNames) {
                        if (buttonText.includes(`{${varName}}`)) {
                          code += `                            btn_text_${safeButtonId} = "${buttonText}"\n`;
                          code += `                            _, btn_var_value = check_user_variable_inline("${varName}", user_data_dict)\n`;
                          code += `                            if btn_var_value is not None:\n`;
                          code += `                                btn_text_${safeButtonId} = btn_text_${safeButtonId}.replace("{${varName}}", btn_var_value)\n`;
                          buttonText = `btn_text_${safeButtonId}`;
                          hasVariable = true;
                          break;
                        }
                      }
                      
                      if (!hasVariable) {
                        buttonText = `"${buttonText}"`;
                      }
                      
                      code += `                            builder.add(KeyboardButton(text=${buttonText}))\n`;
                    }
                    
                    code += `                            builder.adjust(1)\n`;
                    code += `                            keyboard = builder.as_markup(resize_keyboard=True, one_time_keyboard=False)\n`;
                    
                    // Отправляем сообщение с клавиатурой
                    const mainMessageText = targetNode.data.messageText || 'Выберите действие';
                    const mainFormattedText = formatTextForPython(mainMessageText);
                    code += `                            main_text = ${mainFormattedText}\n`;
                    code += `                            await message.answer(main_text, reply_markup=keyboard)\n`;
                    
                    // Устанавливаем ожидание ввода, даже если есть клавиатура
                    // Пользователь может ввести текст вместо нажатия кнопки
                    code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                    code += `                                "type": "text",\n`;
                    code += `                                "variable": "${inputVariable}",\n`;
                    code += `                                "save_to_database": True,\n`;
                    code += `                                "node_id": "${targetNode.id}",\n`;
                    code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                    code += `                            }\n`;
                    code += `                            logging.info(f"✅ Показана условная клавиатура для узла ${targetNode.id}")\n`;
                  } else {
                    // Нет кнопок - показываем сообщение и ждем текстового ввода
                    code += `                            # Если условный текст пустой, используем основное сообщение узла\n`;
                    code += `                            if text and text.strip():\n`;
                    code += `                                await message.answer(text)\n`;
                    code += `                            else:\n`;
                    
                    // Используем основное сообщение узла
                    const mainMessageText = targetNode.data.messageText || 'Введите данные';
                    const mainFormattedText = formatTextForPython(mainMessageText);
                    code += `                                main_text = ${mainFormattedText}\n`;
                    code += `                                await message.answer(main_text)\n`;
                    code += `                            \n`;
                    
                    code += `                            # Настраиваем ожидание ввода для условного сообщения\n`;
                    code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
                    code += `                                "type": "text",\n`;
                    code += `                                "variable": "${inputVariable}",\n`;
                    code += `                                "save_to_database": True,\n`;
                    code += `                                "node_id": "${targetNode.id}",\n`;
                    code += `                                "next_node_id": "${nextNodeAfterCondition || ''}"\n`;
                    code += `                            }\n`;
                    code += `                            logging.info(f"✅ Состояние ожидания настроено: text ввод для переменной ${inputVariable} (условное сообщение, узел ${targetNode.id})")\n`;
                  }
                } else {
                  // Автоматически переходим к следующему узлу только если НЕ ждем ввода
                  const nextNodeAfterCondition = condition.nextNodeAfterInput || targetNode.data.inputTargetNodeId;
                  if (nextNodeAfterCondition) {
                    code += `                            # Переменная уже существует, автоматически переходим к узлу: ${nextNodeAfterCondition}\n`;
                    code += `                            logging.info(f"✅ Условие выполнено: переменная существует, автоматически переходим к следующему узлу")\n`;
                    code += `                            # Рекурсивно обрабатываем следующий узел через ту же систему навигации\n`;
                    code += `                            next_node_id_auto = "${nextNodeAfterCondition}"\n`;
                    code += `                            logging.info(f"🔄 Автоматический переход к узлу: {next_node_id_auto}")\n`;
                  } else {
                    code += `                            # Переменная существует, но следующий узел не указан - завершаем обработку\n`;
                  }
                }
              }
            }
            
            // Fallback если условия не выполнены
            code += `                        if not conditional_met:\n`;
            code += `                            # Условие не выполнено - показываем основное сообщение\n`;
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `                            text = ${formattedText}\n`;
            code += `                            await message.answer(text)\n`;
            
            const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const inputTargetNodeId = targetNode.data.inputTargetNodeId;
            code += `                            user_data[user_id]["waiting_for_input"] = {\n`;
            code += `                                "type": "text",\n`;
            code += `                                "variable": "${inputVariable}",\n`;
            code += `                                "save_to_database": True,\n`;
            code += `                                "node_id": "${targetNode.id}",\n`;
            code += `                                "next_node_id": "${inputTargetNodeId || ''}"\n`;
            code += `                            }\n`;
            code += `                            logging.info(f"✅ Состояние ожидания настроено: text ввод для переменной ${inputVariable} (узел ${targetNode.id})")\n`;
          } else {
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их вместо ожидания ввода
            if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += `                        # ИСПРАВЛЕНИЕ: У узла есть кнопки - показываем их, а не ожидаем ввод\n`;
              code += `                        logging.info(f"✅ Показаны кнопки для узла ${targetNode.id} с collectUserInput=true")\n`;
              code += `                        text = ${formattedText}\n`;
              
              // Добавляем замену переменных
              code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
              code += generateUniversalVariableReplacement('                        ');
              
              // Генерируем inline клавиатуру
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
              code += `                        await message.answer(text, reply_markup=keyboard)\n`;
            } else {
              // Обычное ожидание ввода если кнопок нет
              code += `                        # Узел собирает пользовательский ввод\n`;
              code += `                        logging.info(f"🔧 Условная навигация к узлу с вводом: ${targetNode.id}")\n`;
              code += `                        text = ${formattedText}\n`;
              
              // Настраиваем ожидание ввода
              const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
              const inputTargetNodeId = targetNode.data.inputTargetNodeId;
              code += `                        await message.answer(text)\n`;
              code += `                        # Настраиваем ожидание ввода\n`;
              code += `                        user_data[user_id]["waiting_for_input"] = {\n`;
              code += `                            "type": "text",\n`;
              code += `                            "variable": "${inputVariable}",\n`;
              code += `                            "save_to_database": True,\n`;
              code += `                            "node_id": "${targetNode.id}",\n`;
              code += `                            "next_node_id": "${inputTargetNodeId || ''}"\n`;
              code += `                        }\n`;
            }
          }
        } else {
          // Обычная навигация с простым сообщением
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `                        # Обычный узел - отправляем сообщение\n`;
          code += `                        text = ${formattedText}\n`;
          
          // Добавляем замену переменных
          code += '                        user_data[user_id] = user_data.get(user_id, {})\n';
          code += generateUniversalVariableReplacement('                        ');
          
          // Проверяем, есть ли reply кнопки
          if (targetNode.data.keyboardType === 'reply' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += '                        # Создаем reply клавиатуру\n';
            code += '                        builder = ReplyKeyboardBuilder()\n';
            targetNode.data.buttons.forEach((btn: Button) => {
              code += `                        builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
            });
            const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
            const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
            code += `                        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
            code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
            code += '                        await message.answer(text, reply_markup=keyboard)\n';
          } else if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += '                        # Создаем inline клавиатуру\n';
            code += generateInlineKeyboardCode(targetNode.data.buttons, '                        ', targetNode.id, targetNode.data, allNodeIds);
            code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
            code += '                        await message.answer(text, reply_markup=keyboard)\n';
          } else {
            code += `                        logging.info(f"Условная навигация к обычному узлу: ${targetNode.id}")\n`;
            code += '                        await message.answer(text)\n';
          }
        }
      }
    });
    code += '                    else:\n';
    code += '                        logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '                    # No nodes available for navigation\n';
    code += '                    logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
  }
  
  code += '            except Exception as e:\n';
  code += '                logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '        \n';
  code += '        return  # Завершаем обработку для условного сообщения\n';
  code += '    \n';
  code += '    # Проверяем, ожидаем ли мы кнопочный ответ через reply клавиатуру\n';
  code += '    if user_id in user_data and "button_response_config" in user_data[user_id]:\n';
  code += '        config = user_data[user_id]["button_response_config"]\n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Ищем выбранный вариант среди доступных опций\n';
  code += '        selected_option = None\n';
  code += '        for option in config.get("options", []):\n';
  code += '            if option["text"] == user_text:\n';
  code += '                selected_option = option\n';
  code += '                break\n';
  code += '        \n';
  code += '        if selected_option:\n';
  code += '            selected_value = selected_option["value"]\n';
  code += '            selected_text = selected_option["text"]\n';
  code += '            \n';
  code += '            # Сохраняем ответ пользователя\n';
  code += '            variable_name = config.get("variable", "button_response")\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            node_id = config.get("node_id", "unknown")\n';
  code += '            \n';
  code += '            # Создаем структурированный ответ\n';
  code += '            response_data = {\n';
  code += '                "value": selected_value,\n';
  code += '                "text": selected_text,\n';
  code += '                "type": "button_choice",\n';
  code += '                "timestamp": timestamp,\n';
  code += '                "nodeId": node_id,\n';
  code += '                "variable": variable_name\n';
  code += '            }\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][variable_name] = response_data\n';
  code += '            \n';
  code += '            # Сохраняем в базу данных если включено\n';
  code += '            if config.get("save_to_database"):\n';
  code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
  code += '                if saved_to_db:\n';
  code += '                    logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")\n';
  code += '                else:\n';
  code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '            \n';
  code += '            # Отправляем сообщение об успехе\n';
  code += '            success_message = config.get("success_message", "Спасибо за ваш выбор!")\n';
  code += '            await message.answer(f"{success_message}\\n\\n✅ Ваш выбор: {selected_text}", reply_markup=ReplyKeyboardRemove())\n';
  code += '            \n';
  code += '            # Очищаем состояние\n';
  code += '            del user_data[user_id]["button_response_config"]\n';
  code += '            \n';
  code += '            logging.info(f"Получен кнопочный ответ через reply клавиатуру: {variable_name} = {selected_text}")\n';
  code += '            \n';
  code += '            # Навигация на основе действия кнопки\n';
  code += '            option_action = selected_option.get("action", "goto")\n';
  code += '            option_target = selected_option.get("target", "")\n';
  code += '            option_url = selected_option.get("url", "")\n';
  code += '            \n';
  code += '            if option_action == "url" and option_url:\n';
  code += '                # Открытие ссылки\n';
  code += '                url = option_url\n';
  code += '                keyboard = InlineKeyboardMarkup(inline_keyboard=[\n';
  code += '                    [InlineKeyboardButton(text="🔗 Открыть ссылку", url=url)]\n';
  code += '                ])\n';
  code += '                await message.answer("Нажмите кнопку ниже, чтобы открыть ссылку:", reply_markup=keyboard)\n';
  code += '            elif option_action == "command" and option_target:\n';
  code += '                # Выполнение команды\n';
  code += '                command = option_target\n';
  code += '                # Создаем фиктивное сообщение для выполнения команды\n';
  code += '                import types as aiogram_types\n';
  code += '                fake_message = aiogram_types.SimpleNamespace(\n';
  code += '                    from_user=message.from_user,\n';
  code += '                    chat=message.chat,\n';
  code += '                    text=command,\n';
  code += '                    message_id=message.message_id\n';
  code += '                )\n';
  code += '                \n';
  
  // Добавляем обработку различных команд для reply клавиатур
  const commandNodes = (nodes || []).filter(n => (n.type === 'start' || n.type === 'command') && n.data.command);
  commandNodes.forEach((cmdNode, cmdIndex) => {
    const condition = cmdIndex === 0 ? 'if' : 'elif';
    code += `                ${condition} command == "${cmdNode.data.command}":\n`;
    code += `                    try:\n`;
    code += `                        await ${cmdNode.type === 'start' ? 'start_handler' : `${cmdNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_')}_handler`}(fake_message)\n`;
    code += `                    except Exception as e:\n`;
    code += `                        logging.error(f"Ошибка выполнения команды ${cmdNode.data.command}: {e}")\n`;
  });
  if (commandNodes.length > 0) {
    code += `                else:\n`;
    code += `                    logging.warning(f"Неизвестная команда: {command}")\n`;
  }
  
  code += '            elif option_action == "goto" and option_target:\n';
  code += '                # Переход к узлу\n';
  code += '                target_node_id = option_target\n';
  code += '                try:\n';
  code += '                    # Вызываем обработчик для целевого узла\n';

  // Generate navigation logic for reply button responses  
  if (nodes.length > 0) {
    nodes.forEach((btnNode, btnIndex) => {
      const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      const condition = btnIndex === 0 ? 'if' : 'elif';
      code += `                    ${condition} target_node_id == "${btnNode.id}":\n`;
      code += `                        await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))\n`;
    });
    code += '                    else:\n';
    code += '                        logging.warning(f"Неизвестный целевой узел: {target_node_id}")\n';
  } else {
    code += '                    pass  # No nodes to handle\n';
  }
  code += '                except Exception as e:\n';
  code += '                    logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")\n';
  code += '            else:\n';
  code += '                # Fallback к старой системе next_node_id если нет action\n';
  code += '                next_node_id = config.get("next_node_id")\n';
  code += '                if next_node_id:\n';
  code += '                    try:\n';
  code += '                        # Вызываем обработчик для следующего узла\n';
  
  if (nodes.length > 0) {
    nodes.forEach((btnNode, btnIndex) => {
      const safeFunctionName = btnNode.id.replace(/[^a-zA-Z0-9_]/g, '_');
      const condition = btnIndex === 0 ? 'if' : 'elif';
      code += `                        ${condition} next_node_id == "${btnNode.id}":\n`;
      code += `                            await handle_callback_${safeFunctionName}(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))\n`;
    });
    code += '                        else:\n';
    code += '                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '                        pass  # No nodes to handle\n';
  }
  code += '                    except Exception as e:\n';
  code += '                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '            return\n';
  code += '        else:\n';
  code += '            # Неверный выбор - показываем доступные варианты\n';
  code += '            available_options = [option["text"] for option in config.get("options", [])]\n';
  code += '            options_text = "\\n".join([f"• {opt}" for opt in available_options])\n';
  code += '            await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\\n\\n{options_text}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)\n';
  code += '    has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]\n';
  code += '    logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")\n';
  code += '    if user_id in user_data and "waiting_for_input" in user_data[user_id]:\n';
  code += '        # Обрабатываем ввод через универсальную систему\n';
  code += '        waiting_config = user_data[user_id]["waiting_for_input"]\n';
  code += '        \n';
  code += '        # Проверяем, что пользователь все еще находится в состоянии ожидания ввода\n';
  code += '        if not waiting_config:\n';
  code += '            return  # Состояние ожидания пустое, игнорируем\n';
  code += '        \n';
  code += '        # Проверяем формат конфигурации - новый (словарь) или старый (строка)\n';
  code += '        if isinstance(waiting_config, dict):\n';
  code += '            # Новый формат - извлекаем данные из словаря\n';
  code += '            waiting_node_id = waiting_config.get("node_id")\n';
  code += '            input_type = waiting_config.get("type", "text")\n';
  code += '            variable_name = waiting_config.get("variable", "user_response")\n';
  code += '            save_to_database = waiting_config.get("save_to_database", False)\n';
  code += '            min_length = waiting_config.get("min_length", 0)\n';
  code += '            max_length = waiting_config.get("max_length", 0)\n';
  code += '            next_node_id = waiting_config.get("next_node_id")\n';
  code += '        else:\n';
  code += '            # Старый формат - waiting_config это строка с node_id\n';
  code += '            waiting_node_id = waiting_config\n';
  code += '            input_type = user_data[user_id].get("input_type", "text")\n';
  code += '            variable_name = user_data[user_id].get("input_variable", "user_response")\n';
  code += '            save_to_database = user_data[user_id].get("save_to_database", False)\n';
  code += '            min_length = 0\n';
  code += '            max_length = 0\n';
  code += '            next_node_id = user_data[user_id].get("waiting_input_target_node_id") or user_data[user_id].get("input_target_node_id")\n';
  code += '        \n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Валидация для нового формата\n';
  code += '        if isinstance(waiting_config, dict):\n';
  code += '            # Валидация длины\n';
  code += '            if min_length > 0 and len(user_text) < min_length:\n';
  code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
  code += '                return\n';
  code += '            \n';
  code += '            if max_length > 0 and len(user_text) > max_length:\n';
  code += '                retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
  code += '                return\n';
  code += '            \n';
  code += '            # Валидация типа ввода\n';
  code += '            if input_type == "email":\n';
  code += '                import re\n';
  code += '                email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
  code += '                if not re.match(email_pattern, user_text):\n';
  code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                    await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
  code += '                    return\n';
  code += '            elif input_type == "number":\n';
  code += '                try:\n';
  code += '                    float(user_text)\n';
  code += '                except ValueError:\n';
  code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                    await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
  code += '                    return\n';
  code += '            elif input_type == "phone":\n';
  code += '                import re\n';
  code += '                phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
  code += '                if not re.match(phone_pattern, user_text):\n';
  code += '                    retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '                    await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
  code += '                    return\n';
  code += '            \n';
  code += '            # Сохраняем ответ для нового формата\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][variable_name] = response_data\n';
  code += '            \n';
  code += '            # Сохраняем в базу данных если включено\n';
  code += '            if save_to_database:\n';
  code += '                saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
  code += '                if saved_to_db:\n';
  code += '                    logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
  code += '                else:\n';
  code += '                    logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '            \n';
  code += '            # Отправляем подтверждающее сообщение только если оно задано\n';
  code += '            success_message = waiting_config.get("success_message", "")\n';
  code += '            if success_message:\n';
  code += '                logging.info(f"DEBUG: Отправляем подтверждение с текстом: {success_message}")\n';
  code += '                await message.answer(success_message)\n';
  code += '                logging.info(f"✅ Отправлено подтверждение: {success_message}")\n';
  code += '            \n';
  code += '            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем старое состояние ожидания перед навигацией\n';
  code += '            if "waiting_for_input" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["waiting_for_input"]\n';
  code += '            \n';
  code += '            logging.info(f"✅ Переход к следующему узлу выполнен успешно")\n';
  code += '            logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
  code += '            \n';
  code += '            # Навигация к следующему узлу для нового формата\n';
  code += '            if next_node_id:\n';
  code += '                try:\n';
  code += '                    # Цикл для поддержки автопереходов\n';
  code += '                    while next_node_id:\n';
  code += '                        logging.info(f"🚀 Переходим к узлу: {next_node_id}")\n';
  code += '                        current_node_id = next_node_id\n';
  code += '                        next_node_id = None  # Сбрасываем, будет установлен при автопереходе\n';
  code += '                        # Проверяем навигацию к узлам\n';
  
  // Функция для генерации отступов (решение архитектора)
  const indent = (level: number) => '    '.repeat(level);
  const BASE_INDENT_LEVEL = 6; // Базовый уровень (внутри try блока)
  const whileIndent = indent(BASE_INDENT_LEVEL);      // 24 пробела - уровень while
  const conditionIndent = indent(BASE_INDENT_LEVEL);  // 24 пробела - уровень if/elif
  const bodyIndent = indent(BASE_INDENT_LEVEL + 1);   // 28 пробелов - тело if/elif
  
  // Добавляем навигацию для каждого узла
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      code += `${conditionIndent}${condition} current_node_id == "${targetNode.id}":\n`;
      
      if (targetNode.type === 'message') {
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
        if (targetNode.data.allowMultipleSelection === true) {
          // Для узлов с множественным выбором создаем прямую навигацию
          const messageText = targetNode.data.messageText || 'Сообщение';
          const formattedText = formatTextForPython(messageText);
          code += `${bodyIndent}# Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
          code += `${bodyIndent}logging.info(f"🔧 Переходим к узлу с множественным выбором: ${targetNode.id}")\n`;
          code += `${bodyIndent}text = ${formattedText}\n`;
          
          // Замена переменных
          code += `${bodyIndent}user_data[user_id] = user_data.get(user_id, {})\n`;
          code += generateUniversalVariableReplacement(bodyIndent);
          
          // Инициализируем состояние множественного выбора
          code += `${bodyIndent}# Инициализируем состояние множественного выбора\n`;
          code += `${bodyIndent}user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
          code += `${bodyIndent}user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
          code += `${bodyIndent}user_data[user_id]["multi_select_type"] = "selection"\n`;
          if (targetNode.data.multiSelectVariable) {
            code += `${bodyIndent}user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
          }
          
          // Создаем inline клавиатуру с кнопками выбора
          if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += generateInlineKeyboardCode(targetNode.data.buttons, bodyIndent, targetNode.id, targetNode.data, allNodeIds);
            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            code += `${bodyIndent}await message.answer(text)\n`;
          }
          code += `${bodyIndent}logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
        } else {
          const messageText = targetNode.data.messageText || 'Сообщение';
          const cleanedMessageText = stripHtmlTags(messageText);
          const formattedText = formatTextForPython(cleanedMessageText);
          code += `${bodyIndent}text = ${formattedText}\n`;
          
          // Применяем замену переменных
          code += `${bodyIndent}# Замена переменных в тексте\n`;
          code += generateUniversalVariableReplacement(bodyIndent);
          
          // Если узел message собирает ввод, настраиваем ожидание
          if (targetNode.data.collectUserInput === true) {
          const inputType = targetNode.data.inputType || 'text';
          const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
          const inputTargetNodeId = targetNode.data.inputTargetNodeId;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если у узла есть кнопки, показываем их ВМЕСТО ожидания текста
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += `${bodyIndent}# ИСПРАВЛЕНИЕ: У узла есть inline кнопки - показываем их вместо ожидания текста\n`;
            code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;
            
            // Добавляем кнопки для узла с collectUserInput + buttons
            targetNode.data.buttons.forEach((btn: Button, btnIndex: number) => {
              if (btn.action === "goto" && btn.target) {
                const callbackData = `${btn.target}`;
                code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
              } else if (btn.action === "url" && btn.url) {
                code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
              }
            });
            
            const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
            code += `${bodyIndent}builder.adjust(${columns})\n`;
            code += `${bodyIndent}keyboard = builder.as_markup()\n`;
            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
            code += `${bodyIndent}logging.info(f"✅ Показаны inline кнопки для узла ${targetNode.id} с collectUserInput")\n`;
          } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += `${bodyIndent}# ИСПРАВЛЕНИЕ: У узла есть reply кнопки - показываем их вместо ожидания текста\n`;
            code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;
            
            // Добавляем кнопки для reply клавиатуры
            targetNode.data.buttons.forEach((btn: Button) => {
              if (btn.action === "contact" && btn.requestContact) {
                code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
              } else if (btn.action === "location" && btn.requestLocation) {
                code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
              } else {
                code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
              }
            });
            
            const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
            const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
            code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
            code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для узла ${targetNode.id} с collectUserInput")\n`;
            
            // ИСПРАВЛЕНИЕ: Если включен сбор ввода, настраиваем ожидание даже при наличии кнопок
            if (targetNode.data.enableTextInput === true || targetNode.data.enablePhotoInput === true || 
                targetNode.data.enableVideoInput === true || targetNode.data.enableAudioInput === true || 
                targetNode.data.enableDocumentInput === true || targetNode.data.collectUserInput === true) {
              code += `${bodyIndent}# Настраиваем ожидание ввода для message узла с reply кнопками (используем универсальную функцию)\n`;
              code += generateWaitingStateCode(targetNode, bodyIndent);
            }
          } else {
            code += `${bodyIndent}await message.answer(text)\n`;
            
            // Настраиваем ожидание ввода ТОЛЬКО если нет кнопок (используем универсальную функцию)
            code += `${bodyIndent}# Настраиваем ожидание ввода для message узла (универсальная функция определит тип: text/photo/video/audio/document)\n`;
            code += generateWaitingStateCode(targetNode, bodyIndent);
          }
        } else {
          // Если узел не собирает ввод, проверяем есть ли inline или reply кнопки
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += `${bodyIndent}# Создаем inline клавиатуру\n`;
            code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;
            
            // Добавляем кнопки
            targetNode.data.buttons.forEach((btn: Button, btnIndex: number) => {
              if (btn.action === "goto" && btn.target) {
                const callbackData = `${btn.target}`;
                code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${callbackData}"))\n`;
              } else if (btn.action === "url" && btn.url) {
                code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
              } else if (btn.action === "command" && btn.target) {
                // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Добавляем поддержку кнопок команд
                const commandCallback = `cmd_${btn.target.replace('/', '')}`;
                code += `${bodyIndent}logging.info(f"Создана кнопка команды: ${btn.text} -> ${commandCallback}")\n`;
                code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
              }
            });
            
            // ВОССТАНОВЛЕНИЕ: Добавляем умное расположение кнопок по колонкам
            const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
            code += `${bodyIndent}builder.adjust(${columns})\n`;
            code += `${bodyIndent}keyboard = builder.as_markup()\n`;
            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
          } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            code += `${bodyIndent}# Создаем reply клавиатуру\n`;
            code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;
            
            // Добавляем кнопки для reply клавиатуры
            targetNode.data.buttons.forEach((btn: Button) => {
              if (btn.action === "contact" && btn.requestContact) {
                code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
              } else if (btn.action === "location" && btn.requestLocation) {
                code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
              } else {
                code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
              }
            });
            
            const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
            const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
            code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
            code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
            code += `${bodyIndent}logging.info(f"✅ Показана reply клавиатура для переходного узла")\n`;
          } else {
            code += `${bodyIndent}await message.answer(text)\n`;
          }
          
          // Очищаем состояние ожидания ввода после успешного перехода для message узлов без сбора ввода
          if (!targetNode.data.collectUserInput) {
            code += `${bodyIndent}# НЕ отправляем сообщение об успехе здесь - это делается в старом формате\n`;
            code += `${bodyIndent}# Очищаем состояние ожидания ввода после успешного перехода\n`;
            code += `${bodyIndent}if "waiting_for_input" in user_data[user_id]:\n`;
            code += `${bodyIndent}    del user_data[user_id]["waiting_for_input"]\n`;
            code += `${bodyIndent}\n`;
            code += `${bodyIndent}logging.info("✅ Переход к следующему узлу выполнен успешно")\n`;
          }
          
          // АВТОПЕРЕХОД: Если у узла есть autoTransitionTo, сразу вызываем callback обработчик
          if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
            const autoTargetId = targetNode.data.autoTransitionTo;
            const autoSafeFunctionName = autoTargetId.replace(/[^a-zA-Z0-9_]/g, '_');
            code += `${bodyIndent}\n`;
            code += `${bodyIndent}# ⚡ Автопереход к узлу ${autoTargetId}\n`;
            code += `${bodyIndent}logging.info(f"⚡ Автопереход от узла ${targetNode.id} к узлу ${autoTargetId}")\n`;
            code += `${bodyIndent}import types as aiogram_types\n`;
            code += `${bodyIndent}async def noop(*args, **kwargs):\n`;
            code += `${bodyIndent}    return None\n`;
            code += `${bodyIndent}fake_message = aiogram_types.SimpleNamespace(\n`;
            code += `${bodyIndent}    chat=aiogram_types.SimpleNamespace(id=message.from_user.id),\n`;
            code += `${bodyIndent}    message_id=message.message_id,\n`;
            code += `${bodyIndent}    delete=noop,\n`;
            code += `${bodyIndent}    edit_text=noop,\n`;
            code += `${bodyIndent}    answer=lambda text, **kwargs: bot.send_message(message.from_user.id, text, **kwargs)\n`;
            code += `${bodyIndent})\n`;
            code += `${bodyIndent}fake_callback = aiogram_types.SimpleNamespace(\n`;
            code += `${bodyIndent}    id="auto_transition",\n`;
            code += `${bodyIndent}    from_user=message.from_user,\n`;
            code += `${bodyIndent}    chat_instance="",\n`;
            code += `${bodyIndent}    data="${autoTargetId}",\n`;
            code += `${bodyIndent}    message=fake_message,\n`;
            code += `${bodyIndent}    answer=noop\n`;
            code += `${bodyIndent})\n`;
            code += `${bodyIndent}await handle_callback_${autoSafeFunctionName}(fake_callback)\n`;
          } else {
            code += `${bodyIndent}break  # Нет автоперехода, завершаем цикл\n`;
          }
        }
        } // Закрываем блок else для allowMultipleSelection
      } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
        const inputPrompt = formatTextForPython(targetNode.data.messageText || "Введите ваш ответ:");
        code += `${bodyIndent}prompt_text = ${inputPrompt}\n`;
        code += `${bodyIndent}await message.answer(prompt_text)\n`;
        code += `${bodyIndent}# Устанавливаем новое ожидание ввода\n`;
        code += `${bodyIndent}user_data[user_id]["waiting_for_input"] = {\n`;
        code += `${bodyIndent}    "type": "${targetNode.data.inputType || 'text'}",\n`;
        code += `${bodyIndent}    "variable": "${targetNode.data.inputVariable || 'user_response'}",\n`;
        code += `${bodyIndent}    "save_to_database": True,\n`;
        code += `${bodyIndent}    "node_id": "${targetNode.id}",\n`;
        const nextConnection = connections.find(conn => conn.source === targetNode.id);
        if (nextConnection) {
          code += `${bodyIndent}    "next_node_id": "${nextConnection.target}",\n`;
        } else {
          code += `${bodyIndent}    "next_node_id": None,\n`;
        }
        code += `${bodyIndent}    "min_length": ${targetNode.data.minLength || 0},\n`;
        code += `${bodyIndent}    "max_length": ${targetNode.data.maxLength || 0},\n`;
        code += `${bodyIndent}    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
        code += `${bodyIndent}    "success_message": ""\n`;
        code += `${bodyIndent}}\n`;
        code += `${bodyIndent}break  # Выходим из цикла после настройки ожидания ввода\n`;
      } else if (targetNode.type === 'command') {
        // Для узлов команд вызываем соответствующий обработчик
        const commandName = targetNode.data.command?.replace('/', '') || 'unknown';
        const handlerName = `${commandName}_handler`;
        code += `${bodyIndent}# Выполняем команду ${targetNode.data.command}\n`;
        code += `${bodyIndent}from types import SimpleNamespace\n`;
        code += `${bodyIndent}fake_message = SimpleNamespace()\n`;
        code += `${bodyIndent}fake_message.from_user = message.from_user\n`;
        code += `${bodyIndent}fake_message.chat = message.chat\n`;
        code += `${bodyIndent}fake_message.date = message.date\n`;
        code += `${bodyIndent}fake_message.answer = message.answer\n`;
        code += `${bodyIndent}await ${handlerName}(fake_message)\n`;
        code += `${bodyIndent}break  # Выходим из цикла после выполнения команды\n`;
      } else {
        code += `${bodyIndent}logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
        code += `${bodyIndent}break  # Выходим из цикла для неизвестного типа узла\n`;
      }
    });
    
    code += '                        else:\n';
    code += '                            logging.warning(f"Неизвестный узел: {current_node_id}")\n';
    code += '                            break  # Выходим из цикла при неизвестном узле\n';
  } else {
    code += '                        # No nodes available for navigation\n';
    code += '                        logging.warning(f"Нет доступных узлов для навигации")\n';
    code += '                        break\n';
  }
  
  code += '                except Exception as e:\n';
  code += '                    logging.error(f"Ошибка при переходе к узлу: {e}")\n';
  code += '            \n';
  code += '            return  # Завершаем обработку для нового формата\n';
  code += '        \n';
  code += '        # Обработка старого формата (для совместимости)\n';
  code += '        # Находим узел для получения настроек\n';
  
  // Генерируем проверку для каждого узла с универсальным сбором ввода (старый формат)
  const inputNodes = (nodes || []).filter(node => node.data.collectUserInput);
  code += `        logging.info(f"DEBUG old format: checking inputNodes: ${inputNodes.map(n => n.id).join(', ')}")\n`;
  inputNodes.forEach((node, index) => {
    const condition = index === 0 ? 'if' : 'elif';
    code += `        ${condition} waiting_node_id == "${node.id}":\n`;
    
    // Добавляем валидацию если есть
    if (node.data.inputValidation) {
      if (node.data.minLength && node.data.minLength > 0) {
        code += `            if len(user_text) < ${node.data.minLength}:\n`;
        code += `                await message.answer("❌ Слишком короткий ответ (минимум ${node.data.minLength} символов). Попробуйте еще раз.")\n`;
        code += `                return\n`;
      }
      if (node.data.maxLength && node.data.maxLength > 0) {
        code += `            if len(user_text) > ${node.data.maxLength}:\n`;
        code += `                await message.answer("❌ Слишком длинный ответ (максимум ${node.data.maxLength} символов). Попробуйте еще раз.")\n`;
        code += `                return\n`;
      }
    }
    
    // Валидация типа ввода
    if (node.data.inputType === 'email') {
      code += `            import re\n`;
      code += `            email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n`;
      code += `            if not re.match(email_pattern, user_text):\n`;
      code += `                await message.answer("❌ Неверный формат email. Попробуйте еще раз.")\n`;
      code += `                return\n`;
    } else if (node.data.inputType === 'number') {
      code += `            try:\n`;
      code += `                float(user_text)\n`;
      code += `            except ValueError:\n`;
      code += `                await message.answer("❌ Введите корректное число. Попробуйте еще раз.")\n`;
      code += `                return\n`;
    } else if (node.data.inputType === 'phone') {
      code += `            import re\n`;
      code += `            phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n`;
      code += `            if not re.match(phone_pattern, user_text):\n`;
      code += `                await message.answer("❌ Неверный формат телефона. Попробуйте еще раз.")\n`;
      code += `                return\n`;
    }
    
    // Сохранение ответа
    const variableName = node.data.inputVariable || 'user_response';
    code += `            \n`;
    code += `            # Сохраняем ответ пользователя\n`;
    code += `            import datetime\n`;
    code += `            timestamp = get_moscow_time()\n`;
    code += `            \n`;
    code += `            # Сохраняем простое значение для совместимости с логикой профиля\n`;
    code += `            response_data = user_text  # Простое значение вместо сложного объекта\n`;
    code += `            \n`;
    code += `            # Сохраняем в пользовательские данные\n`;
    code += `            user_data[user_id]["${variableName}"] = response_data\n`;
    code += `            \n`;
    
    // Сохранение в базу данных (всегда включено для collectUserInput)
    code += `            # Сохраняем в базу данных\n`;
    code += `            saved_to_db = await update_user_data_in_db(user_id, "${variableName}", response_data)\n`;
    code += `            if saved_to_db:\n`;
    code += `                logging.info(f"✅ Данные сохранены в БД: ${variableName} = {user_text} (пользователь {user_id})")\n`;
    code += `            else:\n`;
    code += `                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n`;
    code += `            \n`;
    
    code += `            \n`;
    code += `            logging.info(f"Получен пользовательский ввод: ${variableName} = {user_text}")\n`;
    code += `            \n`;
    
    // Навигация к следующему узлу
    if (node.data.inputTargetNodeId) {
      code += `            # Переходим к следующему узлу\n`;
      code += `            try:\n`;
      
      // Найдем целевой узел для навигации
      const targetNode = nodes.find(n => n.id === node.data.inputTargetNodeId);
      if (targetNode) {
        if (targetNode.type === 'keyboard' || targetNode.type === 'message') {
          // Для keyboard и message узлов отправляем сообщение напрямую
          const messageText = targetNode.data.messageText || 'Выберите действие';
          const formattedText = formatTextForPython(messageText);
          code += `                # Отправляем сообщение для узла ${targetNode.id}\n`;
          code += `                text = ${formattedText}\n`;
          
          // Если целевой узел тоже собирает ввод, настраиваем новое ожидание
          if (targetNode.data.collectUserInput === true) {
            const nextInputType = targetNode.data.inputType || 'text';
            const nextInputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
            const nextInputTargetNodeId = targetNode.data.inputTargetNodeId;
            
            code += `                # Настраиваем новое ожидание ввода для узла ${targetNode.id}\n`;
            code += `                user_data[user_id]["waiting_for_input"] = {\n`;
            code += `                    "type": "${nextInputType}",\n`;
            code += `                    "variable": "${nextInputVariable}",\n`;
            code += `                    "save_to_database": True,\n`;
            code += `                    "node_id": "${targetNode.id}",\n`;
            code += `                    "next_node_id": "${nextInputTargetNodeId || ''}",\n`;
            code += `                    "min_length": 0,\n`;
            code += `                    "max_length": 0,\n`;
            code += `                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n`;
            code += `                    "success_message": ""\n`;
            code += `                }\n`;
            code += `                \n`;
          }
          
          if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            // Используем универсальную функцию для создания inline клавиатуры
            code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
            code += `                await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            code += `                await message.answer(text)\n`;
          }
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем состояние ТОЛЬКО если целевой узел НЕ собирает ввод
          if (!targetNode.data.collectUserInput) {
            code += `                # Очищаем состояние ожидания ввода после успешного перехода\n`;
            code += `                if "waiting_for_input" in user_data[user_id]:\n`;
            code += `                    del user_data[user_id]["waiting_for_input"]\n`;
            if (node.data.inputType) {
              code += `                if "input_type" in user_data[user_id]:\n`;
              code += `                    del user_data[user_id]["input_type"]\n`;
            }
          }
          code += `                \n`;
          code += `                logging.info("✅ Переход к следующему узлу выполнен успешно")\n`;
        } else {
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, имеет ли узел множественный выбор
          if (targetNode.data.allowMultipleSelection === true) {
            // Для узлов с множественным выбором создаем прямую навигацию
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `                # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
            code += `                text = ${formattedText}\n`;
            
            // Замена переменных
            code += '                user_data[user_id] = user_data.get(user_id, {})\n';
            code += generateUniversalVariableReplacement('                ');
            
            // Инициализируем состояние множественного выбора
            code += `                # Инициализируем состояние множественного выбора\n`;
            code += `                user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
            code += `                user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
            code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
            if (targetNode.data.multiSelectVariable) {
              code += `                user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
            }
            
            // Создаем inline клавиатуру с кнопками выбора
            if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
              code += `                await message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `                await message.answer(text)\n`;
            }
            code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
          } else {
            // Для обычных узлов используем обычную навигацию
            const messageText = targetNode.data.messageText || 'Сообщение';
            const formattedText = formatTextForPython(messageText);
            code += `                # Обычный узел - отправляем сообщение\n`;
            code += `                text = ${formattedText}\n`;
            
            // Добавляем замену переменных
            code += '                user_data[user_id] = user_data.get(user_id, {})\n';
            code += generateUniversalVariableReplacement('                ');
            
            // Создаем inline клавиатуру если есть кнопки
            if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
              code += `                await message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += '                await message.answer(text)\n';
            }
            code += `                logging.info(f"✅ Ввод навигация к обычному узлу: ${targetNode.id}")\n`;
          }
        }
      } else {
        // Если целевой узел не найден, добавляем заглушку
        code += `                logging.warning(f"Целевой узел {node.data.inputTargetNodeId} не найден")\n`;
        code += `                await message.answer("❌ Ошибка перехода: целевой узел не найден")\n`;
      }
      
      code += `            except Exception as e:\n`;
      code += `                logging.error(f"Ошибка при переходе к следующему узлу: {e}")\n`;
      code += `            return\n`;
    } else {
      // Если inputTargetNodeId равен null, это конец цепочки - это нормально
      code += `            # Конец цепочки ввода - завершаем обработку\n`;
      code += `            logging.info("Завершена цепочка сбора пользовательских данных")\n`;
      code += `            return\n`;
    }
  });
  
  code += '        \n';
  code += '        # Если узел не найден\n';
  code += '        logging.warning(f"Узел для сбора ввода не найден: {waiting_node_id}")\n';
  code += '        del user_data[user_id]["waiting_for_input"]\n';
  code += '        return\n';
  code += '    \n';
  code += '    # НОВАЯ ЛОГИКА: Проверяем, включен ли дополнительный сбор ответов для обычных кнопок\n';
  code += '    if user_id in user_data and user_data[user_id].get("input_collection_enabled"):\n';
  code += '        input_node_id = user_data[user_id].get("input_node_id")\n';
  code += '        input_variable = user_data[user_id].get("input_variable", "button_response")\n';
  code += '        input_target_node_id = user_data[user_id].get("input_target_node_id")\n';
  code += '        user_text = message.text\n';
  code += '        \n';
  code += '        # Если есть целевой узел для перехода - это основной ввод, а не дополнительный\n';
  code += '        if input_target_node_id:\n';
  code += '            # Это основной ввод с переходом к следующему узлу\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][input_variable] = response_data\n';
  code += '            \n';
  code += '            # Сохраняем в базу данных\n';
  code += '            saved_to_db = await update_user_data_in_db(user_id, input_variable, response_data)\n';
  code += '            if saved_to_db:\n';
  code += '                logging.info(f"✅ Данные сохранены в БД: {input_variable} = {user_text} (пользователь {user_id})")\n';
  code += '            else:\n';
  code += '                logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '            \n';
  code += '            logging.info(f"Получен основной пользовательский ввод: {input_variable} = {user_text}")\n';
  code += '            \n';
  code += '            # Переходим к целевому узлу\n';
  code += '            # Очищаем состояние сбора ввода\n';
  code += '            del user_data[user_id]["input_collection_enabled"]\n';
  code += '            if "input_node_id" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_node_id"]\n';
  code += '            if "input_variable" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_variable"]\n';
  code += '            if "input_target_node_id" in user_data[user_id]:\n';
  code += '                del user_data[user_id]["input_target_node_id"]\n';
  code += '            \n';
  code += '            # Находим и вызываем обработчик целевого узла\n';
  
  // Добавляем навигацию к целевому узлу
  nodes.forEach((targetNode) => {
    code += `            if input_target_node_id == "${targetNode.id}":\n`;
    if (targetNode.type === 'keyboard' || targetNode.type === 'message') {
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextForPython(messageText);
      code += `                # Переход к узлу ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;
      
      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      code += generateUniversalVariableReplacement('                ');
      
      // Отправляем сообщение с кнопками если есть
      if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"Переход к узлу ${targetNode.id} выполнен")\n`;
    } else if (targetNode.data.allowMultipleSelection) {
      // Для узлов с множественным выбором создаем прямую навигацию
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextForPython(messageText);
      code += `                # Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;
      
      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      code += generateUniversalVariableReplacement('                ');
      
      // Инициализируем состояние множественного выбора
      code += `                # Инициализируем состояние множественного выбора\n`;
      code += `                user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
      code += `                user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
      code += `                user_data[user_id]["multi_select_type"] = "selection"\n`;
      if (targetNode.data.multiSelectVariable) {
        code += `                user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
      }
      
      // Создаем inline клавиатуру с кнопками выбора
      if (targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;
    } else {
      // Для обычных узлов отправляем простое сообщение
      const messageText = targetNode.data.messageText || 'Сообщение';
      const formattedText = formatTextForPython(messageText);
      code += `                # Обычный узел - отправляем сообщение ${targetNode.id}\n`;
      code += `                text = ${formattedText}\n`;
      
      // Замена переменных
      code += '                user_data[user_id] = user_data.get(user_id, {})\n';
      code += generateUniversalVariableReplacement('                ');
      
      if (targetNode.data.keyboardType === 'inline' && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
        code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
        code += `                await message.answer(text, reply_markup=keyboard)\n`;
      } else {
        code += `                await message.answer(text)\n`;
      }
      code += `                logging.info(f"✅ Навигация к обычному узлу ${targetNode.id} выполнена")\n`;
    }
  });
  code += '            return\n';
  code += '        else:\n';
  code += '            # Это дополнительный комментарий (нет целевого узла)\n';
  code += '            timestamp = get_moscow_time()\n';
  code += '            response_data = user_text\n';
  code += '            \n';
  code += '            # Сохраняем в пользовательские данные\n';
  code += '            user_data[user_id][f"{input_variable}_additional"] = response_data\n';
  code += '            \n';
  code += '            # Уведомляем пользователя\n';
  code += '            await message.answer("✅ Дополнительный комментарий сохранен!")\n';
  code += '            \n';
  code += '            logging.info(f"Дополнительный текстовый ввод: {input_variable}_additional = {user_text} (пользователь {user_id})")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Если нет активного ожидания ввода, игнорируем сообщение\n';
  code += '    return\n';
  
  // Добавляем обработчик для фото
  const hasPhotoInput = (nodes || []).some(node => node.data.enablePhotoInput);
  if (hasPhotoInput) {
    code += '\n\n# Обработчик получения фото от пользователя\n';
    code += '@dp.message(F.photo)\n';
    code += 'async def handle_photo_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    logging.info(f"📸 Получено фото от пользователя {user_id}")\n';
    code += '    \n';
    code += '    # Проверяем, ожидаем ли мы ввод фото\n';
    code += '    if user_id not in user_data or "waiting_for_photo" not in user_data[user_id]:\n';
    code += '        logging.info(f"Фото от пользователя {user_id} проигнорировано - не ожидается ввод")\n';
    code += '        return\n';
    code += '    \n';
    code += '    # Получаем конфигурацию ожидания\n';
    code += '    photo_config = user_data[user_id]["waiting_for_photo"]\n';
    code += '    photo_variable = photo_config.get("variable", "user_photo")\n';
    code += '    node_id = photo_config.get("node_id", "unknown")\n';
    code += '    next_node_id = photo_config.get("next_node_id")\n';
    code += '    \n';
    code += '    # Получаем file_id фото (берем последнее - лучшее качество)\n';
    code += '    photo_file_id = message.photo[-1].file_id\n';
    code += '    logging.info(f"📸 Получен file_id фото: {photo_file_id}")\n';
    code += '    \n';
    code += '    # Сохраняем в пользовательские данные\n';
    code += '    user_data[user_id][photo_variable] = photo_file_id\n';
    code += '    \n';
    code += '    # Сохраняем в базу данных\n';
    code += '    saved_to_db = await update_user_data_in_db(user_id, photo_variable, photo_file_id)\n';
    code += '    if saved_to_db:\n';
    code += '        logging.info(f"✅ Фото сохранено в БД: {photo_variable} = {photo_file_id} (пользователь {user_id})")\n';
    code += '    else:\n';
    code += '        logging.warning(f"⚠️ Не удалось сохранить фото в БД, данные сохранены локально")\n';
    code += '    \n';
    code += '    # Очищаем состояние ожидания\n';
    code += '    del user_data[user_id]["waiting_for_photo"]\n';
    code += '    \n';
    code += '    logging.info(f"📸 Фото сохранено: {photo_variable} = {photo_file_id}")\n';
    code += '    \n';
    code += '    # Переходим к следующему узлу если указан\n';
    code += '    if next_node_id:\n';
    code += '        logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
    code += '        try:\n';
    code += '            # Получаем данные пользователя для замены переменных\n';
    code += '            user_record = await get_user_from_db(user_id)\n';
    code += '            if user_record and "user_data" in user_record:\n';
    code += '                user_vars = user_record["user_data"]\n';
    code += '            else:\n';
    code += '                user_vars = user_data.get(user_id, {})\n';
    code += '            \n';
    
    // Добавляем навигацию для каждого узла - отправляем сообщение напрямую
    if (nodes.length > 0) {
      nodes.forEach((targetNode, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `            ${condition} next_node_id == "${targetNode.id}":\n`;
        
        // Получаем текст сообщения
        const messageText = targetNode.data.messageText || targetNode.data.text || '';
        const formattedText = formatTextForPython(messageText);
        code += `                text = ${formattedText}\n`;
        
        // Добавляем замену переменных
        code += '                # Замена переменных\n';
        code += generateUniversalVariableReplacement('                ');
        
        // Проверяем attachedMedia
        const attachedMedia = targetNode.data.attachedMedia || [];
        if (attachedMedia.length > 0 && attachedMedia.includes('photo')) {
          // Отправляем фото с текстом
          code += '                # Отправляем сохраненное фото с текстом узла\n';
          code += `                if "${attachedMedia[0]}" in user_vars:\n`;
          code += `                    media_file_id = user_vars["${attachedMedia[0]}"]\n`;
          code += '                    if isinstance(media_file_id, dict) and "value" in media_file_id:\n';
          code += '                        media_file_id = media_file_id["value"]\n';
          code += '                    await message.answer_photo(media_file_id, caption=text)\n';
          code += `                    logging.info(f"✅ Отправлено фото из переменной ${attachedMedia[0]} с текстом узла {next_node_id}")\n`;
          code += '                else:\n';
          code += '                    await message.answer(text)\n';
          code += `                    logging.warning(f"⚠️ Переменная ${attachedMedia[0]} не найдена, отправлен только текст")\n`;
        } else {
          // Обычное сообщение
          code += '                await message.answer(text)\n';
        }
        
        // Проверяем автопереход
        if (targetNode.data.enableAutoTransition && targetNode.data.autoTransitionTo) {
          code += `                \n`;
          code += `                # Автопереход к следующему узлу\n`;
          code += `                auto_next_node_id = "${targetNode.data.autoTransitionTo}"\n`;
          code += `                logging.info(f"⚡ Автопереход от {next_node_id} к {auto_next_node_id}")\n`;
          
          // Находим целевой узел автоперехода
          const autoTargetNode = nodes.find(n => n.id === targetNode.data.autoTransitionTo);
          if (autoTargetNode) {
            const autoMessageText = autoTargetNode.data.messageText || autoTargetNode.data.text || '';
            const autoFormattedText = formatTextForPython(autoMessageText);
            code += `                auto_text = ${autoFormattedText}\n`;
            code += '                # Замена переменных для автоперехода\n';
            code += '                auto_user_vars = await get_user_from_db(user_id)\n';
            code += '                if not auto_user_vars:\n';
            code += '                    auto_user_vars = user_data.get(user_id, {})\n';
            code += '                if not isinstance(auto_user_vars, dict):\n';
            code += '                    auto_user_vars = {}\n';
            code += '                import re\n';
            code += '                def replace_variables_in_text(text_content, variables_dict):\n';
            code += '                    if not text_content or not variables_dict:\n';
            code += '                        return text_content\n';
            code += '                    for var_name, var_data in variables_dict.items():\n';
            code += '                        placeholder = "{" + var_name + "}"\n';
            code += '                        if placeholder in text_content:\n';
            code += '                            if isinstance(var_data, dict) and "value" in var_data:\n';
            code += '                                var_value = str(var_data["value"]) if var_data["value"] is not None else var_name\n';
            code += '                            elif var_data is not None:\n';
            code += '                                var_value = str(var_data)\n';
            code += '                            else:\n';
            code += '                                var_value = var_name\n';
            code += '                            text_content = text_content.replace(placeholder, var_value)\n';
            code += '                    return text_content\n';
            code += '                auto_text = replace_variables_in_text(auto_text, auto_user_vars)\n';
            
            // Генерируем клавиатуру для автоперехода
            const autoButtons = autoTargetNode.data.buttons || [];
            const autoKeyboardType = autoTargetNode.data.keyboardType || 'none';
            
            if (autoButtons.length > 0 && autoKeyboardType !== 'none') {
              if (autoKeyboardType === 'reply') {
                // Reply клавиатура
                code += '                # Создаем reply клавиатуру для автоперехода\n';
                code += '                auto_builder = ReplyKeyboardBuilder()\n';
                autoButtons.forEach((btn) => {
                  const btnText = formatTextForPython(btn.text || 'Button');
                  code += `                auto_builder.add(KeyboardButton(text=${btnText}))\n`;
                });
                code += '                auto_keyboard = auto_builder.as_markup(resize_keyboard=True)\n';
                code += '                await message.answer(auto_text, reply_markup=auto_keyboard)\n';
              } else if (autoKeyboardType === 'inline') {
                // Inline клавиатура
                code += '                # Создаем inline клавиатуру для автоперехода\n';
                code += '                auto_builder = InlineKeyboardBuilder()\n';
                autoButtons.forEach((btn) => {
                  const btnText = formatTextForPython(btn.text || 'Button');
                  const callbackData = btn.id || 'callback';
                  code += `                auto_builder.add(InlineKeyboardButton(text=${btnText}, callback_data="${callbackData}"))\n`;
                });
                code += '                auto_keyboard = auto_builder.as_markup()\n';
                code += '                await message.answer(auto_text, reply_markup=auto_keyboard)\n';
              }
            } else {
              // Нет кнопок
              code += `                await message.answer(auto_text)\n`;
            }
            
            code += `                logging.info(f"✅ Автопереход выполнен: {next_node_id} -> {auto_next_node_id}")\n`;
          }
        }
      });
      code += '            else:\n';
      code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
    }
    
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '    \n';
    code += '    return\n';
  }
  
  // Добавляем обработчик для видео
  const hasVideoInput = (nodes || []).some(node => node.data.enableVideoInput);
  if (hasVideoInput) {
    code += '\n\n# Обработчик получения видео от пользователя\n';
    code += '@dp.message(F.video)\n';
    code += 'async def handle_video_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    logging.info(f"🎥 Получено видео от пользователя {user_id}")\n';
    code += '    \n';
    code += '    # Проверяем, ожидаем ли мы ввод видео\n';
    code += '    if user_id not in user_data or "waiting_for_video" not in user_data[user_id]:\n';
    code += '        logging.info(f"Видео от пользователя {user_id} проигнорировано - не ожидается ввод")\n';
    code += '        return\n';
    code += '    \n';
    code += '    # Получаем конфигурацию ожидания\n';
    code += '    video_config = user_data[user_id]["waiting_for_video"]\n';
    code += '    video_variable = video_config.get("variable", "user_video")\n';
    code += '    node_id = video_config.get("node_id", "unknown")\n';
    code += '    next_node_id = video_config.get("next_node_id")\n';
    code += '    \n';
    code += '    # Получаем file_id видео\n';
    code += '    video_file_id = message.video.file_id\n';
    code += '    logging.info(f"🎥 Получен file_id видео: {video_file_id}")\n';
    code += '    \n';
    code += '    # Сохраняем в пользовательские данные\n';
    code += '    user_data[user_id][video_variable] = video_file_id\n';
    code += '    \n';
    code += '    # Сохраняем в базу данных\n';
    code += '    saved_to_db = await update_user_data_in_db(user_id, video_variable, video_file_id)\n';
    code += '    if saved_to_db:\n';
    code += '        logging.info(f"✅ Видео сохранено в БД: {video_variable} = {video_file_id} (пользователь {user_id})")\n';
    code += '    else:\n';
    code += '        logging.warning(f"⚠️ Не удалось сохранить видео в БД, данные сохранены локально")\n';
    code += '    \n';
    code += '    # Очищаем состояние ожидания\n';
    code += '    del user_data[user_id]["waiting_for_video"]\n';
    code += '    \n';
    code += '    logging.info(f"🎥 Видео сохранено: {video_variable} = {video_file_id}")\n';
    code += '    \n';
    code += '    # Переходим к следующему узлу если указан\n';
    code += '    if next_node_id:\n';
    code += '        logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
    code += '        try:\n';
    code += '            # Получаем данные пользователя для замены переменных\n';
    code += '            user_record = await get_user_from_db(user_id)\n';
    code += '            if user_record and "user_data" in user_record:\n';
    code += '                user_vars = user_record["user_data"]\n';
    code += '            else:\n';
    code += '                user_vars = user_data.get(user_id, {})\n';
    code += '            \n';
    
    // Добавляем навигацию для каждого узла - отправляем сообщение напрямую
    if (nodes.length > 0) {
      nodes.forEach((targetNode, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `            ${condition} next_node_id == "${targetNode.id}":\n`;
        
        // Получаем текст сообщения
        const messageText = targetNode.data.messageText || targetNode.data.text || '';
        const formattedText = formatTextForPython(messageText);
        code += `                text = ${formattedText}\n`;
        
        // Добавляем замену переменных
        code += '                # Замена переменных\n';
        code += generateUniversalVariableReplacement('                ');
        
        // Проверяем attachedMedia
        const attachedMedia = targetNode.data.attachedMedia || [];
        if (attachedMedia.length > 0 && attachedMedia.includes('video')) {
          // Отправляем видео с текстом
          code += '                # Отправляем сохраненное видео с текстом узла\n';
          code += `                if "${attachedMedia[0]}" in user_vars:\n`;
          code += `                    media_file_id = user_vars["${attachedMedia[0]}"]\n`;
          code += '                    if isinstance(media_file_id, dict) and "value" in media_file_id:\n';
          code += '                        media_file_id = media_file_id["value"]\n';
          code += '                    await message.answer_video(media_file_id, caption=text)\n';
          code += `                    logging.info(f"✅ Отправлено видео из переменной ${attachedMedia[0]} с текстом узла {next_node_id}")\n`;
          code += '                else:\n';
          code += '                    await message.answer(text)\n';
          code += `                    logging.warning(f"⚠️ Переменная ${attachedMedia[0]} не найдена, отправлен только текст")\n`;
        } else {
          // Обычное сообщение
          code += '                await message.answer(text)\n';
        }
      });
      code += '            else:\n';
      code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
    }
    
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '    \n';
    code += '    return\n';
  }
  
  // Добавляем обработчик для аудио
  const hasAudioInput = (nodes || []).some(node => node.data.enableAudioInput);
  if (hasAudioInput) {
    code += '\n\n# Обработчик получения аудио от пользователя\n';
    code += '@dp.message(F.audio | F.voice)\n';
    code += 'async def handle_audio_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    logging.info(f"🎵 Получено аудио от пользователя {user_id}")\n';
    code += '    \n';
    code += '    # Проверяем, ожидаем ли мы ввод аудио\n';
    code += '    if user_id not in user_data or "waiting_for_audio" not in user_data[user_id]:\n';
    code += '        logging.info(f"Аудио от пользователя {user_id} проигнорировано - не ожидается ввод")\n';
    code += '        return\n';
    code += '    \n';
    code += '    # Получаем конфигурацию ожидания\n';
    code += '    audio_config = user_data[user_id]["waiting_for_audio"]\n';
    code += '    audio_variable = audio_config.get("variable", "user_audio")\n';
    code += '    node_id = audio_config.get("node_id", "unknown")\n';
    code += '    next_node_id = audio_config.get("next_node_id")\n';
    code += '    \n';
    code += '    # Получаем file_id аудио (поддерживаем и audio, и voice)\n';
    code += '    if message.audio:\n';
    code += '        audio_file_id = message.audio.file_id\n';
    code += '    elif message.voice:\n';
    code += '        audio_file_id = message.voice.file_id\n';
    code += '    else:\n';
    code += '        logging.error("Не удалось получить file_id аудио")\n';
    code += '        return\n';
    code += '    logging.info(f"🎵 Получен file_id аудио: {audio_file_id}")\n';
    code += '    \n';
    code += '    # Сохраняем в пользовательские данные\n';
    code += '    user_data[user_id][audio_variable] = audio_file_id\n';
    code += '    \n';
    code += '    # Сохраняем в базу данных\n';
    code += '    saved_to_db = await update_user_data_in_db(user_id, audio_variable, audio_file_id)\n';
    code += '    if saved_to_db:\n';
    code += '        logging.info(f"✅ Аудио сохранено в БД: {audio_variable} = {audio_file_id} (пользователь {user_id})")\n';
    code += '    else:\n';
    code += '        logging.warning(f"⚠️ Не удалось сохранить аудио в БД, данные сохранены локально")\n';
    code += '    \n';
    code += '    # Очищаем состояние ожидания\n';
    code += '    del user_data[user_id]["waiting_for_audio"]\n';
    code += '    \n';
    code += '    logging.info(f"🎵 Аудио сохранено: {audio_variable} = {audio_file_id}")\n';
    code += '    \n';
    code += '    # Переходим к следующему узлу если указан\n';
    code += '    if next_node_id:\n';
    code += '        logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
    code += '        try:\n';
    code += '            # Получаем данные пользователя для замены переменных\n';
    code += '            user_record = await get_user_from_db(user_id)\n';
    code += '            if user_record and "user_data" in user_record:\n';
    code += '                user_vars = user_record["user_data"]\n';
    code += '            else:\n';
    code += '                user_vars = user_data.get(user_id, {})\n';
    code += '            \n';
    
    // Добавляем навигацию для каждого узла - отправляем сообщение напрямую
    if (nodes.length > 0) {
      nodes.forEach((targetNode, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `            ${condition} next_node_id == "${targetNode.id}":\n`;
        
        // Получаем текст сообщения
        const messageText = targetNode.data.messageText || targetNode.data.text || '';
        const formattedText = formatTextForPython(messageText);
        code += `                text = ${formattedText}\n`;
        
        // Добавляем замену переменных
        code += '                # Замена переменных\n';
        code += generateUniversalVariableReplacement('                ');
        
        // Проверяем attachedMedia
        const attachedMedia = targetNode.data.attachedMedia || [];
        if (attachedMedia.length > 0 && attachedMedia.includes('audio')) {
          // Отправляем аудио с текстом
          code += '                # Отправляем сохраненное аудио с текстом узла\n';
          code += `                if "${attachedMedia[0]}" in user_vars:\n`;
          code += `                    media_file_id = user_vars["${attachedMedia[0]}"]\n`;
          code += '                    if isinstance(media_file_id, dict) and "value" in media_file_id:\n';
          code += '                        media_file_id = media_file_id["value"]\n';
          code += '                    await message.answer_audio(media_file_id, caption=text)\n';
          code += `                    logging.info(f"✅ Отправлено аудио из переменной ${attachedMedia[0]} с текстом узла {next_node_id}")\n`;
          code += '                else:\n';
          code += '                    await message.answer(text)\n';
          code += `                    logging.warning(f"⚠️ Переменная ${attachedMedia[0]} не найдена, отправлен только текст")\n`;
        } else {
          // Обычное сообщение
          code += '                await message.answer(text)\n';
        }
      });
      code += '            else:\n';
      code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
    }
    
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '    \n';
    code += '    return\n';
  }
  
  // Добавляем обработчик для документов
  const hasDocumentInput = (nodes || []).some(node => node.data.enableDocumentInput);
  if (hasDocumentInput) {
    code += '\n\n# Обработчик получения документа от пользователя\n';
    code += '@dp.message(F.document)\n';
    code += 'async def handle_document_input(message: types.Message):\n';
    code += '    user_id = message.from_user.id\n';
    code += '    logging.info(f"📄 Получен документ от пользователя {user_id}")\n';
    code += '    \n';
    code += '    # Проверяем, ожидаем ли мы ввод документа\n';
    code += '    if user_id not in user_data or "waiting_for_document" not in user_data[user_id]:\n';
    code += '        logging.info(f"Документ от пользователя {user_id} проигнорирован - не ожидается ввод")\n';
    code += '        return\n';
    code += '    \n';
    code += '    # Получаем конфигурацию ожидания\n';
    code += '    document_config = user_data[user_id]["waiting_for_document"]\n';
    code += '    document_variable = document_config.get("variable", "user_document")\n';
    code += '    node_id = document_config.get("node_id", "unknown")\n';
    code += '    next_node_id = document_config.get("next_node_id")\n';
    code += '    \n';
    code += '    # Получаем file_id документа\n';
    code += '    document_file_id = message.document.file_id\n';
    code += '    logging.info(f"📄 Получен file_id документа: {document_file_id}")\n';
    code += '    \n';
    code += '    # Сохраняем в пользовательские данные\n';
    code += '    user_data[user_id][document_variable] = document_file_id\n';
    code += '    \n';
    code += '    # Сохраняем в базу данных\n';
    code += '    saved_to_db = await update_user_data_in_db(user_id, document_variable, document_file_id)\n';
    code += '    if saved_to_db:\n';
    code += '        logging.info(f"✅ Документ сохранен в БД: {document_variable} = {document_file_id} (пользователь {user_id})")\n';
    code += '    else:\n';
    code += '        logging.warning(f"⚠️ Не удалось сохранить документ в БД, данные сохранены локально")\n';
    code += '    \n';
    code += '    # Очищаем состояние ожидания\n';
    code += '    del user_data[user_id]["waiting_for_document"]\n';
    code += '    \n';
    code += '    logging.info(f"📄 Документ сохранен: {document_variable} = {document_file_id}")\n';
    code += '    \n';
    code += '    # Переходим к следующему узлу если указан\n';
    code += '    if next_node_id:\n';
    code += '        logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
    code += '        try:\n';
    code += '            # Получаем данные пользователя для замены переменных\n';
    code += '            user_record = await get_user_from_db(user_id)\n';
    code += '            if user_record and "user_data" in user_record:\n';
    code += '                user_vars = user_record["user_data"]\n';
    code += '            else:\n';
    code += '                user_vars = user_data.get(user_id, {})\n';
    code += '            \n';
    
    // Добавляем навигацию для каждого узла - отправляем сообщение напрямую
    if (nodes.length > 0) {
      nodes.forEach((targetNode, index) => {
        const condition = index === 0 ? 'if' : 'elif';
        code += `            ${condition} next_node_id == "${targetNode.id}":\n`;
        
        // Получаем текст сообщения
        const messageText = targetNode.data.messageText || targetNode.data.text || '';
        const formattedText = formatTextForPython(messageText);
        code += `                text = ${formattedText}\n`;
        
        // Добавляем замену переменных
        code += '                # Замена переменных\n';
        code += generateUniversalVariableReplacement('                ');
        
        // Проверяем attachedMedia
        const attachedMedia = targetNode.data.attachedMedia || [];
        if (attachedMedia.length > 0 && attachedMedia.includes('document')) {
          // Отправляем документ с текстом
          code += '                # Отправляем сохраненный документ с текстом узла\n';
          code += `                if "${attachedMedia[0]}" in user_vars:\n`;
          code += `                    media_file_id = user_vars["${attachedMedia[0]}"]\n`;
          code += '                    if isinstance(media_file_id, dict) and "value" in media_file_id:\n';
          code += '                        media_file_id = media_file_id["value"]\n';
          code += '                    await message.answer_document(media_file_id, caption=text)\n';
          code += `                    logging.info(f"✅ Отправлен документ из переменной ${attachedMedia[0]} с текстом узла {next_node_id}")\n`;
          code += '                else:\n';
          code += '                    await message.answer(text)\n';
          code += `                    logging.warning(f"⚠️ Переменная ${attachedMedia[0]} не найдена, отправлен только текст")\n`;
        } else {
          // Обычное сообщение
          code += '                await message.answer(text)\n';
        }
      });
      code += '            else:\n';
      code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
    }
    
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
    code += '    \n';
    code += '    return\n';
  }
  
  code += '    # Валидация длины текста\n';
  code += '    min_length = input_config.get("min_length", 0)\n';
  code += '    max_length = input_config.get("max_length", 0)\n';
  code += '    \n';
  code += '    if min_length > 0 and len(user_text) < min_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    if max_length > 0 and len(user_text) > max_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Валидация типа ввода\n';
  code += '    input_type = input_config.get("type", "text")\n';
  code += '    \n';
  code += '    if input_type == "email":\n';
  code += '        import re\n';
  code += '        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
  code += '        if not re.match(email_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "number":\n';
  code += '        try:\n';
  code += '            float(user_text)\n';
  code += '        except ValueError:\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "phone":\n';
  code += '        import re\n';
  code += '        phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
  code += '        if not re.match(phone_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    # Сохраняем ответ пользователя простым значением\n';
  code += '    variable_name = input_config.get("variable", "user_response")\n';
  code += '    timestamp = get_moscow_time()\n';
  code += '    node_id = input_config.get("node_id", "unknown")\n';
  code += '    \n';
  code += '    # Простое значение вместо сложного объекта\n';
  code += '    response_data = user_text\n';
  code += '    \n';
  code += '    # Сохраняем в пользовательские данные\n';
  code += '    user_data[user_id][variable_name] = response_data\n';
  code += '    \n';
  code += '    # Сохраняем в базу данных если включено\n';
  code += '    if input_config.get("save_to_database"):\n';
  code += '        saved_to_db = await update_user_data_in_db(user_id, variable_name, response_data)\n';
  code += '        if saved_to_db:\n';
  code += '            logging.info(f"✅ Данные сохранены в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
  code += '        else:\n';
  code += '            logging.warning(f"⚠️ Не удалось сохранить в БД, данные сохранены локально")\n';
  code += '    \n';
  code += '    # Отправляем сообщение об успехе только если оно задано\n';
  code += '    success_message = input_config.get("success_message", "")\n';
  code += '    if success_message:\n';
  code += '        await message.answer(success_message)\n';
  code += '    \n';
  code += '    # Очищаем состояние ожидания ввода\n';
  code += '    del user_data[user_id]["waiting_for_input"]\n';
  code += '    \n';
  code += '    logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
  code += '    \n';
  code += '    # Автоматическая навигация к следующему узлу после успешного ввода\n';
  code += '    next_node_id = input_config.get("next_node_id")\n';
  code += '    logging.info(f"🔄 Проверяем навигацию: next_node_id = {next_node_id}")\n';
  code += '    if next_node_id:\n';
  code += '        try:\n';
  code += '            logging.info(f"🚀 Переходим к следующему узлу: {next_node_id}")\n';
  code += '            \n';
  code += '            # Создаем фейковое сообщение для навигации\n';
  code += '            fake_message = type("FakeMessage", (), {})()\n';
  code += '            fake_message.from_user = message.from_user\n';
  code += '            fake_message.answer = message.answer\n';
  code += '            fake_message.delete = lambda: None\n';
  code += '            \n';
  code += '            # Находим узел по ID и выполняем соответствующее действие\n';
  
  // Generate navigation logic for each node type
  if (nodes.length > 0) {
    nodes.forEach((targetNode, index) => {
      const condition = index === 0 ? 'if' : 'elif';
      code += `            ${condition} next_node_id == "${targetNode.id}":\n`;
      
      if (targetNode.type === 'keyboard') {
        // Обработка узлов клавиатуры
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        
        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += `                text = ${formattedText}\n`;
          code += '                builder = InlineKeyboardBuilder()\n';
          targetNode.data.buttons.forEach((button: Button, buttonIndex: number) => {
            if (button.action === "url") {
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
            } else if (button.action === 'goto') {
              const callbackData = button.target || button.id || 'no_action';
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
            } else if (button.action === 'command') {
              const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
            } else {
              const callbackData = button.target || button.id || 'no_action';
              code += `                builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
            }
          });
          code += '                keyboard = builder.as_markup()\n';
          code += '                await fake_message.answer(text, reply_markup=keyboard)\n';
        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
          code += `                text = ${formattedText}\n`;
          code += '                builder = ReplyKeyboardBuilder()\n';
          targetNode.data.buttons.forEach((button: Button) => {
            if (button.action === "contact" && button.requestContact) {
              code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
            } else if (button.action === "location" && button.requestLocation) {
              code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
            } else {
              code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
            }
          });
          const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
          const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
          code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
          code += '                await fake_message.answer(text, reply_markup=keyboard)\n';
        } else {
          code += `                text = ${formattedText}\n`;
          code += '                await fake_message.answer(text)\n';
        }
        
        // Проверяем, нужно ли настроить ожидание текстового ввода
        // ИСПРАВЛЕНИЕ: Используем универсальную функцию для настройки ожидания ввода
        if (targetNode.data.enableTextInput || targetNode.data.collectUserInput || 
            targetNode.data.enablePhotoInput || targetNode.data.enableVideoInput || 
            targetNode.data.enableAudioInput || targetNode.data.enableDocumentInput) {
          code += generateWaitingStateCode(targetNode, '                ');
        }
      } else if (targetNode.type === 'message') {
        // Добавляем поддержку условных сообщений для узлов сообщений
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        
        if (targetNode.data.enableConditionalMessages && targetNode.data.conditionalMessages && targetNode.data.conditionalMessages.length > 0) {
          code += '                # Проверяем условные сообщения\n';
          code += '                text = None\n';
          code += '                \n';
          code += '                # Получаем данные пользователя для проверки условий\n';
          code += '                user_record = await get_user_from_db(user_id)\n';
          code += '                if not user_record:\n';
          code += '                    user_record = user_data.get(user_id, {})\n';
          code += '                \n';
          code += '                # Безопасно извлекаем user_data\n';
          code += '                if isinstance(user_record, dict):\n';
          code += '                    if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
          code += '                        user_data_dict = user_record["user_data"]\n';
          code += '                    else:\n';
          code += '                        user_data_dict = user_record\n';
          code += '                else:\n';
          code += '                    user_data_dict = {}\n';
          code += '                \n';
          
          // Generate conditional logic using helper function
          code += generateConditionalMessageLogic(targetNode.data.conditionalMessages, '                ');
          
          // Add fallback
          code += '                else:\n';
          
          if (targetNode.data.fallbackMessage) {
            const fallbackText = formatTextForPython(targetNode.data.fallbackMessage);
            code += `                    text = ${fallbackText}\n`;
            code += '                    logging.info("Используется запасное сообщение")\n';
          } else {
            code += `                    text = ${formattedText}\n`;
            code += '                    logging.info("Используется основное сообщение узла")\n';
          }
          
          code += '                \n';
        } else {
          code += `                text = ${formattedText}\n`;
        }
        
        // Определяем режим форматирования (приоритет у условного сообщения)
        code += '                # Используем parse_mode условного сообщения если он установлен\n';
        code += '                if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:\n';
        code += '                    parse_mode = conditional_parse_mode\n';
        code += '                else:\n';
        if (targetNode.data.formatMode === 'markdown' || targetNode.data.markdown === true) {
          code += '                    parse_mode = ParseMode.MARKDOWN\n';
        } else if (targetNode.data.formatMode === 'html') {
          code += '                    parse_mode = ParseMode.HTML\n';
        } else {
          code += '                    parse_mode = None\n';
        }
        
        // Добавляем кнопки если есть
        if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
          // Используем универсальную функцию для создания inline клавиатуры
          code += generateInlineKeyboardCode(targetNode.data.buttons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
        } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
          code += '                builder = ReplyKeyboardBuilder()\n';
          targetNode.data.buttons.forEach(button => {
            code += `                builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
          });
          const resizeKeyboard = toPythonBoolean(targetNode.data.resizeKeyboard);
          const oneTimeKeyboard = toPythonBoolean(targetNode.data.oneTimeKeyboard);
          code += `                keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
          code += '                await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n';
        } else {
          code += '                await message.answer(text, parse_mode=parse_mode)\n';
        }
      } else if (targetNode.type === 'message' && (targetNode.data.inputVariable || targetNode.data.responseType)) {
        const inputPrompt = formatTextForPython(targetNode.data.messageText || targetNode.data.inputPrompt || "Введите ваш ответ:");
        const responseType = targetNode.data.responseType || 'text';
        const inputType = targetNode.data.inputType || 'text';
        const inputVariable = targetNode.data.inputVariable || `response_${targetNode.id}`;
        const minLength = targetNode.data.minLength || 0;
        const maxLength = targetNode.data.maxLength || 0;
        const inputTimeout = targetNode.data.inputTimeout || 60;
        const saveToDatabase = targetNode.data.saveToDatabase || false;
        const placeholder = targetNode.data.placeholder || "";
        const responseOptions = targetNode.data.responseOptions || [];
        const allowMultipleSelection = targetNode.data.allowMultipleSelection || false;
        const allowSkip = targetNode.data.allowSkip || false;
        
        code += `                prompt_text = "${escapeForJsonString(inputPrompt)}"\n`;
        if (placeholder) {
          code += `                placeholder_text = "${placeholder}"\n`;
          code += '                prompt_text += f"\\n\\n💡 {placeholder_text}"\n';
        }
        
        // Check if this is a button response node
        if (responseType === 'buttons' && responseOptions.length > 0) {
          // For button response nodes, set up button_response_config
          code += '                \n';
          code += '                # Создаем кнопки для выбора ответа\n';
          code += '                builder = InlineKeyboardBuilder()\n';
          
          // Создаем кнопки для вариантов ответа
          const responseButtons = responseOptions.map((option: string, index: number) => ({
            text: option.text,
            action: 'goto',
            target: `response_${targetNode.id}_${index}`,
            id: `response_${targetNode.id}_${index}`
          }));
          
          if (allowSkip) {
            responseButtons.push({
              text: "⏭️ Пропустить",
              action: 'goto',
              target: `skip_${targetNode.id}`,
              id: `skip_${targetNode.id}`
            });
          }
          
          // Используем универсальную функцию для создания inline клавиатуры
          code += generateInlineKeyboardCode(responseButtons, '                ', targetNode.id, targetNode.data, allNodeIds);
          code += '                await message.answer(prompt_text, reply_markup=keyboard)\n';
          code += '                \n';
          code += '                # Настраиваем конфигурацию кнопочного ответа\n';
          code += '                user_data[user_id]["button_response_config"] = {\n';
          code += `                    "variable": "${inputVariable}",\n`;
          code += `                    "node_id": "${targetNode.id}",\n`;
          code += `                    "timeout": ${inputTimeout},\n`;
          code += `                    "allow_multiple": ${toPythonBoolean(allowMultipleSelection)},\n`;
          code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
          code += '                    "selected": [],\n';
          code += '                    "success_message": "",\n';
          code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
          code += '                    "options": [\n';
          
          // Добавляем каждый вариант ответа с индивидуальными настройками навигации
          responseOptions.forEach((option: string, index: number) => {
            const optionValue = option.value || option.text;
            const action = option.action || 'goto';
            const target = option.target || '';
            const url = option.url || '';
            
            code += '                        {\n';
            code += `                            "text": "${escapeForJsonString(option.text)}",\n`;
            code += `                            "value": "${escapeForJsonString(optionValue)}",\n`;
            code += `                            "action": "${action}",\n`;
            code += `                            "target": "${target}",\n`;
            code += `                            "url": "${url}",\n`;
            code += `                            "callback_data": "response_${targetNode.id}_${index}"\n`;
            code += '                        }';
            if (index < responseOptions.length - 1) {
              code += ',';
            }
            code += '\n';
          });
          
          code += '                    ],\n';
          
          // Находим следующий узел для этого user-input узла (fallback)
          const nextConnection = connections.find(conn => conn.source === targetNode.id);
          if (nextConnection) {
            code += `                    "next_node_id": "${nextConnection.target}"\n`;
          } else {
            code += '                    "next_node_id": None\n';
          }
          code += '                }\n';
        } else {
          // For text input nodes, use waiting_for_input
          code += '                await message.answer(prompt_text)\n';
          code += '                \n';
          code += '                # Настраиваем ожидание ввода\n';
          code += '                user_data[user_id]["waiting_for_input"] = {\n';
          code += `                    "type": "${inputType}",\n`;
          code += `                    "variable": "${inputVariable}",\n`;
          code += '                    "validation": "",\n';
          code += `                    "min_length": ${minLength},\n`;
          code += `                    "max_length": ${maxLength},\n`;
          code += `                    "timeout": ${inputTimeout},\n`;
          code += '                    "required": True,\n';
          code += '                    "allow_skip": False,\n';
          code += `                    "save_to_database": ${toPythonBoolean(saveToDatabase)},\n`;
          code += '                    "retry_message": "Пожалуйста, попробуйте еще раз.",\n';
          code += '                    "success_message": "",\n';
          code += `                    "prompt": "${escapeForJsonString(inputPrompt)}",\n`;
          code += `                    "node_id": "${targetNode.id}",\n`;
          
          // Находим следующий узел для этого user-input узла
          const nextConnection = connections.find(conn => conn.source === targetNode.id);
          if (nextConnection) {
            code += `                    "next_node_id": "${nextConnection.target}"\n`;
          } else {
            code += '                    "next_node_id": None\n';
          }
          code += '                }\n';
        }
      } else if (targetNode.type === 'message') {
        // Обработка узлов сообщений
        const messageText = targetNode.data.messageText || 'Сообщение';
        const formattedText = formatTextForPython(messageText);
        code += `                await fake_message.answer(${formattedText})\n`;
        code += `                logging.info(f"Отправлено сообщение узла ${targetNode.id}")\n`;
      } else {
        // Для других типов узлов просто логируем
        code += `                logging.info(f"Переход к узлу ${targetNode.id} типа ${targetNode.type}")\n`;
      }
    });
    
    code += '            else:\n';
    code += '                logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n';
  } else {
    code += '            # No nodes available for navigation\n';
    code += '            logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n';
  }
  code += '        except Exception as e:\n';
  code += '            logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n';
  code += '\n';
  }

  // Добавляем обработчик для условных кнопок (conditional_variableName_value) ТОЛЬКО если есть условные кнопки
  if (hasConditionalButtons(nodes)) {
  code += '\n# Обработчик для условных кнопок\n';
  code += '@dp.callback_query(lambda c: c.data.startswith("conditional_"))\n';
  code += 'async def handle_conditional_button(callback_query: types.CallbackQuery):\n';
  code += '    await callback_query.answer()\n';
  code += '    \n';
  code += '    # Парсим callback_data: conditional_variableName_value\n';
  code += '    callback_parts = callback_query.data.split("_", 2)\n';
  code += '    if len(callback_parts) >= 3:\n';
  code += '        variable_name = callback_parts[1]\n';
  code += '        variable_value = callback_parts[2]\n';
  code += '        \n';
  code += '        user_id = callback_query.from_user.id\n';
  code += '        \n';
  code += '        # Сохраняем значение в базу данных\n';
  code += '        await update_user_data_in_db(user_id, variable_name, variable_value)\n';
  code += '        \n';
  code += '        # Сохраняем в локальные данные\n';
  code += '        if user_id not in user_data:\n';
  code += '            user_data[user_id] = {}\n';
  code += '        user_data[user_id][variable_name] = variable_value\n';
  code += '        \n';
  code += '        logging.info(f"Условная кнопка: {variable_name} = {variable_value} (пользователь {user_id})")\n';
  code += '        \n';
  code += '        # После обновления значения автоматически вызываем профиль\n';
  code += '        await callback_query.answer(f"✅ {variable_name} обновлено")\n';
  code += '        \n';
  code += '        # Создаем имитацию сообщения для вызова команды профиль\n';
  code += '        class FakeMessage:\n';
  code += '            def __init__(self, callback_query):\n';
  code += '                self.from_user = callback_query.from_user\n';
  code += '                self.chat = callback_query.message.chat\n';
  code += '                self.date = callback_query.message.date\n';
  code += '                self.message_id = callback_query.message.message_id\n';
  code += '            \n';
  code += '            async def answer(self, text, parse_mode=None, reply_markup=None):\n';
  code += '                if reply_markup:\n';
  code += '                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
  code += '                else:\n';
  code += '                    await bot.send_message(self.chat.id, text, parse_mode=parse_mode)\n';
  code += '            \n';
  code += '            async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
  code += '                try:\n';
  code += '                    await bot.edit_message_text(text, self.chat.id, self.message_id, parse_mode=parse_mode, reply_markup=reply_markup)\n';
  code += '                except Exception:\n';
  code += '                    await self.answer(text, parse_mode, reply_markup)\n';
  code += '        \n';
  code += '        fake_message = FakeMessage(callback_query)\n';
  code += '        \n';
  code += '        # Вызываем обработчик профиля\n';
  code += '        try:\n';
  code += '            await profile_handler(fake_message)\n';
  code += '        except Exception as e:\n';
  code += '            logging.error(f"Ошибка вызова profile_handler: {e}")\n';
  code += '            await callback_query.message.answer(f"✅ Значение {variable_name} обновлено на: {variable_value}")\n';
  code += '    else:\n';
  code += '        logging.warning(f"Неверный формат условной кнопки: {callback_query.data}")\n';
  code += '        await callback_query.answer("❌ Ошибка обработки кнопки", show_alert=True)\n';
  code += '\n';
  }

  // Добавляем обработчики для кнопок команд (типа cmd_start) с подробным логированием
  const commandButtons = new Set<string>();
  console.log('🔍 НАЧИНАЕМ СБОР КНОПОК КОМАНД из', nodes.length, 'узлов');
  
  nodes.forEach(node => {
    console.log(`🔎 Проверяем узел ${node.id} (тип: ${node.type})`);
    
    // Обычные кнопки узла
    if (node.data.buttons) {
      console.log(`📋 Узел ${node.id} имеет ${node.data.buttons.length} кнопок`);
      node.data.buttons.forEach((button: Button, index: number) => {
        console.log(`  🔘 Кнопка ${index}: "${button.text}" (action: ${button.action}, target: ${button.target})`);
        if (button.action === 'command' && button.target) {
          const commandCallback = `cmd_${button.target.replace('/', '')}`;
          console.log(`✅ НАЙДЕНА кнопка команды: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
          commandButtons.add(commandCallback);
        }
      });
    } else {
      console.log(`❌ Узел ${node.id} не имеет кнопок`);
    }
    
    // Кнопки в условных сообщениях
    if (node.data.conditionalMessages) {
      console.log(`📨 Узел ${node.id} имеет ${node.data.conditionalMessages.length} условных сообщений`);
      node.data.conditionalMessages.forEach((condition: any) => {
        if (condition.buttons) {
          condition.buttons.forEach((button: Button) => {
            console.log(`  🔘 Условная кнопка: "${button.text}" (action: ${button.action}, target: ${button.target})`);
            if (button.action === 'command' && button.target) {
              const commandCallback = `cmd_${button.target.replace('/', '')}`;
              console.log(`✅ НАЙДЕНА кнопка команды в условном сообщении: ${button.text} -> ${button.target} -> ${commandCallback} в узле ${node.id}`);
              commandButtons.add(commandCallback);
            }
          });
        }
      });
    }
  });
  
  console.log(`🎯 ИТОГО найдено кнопок команд: ${commandButtons.size}`);
  console.log('📝 Список найденных кнопок команд:', Array.from(commandButtons));
  
  if (commandButtons.size > 0) {
    code += '\n# Обработчики для кнопок команд\n';
    code += `# Найдено ${commandButtons.size} кнопок команд: ${Array.from(commandButtons).join(', ')}\n`;
    
    commandButtons.forEach(commandCallback => {
      const command = commandCallback.replace('cmd_', '');
      code += `\n@dp.callback_query(lambda c: c.data == "${commandCallback}")\n`;
      code += `async def handle_${commandCallback}(callback_query: types.CallbackQuery):\n`;
      code += '    await callback_query.answer()\n';
      code += `    logging.info(f"Обработка кнопки команды: ${commandCallback} -> /${command} (пользователь {callback_query.from_user.id})")\n`;
      code += `    # Симулируем выполнение команды /${command}\n`;
      code += '    \n';
      code += '    # Создаем fake message object для команды\n';
      code += '    from types import SimpleNamespace\n';
      code += '    fake_message = SimpleNamespace()\n';
      code += '    fake_message.from_user = callback_query.from_user\n';
      code += '    fake_message.chat = callback_query.message.chat\n';
      code += '    fake_message.date = callback_query.message.date\n';
      code += '    fake_message.answer = callback_query.message.answer\n';
      code += '    fake_message.edit_text = callback_query.message.edit_text\n';
      code += '    \n';
      
      // Найти соответствующий обработчик команды
      const commandNode = nodes.find(n => n.data.command === `/${command}` || n.data.command === command);
      if (commandNode) {
        if (commandNode.type === 'start') {
          code += '    # Вызываем start handler через edit_text\n';
          code += '    # Создаем специальный объект для редактирования сообщения\n';
          code += '    class FakeMessageEdit:\n';
          code += '        def __init__(self, callback_query):\n';
          code += '            self.from_user = callback_query.from_user\n';
          code += '            self.chat = callback_query.message.chat\n';
          code += '            self.date = callback_query.message.date\n';
          code += '            self.message_id = callback_query.message.message_id\n';
          code += '            self._callback_query = callback_query\n';
          code += '        \n';
          code += '        async def answer(self, text, parse_mode=None, reply_markup=None):\n';
          code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
          code += '        \n';
          code += '        async def edit_text(self, text, parse_mode=None, reply_markup=None):\n';
          code += '            await self._callback_query.message.edit_text(text, parse_mode=parse_mode, reply_markup=reply_markup)\n';
          code += '    \n';
          code += '    fake_edit_message = FakeMessageEdit(callback_query)\n';
          code += '    await start_handler(fake_edit_message)\n';
        } else if (commandNode.type === 'command') {
          code += `    # Вызываем ${command} handler\n`;
          code += `    await ${command}_handler(fake_message)\n`;
        }
      } else {
        code += `    await callback_query.message.edit_text("Команда /${command} выполнена")\n`;
      }
      code += `    logging.info(f"Команда /${command} выполнена через callback кнопку (пользователь {callback_query.from_user.id})")\n`;
    });
  }

  // Reply button обработчики уже добавлены выше, перед универсальным обработчиком текста
  code += '\n';

  // Добавляем обработчики для групп
  if (groups && groups.length > 0) {
    code += '\n# Обработчики для работы с группами\n';
    code += '@dp.message(F.chat.type.in_(["group", "supergroup"]))\n';
    code += 'async def handle_group_message(message: types.Message):\n';
    code += '    """\n';
    code += '    Обработчик сообщений в группах\n';
    code += '    """\n';
    code += '    chat_id = message.chat.id\n';
    code += '    user_id = message.from_user.id\n';
    code += '    username = message.from_user.username or "Неизвестный"\n';
    code += '    \n';
    code += '    # Проверяем, является ли группа подключенной\n';
    code += '    group_name = None\n';
    code += '    for name, config in CONNECTED_GROUPS.items():\n';
    code += '        if config.get("id") and str(config["id"]) == str(chat_id):\n';
    code += '            group_name = name\n';
    code += '            break\n';
    code += '    \n';
    code += '    if group_name:\n';
    code += '        logging.info(f"📢 Сообщение в подключенной группе {group_name}: {message.text[:50]}... от @{username}")\n';
    code += '        \n';
    code += '        # Здесь можно добавить логику обработки групповых сообщений\n';
    code += '        # Например, модерация, автоответы, статистика и т.д.\n';
    code += '        \n';
    code += '        # Сохраняем статистику сообщений\n';
    code += '        try:\n';
    code += '            await save_group_message_stats(chat_id, user_id, message.text)\n';
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка сохранения статистики группы: {e}")\n';
    code += '    \n';
    code += '# Функция для сохранения статистики групповых сообщений\n';
    code += 'async def save_group_message_stats(chat_id: int, user_id: int, message_text: str):\n';
    code += '    """\n';
    code += '    Сохраняет статистику сообщений в группе\n';
    code += '    """\n';
    code += '    if db_pool:\n';
    code += '        try:\n';
    code += '            async with db_pool.acquire() as conn:\n';
    code += '                # Здесь можно добавить логику сохранения статистики в БД\n';
    code += '                await conn.execute(\n';
    code += '                    """\n';
    code += '                    INSERT INTO group_activity (chat_id, user_id, message_length, created_at) \n';
    code += '                    VALUES ($1, $2, $3, $4)\n';
    code += '                    ON CONFLICT DO NOTHING\n';
    code += '                    """,\n';
    code += '                    chat_id, user_id, len(message_text or ""), get_moscow_time()\n';
    code += '                )\n';
    code += '        except Exception as e:\n';
    code += '            logging.error(f"Ошибка при сохранении статистики группы: {e}")\n';
    code += '    \n';
    
    // Добавляем обработчик новых участников
    code += '# Обработчик новых участников в группе\n';
    code += '@dp.message(F.new_chat_members)\n';
    code += 'async def handle_new_member(message: types.Message):\n';
    code += '    """\n';
    code += '    Обработчик новых участников в группе\n';
    code += '    """\n';
    code += '    chat_id = message.chat.id\n';
    code += '    \n';
    code += '    # Проверяем, является ли группа подключенной\n';
    code += '    group_name = None\n';
    code += '    for name, config in CONNECTED_GROUPS.items():\n';
    code += '        if config.get("id") and str(config["id"]) == str(chat_id):\n';
    code += '            group_name = name\n';
    code += '            break\n';
    code += '    \n';
    code += '    if group_name:\n';
    code += '        for new_member in message.new_chat_members:\n';
    code += '            username = new_member.username or new_member.first_name or "Новый участник"\n';
    code += '            logging.info(f"👋 Новый участник в группе {group_name}: @{username}")\n';
    code += '            \n';
    code += '            # Приветственное сообщение (опционально)\n';
    code += '            # await message.answer(f"Добро пожаловать в группу, @{username}!")\n';
    code += '    \n';
  }
  
  // Добавляем универсальный fallback-обработчик для всех текстовых сообщений
  // Этот обработчик ОБЯЗАТЕЛЬНО нужен, чтобы middleware сохранял ВСЕ сообщения
  // Middleware вызывается только для зарегистрированных обработчиков!
  // ВАЖНО: Добавляем только если база данных включена
  if (userDatabaseEnabled) {
    code += '\n# Универсальный fallback-обработчик для всех необработанных текстовых сообщений\n';
    code += '@dp.message(F.text)\n';
    code += 'async def fallback_text_handler(message: types.Message):\n';
    code += '    """\n';
    code += '    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.\n';
    code += '    Благодаря middleware, сообщение уже сохранено в БД.\n';
    code += '    Этот обработчик просто логирует факт необработанного сообщения.\n';
    code += '    """\n';
    code += '    logging.info(f"💬 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")\n';
    code += '    # Можно отправить ответ пользователю (опционально)\n';
    code += '    # await message.answer("Извините, я не понимаю эту команду. Используйте /start для начала.")\n\n';
    
    // Добавляем универсальный обработчик для фотографий
    code += '\n# Универсальный обработчик для необработанных фото\n';
    code += '@dp.message(F.photo)\n';
    code += 'async def handle_unhandled_photo(message: types.Message):\n';
    code += '    """\n';
    code += '    Обрабатывает фотографии, которые не были обработаны другими обработчиками.\n';
    code += '    Благодаря middleware, фото уже будет сохранено в БД.\n';
    code += '    """\n';
    code += '    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")\n';
    code += '    # Middleware автоматически сохранит фото\n';
    code += '\n';
  }
  
  code += '\n\n# Запуск бота\n';
  code += 'async def main():\n';
  if (userDatabaseEnabled) {
    code += '    global db_pool\n';
  }
  code += '    try:\n';
  if (userDatabaseEnabled) {
    code += '        # Инициализируем базу данных\n';
    code += '        await init_database()\n';
  }
  if (menuCommands.length > 0) {
    code += '        await set_bot_commands()\n';
  }
  code += '        \n';
  if (userDatabaseEnabled) {
  code += '        # Регистрация middleware для сохранения сообщений\n';
  code += '        dp.message.middleware(message_logging_middleware)\n';
  // Регистрируем callback_query middleware только если в боте есть inline кнопки
  if (hasInlineButtons(nodes || [])) {
    code += '        dp.callback_query.middleware(callback_query_logging_middleware)\n';
  }
  code += '        \n';
  }
  code += '        print("🤖 Бот запущен и готов к работе!")\n';
  code += '        await dp.start_polling(bot)\n';
  code += '    except KeyboardInterrupt:\n';
  code += '        print("🛑 Получен сигнал остановки, завершаем работу...")\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Критическая ошибка: {e}")\n';
  code += '    finally:\n';
  code += '        # Правильно закрываем все соединения\n';
  if (userDatabaseEnabled) {
    code += '        if db_pool:\n';
    code += '            await db_pool.close()\n';
    code += '            print("🔌 Соединение с базой данных закрыто")\n';
  }
  code += '        \n';
  code += '        # Закрываем сессию бота\n';
  code += '        await bot.session.close()\n';
  code += '        print("🔌 Сессия бота закрыта")\n';
  code += '        print("✅ Бот корректно завершил работу")\n\n';
  
  // Найдем узлы с множественным выбором для использования в обработчиках
  const multiSelectNodes = (nodes || []).filter(node => 
    node.data.allowMultipleSelection
  );
  console.log(`🔍 ГЕНЕРАТОР: Найдено ${multiSelectNodes.length} узлов с множественным выбором:`, multiSelectNodes.map(n => n.id));
  
  // Добавляем обработчики для множественного выбора ТОЛЬКО если есть узлы с множественным выбором
  if (multiSelectNodes.length > 0) {
  code += '\n# Обработчики для множественного выбора\n';
  
  // Обработчик для inline кнопок множественного выбора
  code += '@dp.callback_query(lambda c: c.data.startswith("ms_") or c.data.startswith("multi_select_"))\n';
  code += 'async def handle_multi_select_callback(callback_query: types.CallbackQuery):\n';
  code += '    await callback_query.answer()\n';
  code += '    user_id = callback_query.from_user.id\n';
  code += '    callback_data = callback_query.data\n';
  code += '    \n';
  code += '    # Обработка кнопки "Готово"\n';
  code += '    if callback_data.startswith("done_"):\n';
  code += '        # Завершение множественного выбора (новый формат)\n';
  code += '        logging.info(f"🏁 Обработка кнопки Готово: {callback_data}")\n';
  code += '        short_node_id = callback_data.replace("done_", "")\n';
  code += '        # Находим полный node_id по короткому суффиксу\n';
  code += '        node_id = None\n';
  multiSelectNodes.forEach(node => {
    const shortNodeId = node.id.slice(-10).replace(/^_+/, '');
    code += `        if short_node_id == "${shortNodeId}":\n`;
    code += `            node_id = "${node.id}"\n`;
    code += `            logging.info(f"✅ Найден узел: ${node.id}")\n`;
  });
  code += '    elif callback_data.startswith("multi_select_done_"):\n';
  code += '        # Завершение множественного выбора (старый формат)\n';
  code += '        node_id = callback_data.replace("multi_select_done_", "")\n';
  code += '        selected_options = user_data.get(user_id, {}).get(f"multi_select_{node_id}", [])\n';
  code += '        \n';
  code += '        # Сохраняем выбранные опции в базу данных\n';
  code += '        if selected_options:\n';
  code += '            selected_text = ", ".join(selected_options)\n';
  
  // Генерируем сохранение для каждого узла с его переменной
  multiSelectNodes.forEach(node => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    code += `            if node_id == "${node.id}":\n`;
    code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
  });
  
  code += '            # Резервное сохранение если узел не найден\n';
  code += '            if not any(node_id == node for node in [' + multiSelectNodes.map(n => `"${n.id}"`).join(', ') + ']):\n';
  code += '                await save_user_data_to_db(user_id, f"multi_select_{node_id}", selected_text)\n';
  code += '        \n';
  code += '        # Очищаем состояние множественного выбора\n';
  code += '        if user_id in user_data:\n';
  code += '            user_data[user_id].pop(f"multi_select_{node_id}", None)\n';
  code += '            user_data[user_id].pop("multi_select_node", None)\n';
  code += '        \n';
  code += '        # Переходим к следующему узлу, если указан\n';
  
  // Добавим переходы для узлов с множественным выбором
  console.log(`🔧 ГЕНЕРАТОР: Обрабатываем ${multiSelectNodes.length} узлов множественного выбора для переходов`);
  code += '        # Определяем следующий узел для каждого node_id\n';
  multiSelectNodes.forEach(node => {
      console.log(`🔧 ГЕНЕРАТОР: Создаем блок if для узла ${node.id}`);
      console.log(`🔧 ГЕНЕРАТОР: continueButtonTarget: ${node.data.continueButtonTarget}`);
      console.log(`🔧 ГЕНЕРАТОР: соединения из узла: ${connections.filter(conn => conn.source === node.id).map(c => c.target).join(', ')}`);
      
      code += `        if node_id == "${node.id}":\n`;
      
      let hasContent = false;
      
      // Сначала проверяем continueButtonTarget
      if (node.data.continueButtonTarget) {
        const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
        if (targetNode) {
          console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через continueButtonTarget`);
          console.log(`🔧 ГЕНЕРАТОР: Тип целевого узла: ${targetNode.type}`);
          code += `            # Переход к узлу ${targetNode.id}\n`;
          code += `            logging.info(f"🔄 Переходим к узлу ${targetNode.id} (тип: ${targetNode.type})")\n`;
          if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
            console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик, отправляем сообщение`);
            const messageText = targetNode.data.messageText || "Продолжение...";
            const formattedText = formatTextForPython(messageText);
            code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
            code += `            text = ${formattedText}\n`;
            
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
              code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для целевого узла\n`;
              code += `            # Загружаем пользовательские данные для клавиатуры\n`;
              code += `            user_vars = await get_user_from_db(user_id)\n`;
              code += `            if not user_vars:\n`;
              code += `                user_vars = user_data.get(user_id, {})\n`;
              code += `            if not isinstance(user_vars, dict):\n`;
              code += `                user_vars = {}\n`;
              code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
              code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
            } else {
              code += `            await callback_query.message.answer(text)\n`;
            }
            code += `            return\n`;
            hasContent = true;
          } else if (targetNode.type === 'command') {
            const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
            console.log(`🔧 ГЕНЕРАТОР: Добавляем вызов handle_command_${safeCommandName}`);
            code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
            hasContent = true;
          } else if (targetNode.type === 'start') {
            console.log(`🔧 ГЕНЕРАТОР: Вызываем полный обработчик start для правильной клавиатуры`);
            code += `            # Вызываем полный обработчик start для правильного отображения главного меню\n`;
            code += `            await handle_command_start(callback_query.message)\n`;
            code += `            return\n`;
            hasContent = true;
          } else {
            console.log(`⚠️ ГЕНЕРАТОР: Неизвестный тип узла ${targetNode.type}, добавляем pass`);
            code += `            logging.warning(f"⚠️ Неизвестный тип узла: ${targetNode.type}")\n`;
            code += `            pass\n`;
            hasContent = true;
          }
        } else {
          console.log(`⚠️ ГЕНЕРАТОР: Целевой узел не найден для continueButtonTarget: ${node.data.continueButtonTarget}`);
          // Если целевой узел не найден, просто завершаем выбор без перехода
          code += `            # Целевой узел не найден, завершаем выбор\n`;
          code += `            logging.warning(f"⚠️ Целевой узел не найден: ${node.data.continueButtonTarget}")\n`;
          code += `            await safe_edit_or_send(callback_query, "✅ Выбор завершен!", is_auto_transition=True)\n`;
          hasContent = true;
        }
      } else {
        // Если нет continueButtonTarget, ищем соединения
        const nodeConnections = connections.filter(conn => conn.source === node.id);
        if (nodeConnections.length > 0) {
          const targetNode = nodes.find(n => n.id === nodeConnections[0].target);
          if (targetNode) {
            console.log(`🔧 ГЕНЕРАТОР: Найден целевой узел ${targetNode.id} через соединение`);
            code += `            # Переход к узлу ${targetNode.id} через соединение\n`;
            if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
              console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик через соединение`);
              const messageText = targetNode.data.messageText || "Продолжение...";
              const formattedText = formatTextForPython(messageText);
              code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
              code += `            text = ${formattedText}\n`;
              
              // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
                console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для соединения ${targetNode.id}`);
                code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для соединения\n`;
                code += `            # Загружаем пользовательские данные для клавиатуры\n`;
                code += `            user_vars = await get_user_from_db(user_id)\n`;
                code += `            if not user_vars:\n`;
                code += `                user_vars = user_data.get(user_id, {})\n`;
                code += `            if not isinstance(user_vars, dict):\n`;
                code += `                user_vars = {}\n`;
                code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
                code += `            await callback_query.message.answer(text, reply_markup=keyboard)\n`;
              } else {
                code += `            await callback_query.message.answer(text)\n`;
              }
              code += `            return\n`;
            } else if (targetNode.type === 'command') {
              const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
              code += `            await handle_command_${safeCommandName}(callback_query.message)\n`;
            }
            hasContent = true;
          }
        }
      }
      
      // Если блок if остался пустым, добавляем return
      if (!hasContent) {
        console.log(`⚠️ ГЕНЕРАТОР: Блок if для узла ${node.id} остался пустым, добавляем return`);
        code += `            return\n`;
      } else {
        console.log(`✅ ГЕНЕРАТОР: Блок if для узла ${node.id} заполнен контентом`);
      }
    });
  }
  
  code += '        return\n';
  code += '    \n';
  
  // Весь следующий блок генерируется только если есть узлы с множественным выбором
  if (multiSelectNodes.length > 0) {
  code += '    # Обработка выбора опции\n';
  code += '    logging.info(f"📱 Обрабатываем callback_data: {callback_data}")\n';
  code += '    \n';
  code += '    # Поддерживаем и новый формат ms_ и старый multi_select_\n';
  code += '    if callback_data.startswith("ms_"):\n';
  code += '        # Новый короткий формат: ms_shortNodeId_shortTarget\n';
  code += '        parts = callback_data.split("_")\n';
  code += '        if len(parts) >= 3:\n';
  code += '            short_node_id = parts[1]\n';
  code += '            button_id = "_".join(parts[2:])\n';
  code += '            # Находим полный node_id по короткому суффиксу\n';
  code += '            node_id = None\n';
  code += '            logging.info(f"🔍 Ищем узел по короткому ID: {short_node_id}")\n';
  code += '            \n';
  code += '            # Для станций метро ищем по содержимому кнопки, а не по короткому ID\n';
  code += '            if short_node_id == "stations":\n';
  code += '                # Проверяем каждый узел станций на наличие нужной кнопки\n';
  
  let hasStationsCode = false;
  multiSelectNodes.forEach(node => {
    const shortNodeId = generateUniqueShortId(node.id, allNodeIds);
    if (shortNodeId === 'stations') {
      const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
      code += `                # Проверяем узел ${node.id}\n`;
      selectionButtons.forEach(button => {
        const buttonValue = button.target || button.id || button.text;
        code += `                if button_id == "${buttonValue}":\n`;
        code += `                    node_id = "${node.id}"\n`;
        code += `                    logging.info(f"✅ Найден правильный узел по кнопке: {node_id}")\n`;
        hasStationsCode = true;
      });
    }
  });
  
  // Добавляем pass если в if блоке нет кода
  if (!hasStationsCode) {
    code += '                pass\n';
  }
  
  code += '            else:\n';
  code += '                # Обычная логика для других узлов\n';
  
  let hasElseCode = false;
  multiSelectNodes.forEach(node => {
    const shortNodeId = generateUniqueShortId(node.id, allNodeIds);
    if (shortNodeId !== 'stations') {
      code += `                if short_node_id == "${shortNodeId}":\n`;
      code += `                    node_id = "${node.id}"\n`;
      code += `                    logging.info(f"✅ Найден узел: {node_id}")\n`;
      hasElseCode = true;
    }
  });
  
  // Добавляем pass если в else блоке нет кода
  if (!hasElseCode) {
    code += '                pass\n';
  }
  code += '    elif callback_data.startswith("multi_select_"):\n';
  code += '        # Старый формат для обратной совместимости\n';
  code += '        parts = callback_data.split("_")\n';
  code += '        if len(parts) >= 3:\n';
  code += '            node_id = parts[2]\n';
  code += '            button_id = "_".join(parts[3:]) if len(parts) > 3 else parts[2]\n';
  code += '    else:\n';
  code += '        logging.warning(f"⚠️ Неизвестный формат callback_data: {callback_data}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    if not node_id:\n';
  code += '        logging.warning(f"⚠️ Не удалось найти node_id для callback_data: {callback_data}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    logging.info(f"📱 Определили node_id: {node_id}, button_id: {button_id}")\n';
  code += '    \n';
  code += '    # Инициализируем список выбранных опций с восстановлением из БД\n';
  code += '    if user_id not in user_data:\n';
  code += '        user_data[user_id] = {}\n';
  code += '    \n';
  code += '    # Восстанавливаем ранее выбранные опции из базы данных\n';
  code += '    if f"multi_select_{node_id}" not in user_data[user_id]:\n';
  code += '        # Загружаем сохраненные данные из базы\n';
  code += '        user_vars = await get_user_from_db(user_id)\n';
  code += '        saved_selections = []\n';
  code += '        \n';
  code += '        if user_vars:\n';
  code += '            # Ищем переменную с интересами\n';
  code += '            for var_name, var_data in user_vars.items():\n';
  code += '                if "интерес" in var_name.lower() or var_name == "interests" or var_name.startswith("multi_select_"):\n';
  code += '                    if isinstance(var_data, dict) and "value" in var_data:\n';
  code += '                        saved_str = var_data["value"]\n';
  code += '                    elif isinstance(var_data, str):\n';
  code += '                        saved_str = var_data\n';
  code += '                    else:\n';
  code += '                        saved_str = str(var_data) if var_data else ""\n';
  code += '                    \n';
  code += '                    if saved_str:\n';
  code += '                        saved_selections = [item.strip() for item in saved_str.split(",")]\n';
  code += '                        break\n';
  code += '        \n';
  code += '        user_data[user_id][f"multi_select_{node_id}"] = saved_selections\n';
  code += '    \n';
  code += '    # Находим текст кнопки по button_id\n';
  code += '    button_text = None\n';
  
  // Добавляем маппинг кнопок для каждого узла с множественным выбором
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    if (selectionButtons.length > 0) {
      code += `    if node_id == "${node.id}":\n`;
      selectionButtons.forEach(button => {
        // Используем target или id для маппинга, как в генераторе клавиатуры
        const buttonValue = button.target || button.id || button.text;
        code += `        if button_id == "${buttonValue}":\n`;
        code += `            button_text = "${button.text}"\n`;
      });
    }
  });
  
  code += '    \n';
  code += '    if button_text:\n';
  code += '        logging.info(f"🔘 Обрабатываем кнопку: {button_text}")\n';
  code += '        selected_list = user_data[user_id][f"multi_select_{node_id}"]\n';
  code += '        if button_text in selected_list:\n';
  code += '            # Убираем из выбранных\n';
  code += '            selected_list.remove(button_text)\n';
  code += '            logging.info(f"➖ Убрали выбор: {button_text}")\n';
  code += '        else:\n';
  code += '            # Добавляем к выбранным\n';
  code += '            selected_list.append(button_text)\n';
  code += '            logging.info(f"➕ Добавили выбор: {button_text}")\n';
  code += '        \n';
  code += '        logging.info(f"📋 Текущие выборы: {selected_list}")\n';
  code += '        \n';
  code += '        # Обновляем клавиатуру с галочками\n';
  code += '        builder = InlineKeyboardBuilder()\n';
  
  // Генерируем обновление клавиатуры для каждого узла
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    const regularButtons = node.data.buttons?.filter(btn => btn.action !== 'selection') || [];
    
    if (selectionButtons.length > 0) {
      code += `        if node_id == "${node.id}":\n`;
      
      // Добавляем кнопки выбора с галочками
      console.log(`🔧 ГЕНЕРАТОР: Добавляем ${selectionButtons.length} кнопок выбора для узла ${node.id}`);
      selectionButtons.forEach((button, index) => {
        // ИСПРАВЛЕНИЕ: используем тот же формат callback_data как при создании кнопок
        const shortNodeId = generateUniqueShortId(node.id, allNodeIds || []);
        const shortTarget = button.target || button.id || 'btn';
        const callbackData = `ms_${shortNodeId}_${shortTarget}`;
        console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО! Кнопка ${index + 1}: "${button.text}" -> callback_data: ${callbackData}`);
        code += `            selected_mark = "✅ " if "${button.text}" in selected_list else ""\n`;
        code += `            builder.add(InlineKeyboardButton(text=f"{selected_mark}${button.text}", callback_data="${callbackData}"))\n`;
      });
      
      // Добавляем обычные кнопки
      regularButtons.forEach(button => {
        if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        } else if (button.action === 'url') {
          code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'command') {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `            builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
        }
      });
      
      // Добавляем кнопку завершения  
      const continueText = node.data.continueButtonText || 'Готово';
      const doneCallbackData = `multi_select_done_${node.id}`;
      console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем кнопку завершения "${continueText}" с callback_data: ${doneCallbackData}`);
      code += `            builder.add(InlineKeyboardButton(text="${continueText}", callback_data="${doneCallbackData}"))\n`;
      code += `            logging.info(f"🔧 ГЕНЕРАТОР: Применяем adjust(2) для узла ${node.id} (multi-select)")\n`;
      code += `            builder.adjust(2)\n`;
    }
  });
  
  code += '        \n';
  code += '        keyboard = builder.as_markup()\n';
  code += '        logging.info(f"🔄 ОБНОВЛЯЕМ клавиатуру для узла {node_id} с галочками")\n';
  code += '        await callback_query.message.edit_reply_markup(reply_markup=keyboard)\n';
  code += '\n';
  }  // Закрываем if (multiSelectNodes.length > 0) для блока обработки выбора опций
  
  // Генерируем обработчик для кнопок "Готово" многомерного выбора ТОЛЬКО если есть узлы с множественным выбором
  if (multiSelectNodes.length > 0) {
  code += '# Обработчик для кнопок завершения множественного выбора\n';
  code += '@dp.callback_query(lambda callback_query: callback_query.data and callback_query.data.startswith("multi_select_done_"))\n';
  code += 'async def handle_multi_select_done(callback_query: types.CallbackQuery):\n';
  code += '    logging.info(f"🏁 ОБРАБОТЧИК ГОТОВО АКТИВИРОВАН! callback_data: {callback_query.data}")\n';
  code += '    await callback_query.answer()\n';
  code += '    user_id = callback_query.from_user.id\n';
  code += '    callback_data = callback_query.data\n';
  code += '    \n';
  code += '    logging.info(f"🏁 Завершение множественного выбора: {callback_data}")\n';
  code += '    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Текущее сообщение ID: {callback_query.message.message_id}")\n';
  code += '    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Текущий текст сообщения: {callback_query.message.text}")\n';
  code += '    logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Есть ли клавиатура: {bool(callback_query.message.reply_markup)}")\n';
  code += '    \n';
  code += '    # Извлекаем node_id из callback_data\n';
  code += '    node_id = callback_data.replace("multi_select_done_", "")\n';
  code += '    logging.info(f"🎯 Node ID для завершения: {node_id}")\n';
  code += '    \n';
  
  multiSelectNodes.forEach(node => {
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    const continueButtonTarget = node.data.continueButtonTarget;
    
    code += `    if node_id == "${node.id}":\n`;
    code += `        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: Обрабатываем завершение для узла ${node.id}")\n`;
    code += `        logging.info(f"🔍 ГЕНЕРАТОР DEBUG: continueButtonTarget = ${continueButtonTarget || 'НЕТ'}")\n`;
    code += `        # Получаем выбранные опции для узла ${node.id}\n`;
    code += `        selected_options = user_data.get(user_id, {}).get("multi_select_${node.id}", [])\n`;
    code += `        logging.info(f"📋 ГЕНЕРАТОР DEBUG: Выбранные опции для ${node.id}: {selected_options}")\n`;
    code += `        \n`;
    code += `        if selected_options:\n`;
    code += `            selected_text = ", ".join(selected_options)\n`;
    code += `            await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
    code += `            logging.info(f"💾 ГЕНЕРАТОР DEBUG: Сохранили в БД: ${variableName} = {selected_text}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Нет выбранных опций для сохранения")\n`;
    code += `        \n`;
    
    if (continueButtonTarget) {
      const targetNode = nodes.find(n => n.id === continueButtonTarget);
      if (targetNode) {
        code += `        # Переход к следующему узлу: ${continueButtonTarget}\n`;
        const safeFunctionName = continueButtonTarget.replace(/[^a-zA-Z0-9_]/g, '_');
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Переходим к узлу '${continueButtonTarget}'")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Тип целевого узла: ${targetNode?.type || 'неизвестно'}")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: allowMultipleSelection: ${targetNode?.data?.allowMultipleSelection || false}")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: Есть ли кнопки: ${targetNode?.data?.buttons?.length || 0}")\n`;
        code += `        logging.info(f"🚀 ГЕНЕРАТОР DEBUG: keyboardType: ${targetNode?.data?.keyboardType || 'нет'}")\n`;
        
        // Специальная обработка для узлов с множественным выбором
        if (targetNode.data.allowMultipleSelection) {
          code += `        # Узел ${continueButtonTarget} поддерживает множественный выбор - сохраняем состояние\n`;
          code += `        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Инициализируем множественный выбор для узла ${targetNode.id}")\n`;
          code += `        if user_id not in user_data:\n`;
          code += `            user_data[user_id] = {}\n`;
          code += `        user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
          code += `        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
          code += `        user_data[user_id]["multi_select_type"] = "inline"\n`;
          code += `        logging.info(f"🔧 ГЕНЕРАТОР DEBUG: Состояние множественного выбора установлено для узла ${targetNode.id}")\n`;
        }
        
        // ИСПРАВЛЕНИЕ: НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!
        // Пользователь должен сам выбрать продолжение
        
        // Отправляем сообщение для следующего узла с ожиданием пользовательского ввода
        if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
          // Показываем сообщение следующего узла
          const messageText = targetNode.data.messageText || "Выберите опции:";
          const formattedText = formatTextForPython(messageText);
          
          code += `        # Отправляем сообщение для следующего узла с ожиданием пользовательского ввода\n`;
          code += `        text = ${formattedText}\n`;
          code += `        \n`;
          code += `        # Инициализируем состояние множественного выбора для следующего узла\n`;
          
          // Генерируем клавиатуру для следующего узла
          if (targetNode.data.allowMultipleSelection && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            const multiSelectVariable = targetNode.data.multiSelectVariable || 'user_interests';
            
            code += `        # Инициализируем состояние множественного выбора\n`;
            code += `        if user_id not in user_data:\n`;
            code += `            user_data[user_id] = {}\n`;
            code += `        \n`;
            code += `        # Загружаем ранее выбранные варианты из БД\n`;
            code += `        saved_selections = []\n`;
            code += `        user_record = await get_user_from_db(user_id)\n`;
            code += `        if user_record and isinstance(user_record, dict):\n`;
            code += `            user_data_field = user_record.get("user_data", {})\n`;
            code += `            if isinstance(user_data_field, str):\n`;
            code += `                import json\n`;
            code += `                try:\n`;
            code += `                    user_vars = json.loads(user_data_field)\n`;
            code += `                except:\n`;
            code += `                    user_vars = {}\n`;
            code += `            elif isinstance(user_data_field, dict):\n`;
            code += `                user_vars = user_data_field\n`;
            code += `            else:\n`;
            code += `                user_vars = {}\n`;
            code += `            \n`;
            code += `            if "${multiSelectVariable}" in user_vars:\n`;
            code += `                var_data = user_vars["${multiSelectVariable}"]\n`;
            code += `                if isinstance(var_data, str) and var_data.strip():\n`;
            code += `                    saved_selections = [sel.strip() for sel in var_data.split(",") if sel.strip()]\n`;
            code += `        \n`;
            code += `        # Инициализируем состояние с восстановленными значениями\n`;
            code += `        user_data[user_id]["multi_select_${targetNode.id}"] = saved_selections.copy()\n`;
            code += `        user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
            code += `        user_data[user_id]["multi_select_type"] = "inline"\n`;
            code += `        user_data[user_id]["multi_select_variable"] = "${multiSelectVariable}"\n`;
            code += `        \n`;
            code += `        builder = InlineKeyboardBuilder()\n`;
            
            // Добавляем кнопки выбора с учетом ранее сохраненных значений
            targetNode.data.buttons.forEach((button, index) => {
              if (button.action === 'selection') {
                const cleanText = button.text.replace(/"/g, '\\"');
                const callbackData = `ms_${generateUniqueShortId(targetNode.id, allNodeIds || [])}_${button.target || button.id || `btn${index}`}`.replace(/[^a-zA-Z0-9_]/g, '_');
                code += `        # Кнопка с галочкой: ${cleanText}\n`;
                code += `        selected_mark = "✅ " if "${cleanText}" in user_data[user_id]["multi_select_${targetNode.id}"] else ""\n`;
                code += `        button_text = f"{selected_mark}${cleanText}"\n`;
                code += `        builder.add(InlineKeyboardButton(text=button_text, callback_data="${callbackData}"))\n`;
              }
            });
            
            // Добавляем кнопку "Готово"
            code += `        builder.add(InlineKeyboardButton(text="Готово", callback_data="multi_select_done_${targetNode.id}"))\n`;
            code += `        builder.adjust(2)\n`;
            code += `        keyboard = builder.as_markup()\n`;
            code += `        \n`;
            code += `        await callback_query.message.answer(text, reply_markup=keyboard)\n`;
            code += `        logging.info(f"🏁 ГЕНЕРАТОР DEBUG: Сообщение отправлено, ЗАВЕРШАЕМ функцию")\n`;
            code += `        return\n`;
          } else {
            // Обычная клавиатура без множественного выбора
            code += `        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем, нужна ли клавиатура для целевого узла\n`;
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
              console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для целевого узла ${targetNode.id}`);
              code += `        # Добавляем клавиатуру для целевого узла\n`;
              code += `        # Загружаем пользовательские данные для клавиатуры\n`;
              code += `        user_vars = await get_user_from_db(user_id)\n`;
              code += `        if not user_vars:\n`;
              code += `            user_vars = user_data.get(user_id, {})\n`;
              code += `        if not isinstance(user_vars, dict):\n`;
              code += `            user_vars = {}\n`;
              code += `        \n`;
              code += generateInlineKeyboardCode(targetNode.data.buttons, '        ', targetNode.id, targetNode.data, allNodeIds);
              code += `        await callback_query.message.answer(text, reply_markup=keyboard)\n`;
              code += `        logging.info(f"🏁 ГЕНЕРАТОР DEBUG: Сообщение отправлено С КЛАВИАТУРОЙ для узла ${targetNode.id}")\n`;
            } else {
              code += `        # Отправляем только сообщение без клавиатуры\n`;
              code += `        await callback_query.message.answer(text)\n`;
              code += `        logging.info(f"🏁 ГЕНЕРАТОР DEBUG: Сообщение отправлено БЕЗ КЛАВИАТУРЫ для узла ${targetNode.id}")\n`;
            }
            code += `        return\n`;
          }
        } else {
          // Узел не найден - отправляем простое сообщение
          code += `        logging.info(f"⚠️ ГЕНЕРАТОР DEBUG: Целевой узел не найден, отправляем простое сообщение")\n`;
          code += `        await callback_query.message.answer("Переход завершен")\n`;
          code += `        return\n`;
        }
      }
    }
    
    code += `        return\n`;
    code += `    \n`;
  });
  
  code += '\n';
  }  // Закрываем if (multiSelectNodes.length > 0)

  // Обработчик для reply кнопок множественного выбора - только если есть узлы с множественным выбором
  if (hasMultiSelectNodes(nodes || [])) {
    code += '# Обработчик для reply кнопок множественного выбора\n';
    code += '@dp.message()\n';
    code += 'async def handle_multi_select_reply(message: types.Message):\n';
  code += '    user_id = message.from_user.id\n';
  code += '    user_input = message.text\n';
  code += '    \n';
  code += '    # Проверяем, находится ли пользователь в режиме множественного выбора reply\n';
  code += '    if user_id in user_data and "multi_select_node" in user_data[user_id] and user_data[user_id].get("multi_select_type") == "reply":\n';
  code += '        node_id = user_data[user_id]["multi_select_node"]\n';
  code += '        \n';
  
  // Проверяем, является ли это кнопкой завершения
  multiSelectNodes.forEach(node => {
    const continueText = node.data.continueButtonText || 'Готово';
    const variableName = node.data.multiSelectVariable || `multi_select_${node.id}`;
    code += `        if node_id == "${node.id}" and user_input == "${continueText}":\n`;
    code += `            # Завершение множественного выбора для узла ${node.id}\n`;
    code += `            selected_options = user_data.get(user_id, {}).get("multi_select_{node_id}", [])\n`;
    code += `            if selected_options:\n`;
    code += `                selected_text = ", ".join(selected_options)\n`;
    code += `                await save_user_data_to_db(user_id, "${variableName}", selected_text)\n`;
    code += `            \n`;
    code += `            # Очищаем состояние\n`;
    code += `            user_data[user_id].pop("multi_select_{node_id}", None)\n`;
    code += `            user_data[user_id].pop("multi_select_node", None)\n`;
    code += `            user_data[user_id].pop("multi_select_type", None)\n`;
    code += `            \n`;
    
    if (node.data.continueButtonTarget) {
      const targetNode = nodes.find(n => n.id === node.data.continueButtonTarget);
      if (targetNode) {
        code += `            # Переход к следующему узлу\n`;
        if (targetNode.type === 'message' || targetNode.type === 'keyboard') {
          console.log(`🔧 ГЕНЕРАТОР: ИСПРАВЛЕНО - НЕ вызываем обработчик в reply mode`);
          const messageText = targetNode.data.messageText || "Продолжение...";
          const formattedText = formatTextForPython(messageText);
          code += `            # НЕ ВЫЗЫВАЕМ ОБРАБОТЧИК АВТОМАТИЧЕСКИ!\n`;
          code += `            text = ${formattedText}\n`;
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: проверяем, нужна ли клавиатура для целевого узла в reply mode
          if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
            console.log(`🔧 ГЕНЕРАТОР: КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ! Добавляем клавиатуру для reply mode ${targetNode.id}`);
            code += `            # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: добавляем клавиатуру для reply mode\n`;
            code += `            # Загружаем пользовательские данные для клавиатуры\n`;
            code += `            user_vars = await get_user_from_db(user_id)\n`;
            code += `            if not user_vars:\n`;
            code += `                user_vars = user_data.get(user_id, {})\n`;
            code += `            if not isinstance(user_vars, dict):\n`;
            code += `                user_vars = {}\n`;
            code += generateInlineKeyboardCode(targetNode.data.buttons, '            ', targetNode.id, targetNode.data, allNodeIds);
            code += `            await message.answer(text, reply_markup=keyboard)\n`;
          } else {
            code += `            await message.answer(text)\n`;
          };
        } else if (targetNode.type === 'command') {
          const safeCommandName = targetNode.data.command?.replace(/[^a-zA-Z0-9_]/g, '_') || 'unknown';
          code += `            await handle_command_${safeCommandName}(message)\n`;
        }
      }
    }
    code += `            return\n`;
    code += `        \n`;
  });
  
  code += '        # Обработка выбора опции\n';
  multiSelectNodes.forEach(node => {
    const selectionButtons = node.data.buttons?.filter(btn => btn.action === 'selection') || [];
    
    if (selectionButtons.length > 0) {
      code += `        if node_id == "${node.id}":\n`;
      selectionButtons.forEach(button => {
        code += `            if user_input == "${button.text}":\n`;
        code += `                if "multi_select_{node_id}" not in user_data[user_id]:\n`;
        code += `                    user_data[user_id]["multi_select_{node_id}"] = []\n`;
        code += `                \n`;
        code += `                selected_list = user_data[user_id]["multi_select_{node_id}"]\n`;
        code += `                if "${button.text}" in selected_list:\n`;
        code += `                    selected_list.remove("${button.text}")\n`;
        code += `                    await message.answer("❌ Убрано: ${button.text}")\n`;
        code += `                else:\n`;
        code += `                    selected_list.append("${button.text}")\n`;
        code += `                    await message.answer("✅ Выбрано: ${button.text}")\n`;
        code += `                return\n`;
        code += `            \n`;
      });
    }
  });
  
    code += '    \n';
    code += '    # Если не множественный выбор, передаем дальше по цепочке обработчиков\n';
    code += '    pass\n';
    code += '\n';
  }

  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}

function generateStartHandler(node: Node, userDatabaseEnabled: boolean): string {
  let code = '\n@dp.message(CommandStart())\n';
  code += 'async def start_handler(message: types.Message):\n';

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Регистрируем пользователя только если включена БД или есть множественный выбор
  if (userDatabaseEnabled || node.data.allowMultipleSelection) {
    code += '\n    # Регистрируем пользователя в системе\n';
    code += '    user_id = message.from_user.id\n';
    code += '    username = message.from_user.username\n';
    code += '    first_name = message.from_user.first_name\n';
    code += '    last_name = message.from_user.last_name\n';
    code += '    \n';
    
    if (userDatabaseEnabled) {
      code += '    # Сохраняем пользователя в базу данных\n';
      code += '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)\n';
      code += '    \n';
      code += '    # Резервное сохранение в локальное хранилище\n';
      code += '    if not saved_to_db:\n';
      code += '        user_data[user_id] = {\n';
      code += '            "username": username,\n';
      code += '            "first_name": first_name,\n';
      code += '            "last_name": last_name,\n';
      code += '            "registered_at": message.date\n';
      code += '        }\n';
      code += '        logging.info(f"Пользователь {user_id} сохранен в локальное хранилище")\n';
      code += '    else:\n';
      code += '        logging.info(f"Пользователь {user_id} сохранен в базу данных")\n\n';
    } else {
      code += '    # Инициализируем user_data для множественного выбора\n';
      code += '    user_id = message.from_user.id\n';
      code += '    if user_id not in user_data:\n';
      code += '        user_data[user_id] = {}\n\n';
    }
  }
  
  // Восстанавливаем состояние множественного выбора ТОЛЬКО если он включен
  if (node.data.allowMultipleSelection) {
    code += '    saved_interests = []\n';
    code += '    \n';
    
    if (userDatabaseEnabled) {
      code += '    # Восстанавливаем состояние множественного выбора из БД\n';
      code += '    user_record = await get_user_from_db(user_id)\n';
      code += '    \n';
      code += '    if user_record and isinstance(user_record, dict):\n';
      code += '        user_data_field = user_record.get("user_data", {})\n';
      code += '        if isinstance(user_data_field, str):\n';
      code += '            import json\n';
      code += '            try:\n';
      code += '                user_vars = json.loads(user_data_field)\n';
      code += '            except:\n';
      code += '                user_vars = {}\n';
      code += '        elif isinstance(user_data_field, dict):\n';
      code += '            user_vars = user_data_field\n';
      code += '        else:\n';
      code += '            user_vars = {}\n';
      code += '        \n';
      code += '        # Ищем сохраненные интересы\n';
      code += '        for var_name, var_data in user_vars.items():\n';
      code += '            if "интерес" in var_name.lower() or var_name == "user_interests":\n';
      code += '                if isinstance(var_data, str) and var_data:\n';
      code += '                    saved_interests = [interest.strip() for interest in var_data.split(",")]\n';
      code += '                    logging.info(f"Восстановлены интересы из переменной {var_name}: {saved_interests}")\n';
      code += '                    break\n';
    } else {
      code += '    # Восстанавливаем состояние из локального хранилища\n';
      code += '    if user_id in user_data:\n';
      code += '        for var_name, var_data in user_data[user_id].items():\n';
      code += '            if "интерес" in var_name.lower() or var_name == "user_interests":\n';
      code += '                if isinstance(var_data, str) and var_data:\n';
      code += '                    saved_interests = [interest.strip() for interest in var_data.split(",")]\n';
      code += '                    logging.info(f"Восстановлены интересы: {saved_interests}")\n';
      code += '                    break\n';
      code += '                elif isinstance(var_data, list):\n';
      code += '                    saved_interests = var_data\n';
      code += '                    logging.info(f"Восстановлены интересы: {saved_interests}")\n';
      code += '                    break\n';
    }
    
    code += '    \n';
    code += '    # Инициализируем состояние множественного выбора\n';
    code += '    if user_id not in user_data:\n';
    code += '        user_data[user_id] = {}\n';
    const multiSelectVariable = node.data.multiSelectVariable || 'user_interests';
    code += `    user_data[user_id]["multi_select_${node.id}"] = saved_interests.copy() if saved_interests else []\n`;
    code += `    user_data[user_id]["multi_select_node"] = "${node.id}"\n`;
    code += '    logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")\n';
    code += '    \n';
  }
  
  // Создаем клавиатуру с восстановленными галочками для множественного выбора
  if (node.data.allowMultipleSelection) {
    code += '    # Создаем клавиатуру с восстановленными галочками\n';
    code += '    builder = InlineKeyboardBuilder()\n';
    code += '    \n';
    code += '    # Функция для проверки совпадения интересов\n';
    code += '    def check_interest_match(button_text, saved_list):\n';
    code += '        """Проверяет, есть ли интерес в сохраненном списке"""\n';
    code += '        if not saved_list:\n';
    code += '            return False\n';
    code += '        # Убираем эмодзи и галочки для сравнения\n';
    code += '        clean_button = button_text.replace("✅ ", "").replace("⬜ ", "").strip()\n';
    code += '        for saved_interest in saved_list:\n';
    code += '            clean_saved = saved_interest.replace("✅ ", "").replace("⬜ ", "").strip()\n';
    code += '            if clean_button == clean_saved or clean_button in clean_saved or clean_saved in clean_button:\n';
    code += '                return True\n';
    code += '        return False\n';
    code += '    \n';
    
    // Добавляем кнопки интересов с галочками
    const buttons = node.data.buttons || [];
    const interestButtons = buttons.filter(btn => btn.action === 'selection');
    
    interestButtons.forEach(button => {
      const buttonText = button.text || 'Неизвестно';
      const buttonTarget = button.target || button.id;
      code += `    ${buttonTarget}_selected = check_interest_match("${buttonText}", saved_interests)\n`;
      code += `    ${buttonTarget}_text = "✅ ${buttonText}" if ${buttonTarget}_selected else "${buttonText}"\n`;
      code += `    builder.add(InlineKeyboardButton(text=${buttonTarget}_text, callback_data="multi_select_${node.id}_${buttonTarget}"))\n`;
      code += '    \n';
    });
    
    // Добавляем кнопки команд и другие кнопки ПЕРЕД кнопкой "Готово"
    const allButtons = node.data.buttons || [];
    const nonSelectionButtons = allButtons.filter(btn => btn.action !== 'selection');
    
    nonSelectionButtons.forEach(button => {
      if (button.action === 'command') {
        const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      } else if (button.action === 'url') {
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      }
    });
    
    // Добавляем кнопку "Готово"
    const continueTarget = node.data.continueButtonTarget || 'next';
    const continueText = node.data.continueButtonText || 'Готово';
    code += `    builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))\n`;
    code += '    builder.adjust(2)  # Используем 2 колонки для консистентности\n';
    code += '    keyboard = builder.as_markup()\n';
    code += '    \n';
  }
  
  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "Привет! Добро пожаловать!";
  const formattedText = formatTextForPython(messageText);
  
  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    // Инициализируем text основным сообщением ПЕРЕД проверкой условий
    code += '    # Проверяем условные сообщения\n';
    code += `    text = ${formattedText}  # Основной текст узла как fallback\n`;
    code += '    conditional_parse_mode = None\n';
    code += '    conditional_keyboard = None\n';
    code += '    \n';
    code += '    # Получаем данные пользователя для проверки условий\n';
    code += '    user_record = await get_user_from_db(user_id)\n';
    code += '    if not user_record:\n';
    code += '        user_record = user_data.get(user_id, {})\n';
    code += '    \n';
    code += '    # Безопасно извлекаем user_data\n';
    code += '    if isinstance(user_record, dict):\n';
    code += '        if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
    code += '            user_data_dict = user_record["user_data"]\n';
    code += '        else:\n';
    code += '            user_data_dict = user_record\n';
    code += '    else:\n';
    code += '        user_data_dict = {}\n';
    code += '    \n';
    
    // Generate conditional logic using helper function - условия теперь переопределят text если нужно
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ', node.data);
    
    // Не нужен else блок - text уже инициализирован основным сообщением
    code += '    \n';
  } else {
    code += `    text = ${formattedText}\n`;
  }
  
  // Для множественного выбора используем уже созданную клавиатуру
  if (node.data.allowMultipleSelection) {
    code += '    await message.answer(text, reply_markup=keyboard)\n';
    return code;
  }
  
  // Генерируем клавиатуру
  const keyboardCode = generateKeyboard(node);
  
  // ИСПРАВЛЕНИЕ: Добавляем автопереход для узлов start, если он настроен
  if (node.data.enableAutoTransition && node.data.autoTransitionTo) {
    const autoTransitionTarget = node.data.autoTransitionTo;
    const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += keyboardCode;
    code += '\n    # АВТОПЕРЕХОД: Переходим к следующему узлу автоматически\n';
    code += `    logging.info(f"⚡ Автопереход от узла ${node.id} к узлу ${autoTransitionTarget}")\n`;
    code += '    # Создаем временный callback_query объект для вызова обработчика\n';
    code += '    from aiogram.types import CallbackQuery\n';
    code += '    temp_callback = CallbackQuery(\n';
    code += '        id="auto_transition",\n';
    code += '        from_user=message.from_user,\n';
    code += `        data="${autoTransitionTarget}",\n`;
    code += '        chat_instance=str(message.chat.id),\n';
    code += '        message=message\n';
    code += '    )\n';
    code += `    await handle_callback_${safeFunctionName}(temp_callback)\n`;
    code += `    logging.info(f"✅ Автопереход выполнен: ${node.id} -> ${autoTransitionTarget}")\n`;
    return code;  // Возвращаем без добавления keyboardCode повторно
  }
  
  // Если не было автоперехода, добавляем клавиатуру
  return code + keyboardCode;
}

function generateCommandHandler(node: Node, userDatabaseEnabled: boolean): string {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(Command("${command.replace('/', '')}"))\n`;
  code += `async def ${functionName}_handler(message: types.Message):\n`;

  // Добавляем логирование для отладки
  code += `    logging.info(f"Команда ${command} вызвана пользователем {message.from_user.id}")\n`;

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Сохраняем информацию о команде в пользовательских данных
  code += '    # Сохраняем пользователя и статистику использования команд\n';
  code += '    user_id = message.from_user.id\n';
  code += '    username = message.from_user.username\n';
  code += '    first_name = message.from_user.first_name\n';
  code += '    last_name = message.from_user.last_name\n';
  code += '    \n';
  
  if (userDatabaseEnabled) {
    code += '    # Сохраняем пользователя в базу данных\n';
    code += '    saved_to_db = await save_user_to_db(user_id, username, first_name, last_name)\n';
    code += '    \n';
    code += '    # Обновляем статистику команд в БД\n';
    code += `    if saved_to_db:\n`;
    code += `        await update_user_data_in_db(user_id, "command_${command.replace('/', '')}", datetime.now().isoformat())\n`;
    code += '    \n';
  }
  
  code += '    # Сохранение в локальное хранилище\n';
  code += '    if user_id not in user_data:\n';
  code += '        user_data[user_id] = {}\n';
  code += '    if "commands_used" not in user_data[user_id]:\n';
  code += '        user_data[user_id]["commands_used"] = {}\n';
  code += `    user_data[user_id]["commands_used"]["${command}"] = user_data[user_id]["commands_used"].get("${command}", 0) + 1\n`;

  // Добавляем обработку условных сообщений
  const messageText = node.data.messageText || "🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки";
  const cleanedMessageText = stripHtmlTags(messageText); // Удаляем HTML теги
  const formattedText = formatTextForPython(cleanedMessageText);
  const parseMode = getParseMode(node.data.formatMode || (node.data.markdown ? 'markdown' : ''));
  
  if (node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0) {
    code += '\n    # Проверяем условные сообщения\n';
    code += '    text = None\n';
    code += '    \n';
    code += '    # Получаем данные пользователя для проверки условий\n';
    if (userDatabaseEnabled) {
      code += '    user_record = await get_user_from_db(user_id)\n';
      code += '    if not user_record:\n';
      code += '        user_record = user_data.get(user_id, {})\n';
    } else {
      code += '    user_record = user_data.get(user_id, {})\n';
    }
    code += '    \n';
    code += '    # Безопасно извлекаем user_data\n';
    code += '    if isinstance(user_record, dict):\n';
    code += '        if "user_data" in user_record and isinstance(user_record["user_data"], dict):\n';
    code += '            user_data_dict = user_record["user_data"]\n';
    code += '        else:\n';
    code += '            user_data_dict = user_record\n';
    code += '    else:\n';
    code += '        user_data_dict = {}\n';
    code += '    \n';
    
    // Generate conditional logic using helper function
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
    
    // Add fallback
    code += '    else:\n';
    
    if (node.data.fallbackMessage) {
      const cleanedFallbackText = stripHtmlTags(node.data.fallbackMessage);
      const fallbackText = formatTextForPython(cleanedFallbackText);
      code += `        text = ${fallbackText}\n`;
      code += '        logging.info("Используется запасное сообщение")\n';
    } else {
      code += `        text = ${formattedText}\n`;
      code += '        logging.info("Используется основное сообщение узла")\n';
    }
    
    code += '    \n';
  } else {
    code += `\n    text = ${formattedText}\n`;
    
    // Добавляем замену переменных для обычных команд
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
  }
  
  return code + generateKeyboard(node);
}

// generateMessageHandler removed - message nodes are handled via callback handlers only

function generatePhotoHandler(node: Node): string {
  let code = `\n# Обработчик фото для узла ${node.id}\n`;
  
  // Если у узла есть команда, добавляем её как триггер
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `photo_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    // Добавляем логирование
    code += `    logging.info(f"Команда фото ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    // Добавляем проверки безопасности
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const imageUrl = node.data.imageUrl || "https://via.placeholder.com/400x300?text=Photo";
    const caption = node.data.messageText || "📸 Фото";
    
    const formattedCaption = formatTextForPython(caption);
    code += `    caption = ${formattedCaption}\n`;
    
    // Добавляем замену переменных в подписи к фото
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
    code += '    # Обновляем caption с заменёнными переменными\n';
    code += '    caption = text\n';
    code += '    \n';
    
    code += `    photo_url = "${imageUrl}"\n`;
    code += '    photo_url = replace_variables_in_text(photo_url, user_vars)\n';
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(photo_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(photo_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                photo_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            photo_file = photo_url\n';
    code += '        \n';
    
    // Обрабатываем клавиатуру для фото
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Используем универсальную функцию для создания inline клавиатуры
      code += generateInlineKeyboardCode(node.data.buttons, '        ', node.id, node.data);
      code += '        # Отправляем фото с подписью и inline кнопками\n';
      code += '        await message.answer_photo(photo_file, caption=caption, reply_markup=keyboard)\n';
    } else if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
      code += '        # Создаем reply клавиатуру\n';
      code += '        builder = ReplyKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "contact" && button.requestContact) {
          code += `        builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
        } else if (button.action === "location" && button.requestLocation) {
          code += `        builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
        } else {
          code += `        builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
        }
      });
      const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
      const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
      code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
      code += '        # Отправляем фото с подписью и reply клавиатурой\n';
      code += '        await message.answer_photo(photo_file, caption=caption, reply_markup=keyboard)\n';
    } else {
      code += '        # Отправляем фото только с подписью\n';
      code += '        await message.answer_photo(photo_file, caption=caption)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки фото: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить фото\\n{caption}")\n';
  }
  
  return code;
}

function generateVideoHandler(node: Node): string {
  let code = `\n# Обработчик видео для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `video_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда видео ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const videoUrl = node.data.videoUrl || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4";
    const caption = node.data.mediaCaption || node.data.messageText || "🎥 Видео";
    const duration = node.data.duration || 0;
    const fileSize = node.data.fileSize || 0;
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    video_url = "${videoUrl}"\n`;
    
    // Добавляем замену переменных для видео URL
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
    code += '    video_url = replace_variables_in_text(video_url, user_vars)\n';
    
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (fileSize > 0) code += `    file_size = ${fileSize * 1024 * 1024}\n`;  // Convert MB to bytes
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(video_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(video_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                video_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            video_file = video_url\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Используем универсальную функцию для создания inline клавиатуры
      code += generateInlineKeyboardCode(node.data.buttons, '        ', node.id, node.data);
      code += '        await message.answer_video(\n';
      code += '            video_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      code += ',\n            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_video(\n';
      code += '            video_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      code += '\n        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки видео: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить видео\\n{caption}")\n';
  }
  
  return code;
}

function generateAudioHandler(node: Node): string {
  let code = `\n# Обработчик аудио для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `audio_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда аудио ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const audioUrl = node.data.audioUrl || "https://www.soundjay.com/misc/beep-07a.wav";
    const caption = node.data.mediaCaption || node.data.messageText || "🎵 Аудио";
    const duration = node.data.duration || 0;
    const performer = node.data.performer || "";
    const title = node.data.title || "";
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    audio_url = "${audioUrl}"\n`;
    
    // Добавляем замену переменных для аудио URL
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
    code += '    audio_url = replace_variables_in_text(audio_url, user_vars)\n';
    
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (performer) code += `    performer = "${performer}"\n`;
    if (title) code += `    title = "${title}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(audio_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(audio_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                audio_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            audio_file = audio_url\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_audio(\n';
      code += '            audio_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      if (performer) code += ',\n            performer=performer';
      if (title) code += ',\n            title=title';
      code += ',\n            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_audio(\n';
      code += '            audio_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      if (performer) code += ',\n            performer=performer';
      if (title) code += ',\n            title=title';
      code += '\n        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки аудио: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить аудио\\n{caption}")\n';
  }
  
  return code;
}

function generateDocumentHandler(node: Node): string {
  let code = `\n# Обработчик документа для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `document_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда документа ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const documentUrl = node.data.documentUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    const documentName = node.data.documentName || "document.pdf";
    const caption = node.data.mediaCaption || node.data.messageText || "📄 Документ";
    const fileSize = node.data.fileSize || 0;
    const mimeType = node.data.mimeType || "";
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    document_url = "${documentUrl}"\n`;
    
    // Добавляем замену переменных для document URL
    code += '    \n';
    code += generateUniversalVariableReplacement('    ');
    code += '    document_url = replace_variables_in_text(document_url, user_vars)\n';
    
    code += `    document_name = "${documentName}"\n`;
    if (fileSize > 0) code += `    file_size = ${fileSize * 1024 * 1024}\n`;  // Convert MB to bytes
    if (mimeType) code += `    mime_type = "${mimeType}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(document_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(document_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                document_file = FSInputFile(file_path, filename=document_name)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            document_file = URLInputFile(document_url, filename=document_name)\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_document(\n';
      code += '            document_file,\n';
      code += '            caption=caption,\n';
      code += '            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_document(\n';
      code += '            document_file,\n';
      code += '            caption=caption\n';
      code += '        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки документа: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить документ\\n{caption}")\n';
  }
  
  return code;
}

function generateStickerHandler(node: Node): string {
  let code = `\n# Обработчик стикера для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `sticker_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда стикера ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const stickerUrl = node.data.stickerUrl || node.data.stickerFileId || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";
    
    code += '    try:\n';
    code += '        # Отправляем стикер\n';
    
    if (node.data.stickerFileId) {
      code += `        sticker_file_id = "${node.data.stickerFileId}"\n`;
      code += '        await message.answer_sticker(sticker_file_id)\n';
    } else {
      code += `        sticker_url = "${stickerUrl}"\n`;
      code += '        await message.answer_sticker(sticker_url)\n';
    }
    
    // Добавляем кнопки после стикера если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после стикера\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить стикер")\n';
  }
  
  return code;
}

function generateVoiceHandler(node: Node): string {
  let code = `\n# Обработчик голосового сообщения для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `voice_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда голосового сообщения ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const voiceUrl = node.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
    const duration = node.data.duration || 10;
    
    code += `    voice_url = "${voiceUrl}"\n`;
    code += `    duration = ${duration}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем голосовое сообщение\n';
    code += '        await message.answer_voice(voice_url, duration=duration)\n';
    
    // Добавляем кнопки после голосового сообщения если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после голосового сообщения\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить голосовое сообщение")\n';
  }
  
  return code;
}

function generateAnimationHandler(node: Node): string {
  let code = `\n# Обработчик GIF анимации для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `animation_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда анимации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const animationUrl = node.data.animationUrl || "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif";
    const caption = node.data.mediaCaption || node.data.messageText || "🎬 GIF анимация";
    const duration = node.data.duration || 0;
    const width = node.data.width || 0;
    const height = node.data.height || 0;
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    animation_url = "${animationUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (width > 0) code += `    width = ${width}\n`;
    if (height > 0) code += `    height = ${height}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем GIF анимацию\n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_animation(animation_url, caption=caption, reply_markup=keyboard';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    } else {
      code += '        await message.answer_animation(animation_url, caption=caption';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить анимацию\\n{caption}")\n';
  }
  
  return code;
}

function generateLocationHandler(node: Node): string {
  let code = `\n# Обработчик геолокации для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `location_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда геолокации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    // Получаем координаты из различных источников
    let latitude = node.data.latitude || 55.7558;
    let longitude = node.data.longitude || 37.6176;
    const title = node.data.title || "Местоположение";
    const address = node.data.address || "";
    const city = node.data.city || "";
    const country = node.data.country || "";
    const foursquareId = node.data.foursquareId || "";
    const foursquareType = node.data.foursquareType || "";
    const mapService = node.data.mapService || 'custom';
    const generateMapPreview = node.data.generateMapPreview !== false;

    code += '    # Определяем координаты на основе выбранного сервиса карт\n';
    
    if (mapService === 'yandex' && node.data.yandexMapUrl) {
      code += `    yandex_url = "${node.data.yandexMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else if (mapService === 'google' && node.data.googleMapUrl) {
      code += `    google_url = "${node.data.googleMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else if (mapService === '2gis' && node.data.gisMapUrl) {
      code += `    gis_url = "${node.data.gisMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else {
      code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
    }
    
    if (title) code += `    title = "${title}"\n`;
    if (address) code += `    address = "${address}"\n`;
    if (city) code += `    city = "${city}"\n`;
    if (country) code += `    country = "${country}"\n`;
    if (foursquareId) code += `    foursquare_id = "${foursquareId}"\n`;
    if (foursquareType) code += `    foursquare_type = "${foursquareType}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем геолокацию\n';
    
    if (title || address) {
      code += '        await message.answer_venue(\n';
      code += '            latitude=latitude,\n';
      code += '            longitude=longitude,\n';
      code += '            title=title,\n';
      code += '            address=address';
      if (foursquareId) code += ',\n            foursquare_id=foursquare_id';
      if (foursquareType) code += ',\n            foursquare_type=foursquare_type';
      code += '\n        )\n';
    } else {
      code += '        await message.answer_location(latitude=latitude, longitude=longitude)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось отправить геолокацию")\n';
    
    // Генерируем кнопки для картографических сервисов если включено
    if (generateMapPreview) {
      code += '        \n';
      code += '        # Генерируем ссылки на картографические сервисы\n';
      code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
      code += '        \n';
      code += '        # Создаем кнопки для различных карт\n';
      code += '        map_builder = InlineKeyboardBuilder()\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';
      
      if (node.data.showDirections) {
        code += '        # Добавляем кнопки для построения маршрута\n';
        code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
        code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
      }
      
      code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
      code += '        map_keyboard = map_builder.as_markup()\n';
      code += '        \n';
      code += '        await message.answer(\n';
      if (node.data.showDirections) {
        code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
      } else {
        code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
      }
      code += '            reply_markup=map_keyboard\n';
      code += '        )\n';
    }
    
    // Добавляем дополнительные кнопки после геолокации если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем дополнительные кнопки\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить геолокацию")\n';
  }
  
  return code;
}

function generateContactHandler(node: Node): string {
  let code = `\n# Обработчик контакта для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `contact_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда контакта ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const phoneNumber = node.data.phoneNumber || "+7 (999) 123-45-67";
    const firstName = node.data.firstName || "Имя";
    const lastName = node.data.lastName || "";
    const userId = node.data.userId || 0;
    const vcard = node.data.vcard || "";
    
    code += `    phone_number = "${phoneNumber}"\n`;
    code += `    first_name = "${firstName}"\n`;
    if (lastName) code += `    last_name = "${lastName}"\n`;
    if (userId > 0) code += `    user_id = ${userId}\n`;
    if (vcard) code += `    vcard = "${vcard}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем контакт\n';
    code += '        await message.answer_contact(\n';
    code += '            phone_number=phone_number,\n';
    code += '            first_name=first_name';
    if (lastName) code += ',\n            last_name=last_name';
    if (userId > 0) code += ',\n            user_id=user_id';
    if (vcard) code += ',\n            vcard=vcard';
    code += '\n        )\n';
    
    // Добавляем кнопки после контакта если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после контакта\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить контакт")\n';
  }
  
  return code;
}

// Функции-генераторы для управления контентом
function generatePinMessageHandler(node: Node): string {
  let code = `\n# Pin Message Handler\n`;
  const synonyms = node.data.synonyms || ['закрепить', 'прикрепить', 'зафиксировать'];
  const disableNotification = node.data.disableNotification || false;
  const targetGroupId = node.data.targetGroupId;
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Генерируем обработчик команды /pin_message
  code += `@dp.message(Command("pin_message"))\n`;
  code += `async def pin_message_${sanitizedNodeId}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /pin_message\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение или указание ID сообщения\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевое сообщение\n`;
  code += `    target_message_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_message_id = message.reply_to_message.message_id\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_message_id = int(text_parts[1])\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение или напишите /pin_message ID_сообщения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        await bot.pin_chat_message(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            message_id=target_message_id,\n`;
  code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        await message.answer("✅ Сообщение закреплено")\n`;
  code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
  code += `            await message.answer("❌ Сообщение не найдено")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для закрепления сообщения")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка закрепления сообщения: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при закреплении: {e}")\n`;
  code += `\n`;
  
  // Создаем универсальный обработчик, который работает в любых группах
  synonyms.forEach((synonym, index) => {
    const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
    
    // Условие: проверяем синоним и что сообщение пришло из группы
    let condition = `lambda message: message.text and message.text.lower().startswith("${synonym.toLowerCase()}") and message.chat.type in ['group', 'supergroup']`;
    
    // Если указана конкретная группа, добавляем проверку ID группы
    if (targetGroupId) {
      condition += ` and str(message.chat.id) == "${targetGroupId}"`;
    }
    
    code += `\n@dp.message(${condition})\n`;
    code += `async def pin_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик для закрепления сообщения по команде '${synonym}'\n`;
    if (targetGroupId) {
      code += `    Работает только в группе ${targetGroupId}\n`;
    } else {
      code += `    Работает в любых группах где бот имеет права администратора\n`;
    }
    code += `    """\n`;
    code += `    user_id = message.from_user.id\n`;
    code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
    code += `    \n`;
    code += `    # Определяем целевое сообщение\n`;
    code += `    target_message_id = None\n`;
    code += `    \n`;
    code += `    if message.reply_to_message:\n`;
    code += `        # Если есть ответ на сообщение - используем его\n`;
    code += `        target_message_id = message.reply_to_message.message_id\n`;
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} в группе {chat_id}")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения в группе {chat_id}")\n`;
    code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
    code += `            return\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Закрепляем сообщение в текущей группе\n`;
    code += `        await bot.pin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id,\n`;
    code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer("✅ Сообщение закреплено")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для закрепления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка закрепления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при закреплении: {e}")\n`;
    code += `\n`;
  });
  
  return code;
}

function generateUnpinMessageHandler(node: Node): string {
  let code = `\n# Unpin Message Handler\n`;
  const synonyms = node.data.synonyms || ['открепить', 'отцепить', 'убрать закрепление'];
  const targetGroupId = node.data.targetGroupId;
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Генерируем обработчик команды /unpin_message
  code += `@dp.message(Command("unpin_message"))\n`;
  code += `async def unpin_message_${sanitizedNodeId}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /unpin_message\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение или указание ID сообщения\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевое сообщение\n`;
  code += `    target_message_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_message_id = message.reply_to_message.message_id\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_message_id = int(text_parts[1])\n`;
  code += `        else:\n`;
  code += `            # Если нет конкретного сообщения, открепляем все\n`;
  code += `            target_message_id = None\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        if target_message_id:\n`;
  code += `            await bot.unpin_chat_message(\n`;
  code += `                chat_id=chat_id,\n`;
  code += `                message_id=target_message_id\n`;
  code += `            )\n`;
  code += `            await message.answer("✅ Сообщение откреплено")\n`;
  code += `            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")\n`;
  code += `        else:\n`;
  code += `            await bot.unpin_all_chat_messages(chat_id=chat_id)\n`;
  code += `            await message.answer("✅ Все сообщения откреплены")\n`;
  code += `            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to unpin not found" in str(e) or "message not found" in str(e):\n`;
  code += `            await message.answer("❌ Сообщение не найдено")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для открепления сообщения")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка открепления сообщения: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при откреплении: {e}")\n`;
  code += `\n`;
  
  // Создаем универсальный обработчик, который работает в любых группах
  synonyms.forEach((synonym, index) => {
    const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
    
    // Условие: проверяем синоним и что сообщение пришло из группы
    let condition = `lambda message: message.text and message.text.lower().startswith("${synonym.toLowerCase()}") and message.chat.type in ['group', 'supergroup']`;
    
    // Если указана конкретная группа, добавляем проверку ID группы
    if (targetGroupId) {
      condition += ` and str(message.chat.id) == "${targetGroupId}"`;
    }
    
    code += `\n@dp.message(${condition})\n`;
    code += `async def unpin_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик для открепления сообщения по команде '${synonym}'\n`;
    if (targetGroupId) {
      code += `    Работает только в группе ${targetGroupId}\n`;
    } else {
      code += `    Работает в любых группах где бот имеет права администратора\n`;
    }
    code += `    """\n`;
    code += `    user_id = message.from_user.id\n`;
    code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
    code += `    \n`;
    code += `    # Определяем целевое сообщение\n`;
    code += `    target_message_id = None\n`;
    code += `    \n`;
    code += `    if message.reply_to_message:\n`;
    code += `        # Если есть ответ на сообщение - используем его\n`;
    code += `        target_message_id = message.reply_to_message.message_id\n`;
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для открепления в группе {chat_id}")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для открепления в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения - открепим все в группе {chat_id}")\n`;
    code += `            # Если нет конкретного сообщения, открепляем все\n`;
    code += `            target_message_id = None\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Открепляем сообщение в текущей группе\n`;
    code += `        if target_message_id:\n`;
    code += `            await bot.unpin_chat_message(\n`;
    code += `                chat_id=chat_id,\n`;
    code += `                message_id=target_message_id\n`;
    code += `            )\n`;
    code += `            await message.answer("✅ Сообщение откреплено")\n`;
    code += `            logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id} в группе {chat_id}")\n`;
    code += `        else:\n`;
    code += `            await bot.unpin_all_chat_messages(chat_id=chat_id)\n`;
    code += `            await message.answer("✅ Все сообщения откреплены")\n`;
    code += `            logging.info(f"Все сообщения откреплены пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to unpin not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для открепления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка открепления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при откреплении: {e}")\n`;
    code += `\n`;
  });
  
  return code;
}

function generateDeleteMessageHandler(node: Node): string {
  let code = `\n# Delete Message Handler\n`;
  const synonyms = node.data.synonyms || ['удалить', 'стереть', 'убрать сообщение'];
  const targetGroupId = node.data.targetGroupId;
  const messageText = node.data.messageText || "🗑️ Сообщение успешно удалено!";
  
  // Если указан конкретный ID группы, генерируем обработчик для этой группы
  if (targetGroupId) {
    const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    
    synonyms.forEach((synonym, index) => {
      const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
      code += `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
      code += `async def delete_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
      code += `    """\n`;
      code += `    Обработчик для удаления сообщения по команде '${synonym}'\n`;
      code += `    Работает в группе ${targetGroupId}\n`;
      code += `    """\n`;
      code += `    user_id = message.from_user.id\n`;
      code += `    chat_id = ${targetGroupId}\n`;
      code += `    \n`;
      code += `    # Определяем целевое сообщение\n`;
      code += `    target_message_id = None\n`;
      code += `    \n`;
      code += `    if message.reply_to_message:\n`;
      code += `        # Если есть ответ на сообщение - используем его\n`;
      code += `        target_message_id = message.reply_to_message.message_id\n`;
      code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления")\n`;
      code += `    else:\n`;
      code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
      code += `        text_parts = message.text.split()\n`;
      code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
      code += `            target_message_id = int(text_parts[1])\n`;
      code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления")\n`;
      code += `        else:\n`;
      code += `            logging.info(f"DEBUG: Получен текст ${synonym} без ID сообщения")\n`;
      code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
      code += `            return\n`;
      code += `    \n`;
      code += `    try:\n`;
      code += `        # Удаляем сообщение в указанной группе\n`;
      code += `        await bot.delete_message(\n`;
      code += `            chat_id=chat_id,\n`;
      code += `            message_id=target_message_id\n`;
      code += `        )\n`;
      code += `        await message.answer("${messageText}")\n`;
      code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id}")\n`;
      code += `    except TelegramBadRequest as e:\n`;
      code += `        if "message to delete not found" in str(e) or "message not found" in str(e):\n`;
      code += `            await message.answer("❌ Сообщение не найдено")\n`;
      code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
      code += `            await message.answer("❌ Недостаточно прав для удаления сообщения")\n`;
      code += `        else:\n`;
      code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
      code += `        logging.error(f"Ошибка удаления сообщения: {e}")\n`;
      code += `    except Exception as e:\n`;
      code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
      code += `        logging.error(f"Неожиданная ошибка при удалении: {e}")\n`;
      code += `\n`;
    });
  } else {
    // Если группа не указана, создаем общий обработчик для всех групп
    code += `# Обработчик для удаления сообщения используя синонимы: ${synonyms.join(', ')}\n`;
    code += `# Поддерживает ответ на сообщение для автоматического определения target message ID\n`;
    code += `# Работает в любых группах где бот имеет права администратора\n`;
    
    const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Генерируем обработчик команды
    code += `\n@dp.message(Command("delete_message"))\n`;
    code += `async def delete_message_${sanitizedNodeId}_command_handler(message: types.Message):\n`;
    code += `    """\n`;
    code += `    Обработчик команды /delete_message\n`;
    code += `    Работает в любых группах где бот имеет права администратора\n`;
    code += `    """\n`;
    code += `    user_id = message.from_user.id\n`;
    code += `    chat_id = message.chat.id\n`;
    code += `    \n`;
    code += `    # Проверяем, что это группа\n`;
    code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
    code += `        await message.answer("❌ Команда работает только в группах")\n`;
    code += `        return\n`;
    code += `    \n`;
    code += `    # Определяем целевое сообщение\n`;
    code += `    target_message_id = None\n`;
    code += `    \n`;
    code += `    if message.reply_to_message:\n`;
    code += `        # Если есть ответ на сообщение - используем его\n`;
    code += `        target_message_id = message.reply_to_message.message_id\n`;
    code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления")\n`;
    code += `    else:\n`;
    code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
    code += `        text_parts = message.text.split()\n`;
    code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
    code += `            target_message_id = int(text_parts[1])\n`;
    code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления")\n`;
    code += `        else:\n`;
    code += `            logging.info(f"DEBUG: Получена команда удаления без ID сообщения")\n`;
    code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '/delete_message ID_сообщения'")\n`;
    code += `            return\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Удаляем сообщение\n`;
    code += `        await bot.delete_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id}")\n`;
    code += `    except TelegramBadRequest as e:\n`;
    code += `        if "message to delete not found" in str(e) or "message not found" in str(e):\n`;
    code += `            await message.answer("❌ Сообщение не найдено")\n`;
    code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
    code += `            await message.answer("❌ Недостаточно прав для удаления сообщения")\n`;
    code += `        else:\n`;
    code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
    code += `        logging.error(f"Ошибка удаления сообщения: {e}")\n`;
    code += `    except Exception as e:\n`;
    code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
    code += `        logging.error(f"Неожиданная ошибка при удалении: {e}")\n`;
    code += `\n`;
    
    // Генерируем обработчики для синонимов
    synonyms.forEach((synonym, index) => {
      const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
      code += `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} ")) and message.chat.type in ['group', 'supergroup'])\n`;
      code += `async def delete_message_${sanitizedNodeId}_${sanitizedSynonym}_handler(message: types.Message):\n`;
      code += `    """\n`;
      code += `    Обработчик синонима '${synonym}' для удаления сообщения\n`;
      code += `    Работает в группах с ответом на сообщение или с указанием ID\n`;
      code += `    """\n`;
      code += `    user_id = message.from_user.id\n`;
      code += `    chat_id = message.chat.id\n`;
      code += `    \n`;
      code += `    # Определяем целевое сообщение\n`;
      code += `    target_message_id = None\n`;
      code += `    \n`;
      code += `    if message.reply_to_message:\n`;
      code += `        # Если есть ответ на сообщение - используем его\n`;
      code += `        target_message_id = message.reply_to_message.message_id\n`;
      code += `        logging.info(f"DEBUG: Получен ответ на сообщение {target_message_id} для удаления через синоним '${synonym}'")\n`;
      code += `    else:\n`;
      code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
      code += `        text_parts = message.text.split()\n`;
      code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
      code += `            target_message_id = int(text_parts[1])\n`;
      code += `            logging.info(f"DEBUG: Получен ID сообщения {target_message_id} из текста для удаления через синоним '${synonym}'")\n`;
      code += `        else:\n`;
      code += `            logging.info(f"DEBUG: Получен синоним '${synonym}' без ID сообщения")\n`;
      code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
      code += `            return\n`;
      code += `    \n`;
      code += `    try:\n`;
      code += `        # Удаляем сообщение\n`;
      code += `        await bot.delete_message(\n`;
      code += `            chat_id=chat_id,\n`;
      code += `            message_id=target_message_id\n`;
      code += `        )\n`;
      code += `        await message.answer("${messageText}")\n`;
      code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id} в группе {chat_id} через синоним '${synonym}'")\n`;
      code += `    except TelegramBadRequest as e:\n`;
      code += `        if "message to delete not found" in str(e) or "message not found" in str(e):\n`;
      code += `            await message.answer("❌ Сообщение не найдено")\n`;
      code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
      code += `            await message.answer("❌ Недостаточно прав для удаления сообщения")\n`;
      code += `        else:\n`;
      code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
      code += `        logging.error(f"Ошибка удаления сообщения через синоним '${synonym}': {e}")\n`;
      code += `    except Exception as e:\n`;
      code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
      code += `        logging.error(f"Неожиданная ошибка при удалении через синоним '${synonym}': {e}")\n`;
      code += `\n`;
    });
  }
  
  return code;
}

function generateContentManagementSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  const messageText = node.data.messageText || (
    node.type === 'pin_message' ? "✅ Сообщение закреплено" :
    node.type === 'unpin_message' ? "✅ Сообщение откреплено" :
    node.type === 'delete_message' ? "🗑️ Сообщение успешно удалено!" :
    "✅ Действие выполнено"
  );
  
  let code = `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} ")) and message.chat.type in ['group', 'supergroup'])\n`;
  code += `async def ${node.type}_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик синонима '${synonym}' для ${node.type}\n`;
  code += `    Работает в группах с ответом на сообщение или с указанием ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевое сообщение\n`;
  code += `    target_message_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        # Если есть ответ на сообщение - используем его\n`;
  code += `        target_message_id = message.reply_to_message.message_id\n`;
  code += `        logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для сообщения {target_message_id} (через ответ)")\n`;
  code += `    else:\n`;
  code += `        # Если нет ответа, проверяем текст на наличие ID сообщения\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_message_id = int(text_parts[1])\n`;
  code += `            logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для сообщения {target_message_id} (через ID)")\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Укажите сообщение: ответьте на сообщение или напишите '${synonym} ID_сообщения'")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    \n`;
  code += `    try:\n`;
  
  if (node.type === 'pin_message') {
    const disableNotification = node.data.disableNotification || false;
    code += `        # Закрепляем сообщение\n`;
    code += `        await bot.pin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id,\n`;
    code += `            disable_notification=${disableNotification ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} закреплено пользователем {user_id}")\n`;
  } else if (node.type === 'unpin_message') {
    code += `        # Открепляем сообщение\n`;
    code += `        await bot.unpin_chat_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} откреплено пользователем {user_id}")\n`;
  } else if (node.type === 'delete_message') {
    code += `        # Удаляем сообщение\n`;
    code += `        await bot.delete_message(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            message_id=target_message_id\n`;
    code += `        )\n`;
    code += `        await message.answer("${messageText}")\n`;
    code += `        logging.info(f"Сообщение {target_message_id} удалено пользователем {user_id}")\n`;
  }
  
  code += `    \n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "message to pin not found" in str(e) or "message not found" in str(e):\n`;
  code += `            await message.answer("❌ Сообщение не найдено")\n`;
  code += `        elif "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для выполнения операции")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка {current_node_type}: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")\n`;
  code += `\n`;
  
  return code;
}

// Функции для управления пользователями

function generateBanUserHandler(node: Node): string {
  let code = `\n# Ban User Handler\n`;
  const reason = node.data.reason || 'Нарушение правил группы';
  const untilDate = node.data.untilDate || 0;
  const synonyms = node.data.synonyms || ['забанить', 'бан', 'заблокировать'];
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /ban_user
  code += `@dp.message(Command("ban_user"))\n`;
  code += `async def ban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /ban_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для блокировки")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Баним пользователя\n`;
  if (untilDate && untilDate > 0) {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    code += `            until_date=${untilDate}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до {untilDate}\\nПричина: ${reason}")\n`;
  } else {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
  }
  code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для блокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка блокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при блокировке: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие для работы в любых группах (синонимы)
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}]) and message.chat.type in ['group', 'supergroup']`;
  
  code += `@dp.message(${condition})\n`;
  code += `async def ban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для блокировки пользователя\n`;
  code += `    Синонимы: ${synonymsList.join(', ')}\n`;
  code += `    Работает в любых группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        target_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name\n`;
  code += `    else:\n`;
  code += `        text_parts = message.text.split()\n`;
    // Автоматическое определение пользователя из упоминаний
    code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
    code += `        if message.entities:\n`;
    code += `            for entity in message.entities:\n`;
    code += `                if entity.type == "text_mention":\n`;
    code += `                    target_user_id = entity.user.id\n`;
    code += `                    break\n`;
    code += `        if not target_user_id:\n`;
    code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
    code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для блокировки")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Баним пользователя\n`;
  if (untilDate && untilDate > 0) {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    code += `            until_date=${untilDate}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до {untilDate}\\nПричина: ${reason}")\n`;
  } else {
    code += `        await bot.ban_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
  }
  code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для блокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка блокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при блокировке: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateUnbanUserHandler(node: Node): string {
  let code = `\n# Unban User Handler\n`;
  const synonyms = node.data.synonyms || ['разбанить', 'разблокировать', 'unban'];
  const targetGroupId = node.data.targetGroupId || '';
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /unban_user
  code += `@dp.message(Command("unban_user"))\n`;
  code += `async def unban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /unban_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    # Проверяем, есть ли ответ на сообщение\n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Определен пользователь для разбана из reply: {target_user_id}")\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для разблокировки")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Разбаниваем пользователя\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для разблокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка разблокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при разблокировке: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие для работы в любых группах (синонимы)
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}]) and message.chat.type in ['group', 'supergroup']`;
  
  code += `@dp.message(${condition})\n`;
  code += `async def unban_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для разблокировки пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Группа: ${targetGroupId}\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  // Автоматическое определение пользователя из контекста
  code += `    # Проверяем, есть ли ответ на сообщение\n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Определен пользователь для разбана из reply: {target_user_id}")\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для разблокировки")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Разбаниваем пользователя\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для разблокировки пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка разблокировки пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при разблокировке: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateMuteUserHandler(node: Node): string {
  let code = `\n# Mute User Handler\n`;
  const duration = node.data.duration || 3600;
  const reason = node.data.reason || 'Нарушение правил группы';
  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || 'замутить, мут, заткнуть';
  
  // Permissions для мута
  const canSendMessages = node.data.canSendMessages || false;
  const canSendMediaMessages = node.data.canSendMediaMessages || false;
  const canSendPolls = node.data.canSendPolls || false;
  const canSendOtherMessages = node.data.canSendOtherMessages || false;
  const canAddWebPagePreviews = node.data.canAddWebPagePreviews || false;
  const canChangeGroupInfo = node.data.canChangeGroupInfo || false;
  const canInviteUsers2 = node.data.canInviteUsers2 || false;
  const canPinMessages2 = node.data.canPinMessages2 || false;
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /mute_user
  code += `@dp.message(Command("mute_user"))\n`;
  code += `async def mute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    \"\"\"\n`;
  code += `    Обработчик команды /mute_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    \"\"\"\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer(\"❌ Команда работает только в группах\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == \"text_mention\":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer(\"❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия\")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer(\"❌ Не удалось определить пользователя для ограничения\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Вычисляем время окончания мута\n`;
  code += `        from datetime import datetime, timedelta\n`;
  code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
  code += `        \n`;
  code += `        # Ограничиваем пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
  code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'},\n`;
  code += `                can_send_polls=${canSendPolls ? 'True' : 'False'},\n`;
  code += `                can_send_other_messages=${canSendOtherMessages ? 'True' : 'False'},\n`;
  code += `                can_add_web_page_previews=${canAddWebPagePreviews ? 'True' : 'False'},\n`;
  code += `                can_change_info=${canChangeGroupInfo ? 'True' : 'False'},\n`;
  code += `                can_invite_users=${canInviteUsers2 ? 'True' : 'False'},\n`;
  code += `                can_pin_messages=${canPinMessages2 ? 'True' : 'False'}\n`;
  code += `            ),\n`;
  code += `            until_date=until_date\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        hours = ${duration} // 3600\n`;
  code += `        minutes = (${duration} % 3600) // 60\n`;
  code += `        time_str = f\"{hours}ч {minutes}м\" if hours > 0 else f\"{minutes}м\"\n`;
  code += `        \n`;
  code += `        await message.answer(f\"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}\")\n`;
  code += `        logging.info(f\"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на ${duration} секунд\")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if \"not enough rights\" in str(e) or \"CHAT_ADMIN_REQUIRED\" in str(e):\n`;
  code += `            await message.answer(\"❌ Недостаточно прав для ограничения пользователя\")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f\"❌ Ошибка: {e}\")\n`;
  code += `        logging.error(f\"Ошибка ограничения пользователя: {e}\")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer(\"❌ Произошла неожиданная ошибка\")\n`;
  code += `        logging.error(f\"Неожиданная ошибка при ограничении: {e}\")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def mute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для ограничения пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Группа: ${targetGroupId}\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для ограничения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Вычисляем время окончания мута\n`;
  code += `        from datetime import datetime, timedelta\n`;
  code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
  code += `        \n`;
  code += `        # Ограничиваем пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
  code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'},\n`;
  code += `                can_send_polls=${canSendPolls ? 'True' : 'False'},\n`;
  code += `                can_send_other_messages=${canSendOtherMessages ? 'True' : 'False'},\n`;
  code += `                can_add_web_page_previews=${canAddWebPagePreviews ? 'True' : 'False'},\n`;
  code += `                can_change_info=${canChangeGroupInfo ? 'True' : 'False'},\n`;
  code += `                can_invite_users=${canInviteUsers2 ? 'True' : 'False'},\n`;
  code += `                can_pin_messages=${canPinMessages2 ? 'True' : 'False'}\n`;
  code += `            ),\n`;
  code += `            until_date=until_date\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        hours = ${duration} // 3600\n`;
  code += `        minutes = (${duration} % 3600) // 60\n`;
  code += `        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id} в группе {chat_id} на ${duration} секунд")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для ограничения пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка ограничения пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при ограничении: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateUnmuteUserHandler(node: Node): string {
  let code = `\n# Unmute User Handler\n`;
  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || 'размутить, размут, освободить';
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /unmute_user
  code += `@dp.message(Command("unmute_user"))\n`;
  code += `async def unmute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    \"\"\"\n`;
  code += `    Обработчик команды /unmute_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    \"\"\"\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer(\"❌ Команда работает только в группах\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == \"text_mention\":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer(\"❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия\")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer(\"❌ Не удалось определить пользователя для снятия ограничений\")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Снимаем ограничения с пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=True,\n`;
  code += `                can_send_media_messages=True,\n`;
  code += `                can_send_polls=True,\n`;
  code += `                can_send_other_messages=True,\n`;
  code += `                can_add_web_page_previews=True,\n`;
  code += `                can_change_info=False,\n`;
  code += `                can_invite_users=False,\n`;
  code += `                can_pin_messages=False\n`;
  code += `            )\n`;
  code += `        )\n`;
  code += `        await message.answer(f\"✅ Ограничения с пользователя {target_user_id} сняты\")\n`;
  code += `        logging.info(f\"Ограничения с пользователя {target_user_id} сняты администратором {user_id} в группе {chat_id}\")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if \"not enough rights\" in str(e) or \"CHAT_ADMIN_REQUIRED\" in str(e):\n`;
  code += `            await message.answer(\"❌ Недостаточно прав для снятия ограничений\")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f\"❌ Ошибка: {e}\")\n`;
  code += `        logging.error(f\"Ошибка снятия ограничений: {e}\")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer(\"❌ Произошла неожиданная ошибка\")\n`;
  code += `        logging.error(f\"Неожиданная ошибка при снятии ограничений: {e}\")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def unmute_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для снятия ограничений с пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Группа: ${targetGroupId}\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для снятия ограничений")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Снимаем ограничения с пользователя\n`;
  code += `        await bot.restrict_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            permissions=types.ChatPermissions(\n`;
  code += `                can_send_messages=True,\n`;
  code += `                can_send_media_messages=True,\n`;
  code += `                can_send_polls=True,\n`;
  code += `                can_send_other_messages=True,\n`;
  code += `                can_add_web_page_previews=True,\n`;
  code += `                can_change_info=False,\n`;
  code += `                can_invite_users=False,\n`;
  code += `                can_pin_messages=False\n`;
  code += `            )\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")\n`;
  code += `        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для снятия ограничений")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка снятия ограничений: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при снятии ограничений: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateKickUserHandler(node: Node): string {
  let code = `\n# Kick User Handler\n`;
  const reason = node.data.reason || 'Нарушение правил группы';
  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['кикнуть', 'кик', 'исключить'];
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /kick_user
  code += `@dp.message(Command("kick_user"))\n`;
  code += `async def kick_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /kick_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для исключения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Исключаем пользователя (ban + unban)\n`;
  code += `        await bot.ban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        # Немедленно разбаниваем, чтобы пользователь мог вернуться\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\\nПричина: ${reason}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id} из группы {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для исключения пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка исключения пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при исключении: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def kick_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для исключения пользователя из группы\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Работает только в группе ${targetGroupId}\n`;
  } else {
    code += `    Работает в любых группах где бот имеет права администратора\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для исключения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Исключаем пользователя из группы (кик)\n`;
  code += `        await bot.ban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            revoke_messages=False  # Не удаляем сообщения пользователя\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        # Добавляем небольшую задержку для корректной обработки\n`;
  code += `        import asyncio\n`;
  code += `        await asyncio.sleep(0.5)\n`;
  code += `        \n`;
  code += `        # Сразу же разбаниваем, чтобы пользователь мог зайти обратно\n`;
  code += `        await bot.unban_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            only_if_banned=True\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\\nПричина: ${reason}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id} из группы {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для исключения пользователя")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка исключения пользователя: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при исключении: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generatePromoteUserHandler(node: Node): string {
  let code = `\n# Promote User Handler\n`;

  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['повысить', 'админ', 'назначить'];
  
  // Admin rights
  const canChangeInfo = node.data.canChangeInfo || false;
  const canDeleteMessages = node.data.canDeleteMessages || true;
  const canBanUsers = node.data.canBanUsers || false;
  const canInviteUsers = node.data.canInviteUsers || true;
  const canPinMessages = node.data.canPinMessages || true;
  const canAddAdmins = node.data.canAddAdmins || false;
  const canRestrictMembers = node.data.canRestrictMembers || false;
  const canPromoteMembers = node.data.canPromoteMembers || false;
  const canManageVideoChats = node.data.canManageVideoChats || false;
  const canManageTopics = node.data.canManageTopics || false;
  const isAnonymous = node.data.isAnonymous || false;
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /promote_user
  code += `@dp.message(Command("promote_user"))\n`;
  code += `async def promote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /promote_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для повышения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для повышения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Повышаем пользователя до админа\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=${canChangeInfo ? 'True' : 'False'},\n`;
  code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
  code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
  code += `            can_restrict_members=${canRestrictMembers ? 'True' : 'False'},\n`;
  code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'},\n`;
  code += `            can_promote_members=${canPromoteMembers ? 'True' : 'False'},\n`;
  code += `            can_manage_video_chats=${canManageVideoChats ? 'True' : 'False'},\n`;
  if (canManageTopics) {
    code += `            can_manage_topics=${canManageTopics ? 'True' : 'False'},\n`;
  }
  code += `            is_anonymous=${isAnonymous ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором!")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} назначен администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e) or "RIGHT_FORBIDDEN" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для назначения администраторов. Бот должен быть администратором с правом назначать других администраторов.")\n`;
  code += `        elif "USER_NOT_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь не является участником группы")\n`;
  code += `        elif "USER_ALREADY_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь уже является администратором")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка назначения админа: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при назначении админа: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def promote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для назначения пользователя администратором\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Работает только в группе ${targetGroupId}\n`;
  } else {
    code += `    Работает в любых группах где бот имеет права администратора\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для назначения администратором")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Назначаем пользователя администратором\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=${canChangeInfo ? 'True' : 'False'},\n`;
  code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
  code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
  code += `            can_restrict_members=${canRestrictMembers ? 'True' : 'False'},\n`;
  code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'},\n`;
  code += `            can_promote_members=${canPromoteMembers ? 'True' : 'False'},\n`;
  code += `            can_manage_video_chats=${canManageVideoChats ? 'True' : 'False'},\n`;
  if (canManageTopics) {
    code += `            can_manage_topics=${canManageTopics ? 'True' : 'False'},\n`;
  }
  code += `            is_anonymous=${isAnonymous ? 'True' : 'False'}\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        # Создаем список предоставленных прав\n`;
  code += `        rights = []\n`;
  if (canChangeInfo) code += `        rights.append("изменение информации")\n`;
  if (canDeleteMessages) code += `        rights.append("удаление сообщений")\n`;
  if (canBanUsers) code += `        rights.append("блокировка пользователей")\n`;
  if (canInviteUsers) code += `        rights.append("приглашение пользователей")\n`;
  if (canPinMessages) code += `        rights.append("закрепление сообщений")\n`;
  if (canRestrictMembers) code += `        rights.append("ограничение участников")\n`;
  if (canPromoteMembers) code += `        rights.append("назначение администраторов")\n`;
  if (canManageVideoChats) code += `        rights.append("управление видеочатами")\n`;
  if (canManageTopics) code += `        rights.append("управление темами")\n`;
  
  code += `        rights_text = ", ".join(rights) if rights else "базовые права администратора"\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором\\nПрава: {rights_text}")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e) or "RIGHT_FORBIDDEN" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для назначения администратора. Бот должен быть администратором с правом назначать других администраторов.")\n`;
  code += `        elif "USER_NOT_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь не является участником группы")\n`;
  code += `        elif "USER_ALREADY_PARTICIPANT" in str(e):\n`;
  code += `            await message.answer("❌ Пользователь уже является администратором")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка назначения администратора: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при назначении администратора: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateDemoteUserHandler(node: Node): string {
  let code = `\n# Demote User Handler\n`;

  const targetGroupId = node.data.targetGroupId || '';
  const synonyms = node.data.synonyms || ['понизить', 'снять с админки', 'демоут'];
  
  // Создаем список синонимов для проверки
  const synonymsList = Array.isArray(synonyms) ? synonyms.map((s: string) => s.trim().toLowerCase()).filter((s: string) => s) : (synonyms as string).split(',').map((s: string) => s.trim().toLowerCase()).filter((s: string) => s);
  const synonymsPattern = synonymsList.map((s: string) => `"${s}"`).join(', ');
  
  // Генерируем обработчик команды /demote_user
  code += `@dp.message(Command("demote_user"))\n`;
  code += `async def demote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_command_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик команды /demote_user\n`;
  code += `    Работает в группах где бот имеет права администратора\n`;
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Проверяем, что это группа\n`;
  code += `    if message.chat.type not in ['group', 'supergroup']:\n`;
  code += `        await message.answer("❌ Команда работает только в группах")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для понижения")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для понижения")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Понижаем пользователя - убираем все права админа\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=False,\n`;
  code += `            can_delete_messages=False,\n`;
  code += `            can_invite_users=False,\n`;
  code += `            can_restrict_members=False,\n`;
  code += `            can_pin_messages=False,\n`;
  code += `            can_promote_members=False,\n`;
  code += `            can_manage_video_chats=False,\n`;
  code += `            can_manage_topics=False,\n`;
  code += `            is_anonymous=False\n`;
  code += `        )\n`;
  code += `        await message.answer(f"✅ Пользователь {target_user_id} снят с должности администратора!")\n`;
  code += `        logging.info(f"Пользователь {target_user_id} понижен администратором {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для понижения администраторов")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка понижения админа: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при понижении админа: {e}")\n`;
  code += `\n`;
  
  // Генерируем условие с учётом целевой группы и синонимов
  let condition = `lambda message: message.text and any(message.text.lower().startswith(word) for word in [${synonymsPattern}])`;
  if (targetGroupId) {
    condition += ` and str(message.chat.id) == "${targetGroupId}"`;
  } else {
    condition += ` and message.chat.type in ['group', 'supergroup']`;
  }
  
  code += `@dp.message(${condition})\n`;
  code += `async def demote_user_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик для снятия прав администратора с пользователя\n`;
  code += `    Синонимы: ${synonyms}\n`;
  if (targetGroupId) {
    code += `    Работает только в группе ${targetGroupId}\n`;
  } else {
    code += `    Работает в любых группах где бот имеет права администратора\n`;
  }
  code += `    Использование: ответ на сообщение пользователя или указание ID\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id  # Автоматически определяем ID группы из контекста\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `    else:\n`;
  code += `        # Пробуем найти упоминание пользователя в сообщении\n`;
  code += `        if message.entities:\n`;
  code += `            for entity in message.entities:\n`;
  code += `                if entity.type == "text_mention":\n`;
  code += `                    target_user_id = entity.user.id\n`;
  code += `                    break\n`;
  code += `        if not target_user_id:\n`;
  code += `            await message.answer("❌ Ответьте на сообщение пользователя или упомяните его для выполнения действия")\n`;
  code += `            return\n`;
  
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя для снятия прав администратора")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Снимаем права администратора\n`;
  code += `        await bot.promote_chat_member(\n`;
  code += `            chat_id=chat_id,\n`;
  code += `            user_id=target_user_id,\n`;
  code += `            can_change_info=False,\n`;
  code += `            can_delete_messages=False,\n`;
  code += `            can_invite_users=False,\n`;
  code += `            can_restrict_members=False,\n`;
  code += `            can_pin_messages=False,\n`;
  code += `            can_promote_members=False,\n`;
  code += `            can_manage_video_chats=False,\n`;
  code += `            can_manage_topics=False,\n`;
  code += `            is_anonymous=False\n`;
  code += `        )\n`;
  code += `        \n`;
  code += `        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")\n`;
  code += `        logging.info(f"Права администратора сняты с пользователя {target_user_id} пользователем {user_id} в группе {chat_id}")\n`;
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для снятия прав администратора")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка снятия прав администратора: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка при снятии прав администратора: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateAdminRightsHandler(node: Node): string {
  let code = `\n# Interactive Admin Rights Handler for ${node.id}\n`;
  
  const safeFunctionName = createSafeFunctionName(node.id);
  const messageText = node.data.messageText || "⚙️ Управление правами администратора";
  const formattedText = formatTextForPython(messageText);
  const command = node.data.command?.replace('/', '') || 'admin_rights';
  
  // Создаем основной command handler с автоматическим определением участника
  code += `@dp.message(Command("${command}"))\n`;
  code += `async def ${safeFunctionName}_command_handler(message: types.Message, bot):\n`;
  code += `    """\n`;
  code += `    Основной обработчик команды ${node.data.command || '/admin_rights'}\n`;
  code += `    Автоматически определяет целевого пользователя из контекста\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    logging.info(f"Команда admin_rights вызвана пользователем {user_id} в чате {chat_id}")\n`;
  code += `    \n`;
  code += `    # Проверяем права вызывающего пользователя\n`;
  code += `    try:\n`;
  code += `        current_user_member = await bot.get_chat_member(chat_id, user_id)\n`;
  code += `        if current_user_member.status not in ['administrator', 'creator']:\n`;
  code += `            await message.answer("❌ У вас нет прав администратора для использования этой команды")\n`;
  code += `            return\n`;
  code += `        \n`;
  code += `        if current_user_member.status != 'creator' and not getattr(current_user_member, 'can_promote_members', False):\n`;
  code += `            await message.answer("❌ У вас нет права на управление правами других администраторов")\n`;
  code += `            return\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer(f"❌ Ошибка при проверке ваших прав: {e}")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Автоматическое определение целевого пользователя\n`;
  code += `    \n`;
  code += `    # 1. Проверяем, есть ли ответ на сообщение\n`;
  code += `    if message.reply_to_message and message.reply_to_message.from_user:\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Целевой пользователь определен из ответа на сообщение: {target_user_id}")\n`;
  code += `    \n`;
  code += `    # 2. Проверяем, есть ли упоминание в тексте (@username или прямое упоминание)\n`;
  code += `    elif message.entities:\n`;
  code += `        for entity in message.entities:\n`;
  code += `            # Приоритет - прямое упоминание с объектом пользователя\n`;
  code += `            if entity.type == "text_mention" and hasattr(entity, 'user'):\n`;
  code += `                target_user_id = entity.user.id\n`;
  code += `                logging.info(f"Целевой пользователь определен из прямого упоминания: {target_user_id}")\n`;
  code += `                break\n`;
  code += `            elif entity.type == "mention":\n`;
  code += `                # Извлекаем username из упоминания\n`;
  code += `                username = message.text[entity.offset+1:entity.offset+entity.length]  # +1 чтобы убрать @\n`;
  code += `                try:\n`;
  code += `                    # Пытаемся найти пользователя по username через участников чата\n`;
  code += `                    chat_admins = await bot.get_chat_administrators(chat_id)\n`;
  code += `                    for member in chat_admins:\n`;
  code += `                        if member.user.username and member.user.username.lower() == username.lower():\n`;
  code += `                            target_user_id = member.user.id\n`;
  code += `                            logging.info(f"Целевой пользователь определен из упоминания @{username}: {target_user_id}")\n`;
  code += `                            break\n`;
  code += `                except Exception as e:\n`;
  code += `                    logging.warning(f"Не удалось найти пользователя @{username}: {e}")\n`;
  code += `                break\n`;
  code += `    \n`;
  code += `    # 3. Проверяем, есть ли ID в тексте команды\n`;
  code += `    if target_user_id is None:\n`;
  code += `        # Ищем числовой ID в аргументах команды\n`;
  code += `        import re\n`;
  code += `        # Извлекаем все числа из текста команды (исключая сам command)\n`;
  code += `        command_text = message.text or ""\n`;
  code += `        numbers = re.findall(r'\\b\\d{6,}\\b', command_text)  # ID обычно 6+ цифр\n`;
  code += `        \n`;
  code += `        for number_str in numbers:\n`;
  code += `            try:\n`;
  code += `                potential_user_id = int(number_str)\n`;
  code += `                # Проверяем, что это валидный пользователь в чате\n`;
  code += `                try:\n`;
  code += `                    member_check = await bot.get_chat_member(chat_id, potential_user_id)\n`;
  code += `                    target_user_id = potential_user_id\n`;
  code += `                    logging.info(f"Целевой пользователь определен из ID в команде: {target_user_id}")\n`;
  code += `                    break\n`;
  code += `                except Exception:\n`;
  code += `                    logging.debug(f"ID {potential_user_id} не найден в чате, попробуем следующий")\n`;
  code += `                    continue\n`;
  code += `            except ValueError:\n`;
  code += `                continue\n`;
  code += `    \n`;
  code += `    # Если целевой пользователь не определен, показываем инструкцию\n`;
  code += `    if target_user_id is None:\n`;
  code += `        await message.answer(\n`;
  code += `            "❓ Укажите пользователя для управления правами:\\n"\n`;
  code += `            "• Ответьте на сообщение пользователя\\n"\n`;
  code += `            "• Упомяните пользователя: /admin_rights @username\\n"\n`;
  code += `            "• Укажите ID: /admin_rights 123456789"\n`;
  code += `        )\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Проверяем, что целевой пользователь является администратором\n`;
  code += `    try:\n`;
  code += `        target_member = await bot.get_chat_member(chat_id, target_user_id)\n`;
  code += `        if target_member.status not in ['administrator', 'creator']:\n`;
  code += `            await message.answer("❌ Указанный пользователь не является администратором")\n`;
  code += `            return\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer(f"❌ Не удалось проверить пользователя: {e}")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Создаем и отправляем интерактивную клавиатуру\n`;
  code += `    keyboard = await create_admin_rights_keyboard_${safeFunctionName}(bot, chat_id, target_user_id)\n`;
  code += `    text = ${formattedText}\n`;
  code += generateUniversalVariableReplacement('    ');
  code += `    \n`;
  code += `    await message.answer(text, reply_markup=keyboard)\n`;
  code += `\n`;
  
  // Создаем функцию для получения текущих прав администратора
  code += `async def get_admin_rights_${safeFunctionName}(bot, chat_id, target_user_id):\n`;
  code += `    """\n`;
  code += `    Получает текущие права администратора пользователя в чате\n`;
  code += `    """\n`;
  code += `    try:\n`;
  code += `        member = await bot.get_chat_member(chat_id, target_user_id)\n`;
  code += `        if hasattr(member, 'status') and member.status in ['administrator', 'creator']:\n`;
  code += `            # Возвращаем основные права администратора включая управление историями\n`;
  code += `            return {\n`;
  code += `                'can_change_info': getattr(member, 'can_change_info', False),\n`;
  code += `                'can_delete_messages': getattr(member, 'can_delete_messages', False),\n`;
  code += `                'can_restrict_members': getattr(member, 'can_restrict_members', False),\n`;
  code += `                'can_invite_users': getattr(member, 'can_invite_users', False),\n`;
  code += `                'can_pin_messages': getattr(member, 'can_pin_messages', False),\n`;
  code += `                'can_manage_video_chats': getattr(member, 'can_manage_video_chats', False),\n`;
  code += `                'can_post_stories': getattr(member, 'can_post_stories', False),\n`;
  code += `                'can_edit_stories': getattr(member, 'can_edit_stories', False),\n`;
  code += `                'can_delete_stories': getattr(member, 'can_delete_stories', False),\n`;
  code += `                'is_anonymous': getattr(member, 'is_anonymous', False),\n`;
  code += `                'can_promote_members': getattr(member, 'can_promote_members', False)\n`;
  code += `            }\n`;
  code += `        else:\n`;
  code += `            # Пользователь не является администратором\n`;
  code += `            return None\n`;
  code += `    except Exception as e:\n`;
  code += `        logging.error(f"Ошибка при получении прав администратора: {e}")\n`;
  code += `        return None\n`;
  code += `\n`;
  
  // Создаем функцию для генерации интерактивной клавиатуры
  code += `async def create_admin_rights_keyboard_${safeFunctionName}(bot, chat_id, target_user_id, node_id="${node.id}"):\n`;
  code += `    """\n`;
  code += `    Создает интерактивную клавиатуру с кнопками-переключателями прав\n`;
  code += `    """\n`;
  code += `    # Получаем текущие права\n`;
  code += `    current_rights = await get_admin_rights_${safeFunctionName}(bot, chat_id, target_user_id)\n`;
  code += `    \n`;
  code += `    builder = InlineKeyboardBuilder()\n`;
  code += `    \n`;
  code += `    if current_rights is None:\n`;
  code += `        # Пользователь не администратор\n`;
  code += `        builder.add(InlineKeyboardButton(text="❌ Пользователь не является администратором", callback_data="no_admin"))\n`;
  code += `        return builder.as_markup()\n`;
  code += `    \n`;
  code += `    # Список основных прав администратора включая управление историями\n`;
  code += `    admin_rights_list = [\n`;
  code += `        ('can_change_info', '🏷️ Изменение профиля'),\n`;
  code += `        ('can_delete_messages', '🗑️ Удаление сообщений'),\n`;
  code += `        ('can_restrict_members', '🚫 Блокировка участников'),\n`;
  code += `        ('can_invite_users', '📨 Приглашение участников'),\n`;
  code += `        ('can_pin_messages', '📌 Закрепление сообщений'),\n`;
  code += `        ('can_manage_video_chats', '🎥 Управление видеочатами'),\n`;
  code += `        ('can_post_stories', '📰 Публикация историй'),\n`;
  code += `        ('can_edit_stories', '✏️ Редактирование историй'),\n`;
  code += `        ('can_delete_stories', '🗑️ Удаление историй'),\n`;
  code += `        ('is_anonymous', '🔒 Анонимность'),\n`;
  code += `        ('can_promote_members', '👑 Назначение администраторов')\n`;
  code += `    ]\n`;
  code += `    \n`;
  code += `    # Создаем кнопки с индикаторами состояния\n`;
  code += `    for right_key, right_name in admin_rights_list:\n`;
  code += `        is_enabled = current_rights.get(right_key, False)\n`;
  code += `        indicator = "✅" if is_enabled else "❌"\n`;
  code += `        button_text = f"{indicator} {right_name}"\n`;
  code += `        # Укорачиваем callback_data для соблюдения лимита Telegram (64 байта)\n`;
  code += `        short_node_id = str(hash(node_id))[-6:]  # Берем последние 6 символов хэша\n`;
  code += `        callback_data = f"tr_{right_key[:12]}_{target_user_id}_{short_node_id}"\n`;
  code += `        builder.add(InlineKeyboardButton(text=button_text, callback_data=callback_data))\n`;
  code += `    \n`;
  code += `    # Кнопка для обновления состояния (с коротким callback_data)\n`;
  code += `    short_node_id = str(hash(node_id))[-6:]  # Берем последние 6 символов хэша\n`;
  code += `    builder.add(InlineKeyboardButton(text="🔄 Обновить", callback_data=f"ref_{target_user_id}_{short_node_id}"))\n`;
  code += `    \n`;
  code += `    builder.adjust(1)  # Располагаем кнопки в одну колонку для лучшей читаемости\n`;
  code += `    return builder.as_markup()\n`;
  code += `\n`;
  
  // Главный callback обработчик для узла admin_rights
  code += `@dp.callback_query(lambda c: c.data == "${node.id}")\n`;
  code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery, bot):\n`;
  code += `    """\n`;
  code += `    Обработчик callback для узла admin_rights: ${node.id}\n`;
  code += `    Отображает интерактивную клавиатуру для управления правами администратора\n`;
  code += `    """\n`;
  code += `    await callback_query.answer()\n`;
  code += `    user_id = callback_query.from_user.id\n`;
  code += `    chat_id = callback_query.message.chat.id\n`;
  code += `    \n`;
  code += `    logging.info(f"Обработка callback admin_rights от пользователя {user_id} в чате {chat_id}")\n`;
  code += `    \n`;
  code += `    # Проверяем права БОТА (не пользователя) на управление правами администраторов\n`;
  code += `    try:\n`;
  code += `        bot_member = await bot.get_chat_member(chat_id, bot.id)\n`;
  code += `        if bot_member.status not in ['administrator', 'creator']:\n`;
  code += `            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")\n`;
  code += `            return\n`;
  code += `        \n`;
  code += `        # Проверяем, может ли бот управлять правами других администраторов\n`;
  code += `        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):\n`;
  code += `            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")\n`;
  code += `            return\n`;
  code += `    except Exception as e:\n`;
  code += `        logging.error(f"Ошибка при проверке прав администратора: {e}")\n`;
  code += `        await safe_edit_or_send(callback_query, "❌ Не удалось проверить права администратора. Попробуйте позже.")\n`;
  code += `        return\n`;
  code += `    \n`;
  code += `    # Получаем target_user_id (пользователя, чьи права будем менять)\n`;
  code += `    # В данном случае, мы будем управлять правами пользователя, который вызвал команду\n`;
  code += `    # Но это можно изменить для работы с replied сообщениями\n`;
  code += `    target_user_id = user_id  # По умолчанию управляем своими правами\n`;
  code += `    \n`;
  code += `    # Если это ответ на сообщение, берем пользователя из ответа\n`;
  code += `    if hasattr(callback_query.message, 'reply_to_message') and callback_query.message.reply_to_message:\n`;
  code += `        target_user_id = callback_query.message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Управляем правами пользователя {target_user_id} из ответа на сообщение")\n`;
  code += `    \n`;
  code += `    # Текст сообщения\n`;
  code += `    text = ${formattedText}\n`;
  
  // Добавляем универсальную замену переменных
  code += generateUniversalVariableReplacement('    ');
  code += `    \n`;
  code += `    # Создаем интерактивную клавиатуру\n`;
  code += `    keyboard = await create_admin_rights_keyboard_${safeFunctionName}(bot, chat_id, target_user_id)\n`;
  code += `    \n`;
  code += `    # Отправляем/обновляем сообщение с клавиатурой\n`;
  code += `    try:\n`;
  code += `        # Пробуем отредактировать сообщение (работает для inline callbacks)\n`;
  code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n`;
  code += `    except Exception as e:\n`;
  code += `        # Если не удалось отредактировать (например, для text commands), отправляем новое сообщение\n`;
  code += `        logging.info(f"Отправляем новое сообщение admin_rights: {e}")\n`;
  code += `        await callback_query.message.answer(text, reply_markup=keyboard)\n`;
  code += `\n`;
  
  // Добавляем callback обработчики для переключения прав
  code += generateAdminRightsToggleHandlers(node);
  
  return code;
}

function generateAdminRightsToggleHandlers(node: any): string {
  const safeFunctionName = createSafeFunctionName(node.id);
  let code = '\n';
  
  // Список основных админ прав включая управление историями
  const adminRights = [
    'can_change_info',
    'can_delete_messages', 
    'can_restrict_members',
    'can_invite_users',
    'can_pin_messages',
    'can_manage_video_chats',
    'can_post_stories',
    'can_edit_stories', 
    'can_delete_stories',
    'is_anonymous',
    'can_promote_members'
  ];
  
  // Создаем обработчик для каждого права
  adminRights.forEach(rightKey => {
    const shortRightKey = rightKey.substring(0, 12); // Обрезаем ключ права до 12 символов
    code += `# Обработчик переключения права: ${rightKey}\n`;
    code += `@dp.callback_query(lambda c: c.data.startswith("tr_${shortRightKey}_"))\n`;
    code += `async def toggle_${rightKey}_${safeFunctionName}(callback_query: types.CallbackQuery, bot):\n`;
    code += `    """\n`;
    code += `    Переключает право ${rightKey} для пользователя\n`;
    code += `    """\n`;
    code += `    await callback_query.answer()\n`;
    code += `    \n`;
    code += `    # Парсим данные из callback_data: tr_<right>_<user_id>_<node_hash>\n`;
    code += `    try:\n`;
    code += `        data_parts = callback_query.data.split('_')\n`;
    code += `        # Формат: ['tr', '<right_name>', '<user_id>', '<node_hash>']\n`;
    code += `        if len(data_parts) < 4:\n`;
    code += `            raise ValueError("Недостаточно частей в callback_data")\n`;
    code += `        target_user_id = int(data_parts[-2])\n`;
    code += `        node_hash = data_parts[-1]\n`;
    code += `        logging.info(f"Переключаем право ${rightKey} для пользователя {target_user_id}")\n`;
    code += `    except (ValueError, IndexError) as e:\n`;
    code += `        logging.error(f"Ошибка парсинга callback_data: {callback_query.data}, ошибка: {e}")\n`;
    code += `        await callback_query.answer("❌ Ошибка в данных кнопки")\n`;
    code += `        return\n`;
    code += `    \n`;
    code += `    user_id = callback_query.from_user.id\n`;
    code += `    chat_id = callback_query.message.chat.id\n`;
    code += `    \n`;
    code += `    try:\n`;
    code += `        # Проверяем права БОТА на управление правами администраторов\n`;
    code += `        bot_member = await bot.get_chat_member(chat_id, bot.id)\n`;
    code += `        if bot_member.status not in ['administrator', 'creator']:\n`;
    code += `            await safe_edit_or_send(callback_query, "❌ Бот не является администратором этой группы")\n`;
    code += `            return\n`;
    code += `            \n`;
    code += `        if bot_member.status != 'creator' and not getattr(bot_member, 'can_promote_members', False):\n`;
    code += `            await safe_edit_or_send(callback_query, "❌ У бота нет права на управление правами администраторов")\n`;
    code += `            return\n`;
    code += `        \n`;
    code += `        # Получаем текущие права целевого пользователя\n`;
    code += `        target_member = await bot.get_chat_member(chat_id, target_user_id)\n`;
    code += `        if target_member.status not in ['administrator', 'creator']:\n`;
    code += `            await safe_edit_or_send(callback_query, "❌ Целевой пользователь не является администратором")\n`;
    code += `            return\n`;
    code += `        \n`;
    code += `        # Получаем текущее состояние права\n`;
    code += `        current_value = getattr(target_member, '${rightKey}', False)\n`;
    code += `        new_value = not current_value\n`;
    code += `        \n`;
    code += `        # Подготавливаем права для обновления\n`;
    code += `        permissions = {\n`;
    adminRights.forEach(right => {
      code += `            '${right}': getattr(target_member, '${right}', False),\n`;
    });
    code += `        }\n`;
    code += `        permissions['${rightKey}'] = new_value\n`;
    code += `        \n`;
    code += `        # Применяем изменения\n`;
    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id,\n`;
    code += `            user_id=target_user_id,\n`;
    adminRights.forEach(right => {
      code += `            ${right}=permissions['${right}'],\n`;
    });
    code += `        )\n`;
    code += `        \n`;
    code += `        # Обновляем клавиатуру с новым состоянием\n`;
    code += `        keyboard = await create_admin_rights_keyboard_${safeFunctionName}(bot, chat_id, target_user_id)\n`;
    code += `        \n`;
    code += `        # Обновляем сообщение\n`;
    code += `        text = "⚙️ Управление правами администратора"\n`;
    code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n`;
    code += `        \n`;
    code += `        logging.info(f"Пользователь {user_id} {'включил' if new_value else 'отключил'} право '${rightKey}' для пользователя {target_user_id}")\n`;
    code += `        \n`;
    code += `    except Exception as e:\n`;
    code += `        logging.error(f"Ошибка при переключении права ${rightKey}: {e}")\n`;
    code += `        await safe_edit_or_send(callback_query, "❌ Не удалось изменить права администратора. Попробуйте позже.")\n`;
    code += `\n`;
  });
  
  // Обработчик кнопки обновления
  code += `# Обработчик кнопки обновления прав\n`;
  code += `@dp.callback_query(lambda c: c.data.startswith("ref_"))\n`;
  code += `async def refresh_admin_rights_${safeFunctionName}(callback_query: types.CallbackQuery, bot):\n`;
  code += `    """\n`;
  code += `    Обновляет отображение прав администратора\n`;
  code += `    """\n`;
  code += `    await callback_query.answer("🔄 Обновляем...")\n`;
  code += `    \n`;
  code += `    # Парсим данные: ref_<user_id>_<node_hash>\n`;
  code += `    data_parts = callback_query.data.split('_')\n`;
  code += `    target_user_id = int(data_parts[-2])\n`;
  code += `    \n`;
  code += `    chat_id = callback_query.message.chat.id\n`;
  code += `    \n`;
  code += `    try:\n`;
  code += `        # Создаем обновленную клавиатуру\n`;
  code += `        keyboard = await create_admin_rights_keyboard_${safeFunctionName}(bot, chat_id, target_user_id)\n`;
  code += `        \n`;
  code += `        # Обновляем сообщение\n`;
  code += `        text = "⚙️ Управление правами администратора"\n`;
  code += `        await safe_edit_or_send(callback_query, text, reply_markup=keyboard)\n`;
  code += `        \n`;
  code += `        logging.info(f"Обновлены права для пользователя {target_user_id}")\n`;
  code += `        \n`;
  code += `    except Exception as e:\n`;
  code += `        logging.error(f"Ошибка при обновлении прав: {e}")\n`;
  code += `        await safe_edit_or_send(callback_query, "❌ Не удалось обновить права. Попробуйте позже.")\n`;
  code += `\n`;
  
  return code;
}

function generateUserManagementSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Для admin_rights разрешаем работу в любых чатах, для остальных - только в группах
  const chatTypeFilter = node.type === 'admin_rights' ? '' : ` and message.chat.type in ['group', 'supergroup']`;
  let code = `\n@dp.message(lambda message: message.text and (message.text.lower() == "${synonym.toLowerCase()}" or message.text.lower().startswith("${synonym.toLowerCase()} "))${chatTypeFilter})\n`;
  code += `async def ${node.type}_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    """\n`;
  code += `    Обработчик синонима '${synonym}' для ${node.type}\n`;
  code += `    Работает в группах с ответом на сообщение или с указанием ID пользователя\n`;
  code += `    """\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    chat_id = message.chat.id\n`;
  code += `    \n`;
  code += `    # Определяем целевого пользователя\n`;
  code += `    target_user_id = None\n`;
  code += `    \n`;
  code += `    if message.reply_to_message:\n`;
  code += `        # Если есть ответ на сообщение - используем его\n`;
  code += `        target_user_id = message.reply_to_message.from_user.id\n`;
  code += `        logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для пользователя {target_user_id} (через ответ)")\n`;
  code += `    else:\n`;
  code += `        # Если нет ответа, проверяем текст на наличие ID пользователя\n`;
  code += `        text_parts = message.text.split()\n`;
  code += `        if len(text_parts) > 1 and text_parts[1].isdigit():\n`;
  code += `            target_user_id = int(text_parts[1])\n`;
  code += `            logging.info(f"Пользователь {user_id} использовал команду '${synonym}' для пользователя {target_user_id} (через ID)")\n`;
  code += `        else:\n`;
  code += `            await message.answer("❌ Укажите пользователя: ответьте на сообщение или напишите '${synonym} ID_пользователя'")\n`;
  code += `            return\n`;
  code += `    \n`;
  code += `    if not target_user_id:\n`;
  code += `        await message.answer("❌ Не удалось определить пользователя")\n`;
  code += `        return\n`;
  code += `    \n`;
  // Генерируем код в зависимости от типа узла
  code += `    # Тип текущего узла для логирования\n`;
  code += `    current_node_type = "${node.type}"\n`;
  code += `    try:\n`;
  if (node.type === 'ban_user') {
    const reason = node.data.reason || 'Нарушение правил группы';
    const untilDate = node.data.untilDate || 0;
    
    if (untilDate && untilDate > 0) {
      code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id, until_date=${untilDate})\n`;
      code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован до ${untilDate}\\nПричина: ${reason}")\n`;
    } else {
      code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
      code += `        await message.answer(f"✅ Пользователь {target_user_id} заблокирован навсегда\\nПричина: ${reason}")\n`;
    }
    code += `        logging.info(f"Пользователь {target_user_id} заблокирован администратором {user_id}")\n`;
  } else if (node.type === 'unban_user') {
    code += `        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id, only_if_banned=True)\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} разблокирован")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} разблокирован администратором {user_id}")\n`;
  } else if (node.type === 'kick_user') {
    const reason = node.data.reason || 'Нарушение правил группы';
    code += `        await bot.ban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
    code += `        await bot.unban_chat_member(chat_id=chat_id, user_id=target_user_id)\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} исключен из группы\\nПричина: ${reason}")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} исключен администратором {user_id}")\n`;
  } else if (node.type === 'mute_user') {
    const duration = node.data.duration || 3600;
    const reason = node.data.reason || 'Нарушение правил группы';
    const canSendMessages = node.data.canSendMessages || false;
    const canSendMediaMessages = node.data.canSendMediaMessages || false;
    
    code += `        from datetime import datetime, timedelta\n`;
    code += `        until_date = datetime.now() + timedelta(seconds=${duration})\n`;
    code += `        await bot.restrict_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            permissions=types.ChatPermissions(\n`;
    code += `                can_send_messages=${canSendMessages ? 'True' : 'False'},\n`;
    code += `                can_send_media_messages=${canSendMediaMessages ? 'True' : 'False'}\n`;
    code += `            ), until_date=until_date\n`;
    code += `        )\n`;
    code += `        hours = ${duration} // 3600\n`;
    code += `        minutes = (${duration} % 3600) // 60\n`;
    code += `        time_str = f"{hours}ч {minutes}м" if hours > 0 else f"{minutes}м"\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} ограничен на {time_str}\\nПричина: ${reason}")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} ограничен администратором {user_id}")\n`;
  } else if (node.type === 'unmute_user') {
    code += `        await bot.restrict_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            permissions=types.ChatPermissions(\n`;
    code += `                can_send_messages=True, can_send_media_messages=True,\n`;
    code += `                can_send_polls=True, can_send_other_messages=True,\n`;
    code += `                can_add_web_page_previews=True\n`;
    code += `            )\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Ограничения с пользователя {target_user_id} сняты")\n`;
    code += `        logging.info(f"Ограничения с пользователя {target_user_id} сняты администратором {user_id}")\n`;
  } else if (node.type === 'promote_user') {
    const canDeleteMessages = node.data.canDeleteMessages !== false;
    const canInviteUsers = node.data.canInviteUsers !== false;
    const canPinMessages = node.data.canPinMessages !== false;
    
    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            can_delete_messages=${canDeleteMessages ? 'True' : 'False'},\n`;
    code += `            can_invite_users=${canInviteUsers ? 'True' : 'False'},\n`;
    code += `            can_pin_messages=${canPinMessages ? 'True' : 'False'}\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Пользователь {target_user_id} назначен администратором")\n`;
    code += `        logging.info(f"Пользователь {target_user_id} назначен администратором пользователем {user_id}")\n`;
  } else if (node.type === 'demote_user') {
    code += `        await bot.promote_chat_member(\n`;
    code += `            chat_id=chat_id, user_id=target_user_id,\n`;
    code += `            can_change_info=False, can_delete_messages=False,\n`;
    code += `            can_invite_users=False, can_restrict_members=False,\n`;
    code += `            can_pin_messages=False, can_promote_members=False\n`;
    code += `        )\n`;
    code += `        await message.answer(f"✅ Права администратора сняты с пользователя {target_user_id}")\n`;
    code += `        logging.info(f"Права администратора сняты с пользователя {target_user_id} администратором {user_id}")\n`;
  } else if (node.type === 'admin_rights') {
    // Для admin_rights узлов перенаправляем к callback обработчику
    const safeFunctionName = createSafeFunctionName(node.id);
    code += `        # Создаем Mock callback для эмуляции inline кнопки admin_rights\n`;
    code += `        class MockCallback:\n`;
    code += `            def __init__(self, data, user, msg):\n`;
    code += `                self.data = data\n`;
    code += `                self.from_user = user\n`;
    code += `                self.message = msg\n`;
    code += `            async def answer(self):\n`;
    code += `                pass  # Mock метод, ничего не делаем\n`;
    code += `            async def edit_text(self, text, **kwargs):\n`;
    code += `                try:\n`;
    code += `                    return await self.message.edit_text(text, **kwargs)\n`;
    code += `                except Exception as e:\n`;
    code += `                    logging.warning(f"Не удалось отредактировать сообщение: {e}")\n`;
    code += `                    return await self.message.answer(text, **kwargs)\n`;
    code += `        \n`;
    code += `        mock_callback = MockCallback("${node.id}", message.from_user, message)\n`;
    code += `        # bot уже определен глобально\n`;
    code += `        await handle_callback_${safeFunctionName}(mock_callback, bot)\n`;
    code += `        return  # Завершаем обработку, так как все сделано в callback\n`;
  }
  
  code += `    except TelegramBadRequest as e:\n`;
  code += `        if "not enough rights" in str(e) or "CHAT_ADMIN_REQUIRED" in str(e):\n`;
  code += `            await message.answer("❌ Недостаточно прав для выполнения операции")\n`;
  code += `        else:\n`;
  code += `            await message.answer(f"❌ Ошибка: {e}")\n`;
  code += `        logging.error(f"Ошибка {current_node_type}: {e}")\n`;
  code += `    except Exception as e:\n`;
  code += `        await message.answer("❌ Произошла неожиданная ошибка")\n`;
  code += `        logging.error(f"Неожиданная ошибка в {current_node_type}: {e}")\n`;
  code += `\n`;
  
  return code;
}

function generateSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const originalCommand = node.data.command || (node.type === 'start' ? '/start' : '/help');
  const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
  code += `async def ${functionName}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    # Синоним для команды ${originalCommand}\n`;
  
  if (node.type === 'start') {
    code += '    await start_handler(message)\n';
  } else {
    code += `    await ${functionName}_handler(message)\n`;
  }
  
  return code;
}

function generateMessageSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const sanitizedNodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
  code += `async def message_${sanitizedNodeId}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    # Синоним для сообщения ${node.id}\n`;
  code += `    user_id = message.from_user.id\n`;
  code += `    logging.info(f"Пользователь {user_id} написал синоним '${synonym}' для узла ${node.id}")\n`;
  code += `    \n`;
  code += `    # Обрабатываем синоним как переход к узлу ${node.id}\n`;
  code += `    # Создаем Mock callback для эмуляции кнопки\n`;
  code += `    class MockCallback:\n`;
  code += `        def __init__(self, data, user, msg):\n`;
  code += `            self.data = data\n`;
  code += `            self.from_user = user\n`;
  code += `            self.message = msg\n`;
  code += `        async def answer(self):\n`;
  code += `            pass  # Mock метод, ничего не делаем\n`;
  code += `        async def edit_text(self, text, **kwargs):\n`;
  code += `            try:\n`;
  code += `                return await self.message.edit_text(text, **kwargs)\n`;
  code += `            except Exception as e:\n`;
  code += `                logging.warning(f"Не удалось отредактировать сообщение: {e}")\n`;
  code += `                return await self.message.answer(text, **kwargs)\n`;
  code += `    \n`;
  code += `    mock_callback = MockCallback("${node.id}", message.from_user, message)\n`;
  code += `    await handle_callback_${sanitizedNodeId}(mock_callback)\n`;
  
  return code;
}

function generateKeyboard(node: Node): string {
  let code = '';
  
  // Определяем режим форматирования в начале
  const hasConditionalMessages = node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0;
  
  // Определяем отступ в зависимости от наличия условных сообщений
  const indent3 = hasConditionalMessages ? '        ' : '    ';
  
  // Добавляем поддержку условных сообщений для клавиатуры
  if (hasConditionalMessages) {
    code += generateUniversalVariableReplacement('    ');
    code += '    text = replace_variables_in_text(text, user_vars)\n';
    code += '    \n';
    code += '    # Проверка условных сообщений для клавиатуры\n';
    code += '    user_record = await get_user_from_db(user_id)\n';
    code += '    if not user_record:\n';
    code += '        user_record = user_data.get(user_id, {})\n';
    code += '    user_data_dict = user_record if user_record else user_data.get(user_id, {})\n';
    code += generateConditionalMessageLogic(node.data.conditionalMessages, '    ');
    code += '    \n';
    
    // Use conditional message if available, otherwise use default text
    code += '    # Используем условное сообщение если есть подходящее условие\n';
    code += '    if "text" not in locals():\n';
    code += '        # Используем исходный текст клавиатуры если условие не сработало\n';
    code += '        pass  # text уже установлен выше\n';
    code += '    \n';
    code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
    code += '    use_conditional_keyboard = conditional_keyboard is not None\n';
  }
  
  // Генерируем parseMode строку для использования в коде
  let parseMode = '';
  
  if (hasConditionalMessages) {
    // Для узлов с условными сообщениями - проверяем приоритет условного режима
    code += '    # Определяем режим форматирования (приоритет у условного сообщения)\n';
    code += '    if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:\n';
    code += '        current_parse_mode = conditional_parse_mode\n';
    code += '    else:\n';
    if (node.data.formatMode === 'markdown' || node.data.markdown === true) {
      code += '        current_parse_mode = ParseMode.MARKDOWN\n';
    } else if (node.data.formatMode === 'html') {
      code += '        current_parse_mode = ParseMode.HTML\n';
    } else {
      code += '        current_parse_mode = None\n';
    }
    
    // Для узлов с условными сообщениями используем current_parse_mode
    if (node.data.formatMode === 'markdown' || node.data.markdown === true || node.data.formatMode === 'html') {
      parseMode = ', parse_mode=current_parse_mode';
    } else {
      parseMode = ', parse_mode=current_parse_mode if current_parse_mode else None';
    }
  } else {
    // Для узлов без условных сообщений - используем прямые значения ParseMode
    if (node.data.formatMode === 'markdown' || node.data.markdown === true) {
      parseMode = ', parse_mode=ParseMode.MARKDOWN';
    } else if (node.data.formatMode === 'html') {
      parseMode = ', parse_mode=ParseMode.HTML';
    } else {
      parseMode = '';
    }
  }

  // НОВАЯ ЛОГИКА: Сбор ввода как дополнительная функциональность к обычным кнопкам
  
  // Определяем есть ли обычные кнопки у узла
  const hasRegularButtons = node.data.keyboardType !== "none" && node.data.buttons && node.data.buttons.length > 0;
  
  // Определяем включен ли сбор пользовательского ввода ИЛИ текстовый/медиа ввод
  const hasInputCollection = node.data.collectUserInput === true || node.data.enableTextInput === true || 
                             node.data.enablePhotoInput === true || node.data.enableVideoInput === true || 
                             node.data.enableAudioInput === true || node.data.enableDocumentInput === true;
  
  // Добавляем логирование для отладки (используем Python переменные)
  code += `    has_regular_buttons = ${toPythonBoolean(hasRegularButtons)}\n`;
  code += `    has_input_collection = ${toPythonBoolean(hasInputCollection)}\n`;
  code += `    logging.info(f"DEBUG: generateKeyboard для узла ${node.id} - hasRegularButtons={has_regular_buttons}, hasInputCollection={has_input_collection}, collectUserInput=${node.data.collectUserInput}, enableTextInput=${node.data.enableTextInput}, enablePhotoInput=${node.data.enablePhotoInput}, enableVideoInput=${node.data.enableVideoInput}, enableAudioInput=${node.data.enableAudioInput}, enableDocumentInput=${node.data.enableDocumentInput}")\n`;
  
  // CASE 1: Есть обычные кнопки + сбор ввода = обычные кнопки работают + дополнительно сохраняются как ответы
  if (hasRegularButtons && hasInputCollection) {
    // Проверяем условную клавиатуру только если есть условные сообщения
    if (hasConditionalMessages) {
      code += '    \n';
      code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
      code += '    if use_conditional_keyboard:\n';
      code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
      code += '    else:\n';
      code += '        # Отправляем обычные кнопки если условной клавиатуры нет\n';
    }
    
    const indent4 = hasConditionalMessages ? '        ' : '    ';
    
    // Отправляем обычные кнопки как обычно (используем правильный отступ)
    if (node.data.keyboardType === "reply") {
      code += `${indent4}# Создаем reply клавиатуру (+ дополнительный сбор ответов включен)\n`;
      code += `${indent4}builder = ReplyKeyboardBuilder()\n`;
      node.data.buttons.forEach(button => {
        if (button.action === "contact" && button.requestContact) {
          code += `${indent4}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
        } else if (button.action === "location" && button.requestLocation) {
          code += `${indent4}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
        } else {
          code += `${indent4}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
        }
      });
      
      const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
      const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
      code += `${indent4}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
      code += `${indent4}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      
    } else if (node.data.keyboardType === "inline") {
      code += `${indent4}# Создаем inline клавиатуру (+ дополнительный сбор ответов включен)\n`;
      code += `${indent4}builder = InlineKeyboardBuilder()\n`;
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `${indent4}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `${indent4}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
        } else if (button.action === 'command') {
          const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
          code += `${indent4}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
        }
      });
      
      code += `${indent4}builder.adjust(2)  # Используем 2 колонки для консистентности\n`;
      code += `${indent4}keyboard = builder.as_markup()\n`;
      code += `${indent4}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
    }
    
    // Закрываем блок else если были условные сообщения
    if (hasConditionalMessages) {
      code += '    \n';
    }
    
    // Дополнительно настраиваем сбор ответов с полной структурой ожидания ввода
    code += '    \n';
    code += '    # Дополнительно: настраиваем полную структуру ожидания ввода для узла с кнопками\n';
    code += generateWaitingStateCode(node, '    ');
    
    return code;
  }
  
  // CASE 2: Только сбор ввода БЕЗ обычных кнопок = специальные кнопки для сбора или текстовый ввод
  else if (!hasRegularButtons && hasInputCollection) {
    
    // Если настроены специальные кнопки ответа
    if (node.data.responseType === 'buttons' && node.data.responseOptions && node.data.responseOptions.length > 0) {
      const buttonType = node.data.inputButtonType || 'inline';
      
      if (buttonType === 'reply') {
        code += '    \n';
        code += '    # Создаем reply клавиатуру для сбора ответов\n';
        code += '    builder = ReplyKeyboardBuilder()\n';
        node.data.responseOptions.forEach(option => {
          code += `    builder.add(KeyboardButton(text="${option.text}"))\n`;
        });
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
        code += `    await message.answer(text, reply_markup=keyboard${parseMode})\n`;
        
      } else {
        // inline кнопки для сбора ответов
        code += '    \n';
        code += '    # Создаем inline клавиатуру для сбора ответов\n';
        code += '    builder = InlineKeyboardBuilder()\n';
        node.data.responseOptions.forEach(option => {
          const callbackData = `input_${node.id}_${option.id}`;
          code += `    builder.add(InlineKeyboardButton(text="${option.text}", callback_data="${callbackData}"))\n`;
        });
        
        // Автоматическое распределение колонок
        const columns = calculateOptimalColumns(node.data.responseOptions, node.data);
        code += `    builder.adjust(${columns})\n`;
        code += '    keyboard = builder.as_markup()\n';
        code += `    await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      }
      
    } else {
      // Текстовый ввод - проверяем условную клавиатуру только если есть условные сообщения
      if (hasConditionalMessages) {
        code += '    \n';
        code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
        code += '    if use_conditional_keyboard:\n';
        code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
        code += '    else:\n';
        code += `        await message.answer(text${parseMode})\n`;
      } else {
        code += '    \n';
        code += `    await message.answer(text${parseMode})\n`;
      }
    }
    
    // Устанавливаем состояние ожидания ввода
    code += '    \n';
    code += '    # Устанавливаем состояние ожидания ввода с полной структурой\n';
    code += generateWaitingStateCode(node, '    ');
    
    return code;
  }
  
  // CASE 3: Только обычные кнопки БЕЗ сбора ввода = работает как раньше
  else {
    code += `    # DEBUG: Узел ${node.id} - hasRegularButtons=${toPythonBoolean(hasRegularButtons)}, hasInputCollection=${toPythonBoolean(hasInputCollection)}\n`;
    code += `    logging.info(f"DEBUG: Узел ${node.id} обработка кнопок - keyboardType=${node.data.keyboardType}, buttons=${node.data.buttons ? node.data.buttons.length : 0}")\n`;
    
    // Проверяем условную клавиатуру только если есть условные сообщения
    if (hasConditionalMessages) {
      code += '    \n';
      code += '    # Проверяем, нужно ли использовать условную клавиатуру\n';
      code += '    if use_conditional_keyboard:\n';
      code += '        await message.answer(text, reply_markup=conditional_keyboard, parse_mode=current_parse_mode if current_parse_mode else None)\n';
      code += '        return  # Возвращаемся чтобы не отправлять сообщение дважды\n';
      code += '    \n';
    }
    
    if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
      // Проверяем, есть ли множественный выбор
      if (node.data.allowMultipleSelection) {
        code += `${indent3}# Создаем reply клавиатуру с поддержкой множественного выбора\n`;
        code += `${indent3}builder = ReplyKeyboardBuilder()\n`;
        
        // Разделяем кнопки на опции выбора и обычные кнопки
        const selectionButtons = node.data.buttons.filter(button => button.action === 'selection');
        const regularButtons = node.data.buttons.filter(button => button.action !== 'selection');
        
        // Добавляем кнопки для множественного выбора
        selectionButtons.forEach(button => {
          code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
        });
        
        // Добавляем обычные кнопки
        regularButtons.forEach(button => {
          if (button.action === "contact" && button.requestContact) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
          } else if (button.action === "location" && button.requestLocation) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
          } else {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
          }
        });
        
        // Добавляем кнопку завершения, если есть опции выбора
        if (selectionButtons.length > 0) {
          const continueText = node.data.continueButtonText || 'Готово';
          code += `${indent3}builder.add(KeyboardButton(text="${continueText}"))\n`;
        }
        
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `${indent3}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
        code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
        
        // Инициализируем состояние множественного выбора
        if (selectionButtons.length > 0) {
          code += `${indent3}\n`;
          code += `${indent3}# Инициализируем состояние множественного выбора\n`;
          code += `${indent3}user_data[message.from_user.id] = user_data.get(message.from_user.id, {})\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_${node.id}"] = []\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_node"] = "${node.id}"\n`;
          code += `${indent3}user_data[message.from_user.id]["multi_select_type"] = "reply"\n`;
        }
      } else {
        // Обычная reply клавиатура
        code += `${indent3}builder = ReplyKeyboardBuilder()\n`;
        node.data.buttons.forEach((button: Button) => {
          if (button.action === "contact" && button.requestContact) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
          } else if (button.action === "location" && button.requestLocation) {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
          } else {
            code += `${indent3}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
          }
        });
        
        const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
        const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
        code += `${indent3}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
        code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      }
    } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      // Проверяем, есть ли множественный выбор
      if (node.data.allowMultipleSelection) {
        // Добавляем универсальную функцию замены переменных для доступа к user_vars
        code += generateUniversalVariableReplacement(indent3);
        
        // Добавляем логику загрузки ранее выбранных интересов
        const multiSelectVariable = node.data.multiSelectVariable || 'user_interests';
        
        code += `${indent3}# Загружаем ранее выбранные интересы из базы данных для восстановления состояния\n`;
        code += `${indent3}if user_id not in user_data:\n`;
        code += `${indent3}    user_data[user_id] = {}\n`;
        code += `${indent3}\n`;
        code += `${indent3}# Получаем сохраненные интересы из базы данных\n`;
        code += `${indent3}saved_interests = []\n`;
        code += `${indent3}if user_vars:\n`;
        code += `${indent3}    # Ищем интересы в любой переменной, которая может их содержать\n`;
        code += `${indent3}    for var_name, var_data in user_vars.items():\n`;
        code += `${indent3}        if "интерес" in var_name.lower() or var_name == "interests" or var_name == "${multiSelectVariable}":\n`;
        code += `${indent3}            if isinstance(var_data, dict) and "value" in var_data:\n`;
        code += `${indent3}                interests_str = var_data["value"]\n`;
        code += `${indent3}            elif isinstance(var_data, str):\n`;
        code += `${indent3}                interests_str = var_data\n`;
        code += `${indent3}            else:\n`;
        code += `${indent3}                interests_str = str(var_data) if var_data else ""\n`;
        code += `${indent3}            \n`;
        code += `${indent3}            if interests_str:\n`;
        code += `${indent3}                saved_interests = [interest.strip() for interest in interests_str.split(",")]\n`;
        code += `${indent3}                logging.info(f"Восстановлены интересы из БД: {saved_interests}")\n`;
        code += `${indent3}                break\n`;
        code += `${indent3}\n`;
        code += `${indent3}# Инициализируем состояние множественного выбора с сохраненными интересами\n`;
        code += `${indent3}user_data[user_id]["multi_select_${node.id}"] = saved_interests.copy()\n`;
        code += `${indent3}user_data[user_id]["multi_select_node"] = "${node.id}"\n`;
        code += `${indent3}logging.info(f"Инициализировано состояние множественного выбора с {len(saved_interests)} интересами")\n`;
        code += `${indent3}\n`;
        
        code += `${indent3}# Создаем inline клавиатуру с поддержкой множественного выбора\n`;
        code += `${indent3}builder = InlineKeyboardBuilder()\n`;
        
        // Разделяем кнопки на опции выбора и обычные кнопки
        const selectionButtons = node.data.buttons.filter(button => button.action === 'selection');
        const regularButtons = node.data.buttons.filter(button => button.action !== 'selection');
        
        // Добавляем кнопки для множественного выбора с логикой галочек
        selectionButtons.forEach(button => {
          const buttonValue = button.target || button.id || button.text;
          const safeVarName = buttonValue.toLowerCase().replace(/[^a-z0-9]/g, '_');
          code += `${indent3}# Проверяем каждый интерес и добавляем галочку если он выбран\n`;
          code += `${indent3}logging.info(f"🔧 /START: Проверяем галочку для кнопки '${button.text}' в списке: {saved_interests}")\n`;
          code += `${indent3}${safeVarName}_selected = "${button.text}" in saved_interests\n`;
          code += `${indent3}logging.info(f"🔍 /START: РЕЗУЛЬТАТ для '${button.text}': selected={${safeVarName}_selected}")\n`;
          code += `${indent3}${safeVarName}_text = "✅ ${button.text}" if ${safeVarName}_selected else "${button.text}"\n`;
          code += `${indent3}logging.info(f"📱 /START: СОЗДАЕМ КНОПКУ: text='{${safeVarName}_text}'")\n`;
          code += `${indent3}builder.add(InlineKeyboardButton(text=${safeVarName}_text, callback_data="multi_select_start_${buttonValue}"))\n`;
        });
        
        // Добавляем обычные кнопки
        regularButtons.forEach((button: Button) => {
          if (button.action === "url") {
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
          } else if (button.action === 'goto') {
            const callbackData = button.target || button.id || 'no_action';
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
          } else if (button.action === 'command') {
            const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
          }
        });
        code += `${indent3}\n`;
        
        // Добавляем кнопку завершения, если есть опции выбора
        if (selectionButtons.length > 0) {
          const continueText = node.data.continueButtonText || 'Готово';
          code += `${indent3}builder.add(InlineKeyboardButton(text="${continueText}", callback_data="multi_select_done_${node.id}"))\n`;
        }
        
        // Автоматическое распределение колонок
        // Для множественного выбора учитываем все кнопки: селекции + регулярные + "Готово"
        const allButtons: Button[] = [...selectionButtons, ...regularButtons];
        if (selectionButtons.length > 0) {
          allButtons.push({ 
            id: `continue_${node.id}`, 
            text: node.data.continueButtonText || 'Готово',
            action: 'goto',
            buttonType: 'complete',
            skipDataCollection: false
          });
        }
        const columns = calculateOptimalColumns(allButtons, node.data);
        code += `${indent3}builder.adjust(${columns})\n`;
        code += `${indent3}keyboard = builder.as_markup()\n`;
        code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
        
        // Состояние множественного выбора уже инициализировано выше с сохраненными значениями
      } else {
        // Обычная inline клавиатура
        code += `${indent3}# Создаем inline клавиатуру с кнопками\n`;
        code += `${indent3}logging.info(f"DEBUG: Создаем inline клавиатуру для узла ${node.id} с ${node.data.buttons ? node.data.buttons.length : 0} кнопками")\n`;
        code += `${indent3}builder = InlineKeyboardBuilder()\n`;
        node.data.buttons.forEach((button: Button) => {
          if (button.action === "url") {
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
          } else if (button.action === 'goto') {
            // Если есть target, используем его, иначе используем ID кнопки как callback_data
            const callbackData = button.target || button.id || 'no_action';
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
          } else if (button.action === 'command') {
            // Для кнопок команд создаем специальную callback_data
            const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
            code += `${indent3}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
          }
        });
        
        // Автоматическое распределение колонок
        const columns = calculateOptimalColumns(node.data.buttons, node.data);
        code += `${indent3}builder.adjust(${columns})\n`;
        code += `${indent3}keyboard = builder.as_markup()\n`;
        code += `${indent3}await message.answer(text, reply_markup=keyboard${parseMode})\n`;
      }
    } else {
      // Без клавиатуры
      code += `${indent3}await message.answer(text${parseMode})\n`;
    }
  }
  
  return code;
}

export function validateBotStructure(botData: BotData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { nodes, connections } = extractNodesAndConnections(botData);

  // Check if there's a start node
  const startNodes = (nodes || []).filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push("Бот должен содержать хотя бы одну стартовую команду");
  }
  if (startNodes.length > 1) {
    errors.push("Бот может содержать только одну стартовую команду");
  }

  // Validate each node
  nodes.forEach(node => {
    // Пропускаем валидацию для стартовых узлов без команды
    if (node.type === 'start' && !node.data.command) {
      return; // это просто стартовый узел, не требуется команда
    }

    // Для узлов command требуем текст, для остальных это опционально
    if (!node.data.messageText && node.type === 'command') {
      errors.push(`Узел "${node.id}" должен содержать текст сообщения`);
    }

    // Validate commands
    if ((node.type === 'start' || node.type === 'command') && node.data.command) {
      const commandValidation = validateCommand(node.data.command);
      if (!commandValidation.isValid) {
        errors.push(...commandValidation.errors.map(err => `Команда "${node.data.command}": ${err}`));
      }
    }

    // Валидация кнопок
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      node.data.buttons.forEach(button => {
        if (!button.text.trim()) {
          errors.push(`Кнопка в узле "${node.id}" должна содержать текст`);
        }
        if (button.action === 'url' && !button.url) {
          errors.push(`Кнопка "${button.text}" должна содержать URL`);
        }
        // Проверка цели перехода для кнопок с действием goto опциональна
        // Кнопка может работать без целевого узла
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCommand(command: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!command) {
    errors.push('Команда не может быть пустой');
    return { isValid: false, errors };
  }
  
  if (!command.startsWith('/')) {
    errors.push('Команда должна начинаться с символа "/"');
  }
  
  if (command.length < 2) {
    errors.push('Команда должна содержать хотя бы один символ после "/"');
  }
  
  if (command.length > 32) {
    errors.push('Команда не может быть длиннее 32 символов');
  }
  
  // Проверка на допустимые символы
  const validPattern = /^\/[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!validPattern.test(command)) {
    errors.push('Команда может содержать только латинские буквы, цифры и подчёркивания');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function generateRequirementsTxt(): string {
  const lines = [
    '# Telegram Bot Requirements - Updated compatible versions',
    '# Install with: pip install -r requirements.txt',
    '# If you get Rust compilation errors, use: pip install --only-binary=all -r requirements.txt',
    '',
    '# Core dependencies (using newer versions to avoid Rust compilation issues)',
    'aiogram>=3.21.0',
    'aiohttp>=3.12.13',
    'requests>=2.32.4',
    'python-dotenv>=1.0.0',
    'aiofiles>=23.2.1',
    'asyncpg>=0.29.0',
    '',
    '# Note: These versions have pre-compiled wheels and do not require Rust',
    '# If you still encounter issues, try:',
    '# pip install --upgrade pip setuptools wheel',
    '# pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles asyncpg',
    '',
    '# Optional dependencies for extended functionality',
    '# redis>=5.0.1  # For session storage',
    '# motor>=3.3.2  # For MongoDB',
    '# pillow>=10.1.0  # For image processing'
  ];
  return lines.join('\n');
}

export function generateReadme(botData: BotData, botName: string): string {
  const nodes = botData?.nodes || [];
  const connections = botData?.connections || [];
  const commandNodes = nodes.filter(node => 
    (node.type === 'start' || node.type === 'command') && node.data?.command
  );
  
  let readme = '# ' + botName + '\n\n';
  readme += 'Telegram бот, созданный с помощью TelegramBot Builder.\n\n';
  readme += '## Описание\n\n';
  readme += 'Этот бот содержит ' + nodes.length + ' узлов и ' + connections.length + ' соединений.\n\n';
  readme += '### Команды бота\n\n';

  commandNodes.forEach(node => {
    const command = node.data.command || '/unknown';
    const description = node.data.description || 'Описание отсутствует';
    readme += '- `' + command + '` - ' + description + '\n';
    
    if (node.data.adminOnly) {
      readme += '  - 🔒 Только для администраторов\n';
    }
    if (node.data.isPrivateOnly) {
      readme += '  - 👤 Только в приватных чатах\n';
    }
    if (node.data.requiresAuth) {
      readme += '  - 🔐 Требует авторизации\n';
    }
  });

  readme += '\n## Установка\n\n';
  readme += '1. Клонируйте или скачайте файлы проекта\n';
  readme += '2. Установите зависимости:\n';
  readme += '   ```bash\n';
  readme += '   pip install -r requirements.txt\n';
  readme += '   ```\n\n';
  readme += '3. Создайте файл `.env` и добавьте настройки:\n';
  readme += '   ```\n';
  readme += '   BOT_TOKEN=your_bot_token_here\n';
  readme += '   DATABASE_URL=postgresql://user:password@localhost:5432/bot_db\n';
  readme += '   ```\n\n';
  readme += '4. Настройте базу данных PostgreSQL (опционально):\n';
  readme += '   - Создайте базу данных PostgreSQL\n';
  readme += '   - Обновите DATABASE_URL в .env файле\n';
  readme += '   - Бот автоматически создаст необходимые таблицы при запуске\n';
  readme += '   - Если БД недоступна, бот будет использовать локальное хранилище\n\n';
  readme += '5. Запустите бота:\n';
  readme += '   ```bash\n';
  readme += '   python bot.py\n';
  readme += '   ```\n\n';
  
  readme += '## Настройка\n\n';
  readme += '### Получение токена бота\n\n';
  readme += '1. Найдите [@BotFather](https://t.me/BotFather) в Telegram\n';
  readme += '2. Отправьте команду `/newbot`\n';
  readme += '3. Следуйте инструкциям для создания нового бота\n';
  readme += '4. Скопируйте полученный токен\n\n';
  
  readme += '### Настройка команд в @BotFather\n\n';
  readme += '1. Отправьте команду `/setcommands` в @BotFather\n';
  readme += '2. Выберите своего бота\n';
  readme += '3. Скопируйте и отправьте следующие команды:\n\n';
  readme += '```\n';
  const botFatherCommands = generateBotFatherCommands(nodes);
  readme += botFatherCommands || '';
  readme += '\n```\n\n';
  
  readme += '## Структура проекта\n\n';
  readme += '- `bot.py` - Основной файл бота\n';
  readme += '- `requirements.txt` - Зависимости Python\n';
  readme += '- `config.yaml` - Конфигурационный файл\n';
  readme += '- `README.md` - Документация\n';
  readme += '- `Dockerfile` - Для контейнеризации (опционально)\n\n';
  
  readme += '## Функциональность\n\n';
  readme += '### Статистика\n\n';
  readme += '- **Всего узлов**: ' + nodes.length + '\n';
  readme += '- **Команд**: ' + commandNodes.length + '\n';
  readme += '- **Сообщений**: ' + nodes.filter(n => n.type === 'message').length + '\n';
  readme += '- **Фото**: ' + nodes.filter(n => n.type === 'photo').length + '\n';
  readme += '- **Кнопок**: ' + (nodes.reduce((sum: number, node: any) => sum + (node.data?.buttons?.length || 0), 0) as number) + '\n\n';
  
  readme += '### Безопасность\n\n';
  readme += 'Бот включает следующие функции безопасности:\n';
  readme += '- Проверка администраторских прав\n';
  readme += '- Ограничения на приватные чаты\n';
  readme += '- Система авторизации пользователей\n\n';
  
  readme += '## Разработка\n\n';
  readme += 'Этот бот создан с использованием:\n';
  readme += '- [aiogram 3.x](https://docs.aiogram.dev/) - современная библиотека для Telegram Bot API\n';
  readme += '- Python 3.8+\n';
  readme += '- Асинхронное программирование\n\n';
  
  readme += '## Лицензия\n\n';
  readme += 'Сгенерировано с помощью TelegramBot Builder\n';

  return readme;
}

export function generateDockerfile(): string {
  const lines = [
    '# Dockerfile для Telegram бота',
    'FROM python:3.11-slim',
    '',
    '# Установка системных зависимостей',
    'RUN apt-get update && apt-get install -y \\',
    '    gcc \\',
    '    && rm -rf /var/lib/apt/lists/*',
    '',
    '# Создание рабочей директории',
    'WORKDIR /app',
    '',
    '# Копирование requirements.txt и установка зависимостей',
    'COPY requirements.txt .',
    'RUN pip install --no-cache-dir -r requirements.txt',
    '',
    '# Копирование исходного кода',
    'COPY . .',
    '',
    '# Создание пользователя для безопасности',
    'RUN adduser --disabled-password --gecos \'\' botuser',
    'RUN chown -R botuser:botuser /app',
    'USER botuser',
    '',
    '# Запуск бота',
    'CMD ["python", "bot.py"]'
  ];
  return lines.join('\n');
}

export function generateConfigYaml(botName: string): string {
  const lines = [
    '# Конфигурация бота',
    'bot:',
    '  name: "' + botName + '"',
    '  description: "Telegram бот, созданный с помощью TelegramBot Builder"',
    '',
    '# Настройки логирования',
    'logging:',
    '  level: INFO',
    '  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"',
    '',
    '# Настройки базы данных (опционально)',
    'database:',
    '  # type: sqlite',
    '  # url: "sqlite:///bot.db"',
    '',
    '  # type: postgresql',
    '  # host: localhost',
    '  # port: 5432',
    '  # name: botdb',
    '  # user: botuser',
    '  # password: botpass',
    '',
    '# Настройки Redis (опционально)',
    'redis:',
    '  # host: localhost',
    '  # port: 6379',
    '  # db: 0',
    '  # password: ""',
    '',
    '# Настройки webhook (для продакшена)',
    'webhook:',
    '  # enabled: false',
    '  # host: "0.0.0.0"',
    '  # port: 8080',
    '  # path: "/webhook"',
    '  # url: "https://yourdomain.com/webhook"',
    '',
    '# Настройки администраторов',
    'admins:',
    '  - 123456789  # Замените на реальные Telegram ID администраторов',
    '',
    '# Дополнительные настройки',
    'settings:',
    '  timezone: "UTC"',
    '  language: "ru"',
    '  debug: false'
  ];
  return lines.join('\n');
}

// Типы для карты кода
export interface CodeNodeRange {
  nodeId: string;
  startLine: number;
  endLine: number;
}

export interface CodeWithMap {
  code: string;
  nodeMap: CodeNodeRange[];
}

// Функция для парсинга маркеров и создания карты кода
export function parseCodeMap(code: string): CodeWithMap {
  const lines = code.split('\n');
  const nodeMap: CodeNodeRange[] = [];
  const stack: Array<{ nodeId: string; startLine: number }> = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Проверяем маркер начала
    const startMatch = line.match(/# @@NODE_START:(.+?)@@/);
    if (startMatch) {
      const nodeId = startMatch[1];
      stack.push({ nodeId, startLine: lineNumber });
      return;
    }
    
    // Проверяем маркер конца
    const endMatch = line.match(/# @@NODE_END:(.+?)@@/);
    if (endMatch) {
      const nodeId = endMatch[1];
      const startInfo = stack.pop();
      
      if (startInfo && startInfo.nodeId === nodeId) {
        nodeMap.push({
          nodeId,
          startLine: startInfo.startLine,
          endLine: lineNumber
        });
      }
    }
  });
  
  return { code, nodeMap };
}

// Функция для удаления маркеров из кода (опционально)
export function removeCodeMarkers(code: string): string {
  return code.replace(/# @@NODE_(START|END):.+?@@\n/g, '');
}

// Обновленная функция генерации с картой
export function generatePythonCodeWithMap(
  botData: BotData, 
  botName: string = "MyBot", 
  groups: BotGroup[] = []
): CodeWithMap {
  const code = generatePythonCode(botData, botName, groups);
  return parseCodeMap(code);
}