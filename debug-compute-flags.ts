import { createGenerationContext } from './lib/bot-generator/core/create-generation-context.ts';
import { computeFeatureFlags } from './lib/bot-generator/core/feature-flags.ts';
import { hasReplyKeyboardButtons } from './lib/templates/filters/node-predicates.ts';

// Создаём чистый проект с reply клавиатурой
const p: any = {
  sheets: [{
    id: 'sheet1',
    name: 'Main',
    nodes: [{
      id: 'start1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        command: '/start',
        messageText: 'Привет!',
        keyboardType: 'reply',
        buttons: [],
        showInMenu: true,
        description: 'Запустить бота',
      },
    }],
    connections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewState: { pan: { x: 0, y: 0 }, zoom: 100 },
  }],
  version: 2,
  activeSheetId: 'sheet1',
};

const context = createGenerationContext(p, 'TestBot', [], { enableComments: false });

console.log('Context nodes:', context.nodes);
console.log('Node 0 keyboardType:', context.nodes[0]?.data?.keyboardType);

// Прямая проверка hasReplyKeyboardButtons
console.log('hasReplyKeyboardButtons(context.nodes):', hasReplyKeyboardButtons(context.nodes));

// Проверка флагов
const flags = computeFeatureFlags(context);
console.log('flags.hasReplyKeyboardResult:', flags.hasReplyKeyboardResult);
