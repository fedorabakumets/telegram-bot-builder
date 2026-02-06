import { BotData } from '@shared/schema';
import { extractNodesAndConnections } from "../MediaHandler/extractNodesAndConnections";
import { validateCommand } from "./validateCommand";


export function validateBotStructure(botData: BotData): { isValid: boolean; errors: string[]; } {
  const errors: string[] = [];
  const { nodes } = extractNodesAndConnections(botData);

  // Check if there's a start node
  const startNodes = (nodes || []).filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push("Бот должен содержать хотя бы одну стартовую команду");
  }
  if (startNodes.length > 1) {
    errors.push("Бот может содержать только одну стартовую команду");
  }

  // Validate each node
  nodes.forEach(node => {
    // Пропускаем валидацию для стартовых узлов без команды
    if (node.type === 'start' && !node.data.command) {
      return; // это просто стартовый узел, не требуется команда
    }

    // Для узлов command требуем текст, для остальных это опционально
    if (!node.data.messageText && node.type === 'command') {
      errors.push(`Узел "${node.id}" должен содержать текст сообщения`);
    }

    // Validate commands
    if ((node.type === 'start' || node.type === 'command') && node.data.command) {
      const commandValidation = validateCommand(node.data.command);
      if (!commandValidation.isValid) {
        errors.push(...commandValidation.errors.map(err => `Команда "${node.data.command}": ${err}`));
      }
    }

    // Валидация кнопок
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      node.data.buttons.forEach((button: { text: string; action: string; url: any; }) => {
        if (!button.text.trim()) {
          errors.push(`Кнопка в узле "${node.id}" должна содержать текст`);
        }
        if (button.action === 'url' && !button.url) {
          errors.push(`Кнопка "${button.text}" должна содержать URL`);
        }
        // Проверка цели перехода для кнопок с действием goto опциональна
        // Кнопка может работать без целевого узла
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
