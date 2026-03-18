import { generateImports } from './lib/templates/imports/imports.renderer.ts';

// Тест с reply клавиатурой
const imports1 = generateImports({
  userDatabaseEnabled: false,
  hasInlineButtons: false,
  hasAutoTransitions: false,
  hasMediaNodes: false,
  hasUploadImages: false,
  hasParseModeNodes: false,
  hasMediaGroups: false,
  hasUrlImages: false,
  hasDatetimeNodes: false,
  hasTimezoneNodes: false,
  hasReplyKeyboard: true,
  hasLocalMediaFiles: false,
  hasBotCommands: true,
});

console.log('=== With Reply Keyboard ===');
console.log('Has ReplyKeyboardBuilder:', imports1.includes('ReplyKeyboardBuilder'));
console.log('\n=== Imports ===');
console.log(imports1);
