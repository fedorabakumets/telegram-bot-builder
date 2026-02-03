import { Node, Connection, Button } from '@shared/schema';
import { nanoid } from 'nanoid';

/**
 * Интерфейс для представления связи вместе с кнопкой и узлами
 * Содержит информацию о соединении, связанной кнопке и узлах источника и назначения
 */
export interface ConnectionWithButton {
  /** Объект соединения */
  connection: Connection;
  /** Объект кнопки, связанной с соединением */
  button: Button;
  /** Узел-источник соединения */
  sourceNode: Node;
  /** Узел-назначение соединения */
  targetNode: Node;
}

/**
 * Интерфейс для предложения соединения
 * Содержит информацию о потенциальном соединении с метриками достоверности
 */
export interface ConnectionSuggestion {
  /** Уникальный идентификатор предложения */
  id: string;
  /** Предлагаемое соединение */
  connection: Connection;
  /** Кнопка, предлагаемая для соединения */
  suggestedButton: Button;
  /** Уверенность в предложении (от 0 до 1) */
  confidence: number;
  /** Причина предложения соединения */
  reason: string;
  /** Флаг автоматического создания соединения */
  autoCreate: boolean;
}

/**
 * Интерфейс для состояния менеджера соединений
 * Хранит информацию о соединениях, узлах и настройках
 */
export interface ConnectionManagerState {
  /** Массив существующих соединений */
  connections: Connection[];
  /** Массив узлов */
  nodes: Node[];
  /** Массив предложенных соединений */
  pendingConnections: ConnectionSuggestion[];
  /** Флаг автоматического создания кнопок */
  autoButtonCreation: boolean;
  // Добавляем поддержку листов
  /** Массив всех листов для межлистовых соединений */
  sheets?: any[]; // Массив всех листов для межлистовых соединений
  /** ID текущего активного листа */
  currentSheetId?: string; // ID текущего активного листа
}

/**
 * Класс для управления соединениями между узлами
 * Обеспечивает создание, удаление и синхронизацию соединений и кнопок
 */
export class ConnectionManager {
  /** Состояние менеджера соединений */
  private state: ConnectionManagerState;

  /**
   * Конструктор класса ConnectionManager
   *
   * @param initialState - начальное состояние менеджера соединений
   */
  constructor(initialState: Partial<ConnectionManagerState> = {}) {
    this.state = {
      connections: [],
      nodes: [],
      pendingConnections: [],
      autoButtonCreation: true,
      ...initialState
    };
  }

  /**
   * Обновление состояния менеджера соединений
   *
   * @param newState - новое состояние для обновления
   */
  updateState(newState: Partial<ConnectionManagerState>) {
    this.state = { ...this.state, ...newState };
  }

