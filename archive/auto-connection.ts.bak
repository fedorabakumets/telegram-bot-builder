import { Node, Connection } from '@shared/schema';

export interface ConnectionSuggestion {
  source: string;
  target: string;
  confidence: number;
  reason: string;
}

// Логика автоматических соединений на основе типов узлов
export function generateAutoConnections(nodes: Node[], existingConnections: Connection[]): ConnectionSuggestion[] {
  const suggestions: ConnectionSuggestion[] = [];
  const existingPairs = new Set(existingConnections.map(c => `${c.source}-${c.target}`));

  // Типы узлов, которые должны быть соединены в определенном порядке
  const flowPatterns = [
    { from: 'start', to: 'message', confidence: 0.9, reason: 'Стартовый узел обычно ведет к сообщению' },
    { from: 'start', to: 'keyboard', confidence: 0.8, reason: 'Стартовый узел может показать клавиатуру' },
    { from: 'command', to: 'message', confidence: 0.9, reason: 'Команда обычно отправляет сообщение' },
    { from: 'command', to: 'keyboard', confidence: 0.8, reason: 'Команда может показать клавиатуру' },
    { from: 'message', to: 'keyboard', confidence: 0.7, reason: 'Сообщение может содержать клавиатуру' },
    { from: 'keyboard', to: 'message', confidence: 0.6, reason: 'Клавиатура может вести к сообщению' },
    { from: 'input', to: 'message', confidence: 0.8, reason: 'Ввод данных обычно ведет к сообщению' },
    { from: 'condition', to: 'message', confidence: 0.7, reason: 'Условие может вести к сообщению' },
    { from: 'photo', to: 'keyboard', confidence: 0.6, reason: 'Фото может содержать клавиатуру' },
  ];

  // Найти узлы по типам
  const nodesByType = nodes.reduce((acc, node) => {
    if (!acc[node.type]) acc[node.type] = [];
    acc[node.type].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  // Генерация предложений на основе шаблонов
  for (const pattern of flowPatterns) {
    const sourceNodes = nodesByType[pattern.from] || [];
    const targetNodes = nodesByType[pattern.to] || [];

    for (const sourceNode of sourceNodes) {
      for (const targetNode of targetNodes) {
        const pairKey = `${sourceNode.id}-${targetNode.id}`;
        if (!existingPairs.has(pairKey) && sourceNode.id !== targetNode.id) {
          // Проверяем расстояние между узлами для улучшения релевантности
          const distance = Math.sqrt(
            Math.pow(targetNode.position.x - sourceNode.position.x, 2) +
            Math.pow(targetNode.position.y - sourceNode.position.y, 2)
          );
          
          // Уменьшаем confidence для удаленных узлов
          const distanceModifier = Math.max(0.5, 1 - distance / 1000);
          
          suggestions.push({
            source: sourceNode.id,
            target: targetNode.id,
            confidence: pattern.confidence * distanceModifier,
            reason: pattern.reason
          });
        }
      }
    }
  }

  // Поиск изолированных узлов
  const connectedNodes = new Set([
    ...existingConnections.map(c => c.source),
    ...existingConnections.map(c => c.target)
  ]);

  const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id));

  // Предложения для изолированных узлов
  for (const isolated of isolatedNodes) {
    const nearbyNodes = nodes
      .filter(node => node.id !== isolated.id && !existingPairs.has(`${isolated.id}-${node.id}`))
      .map(node => ({
        node,
        distance: Math.sqrt(
          Math.pow(node.position.x - isolated.position.x, 2) +
          Math.pow(node.position.y - isolated.position.y, 2)
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Берем 3 ближайших

    for (const { node: nearbyNode, distance } of nearbyNodes) {
      const confidence = Math.max(0.3, 0.8 - distance / 500);
      suggestions.push({
        source: isolated.id,
        target: nearbyNode.id,
        confidence,
        reason: 'Изолированный узел рядом с другими'
      });
    }
  }

  // Сортировка по уверенности
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

// Проверка валидности соединения
export function isValidConnection(
  sourceNode: Node,
  targetNode: Node,
  existingConnections: Connection[]
): { valid: boolean; reason?: string } {
  // Проверяем, что не соединяем узел сам с собой
  if (sourceNode.id === targetNode.id) {
    return { valid: false, reason: 'Нельзя соединить узел сам с собой' };
  }

  // Проверяем, что соединение не существует
  const existingConnection = existingConnections.find(
    c => c.source === sourceNode.id && c.target === targetNode.id
  );
  if (existingConnection) {
    return { valid: false, reason: 'Соединение уже существует' };
  }

  // Проверяем обратное соединение (чтобы избежать циклов)
  const reverseConnection = existingConnections.find(
    c => c.source === targetNode.id && c.target === sourceNode.id
  );
  if (reverseConnection) {
    return { valid: false, reason: 'Обратное соединение уже существует' };
  }

  return { valid: true };
}

// Получение рекомендаций для конкретного узла
export function getNodeConnectionSuggestions(
  node: Node,
  allNodes: Node[],
  existingConnections: Connection[]
): ConnectionSuggestion[] {
  const allSuggestions = generateAutoConnections(allNodes, existingConnections);
  return allSuggestions.filter(s => s.source === node.id || s.target === node.id);
}