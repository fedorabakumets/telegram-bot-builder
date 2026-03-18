import { toEnhancedNodes } from './lib/bot-generator/core/to-enhanced-node.ts';

// Создаём чистый проект с reply клавиатурой
const nodes: any = [{
  id: 'start1',
  type: 'start',
  position: { x: 0, y: 0 },
  data: {
    command: '/start',
    messageText: 'Привет!',
    keyboardType: 'reply',
    buttons: [],
  },
}];

const enhanced = toEnhancedNodes(nodes);
console.log('Enhanced nodes:', enhanced);
console.log('Node 0 keyboardType:', enhanced[0]?.data?.keyboardType);
