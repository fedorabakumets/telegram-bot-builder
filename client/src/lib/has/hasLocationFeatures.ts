import { Button } from "../bot-generator";

// ============================================================================
// ФУНКЦИИ АНАЛИЗА ВОЗМОЖНОСТЕЙ БОТА
// ============================================================================
// Функция для проверки наличия геолокационных элементов в боте
export function hasLocationFeatures(nodes: Node[]): boolean {
  if (!nodes || nodes.length === 0) return false;

  // Проверяем наличие узлов типа location
  const hasLocationNode = nodes.some(node => node.type === 'location');

  // Проверяем наличие кнопок с requestLocation
  const hasLocationButton = nodes.some(node => {
    const buttons = node.data.buttons;
    if (!buttons || !Array.isArray(buttons)) return false;
    return buttons.some((button: Button) => button.action === 'location' && button.requestLocation
    );
  });

  return hasLocationNode || hasLocationButton;
}
