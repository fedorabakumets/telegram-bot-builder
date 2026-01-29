/**
 * Интерфейс условной кнопки сообщения
 */
interface ConditionalMessageButton {
  action: string;
  label: string;
  [key: string]: unknown;
}

/**
 * Интерфейс данных узла
 */
interface NodeData {
  conditionalMessageButtons?: ConditionalMessageButton[];
  [key: string]: unknown;
}

/**
 * Интерфейс узла
 */
interface Node {
  data: NodeData;
  [key: string]: unknown;
}

/**
 * Функция для сбора условных кнопок сообщений из массива узлов
 * @param {Node[]} nodes - Массив узлов для извлечения условных кнопок
 * @returns {ConditionalMessageButton[]} Массив условных кнопок сообщений
 */
export function collectConditionalMessageButtons(nodes: Node[]): ConditionalMessageButton[] {
  const buttons: ConditionalMessageButton[] = [];

  (nodes || []).forEach((node: Node) => {
    if (node.data.conditionalMessageButtons) {
      buttons.push(...node.data.conditionalMessageButtons);
    }
  });

  return buttons;
}
