import { Node, Connection, Button } from '@/types/bot';
import { nanoid } from 'nanoid';

export interface ConnectionWithButton {
  connection: Connection;
  button: Button;
  sourceNode: Node;
  targetNode: Node;
}

export interface ConnectionSuggestion {
  id: string;
  connection: Connection;
  suggestedButton: Button;
  confidence: number;
  reason: string;
  autoCreate: boolean;
}

export interface ConnectionManagerState {
  connections: Connection[];
  nodes: Node[];
  pendingConnections: ConnectionSuggestion[];
  autoButtonCreation: boolean;
}

export class ConnectionManager {
  private state: ConnectionManagerState;
  
  constructor(initialState: Partial<ConnectionManagerState> = {}) {
    this.state = {
      connections: [],
      nodes: [],
      pendingConnections: [],
      autoButtonCreation: true,
      ...initialState
    };
  }

  // Обновление состояния
  updateState(newState: Partial<ConnectionManagerState>) {
    this.state = { ...this.state, ...newState };
  }

  // Основной метод для создания связи
  createConnection(sourceId: string, targetId: string, options: {
    autoCreateButton?: boolean;
    buttonText?: string;
    buttonAction?: 'goto' | 'command' | 'url';
  } = {}): { connection: Connection; updatedNodes: Node[] } {
    const sourceNode = this.state.nodes.find(n => n.id === sourceId);
    const targetNode = this.state.nodes.find(n => n.id === targetId);

    if (!sourceNode || !targetNode) {
      throw new Error('Исходный или целевой узел не найден');
    }

    // Создаем соединение
    const connection: Connection = {
      id: nanoid(),
      source: sourceId,
      target: targetId
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

  // Создание кнопки для соединения
  private createButtonForConnection(
    sourceNode: Node,
    targetNode: Node,
    options: {
      buttonText?: string;
      buttonAction?: 'goto' | 'command' | 'url';
    } = {}
  ): Button {
    const action = options.buttonAction || this.determineButtonAction(targetNode);
    const text = options.buttonText || this.generateButtonText(targetNode, action);

    return {
      id: nanoid(),
      text,
      action,
      target: action === 'goto' ? targetNode.id : undefined,
      url: action === 'url' ? targetNode.data.imageUrl : undefined
    };
  }

  // Определение типа действия кнопки
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

  // Генерация текста кнопки
  private generateButtonText(targetNode: Node, action: 'goto' | 'command' | 'url'): string {
    if (action === 'command' && targetNode.data.command) {
      return targetNode.data.command;
    }

    const textMap: Record<Node['type'], string> = {
      start: '🏠 Главное меню',
      message: targetNode.data.messageText?.slice(0, 25) + '...' || '💬 Сообщение',
      photo: '🖼️ Посмотреть фото',
      keyboard: '⌨️ Показать меню',
      input: '✏️ Ввести данные',
      condition: '🔀 Проверить условие',
      command: targetNode.data.command || '⚡ Команда'
    };

    return textMap[targetNode.type] || '➡️ Продолжить';
  }

  // Проверка, может ли узел иметь кнопки
  private canNodeHaveButtons(node: Node): boolean {
    return ['message', 'photo', 'keyboard', 'start', 'input'].includes(node.type);
  }

  // Добавление кнопки к узлу
  private addButtonToNode(nodes: Node[], nodeId: string, button: Button): Node[] {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            buttons: [...node.data.buttons, button]
          }
        };
      }
      return node;
    });
  }

  // Автоматическое создание предложений соединений
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
          target: targetNode.id
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

  // Расчет уверенности соединения
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
    const buttonCount = sourceNode.data.buttons.length;
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

  // Получение причины для соединения
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

  // Получение названия типа узла
  private getNodeTypeName(type: Node['type']): string {
    const names: Record<Node['type'], string> = {
      start: 'стартом',
      message: 'сообщением',
      photo: 'фото',
      keyboard: 'клавиатурой',
      input: 'вводом',
      condition: 'условием',
      command: 'командой'
    };
    return names[type] || type;
  }

  // Удаление связанных кнопок при удалении соединения
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

  // Синхронизация кнопок с соединениями
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

  // Очистка лишних кнопок
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

// Фабрика для создания менеджера соединений
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