// import { generatePythonCode } from "../client/src/lib/bot-generator"; // Убрано - используем динамический импорт с очисткой кеша
// Функция нормализации данных узлов для добавления недостающих полей
export function normalizeNodeData(node: any) {
  // Определяем значения по умолчанию для разных типов узлов
  const nodeDefaults = {
    start: {
      command: '/start',
      description: 'Запустить бота',
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    },
    command: {
      command: '/custom',
      description: 'Новая команда',
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  };

  // Получаем значения по умолчанию для типа узла
  const defaults = nodeDefaults[node.type as keyof typeof nodeDefaults];
  if (!defaults) return node;

  // Объединяем существующие данные с недостающими значениями по умолчанию
  const normalizedData = { ...node.data };

  for (const [key, value] of Object.entries(defaults)) {
    if (normalizedData[key] === undefined) {
      normalizedData[key] = value;
    }
  }

  return {
    ...node,
    data: normalizedData
  };
}
