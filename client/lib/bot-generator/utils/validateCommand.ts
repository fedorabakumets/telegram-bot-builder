export function validateCommand(command: string): { isValid: boolean; errors: string[]; } {
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

  return {
    isValid: errors.length === 0,
    errors
  };
}
