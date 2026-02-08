// Стандартные команды Telegram и их описания
export const STANDARD_COMMANDS = [
  {
    command: '/start',
    description: 'Начать работу с ботом',
    category: 'system',
    showInMenu: true
  },
  {
    command: '/help',
    description: 'Показать справку',
    category: 'system',
    showInMenu: true
  },
  {
    command: '/settings',
    description: 'Настройки бота',
    category: 'system',
    showInMenu: true
  },
  {
    command: '/menu',
    description: 'Главное меню',
    category: 'navigation',
    showInMenu: true
  },
  {
    command: '/profile',
    description: 'Профиль пользователя',
    category: 'user',
    showInMenu: true
  },
  {
    command: '/info',
    description: 'Информация о боте',
    category: 'system',
    showInMenu: true
  },
  {
    command: '/cancel',
    description: 'Отменить текущее действие',
    category: 'system',
    showInMenu: false
  },
  {
    command: '/back',
    description: 'Вернуться назад',
    category: 'navigation',
    showInMenu: false
  },
  {
    command: '/support',
    description: 'Техническая поддержка',
    category: 'system',
    showInMenu: true
  },
  {
    command: '/about',
    description: 'О боте',
    category: 'system',
    showInMenu: true
  },
  {
    command: '/subscribe',
    description: 'Подписаться на уведомления',
    category: 'user',
    showInMenu: true
  },
  {
    command: '/unsubscribe',
    description: 'Отписаться от уведомлений',
    category: 'user',
    showInMenu: false
  },
  {
    command: '/feedback',
    description: 'Оставить отзыв',
    category: 'user',
    showInMenu: true
  },
  {
    command: '/language',
    description: 'Выбрать язык',
    category: 'system',
    showInMenu: true
  },
  {
    command: '/notifications',
    description: 'Настройки уведомлений',
    category: 'user',
    showInMenu: true
  }
];

export const COMMAND_CATEGORIES = {
  system: 'Системные',
  user: 'Пользовательские',
  navigation: 'Навигация',
  admin: 'Администрирование'
};

// Валидация команды
export function validateCommand(command: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!command) {
    errors.push('Команда не может быть пустой');
    return { isValid: false, errors };
  }
  
  if (!command.startsWith('/')) {
    errors.push('Команда должна начинаться с символа "/"');
  }
  
  if (command.length < 2) {
    errors.push('Команда должна содержать хотя бы один символ после "/"');
  }
  
  if (command.length > 32) {
    errors.push('Команда не может быть длиннее 32 символов');
  }
  
  // Проверка на допустимые символы
  const validPattern = /^\/[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!validPattern.test(command)) {
    errors.push('Команда может содержать только латинские буквы, цифры и подчёркивания');
  }
  
  // Проверка на зарезервированные команды Telegram
  const reservedCommands = ['/newbot', '/mybots', '/setname', '/setdescription', '/setabouttext', '/setuserpic', '/setinline', '/setjoingroups', '/setprivacy'];
  if (reservedCommands.includes(command.toLowerCase())) {
    errors.push('Эта команда зарезервирована системой Telegram');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Генерация автодополнения команд
export function getCommandSuggestions(input: string): typeof STANDARD_COMMANDS {
  if (!input.startsWith('/')) {
    return [];
  }
  
  const query = input.toLowerCase();
  return STANDARD_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query.slice(1))
  ).slice(0, 10);
}

// Получение команды по тексту
export function parseCommandFromText(text: string): string | null {
  if (!text || !text.startsWith('/')) {
    return null;
  }
  
  const match = text.match(/^\/([a-zA-Z][a-zA-Z0-9_]*)/);
  return match ? `/${match[1]}` : null;
}

// Генерация BotFather команд для настройки меню
export function generateBotFatherCommands(nodes: any[]): string {
  if (!nodes || !Array.isArray(nodes)) {
    return '';
  }
  
  const commandNodes = nodes.filter(node =>
    node &&
    (node.type === 'start' || node.type === 'command') &&
    node.data?.command &&
    (node.data?.showInMenu !== false) // Включаем команды где showInMenu = true, undefined или не установлено
  );
  
  if (commandNodes.length === 0) {
    return '';
  }
  
  let botFatherCommands = '';
  
  commandNodes.forEach(node => {
    const command = node.data.command.replace('/', '');
    const description = node.data.description || 'Команда бота';
    botFatherCommands += `${command} - ${description}\n`;
  });
  
  return botFatherCommands.trim();
}