  /**
   * Основной метод для создания связи (поддерживает межлистовые соединения)
   *
   * Создает соединение между двумя узлами с возможностью автоматического создания кнопки.
   * Поддерживает межлистовые соединения, позволяя соединять узлы из разных листов.
   *
   * @param sourceId - ID узла-источника
   * @param targetId - ID узла-назначения
   * @param options - опции создания соединения
   * @param options.autoCreateButton - флаг автоматического создания кнопки
   * @param options.buttonText - текст кнопки
   * @param options.buttonAction - тип действия кнопки
   * @param options.targetSheetId - ID целевого листа для межлистового соединения
   * @returns объект, содержащий созданное соединение и обновленные узлы
   */
  createConnection(sourceId: string, targetId: string, options: {
    autoCreateButton?: boolean;
    buttonText?: string;
    buttonAction?: 'goto' | 'command' | 'url';
    targetSheetId?: string; // ID целевого листа для межлистового соединения
  } = {}): { connection: Connection; updatedNodes: Node[] } {
    const sourceNode = this.state.nodes.find(n => n.id === sourceId);
    let targetNode = this.state.nodes.find(n => n.id === targetId);
    
    // Если узел не найден в текущем листе, ищем в других листах
    if (!targetNode && options.targetSheetId && this.state.sheets) {
      const targetSheet = this.state.sheets.find((sheet: any) => sheet.id === options.targetSheetId);
      if (targetSheet) {
        targetNode = targetSheet.nodes?.find((n: any) => n.id === targetId);
      }
    }

    if (!sourceNode) {
      throw new Error('Исходный узел не найден');
    }
    
    if (!targetNode) {
      throw new Error('Целевой узел не найден');
    }

    // Определяем, является ли соединение межлистовым
    const isInterSheet = options.targetSheetId && options.targetSheetId !== this.state.currentSheetId;

    // Создаем соединение
    const connection: Connection = {
      id: nanoid(),
      source: sourceId,
      target: targetId,
      sourceSheetId: this.state.currentSheetId,
      targetSheetId: options.targetSheetId || this.state.currentSheetId,
      isInterSheet: isInterSheet || false,
      isAutoGenerated: false
    };

    // Если включено автоматическое создание кнопок
    const shouldCreateButton = options.autoCreateButton ?? this.state.autoButtonCreation;
    let updatedNodes = [...this.state.nodes];

    if (shouldCreateButton && this.canNodeHaveButtons(sourceNode)) {
      const button = this.createButtonForConnection(sourceNode, targetNode, options);
      updatedNodes = this.addButtonToNode(updatedNodes, sourceId, button);
    }

    return { connection, updatedNodes };
  }

  /**
   * Получение всех узлов из всех листов для межлистовых соединений
   *
   * Метод возвращает массив всех узлов из всех доступных листов с информацией о принадлежности
   * к конкретному листу. Используется для поиска узлов при создании межлистовых соединений.
   *
   * @returns массив объектов, содержащих узел, ID листа и название листа
   */
  getAllNodesFromAllSheets(): { node: Node; sheetId: string; sheetName: string }[] {
    const allNodes: { node: Node; sheetId: string; sheetName: string }[] = [];
    
    if (this.state.sheets) {
      this.state.sheets.forEach((sheet: any) => {
        if (sheet.nodes) {
          sheet.nodes.forEach((node: Node) => {
            allNodes.push({
              node,
              sheetId: sheet.id,
              sheetName: sheet.name
            });
          });
        }
      });
    }
    
    return allNodes;
  }

  /**
   * Создание кнопки для соединения (поддерживает межлистовые соединения)
   *
   * Метод создает кнопку, связанную с соединением между узлами. При необходимости
   * добавляет индикатор листа для межлистовых соединений.
   *
   * @param _sourceNode - узел-источник (не используется напрямую, но передается для контекста)
   * @param targetNode - узел-назначение
   * @param options - опции создания кнопки
   * @param options.buttonText - текст кнопки
   * @param options.buttonAction - тип действия кнопки
   * @param options.targetSheetId - ID целевого листа для межлистового соединения
   * @returns созданный объект кнопки
   */
  private createButtonForConnection(
    _sourceNode: Node,
    targetNode: Node,
    options: {
      buttonText?: string;
      buttonAction?: 'goto' | 'command' | 'url';
      targetSheetId?: string;
    } = {}
  ): Button {
    const action = options.buttonAction || this.determineButtonAction(targetNode);
    let text = options.buttonText || this.generateButtonText(targetNode, action);
    
    // Если это межлистовое соединение, добавляем индикатор листа
    if (options.targetSheetId && options.targetSheetId !== this.state.currentSheetId) {
      const targetSheet = this.state.sheets?.find((sheet: any) => sheet.id === options.targetSheetId);
      if (targetSheet) {
        text += ` 📋 (${targetSheet.name})`;
      }
    }

    return {
      id: nanoid(),
      text,
      action,
      target: action === 'goto' ? targetNode.id : undefined,
      url: action === 'url' ? targetNode.data.imageUrl : undefined,
      buttonType: 'normal',
      skipDataCollection: false,
      hideAfterClick: false
    };
  }

