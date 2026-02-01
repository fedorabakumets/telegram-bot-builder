import { nanoid } from 'nanoid';
import { CanvasSheet, BotDataWithSheets, BotData, Node, Connection } from '@shared/schema';

export class SheetsManager {
  
  // Миграция старых данных к новому формату с листами
  static migrateLegacyData(legacyData: BotData): BotDataWithSheets {
    // Если нет узлов, создаем стартовый узел по умолчанию
    const hasNodes = legacyData.nodes && legacyData.nodes.length > 0;
    const nodes = hasNodes ? legacyData.nodes : [{
      id: 'start',
      type: 'start' as const,
      position: { x: 100, y: 100 },
      data: {
        messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
        keyboardType: 'none' as const,
        buttons: [],
        resizeKeyboard: true,
        oneTimeKeyboard: false,
        markdown: false,
        formatMode: 'none' as const,
        synonyms: [],
        isPrivateOnly: false,
        adminOnly: false,
        requiresAuth: false,
        showInMenu: true,
        enableStatistics: true,
        customParameters: [],
        options: [],
        command: '/start',
        description: 'Запустить бота',
        // Добавляем все остальные возможные поля, чтобы соответствовать схеме
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
        is_anonymous: false,
        adminChatId: undefined,
        adminChatIdSource: 'current_chat',
        adminChatVariableName: undefined,
        attachedMedia: [],
        text: undefined,
        action: undefined,
        waitForTextInput: undefined,
        messageIdSource: 'last_message',
        disableNotification: false,
        userIdSource: 'last_message',
        mapService: 'custom',
        yandexMapUrl: undefined,
        googleMapUrl: undefined,
        gisMapUrl: undefined,
        mapZoom: 15,
        showDirections: false,
        generateMapPreview: true,
        phoneNumber: undefined,
        firstName: undefined,
        lastName: undefined,
        userId: undefined,
        vcard: undefined,
        question: undefined,
        allowsMultipleAnswers: false,
        anonymousVoting: true,
        emoji: undefined,
        mediaDuration: undefined,
        width: undefined,
        height: undefined,
        performer: undefined,
        fileSize: undefined,
        filename: undefined,
        inputType: 'text',
        responseType: 'text',
        responseOptions: [],
        allowMultipleSelection: false,
        multiSelectVariable: undefined,
        continueButtonText: undefined,
        continueButtonTarget: undefined,
        inputVariable: undefined,
        inputPrompt: undefined,
        inputValidation: undefined,
        inputRequired: true,
        inputTimeout: undefined,
        inputRetryMessage: undefined,
        inputSuccessMessage: undefined,
        enableConditionalMessages: false,
        conditionalMessages: [],
        fallbackMessage: undefined,
        saveToDatabase: false,
        allowSkip: false,
        collectUserInput: false,
        inputTargetNodeId: undefined,
        inputButtonType: 'inline',
        enableAutoTransition: false,
        autoTransitionTo: undefined,
        minLength: undefined,
        maxLength: undefined,
        placeholder: undefined,
        defaultValue: undefined,
        enableUserActions: false,
        actionTrigger: undefined,
        triggerText: undefined,
        userActionType: undefined,
        actionTag: undefined,
        actionMessage: undefined,
        silentAction: false,
        mimeType: undefined,
        stickerSetName: undefined,
        fileName: undefined,
        city: undefined,
        country: undefined,
        enableTextInput: undefined,
        enablePhotoInput: undefined,
        enableVideoInput: undefined,
        enableAudioInput: undefined,
        enableDocumentInput: undefined,
        photoInputVariable: undefined,
        videoInputVariable: undefined,
        audioInputVariable: undefined,
        documentInputVariable: undefined,
        name: undefined,
        label: undefined,
        checkmarkSymbol: undefined,
        multiSelectCheckmark: undefined,
        duration: undefined,
        muteDuration: undefined,
        reason: undefined,
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
        canSendMessages: true,
        canSendMediaMessages: true,
        canSendPolls: true,
        canSendOtherMessages: true,
        canAddWebPagePreviews: true,
        canChangeGroupInfo: true,
        canInviteUsers2: true,
        canPinMessages2: true,
        untilDate: undefined,
        adminTargetUserId: undefined,
        adminUserIdSource: 'last_message',
        adminUserVariableName: undefined,
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
        is_anonymous: false,
        adminChatId: undefined,
        adminChatIdSource: 'current_chat',
        adminChatVariableName: undefined,
        attachedMedia: [],
        waitForTextInput: undefined
      }
    }];

    const defaultSheet: CanvasSheet = {
      id: nanoid(),
      name: 'Лист 1',
      nodes: nodes,
      connections: legacyData.connections || [],
      viewState: {
        pan: { x: 0, y: 0 },
        zoom: 100
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const migratedData = {
      sheets: [defaultSheet],
      activeSheetId: defaultSheet.id,
      version: 2
    };

    console.log('🔄 Мигрированы данные:', {
      hasOriginalNodes: hasNodes,
      originalNodesCount: legacyData.nodes?.length || 0,
      migratedNodesCount: nodes.length,
      sheetsCount: migratedData.sheets.length,
      activeSheetId: migratedData.activeSheetId
    });

    return migratedData;
  }

  // Проверка, является ли данные новым форматом с листами
  static isNewFormat(data: any): data is BotDataWithSheets {
    return data && data.version === 2 && Array.isArray(data.sheets);
  }

  // Создание нового листа
  static createSheet(name: string, nodes: Node[] = [], connections: Connection[] = []): CanvasSheet {
    // Если узлы не переданы, создаем стартовый узел по умолчанию
    const defaultNodes = nodes.length === 0 ? [{
      id: 'start',
      type: 'start' as const,
      position: { x: 100, y: 100 },
      data: {
        messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
        keyboardType: 'none' as const,
        buttons: [],
        resizeKeyboard: true,
        oneTimeKeyboard: false,
        markdown: false,
        formatMode: 'none' as const,
        synonyms: [],
        isPrivateOnly: false,
        adminOnly: false,
        requiresAuth: false,
        showInMenu: true,
        enableStatistics: true,
        customParameters: [],
        options: [],
        command: '/start',
        description: 'Запустить бота',
        // Добавляем все остальные возможные поля, чтобы соответствовать схеме
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
        is_anonymous: false,
        adminChatId: undefined,
        adminChatIdSource: 'current_chat',
        adminChatVariableName: undefined,
        attachedMedia: [],
        text: undefined,
        action: undefined,
        waitForTextInput: undefined,
        messageIdSource: 'last_message',
        disableNotification: false,
        userIdSource: 'last_message',
        mapService: 'custom',
        yandexMapUrl: undefined,
        googleMapUrl: undefined,
        gisMapUrl: undefined,
        mapZoom: 15,
        showDirections: false,
        generateMapPreview: true,
        phoneNumber: undefined,
        firstName: undefined,
        lastName: undefined,
        userId: undefined,
        vcard: undefined,
        question: undefined,
        allowsMultipleAnswers: false,
        anonymousVoting: true,
        emoji: undefined,
        mediaDuration: undefined,
        width: undefined,
        height: undefined,
        performer: undefined,
        fileSize: undefined,
        filename: undefined,
        inputType: 'text',
        responseType: 'text',
        responseOptions: [],
        allowMultipleSelection: false,
        multiSelectVariable: undefined,
        continueButtonText: undefined,
        continueButtonTarget: undefined,
        inputVariable: undefined,
        inputPrompt: undefined,
        inputValidation: undefined,
        inputRequired: true,
        inputTimeout: undefined,
        inputRetryMessage: undefined,
        inputSuccessMessage: undefined,
        enableConditionalMessages: false,
        conditionalMessages: [],
        fallbackMessage: undefined,
        saveToDatabase: false,
        allowSkip: false,
        collectUserInput: false,
        inputTargetNodeId: undefined,
        inputButtonType: 'inline',
        enableAutoTransition: false,
        autoTransitionTo: undefined,
        minLength: undefined,
        maxLength: undefined,
        placeholder: undefined,
        defaultValue: undefined,
        enableUserActions: false,
        actionTrigger: undefined,
        triggerText: undefined,
        userActionType: undefined,
        actionTag: undefined,
        actionMessage: undefined,
        silentAction: false,
        mimeType: undefined,
        stickerSetName: undefined,
        fileName: undefined,
        city: undefined,
        country: undefined,
        enableTextInput: undefined,
        enablePhotoInput: undefined,
        enableVideoInput: undefined,
        enableAudioInput: undefined,
        enableDocumentInput: undefined,
        photoInputVariable: undefined,
        videoInputVariable: undefined,
        audioInputVariable: undefined,
        documentInputVariable: undefined,
        name: undefined,
        label: undefined,
        checkmarkSymbol: undefined,
        multiSelectCheckmark: undefined,
        duration: undefined,
        muteDuration: undefined,
        reason: undefined,
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
        canSendMessages: true,
        canSendMediaMessages: true,
        canSendPolls: true,
        canSendOtherMessages: true,
        canAddWebPagePreviews: true,
        canChangeGroupInfo: true,
        canInviteUsers2: true,
        canPinMessages2: true,
        untilDate: undefined,
        adminTargetUserId: undefined,
        adminUserIdSource: 'last_message',
        adminUserVariableName: undefined,
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
        is_anonymous: false,
        adminChatId: undefined,
        adminChatIdSource: 'current_chat',
        adminChatVariableName: undefined,
        attachedMedia: [],
        waitForTextInput: undefined
      }
    }] : nodes;

    return {
      id: nanoid(),
      name,
      nodes: defaultNodes,
      connections,
      viewState: {
        pan: { x: 0, y: 0 },
        zoom: 100
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Обновляет все ID ссылок на узлы внутри объекта данных
  private static updateNodeReferencesInData(data: any, nodeIdMap: Map<string, string>): any {
    if (!data) return data;

    // Обновляем все свойства, которые могут содержать ссылки на узлы
    const updatedData = JSON.parse(JSON.stringify(data)); // Deep copy

    // Простые ссылки на узлы
    const nodeRefFields = [
      'inputTargetNodeId',
      'targetNodeId',
      'next_node_id',
      'nextNodeId',
      'autoNavigateTarget',
      'fallbackTarget'
    ];

    for (const field of nodeRefFields) {
      if (updatedData?.[field] && nodeIdMap.has(updatedData[field])) {
        updatedData[field] = nodeIdMap.get(updatedData[field]);
      }
    }

    // Обновляем кнопки
    if (updatedData?.buttons && Array.isArray(updatedData.buttons)) {
      updatedData.buttons = updatedData.buttons.map((button: any) => {
        const updatedButton = { ...button };
        if (updatedButton.target && nodeIdMap.has(updatedButton.target)) {
          updatedButton.target = nodeIdMap.get(updatedButton.target);
        }
        return updatedButton;
      });
    }

    // Обновляем условные сообщения
    if (updatedData?.conditionalMessages && Array.isArray(updatedData.conditionalMessages)) {
      updatedData.conditionalMessages = updatedData.conditionalMessages.map((condition: any) => {
        const updatedCondition = { ...condition };
        
        // Обновляем основной target
        if (updatedCondition.target && nodeIdMap.has(updatedCondition.target)) {
          updatedCondition.target = nodeIdMap.get(updatedCondition.target);
        }
        
        // Обновляем кнопки в условном сообщении
        if (updatedCondition.buttons && Array.isArray(updatedCondition.buttons)) {
          updatedCondition.buttons = updatedCondition.buttons.map((button: any) => {
            const updatedButton = { ...button };
            if (updatedButton.target && nodeIdMap.has(updatedButton.target)) {
              updatedButton.target = nodeIdMap.get(updatedButton.target);
            }
            return updatedButton;
          });
        }
        
        return updatedCondition;
      });
    }

    // Обновляем команды
    if (updatedData?.commands && Array.isArray(updatedData.commands)) {
      updatedData.commands = updatedData.commands.map((command: any) => {
        const updatedCommand = { ...command };
        if (updatedCommand.target && nodeIdMap.has(updatedCommand.target)) {
          updatedCommand.target = nodeIdMap.get(updatedCommand.target);
        }
        return updatedCommand;
      });
    }

    // Обновляем опции
    if (updatedData?.options && Array.isArray(updatedData.options)) {
      updatedData.options = updatedData.options.map((option: any) => {
        const updatedOption = { ...option };
        if (updatedOption.target && nodeIdMap.has(updatedOption.target)) {
          updatedOption.target = nodeIdMap.get(updatedOption.target);
        }
        return updatedOption;
      });
    }

    // Обновляем inputConfig
    if (updatedData?.inputConfig) {
      if (updatedData.inputConfig.next_node_id && nodeIdMap.has(updatedData.inputConfig.next_node_id)) {
        updatedData.inputConfig.next_node_id = nodeIdMap.get(updatedData.inputConfig.next_node_id);
      }
    }

    return updatedData;
  }

  // Дублирование листа
  static duplicateSheet(originalSheet: CanvasSheet): CanvasSheet {
    const duplicatedNodes = originalSheet.nodes.map(node => ({
      ...node,
      id: nanoid(),
      position: {
        x: node.position.x + 50, // Смещение для видимости
        y: node.position.y + 50
      }
    }));

    // Создаём map для соответствия старых и новых ID
    const nodeIdMap = new Map(
      originalSheet.nodes.map((node, index) => [node.id, duplicatedNodes[index].id])
    );

    // Обновляем ссылки на узлы внутри самих узлов
    const updatedNodesWithReferences = duplicatedNodes.map(node => ({
      ...node,
      data: this.updateNodeReferencesInData(node.data, nodeIdMap)
    }));

    // Обновляем ID в соединениях
    const duplicatedConnections = originalSheet.connections.map(conn => ({
      ...conn,
      id: nanoid(),
      source: nodeIdMap.get(conn.source) || conn.source,
      target: nodeIdMap.get(conn.target) || conn.target
    }));

    return {
      id: nanoid(),
      name: `${originalSheet.name} (копия)`,
      nodes: updatedNodesWithReferences,
      connections: duplicatedConnections,
      viewState: { ...originalSheet.viewState },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Добавление нового листа в проект
  static addSheet(data: BotDataWithSheets, name: string): BotDataWithSheets {
    const newSheet = this.createSheet(name);
    return {
      ...data,
      sheets: [...data.sheets, newSheet],
      activeSheetId: newSheet.id
    };
  }

  // Удаление листа
  static deleteSheet(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
    if (data.sheets.length <= 1) {
      throw new Error('Нельзя удалить последний лист');
    }

    const deleteSheetIndex = data.sheets.findIndex(sheet => sheet.id === sheetId);
    const filteredSheets = data.sheets.filter(sheet => sheet.id !== sheetId);
    
    let newActiveSheetId = data.activeSheetId;
    
    if (data.activeSheetId === sheetId) {
      // Если удаляемый лист активный, переходим на ближайший
      if (deleteSheetIndex < data.sheets.length - 1) {
        // Если это не последний лист, берем следующий
        newActiveSheetId = data.sheets[deleteSheetIndex + 1].id;
      } else {
        // Если это последний лист, берем предыдущий
        newActiveSheetId = data.sheets[deleteSheetIndex - 1].id;
      }
    }

    return {
      ...data,
      sheets: filteredSheets,
      activeSheetId: newActiveSheetId
    };
  }

  // Переименование листа
  static renameSheet(data: BotDataWithSheets, sheetId: string, newName: string): BotDataWithSheets {
    return {
      ...data,
      sheets: data.sheets.map(sheet => 
        sheet.id === sheetId 
          ? { ...sheet, name: newName, updatedAt: new Date() }
          : sheet
      )
    };
  }

  // Дублирование листа в проекте
  static duplicateSheetInProject(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
    const originalSheet = data.sheets.find(sheet => sheet.id === sheetId);
    if (!originalSheet) {
      throw new Error('Лист не найден');
    }

    const duplicatedSheet = this.duplicateSheet(originalSheet);
    return {
      ...data,
      sheets: [...data.sheets, duplicatedSheet],
      activeSheetId: duplicatedSheet.id
    };
  }

  // Обновление активного листа
  static setActiveSheet(data: BotDataWithSheets, sheetId: string): BotDataWithSheets {
    const sheetExists = data.sheets.some(sheet => sheet.id === sheetId);
    if (!sheetExists) {
      throw new Error('Лист не найден');
    }

    return {
      ...data,
      activeSheetId: sheetId
    };
  }

  // Обновление узлов в листе
  static updateSheetNodes(data: BotDataWithSheets, sheetId: string, nodes: Node[]): BotDataWithSheets {
    return {
      ...data,
      sheets: data.sheets.map(sheet => 
        sheet.id === sheetId 
          ? { ...sheet, nodes, updatedAt: new Date() }
          : sheet
      )
    };
  }

  // Обновление соединений в листе
  static updateSheetConnections(data: BotDataWithSheets, sheetId: string, connections: Connection[]): BotDataWithSheets {
    return {
      ...data,
      sheets: data.sheets.map(sheet => 
        sheet.id === sheetId 
          ? { ...sheet, connections, updatedAt: new Date() }
          : sheet
      )
    };
  }

  // Обновление узлов и соединений в листе одновременно
  static updateSheetData(data: BotDataWithSheets, sheetId: string, nodes: Node[], connections: Connection[]): BotDataWithSheets {
    return {
      ...data,
      sheets: data.sheets.map(sheet => 
        sheet.id === sheetId 
          ? { ...sheet, nodes, connections, updatedAt: new Date() }
          : sheet
      )
    };
  }

  // Обновление состояния вида листа (зум, панорамирование)
  static updateSheetViewState(data: BotDataWithSheets, sheetId: string, viewState: { pan: { x: number; y: number }; zoom: number }): BotDataWithSheets {
    return {
      ...data,
      sheets: data.sheets.map(sheet => 
        sheet.id === sheetId 
          ? { ...sheet, viewState, updatedAt: new Date() }
          : sheet
      )
    };
  }

  // Получение активного листа
  static getActiveSheet(data: BotDataWithSheets): CanvasSheet | null {
    if (!data.activeSheetId) {
      return data.sheets[0] || null;
    }
    return data.sheets.find(sheet => sheet.id === data.activeSheetId) || null;
  }

  // Валидация структуры данных
  static validateData(data: BotDataWithSheets): string[] {
    const errors: string[] = [];

    if (!Array.isArray(data.sheets)) {
      errors.push('Некорректная структура листов');
    }

    if (data.sheets.length === 0) {
      errors.push('Проект должен содержать хотя бы один лист');
    }

    const activeSheet = this.getActiveSheet(data);
    if (!activeSheet) {
      errors.push('Активный лист не найден');
    }

    // Проверка уникальности ID листов
    const sheetIds = data.sheets.map(sheet => sheet.id);
    const uniqueIds = new Set(sheetIds);
    if (sheetIds.length !== uniqueIds.size) {
      errors.push('Обнаружены дублирующиеся ID листов');
    }

    return errors;
  }

  // Конвертация обратно в старый формат для совместимости
  static toLegacyFormat(data: BotDataWithSheets): BotData {
    const activeSheet = this.getActiveSheet(data);
    if (!activeSheet) {
      return { nodes: [], connections: [] };
    }

    return {
      nodes: activeSheet.nodes,
      connections: activeSheet.connections
    };
  }
}