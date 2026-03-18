import { createGenerationContext } from './lib/bot-generator/core/create-generation-context.ts';
import { computeFeatureFlags } from './lib/bot-generator/core/feature-flags.ts';

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
const flags = computeFeatureFlags(context);

console.log('hasReplyKeyboardResult:', flags.hasReplyKeyboardResult);
console.log('hasInlineButtonsResult:', flags.hasInlineButtonsResult);
console.log('hasBotCommandsResult:', flags.hasBotCommandsResult);