  /**
   * Определение типа действия кнопки
   *
   * Метод анализирует тип целевого узла и определяет подходящий тип действия для кнопки.
   *
   * @param targetNode - целевой узел
   * @returns тип действия кнопки ('goto', 'command' или 'url')
   */
  private determineButtonAction(targetNode: Node): 'goto' | 'command' | 'url' {
    switch (targetNode.type) {
      case 'command':
        return 'command';
      case 'photo':
        return targetNode.data.imageUrl ? 'url' : 'goto';
      default:
        return 'goto';
    }
  }

  /**
   * Генерация текста кнопки
   *
   * Метод генерирует подходящий текст для кнопки на основе типа целевого узла и действия.
   *
   * @param targetNode - целевой узел
   * @param action - тип действия кнопки
   * @returns текст кнопки
   */
  private generateButtonText(targetNode: Node, action: 'goto' | 'command' | 'url'): string {
    if (action === 'command' && targetNode.data.command) {
      return targetNode.data.command;
    }

    const textMap: Record<Node['type'], string> = {
      start: '🏠 Главное меню',
      message: targetNode.data.messageText?.slice(0, 25) + '...' || '💬 Сообщение',
      photo: '🖼️ Посмотреть фото',
      video: '🎥 Посмотреть видео',
      audio: '🎵 Прослушать аудио',
      document: '📄 Открыть документ',
      keyboard: '⌨️ Показать меню',
      input: '✏️ Ввести данные',
      condition: '🔀 Проверить условие',
      command: targetNode.data.command || '⚡ Команда',
      sticker: '😀 Отправить стикер',
      voice: '🎤 Голосовое сообщение',
      animation: '🎬 Анимация',
      location: '📍 Геолокация',
      contact: '👤 Контакт',
      pin_message: '📌 Закрепить сообщение',
      unpin_message: '📌 Открепить сообщение',
      delete_message: '🗑️ Удалить сообщение',
      ban_user: '🚫 Заблокировать пользователя',
      unban_user: '✅ Разблокировать пользователя',
      mute_user: '🔇 Заглушить пользователя',
      unmute_user: '🔊 Включить звук пользователя',
      kick_user: '👢 Исключить пользователя',
      promote_user: '👑 Повысить пользователя',
      demote_user: '👤 Понизить пользователя',
      admin_rights: '🛡️ Права администратора'
    };

    return textMap[targetNode.type] || '➡️ Продолжить';
  }

  /**
   * Проверка, может ли узел иметь кнопки
   *
   * Метод определяет, поддерживает ли узел добавление кнопок.
   *
   * @param node - узел для проверки
   * @returns true, если узел может иметь кнопки, иначе false
   */
  private canNodeHaveButtons(node: Node): boolean {
    return ['message', 'photo', 'keyboard', 'start', 'input'].includes(node.type);
  }

  /**
   * Добавление кнопки к узлу
   *
   * Метод добавляет кнопку к указанному узлу и возвращает обновленный массив узлов.
   *
   * @param nodes - массив узлов
   * @param nodeId - ID узла, к которому добавляется кнопка
   * @param button - кнопка для добавления
   * @returns обновленный массив узлов
   */
  private addButtonToNode(nodes: Node[], nodeId: string, button: Button): Node[] {
    return nodes.map(node => {
      if (node.id === nodeId) {
        const existingButtons = node.data.buttons || [];
        return {
          ...node,
          data: {
            ...node.data,
            buttons: [...existingButtons, button]
          }
        };
      }
      return node;
    });
  }

