import { Node } from '../../../shared/schema';

export function generateBotFatherCommands(nodes: Node[]): string {
  const commandNodes = nodes.filter(node => node.type === 'command' && node.data.command);
  
  if (commandNodes.length === 0) {
    return '';
  }

  let commands = '';
  commandNodes.forEach(node => {
    const command = node.data.command?.replace('/', '') || 'unknown';
    const description = node.data.description || 'Описание отсутствует';
    commands += `${command} - ${description}\n`;
  });

  return commands.trim();
}