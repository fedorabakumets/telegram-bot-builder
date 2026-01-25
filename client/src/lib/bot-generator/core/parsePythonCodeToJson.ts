import { Node } from '@shared/schema';
import { Button, ButtonSchema } from './bot-generator';

// Функция для парсинга Python кода обратно в JSON (улучшенная версия)

export function parsePythonCodeToJson(pythonCode: string): { nodes: Node[]; connections: any[]; } {
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
    const buttons: Button[] = [];
    const inlineButtonMatches = Array.from(nodeContent.matchAll(/InlineKeyboardButton\s*\(\s*text\s*=\s*([^,]+)\s*,\s*callback_data\s*=\s*"([^"]+)"\s*\)/g));
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
      } as Button);
    }

    // Извлекаем Reply кнопки
    const replyButtonMatches = Array.from(nodeContent.matchAll(/KeyboardButton\s*\(\s*text\s*=\s*([^)]+)\s*\)/g));
    for (const btnMatch of replyButtonMatches) {
      let btnText = btnMatch[1].replace(/["'`]/g, '').trim();
      // Убираем функции типа replace_variables_in_text
      if (btnText.includes('(')) {
        const innerMatch = /\("([^"]+)"\)/.exec(btnText);
        if (innerMatch) {
          btnText = innerMatch[1];
        }
      }
      if (!buttons.find((b: Button) => b.text === btnText)) {
        buttons.push({
          id: `btn_${nodeId}_${buttons.length}`,
          text: btnText,
          action: 'default',
          buttonType: 'normal',
          skipDataCollection: false,
          hideAfterClick: false
        } as Button);
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
        keyboardType: (keyboardType === 'reply' || keyboardType === 'inline' || keyboardType === 'none') ? keyboardType : 'none',
        buttons: buttons,
        showInMenu: (nodeType === 'start' || nodeType === 'command') && !nodeContent.includes('showInMenu=False'),
        command: command,
        description: description,
        allowMultipleSelection: nodeContent.includes('allowMultipleSelection=True'),
        formatMode: nodeContent.includes('parse_mode=ParseMode.HTML') ? 'html' :
          nodeContent.includes('parse_mode=ParseMode.MARKDOWN') ? 'markdown' : 'none',
        enablePhotoInput: nodeContent.includes('enablePhotoInput'),
        enableVideoInput: nodeContent.includes('enableVideoInput'),
        enableAudioInput: nodeContent.includes('enableAudioInput'),
        enableDocumentInput: nodeContent.includes('enableDocumentInput'),
        waitForTextInput: waitForTextInput,
        inputVariable: inputVariable,
        collectUserInput: collectUserInput,
        conditionalMessages: [],
        synonyms: [],
        attachedMedia: [],
        // Добавляем недостающие поля для совместимости со схемой
        options: [],
        markdown: false,
        oneTimeKeyboard: false,
        resizeKeyboard: true,
        enableTextInput: collectUserInput,
        responseType: 'text' as const,
        responseOptions: [],
        // Дополнительные настройки безопасности
        isPrivateOnly: false,
        adminOnly: false,
        requiresAuth: false,
        enableStatistics: true,
        customParameters: [],
        // Настройки для различных типов ввода
        inputType: 'text' as const,
        allowsMultipleAnswers: false,
        anonymousVoting: true,
        inputRequired: true,
        enableConditionalMessages: false,
        fallbackMessage: undefined,
        saveToDatabase: false,
        allowSkip: false,
        inputTargetNodeId: undefined,
        inputButtonType: 'inline' as const,
        enableAutoTransition: false,
        enableUserActions: false,
        silentAction: false,
        // Настройки медиа
        disableNotification: false,
        mapService: 'custom' as const,
        mapZoom: 15,
        showDirections: false,
        generateMapPreview: true,
        // Источники ID для различных операций
        messageIdSource: 'last_message' as const,
        userIdSource: 'last_message' as const,
        adminUserIdSource: 'last_message' as const,
        adminChatIdSource: 'current_chat' as const,
        // Настройки прав администратора
        canChangeInfo: false,
        canDeleteMessages: false,
        canBanUsers: false,
        canInviteUsers: false,
        canPinMessages: false,
        canAddAdmins: false,
        canRestrictMembers: false,
        canPromoteMembers: false,
        canManageVideoChats: false,
        canManageTopics: false,
        isAnonymous: false,
        // Ограничения для пользователей
        canSendMessages: true,
        canSendMediaMessages: true,
        canSendPolls: true,
        canSendOtherMessages: true,
        canAddWebPagePreviews: true,
        canChangeGroupInfo: true,
        canInviteUsers2: true,
        canPinMessages2: true,
        // Права администратора согласно Telegram Bot API
        can_manage_chat: false,
        can_post_messages: false,
        can_edit_messages: false,
        can_delete_messages: false,
        can_post_stories: false,
        can_edit_stories: false,
        can_delete_stories: false,
        can_manage_video_chats: false,
        can_restrict_members: false,
        can_promote_members: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
        can_manage_topics: false,
        is_anonymous: false
      }
    };

    nodes.push(node);
    nodeIdMap.set(nodeId, node);
    xPosition += 280;
  }

  // Восстанавливаем connections на основе кнопок и контекста
  const connections: any[] = [];
  const addedConnections = new Set<string>();

  nodes.forEach((node: Node) => {
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      node.data.buttons.forEach((button: ButtonSchema) => {
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
