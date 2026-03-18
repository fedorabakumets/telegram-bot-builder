import { generatePythonCode } from './lib/bot-generator.ts';

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

const code = generatePythonCode(p, {
  botName: 'TestReply',
  userDatabaseEnabled: false,
  enableComments: false,
});

console.log('=== Reply Keyboard Test ===');
console.log('Has ReplyKeyboardBuilder:', code.includes('ReplyKeyboardBuilder'));

// Покажем импорты
const importSection = code.split('\n').slice(0, 50).join('\n');
console.log('\n=== Import section ===');
console.log(importSection);
