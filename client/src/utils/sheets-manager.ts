import { nanoid } from 'nanoid';
import { CanvasSheet, BotDataWithSheets, BotData, Node, Connection } from '@shared/schema';

export class SheetsManager {
  
  // Миграция старых данных к новому формату с листами
  static migrateLegacyData(legacyData: BotData): BotDataWithSheets {
    // Если нет узлов, создаем стартовый узел по умолчанию
    const nodes = legacyData.nodes && legacyData.nodes.length > 0 ? legacyData.nodes : [{
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
        description: 'Запустить бота'
      }
    }];

    const defaultSheet: CanvasSheet = {
      id: nanoid(),
      name: 'Основной поток',
      nodes: nodes,
      connections: legacyData.connections || [],
      viewState: {
        pan: { x: 0, y: 0 },
        zoom: 100
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      sheets: [defaultSheet],
      activeSheetId: defaultSheet.id,
      version: 2
    };
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
        description: 'Запустить бота'
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

    // Обновляем ID в соединениях
    const nodeIdMap = new Map(
      originalSheet.nodes.map((node, index) => [node.id, duplicatedNodes[index].id])
    );

    const duplicatedConnections = originalSheet.connections.map(conn => ({
      ...conn,
      id: nanoid(),
      source: nodeIdMap.get(conn.source) || conn.source,
      target: nodeIdMap.get(conn.target) || conn.target
    }));

    return {
      id: nanoid(),
      name: `${originalSheet.name} (копия)`,
      nodes: duplicatedNodes,
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