  /**
   * Автоматическое создание предложений соединений
   *
   * Метод анализирует узлы и создает предложения для потенциальных соединений
   * на основе логических переходов и других факторов.
   *
   * @returns массив предложений соединений
   */
  generateConnectionSuggestions(): ConnectionSuggestion[] {
    const suggestions: ConnectionSuggestion[] = [];
    const existingConnections = new Set(
      this.state.connections.map(c => `${c.source}-${c.target}`)
    );

    // Логика создания предложений
    for (const sourceNode of this.state.nodes) {
      if (!this.canNodeHaveButtons(sourceNode)) continue;

      for (const targetNode of this.state.nodes) {
        if (sourceNode.id === targetNode.id) continue;
        
        const connectionKey = `${sourceNode.id}-${targetNode.id}`;
        if (existingConnections.has(connectionKey)) continue;

        const confidence = this.calculateConnectionConfidence(sourceNode, targetNode);
        if (confidence < 0.5) continue;

        const connection: Connection = {
          id: nanoid(),
          source: sourceNode.id,
          target: targetNode.id,
          isInterSheet: false,
          isAutoGenerated: false
        };

        const suggestedButton = this.createButtonForConnection(sourceNode, targetNode);

        suggestions.push({
          id: nanoid(),
          connection,
          suggestedButton,
          confidence,
          reason: this.getConnectionReason(sourceNode, targetNode),
          autoCreate: confidence > 0.8
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Расчет уверенности соединения
   *
   * Метод вычисляет вероятность того, что между двумя узлами должно быть соединение
   * на основе различных факторов: типов узлов, количества кнопок, расстояния между узлами и т.д.
   *
   * @param sourceNode - узел-источник
   * @param targetNode - узел-назначение
   * @returns значение уверенности (от 0 до 1)
   */
  private calculateConnectionConfidence(sourceNode: Node, targetNode: Node): number {
    let confidence = 0.3;

    // Логичные переходы
    const flowPatterns = [
      { from: 'start', to: 'message', bonus: 0.4 },
      { from: 'start', to: 'keyboard', bonus: 0.3 },
      { from: 'command', to: 'message', bonus: 0.4 },
      { from: 'message', to: 'keyboard', bonus: 0.3 },
      { from: 'keyboard', to: 'message', bonus: 0.2 },
      { from: 'input', to: 'message', bonus: 0.3 },
      { from: 'condition', to: 'message', bonus: 0.3 }
    ];

    const pattern = flowPatterns.find(p => p.from === sourceNode.type && p.to === targetNode.type);
    if (pattern) {
      confidence += pattern.bonus;
    }

    // Штраф за слишком много кнопок
    const buttons = sourceNode.data.buttons || [];
    const buttonCount = buttons.length;
    if (buttonCount > 4) confidence -= 0.1;
    if (buttonCount > 8) confidence -= 0.2;

    // Бонус за близость узлов
    const distance = Math.sqrt(
      Math.pow(sourceNode.position.x - targetNode.position.x, 2) +
      Math.pow(sourceNode.position.y - targetNode.position.y, 2)
    );
    if (distance < 400) confidence += 0.1;

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Получение причины для соединения
   *
   * Метод возвращает текстовое объяснение, почему между двумя узлами предлагается создать соединение.
   *
   * @param sourceNode - узел-источник
   * @param targetNode - узел-назначение
   * @returns текстовое объяснение причины соединения
   */
  private getConnectionReason(sourceNode: Node, targetNode: Node): string {
    if (sourceNode.type === 'start' && targetNode.type === 'message') {
      return 'Стартовый узел обычно ведет к первому сообщению';
    }
    if (sourceNode.type === 'command' && targetNode.type === 'message') {
      return 'Команда должна отправлять ответное сообщение';
    }
    if (sourceNode.type === 'message' && targetNode.type === 'keyboard') {
      return 'Сообщение может содержать интерактивную клавиатуру';
    }
    if (sourceNode.type === 'input' && targetNode.type === 'message') {
      return 'После ввода данных нужно дать обратную связь';
    }
    
    return `Связь между ${this.getNodeTypeName(sourceNode.type)} и ${this.getNodeTypeName(targetNode.type)}`;
  }

  /**
   * Получение названия типа узла
   *
   * Метод возвращает читаемое название типа узла на русском языке.
   *
   * @param type - тип узла
   * @returns название типа узла
   */
  private getNodeTypeName(type: Node['type']): string {
    const names: Record<Node['type'], string> = {
      start: 'стартом',
      message: 'сообщением',
      photo: 'фото',
      video: 'видео',
      audio: 'аудио',
      document: 'документом',
      keyboard: 'клавиатурой',
      input: 'вводом',
      condition: 'условием',
      command: 'командой',
      sticker: 'стикером',
      voice: 'голосовым сообщением',
      animation: 'анимацией',
      location: 'геолокацией',
      contact: 'контактом',
      pin_message: 'закреплением сообщения',
      unpin_message: 'открепление сообщения',
      delete_message: 'удалением сообщения',
      ban_user: 'блокировкой пользователя',
      unban_user: 'разблокировкой пользователя',
      mute_user: 'заглушением пользователя',
      unmute_user: 'включением звука пользователя',
      kick_user: 'исключением пользователя',
      promote_user: 'повышением пользователя',
      demote_user: 'понижением пользователя',
      admin_rights: 'правами администратора'
    };
    return names[type] || type;
  }

  /**
   * Удаление связанных кнопок при удалении соединения
   *
   * Метод удаляет соединение и связанную с ним кнопку из узла-источника.
   *
   * @param connectionId - ID соединения для удаления
   * @returns объект, содержащий удаленное соединение и обновленные узлы
   */
  removeConnection(connectionId: string): { removedConnection: Connection | null; updatedNodes: Node[] } {
    const removedConnection = this.state.connections.find(c => c.id === connectionId);
    if (!removedConnection) {
      return { removedConnection: null, updatedNodes: this.state.nodes };
    }

    // Найти и удалить связанную кнопку
    const updatedNodes = this.state.nodes.map(node => {
      if (node.id === removedConnection.source) {
        return {
          ...node,
          data: {
            ...node.data,
            buttons: node.data.buttons.filter(button => 
              button.action !== 'goto' || button.target !== removedConnection.target
            )
          }
        };
      }
      return node;
    });

    return { removedConnection, updatedNodes };
  }

  /**
   * Синхронизация кнопок с соединениями
   *
   * Метод обеспечивает согласованность между соединениями и кнопками,
   * добавляя недостающие кнопки для существующих соединений.
   *
   * @returns массив обновленных узлов
   */
  syncButtonsWithConnections(): Node[] {
    const updatedNodes = [...this.state.nodes];

    for (const connection of this.state.connections) {
      const sourceNode = updatedNodes.find(n => n.id === connection.source);
      const targetNode = updatedNodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode || !this.canNodeHaveButtons(sourceNode)) continue;

      // Проверяем, есть ли уже кнопка для этого соединения
      const hasButton = sourceNode.data.buttons.some(button => 
        button.action === 'goto' && button.target === connection.target
      );

      if (!hasButton) {
        // Создаем недостающую кнопку
        const button = this.createButtonForConnection(sourceNode, targetNode);
        const nodeIndex = updatedNodes.findIndex(n => n.id === connection.source);
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          data: {
            ...updatedNodes[nodeIndex].data,
            buttons: [...updatedNodes[nodeIndex].data.buttons, button]
          }
        };
      }
    }

    return updatedNodes;
  }

  /**
   * Очистка лишних кнопок
   *
   * Метод удаляет кнопки, для которых не существует соответствующих соединений.
   *
   * @returns массив обновленных узлов без лишних кнопок
   */
  cleanupOrphanedButtons(): Node[] {
    const connectionTargets = new Set(this.state.connections.map(c => c.target));

    return this.state.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        buttons: node.data.buttons.filter(button => 
          button.action !== 'goto' || 
          !button.target || 
          connectionTargets.has(button.target)
        )
      }
    }));
  }
}

/**
 * Фабрика для создания менеджера соединений
 *
 * Функция создает экземпляр ConnectionManager с заданными узлами, соединениями и опциями.
 *
 * @param nodes - массив узлов
 * @param connections - массив соединений
 * @param options - опции создания менеджера
 * @param options.autoButtonCreation - флаг автоматического создания кнопок
 * @returns экземпляр ConnectionManager
 */
export function createConnectionManager(
  nodes: Node[],
  connections: Connection[],
  options: { autoButtonCreation?: boolean } = {}
): ConnectionManager {
  return new ConnectionManager({
    nodes,
    connections,
    autoButtonCreation: options.autoButtonCreation ?? true
  });
}