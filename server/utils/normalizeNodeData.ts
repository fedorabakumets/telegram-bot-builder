// import { generatePythonCode } from "../client/src/lib/bot-generator"; // Убрано - используем динамический импорт с очисткой кеша

/**
 * Нормализует данные узла, добавляя недостающие поля со значениями по умолчанию
 *
 * @param node - Объект узла, данные которого нужно нормализовать
 * @returns Нормализованный объект узла с дополненными полями по умолчанию
 *
 * @description
 * Функция проверяет тип узла и добавляет недостающие поля со значениями по умолчанию.
 * Поддерживаются два типа узлов: 'start' и 'command'.
 * Для каждого типа определены свои значения по умолчанию:
 * - 'start': содержит команду /start, описание, флаги видимости и доступа
 * - 'command': содержит настраиваемую команду, описание, флаги видимости и доступа
 *
 * Если тип узла не поддерживается, функция возвращает исходный объект без изменений.
 * Функция не перезаписывает уже существующие поля, а только добавляет недостающие.
 */
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
