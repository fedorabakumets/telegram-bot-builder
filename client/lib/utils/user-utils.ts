/**
 * Список всех системных переменных, доступных пользователям
 */
export const SYSTEM_VARIABLES = {
  user_name: {
    description: 'Имя пользователя для отображения (приоритет: first_name > username > "Пользователь")',
    example: 'Алексей',
    source: 'Telegram API'
  },
  first_name: {
    description: 'Имя пользователя из профиля Telegram',
    example: 'Алексей',
    source: 'Telegram API'
  },
  last_name: {
    description: 'Фамилия пользователя из профиля Telegram',
    example: 'Иванов',
    source: 'Telegram API'
  },
  username: {
    description: 'Никнейм пользователя в Telegram (без @)',
    example: 'alex123',
    source: 'Telegram API'
  }
} as const;

/**
 * Генерирует документацию по доступным переменным
 * @returns строка с документацией
 */
export function generateVariablesDocumentation(): string {
  let doc = '# Доступные системные переменные\n\n';
  
  Object.entries(SYSTEM_VARIABLES).forEach(([varName, info]) => {
    doc += `## {${varName}}\n`;
    doc += `- **Описание**: ${info.description}\n`;
    doc += `- **Пример**: ${info.example}\n`;
    doc += `- **Источник**: ${info.source}\n\n`;
  });
  
  return doc;
}