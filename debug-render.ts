import { renderPartialTemplate } from './lib/templates/template-renderer.ts';

// Тест с hasReplyKeyboard: true
const result1 = renderPartialTemplate('imports/imports.py.jinja2', {
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

console.log('=== With hasReplyKeyboard: true ===');
console.log('Has ReplyKeyboardBuilder:', result1.includes('ReplyKeyboardBuilder'));
console.log('\n=== Result ===');
console.log(result1);

// Тест с hasReplyKeyboard: false
const result2 = renderPartialTemplate('imports/imports.py.jinja2', {
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
  hasReplyKeyboard: false,
  hasLocalMediaFiles: false,
  hasBotCommands: true,
});

console.log('\n=== With hasReplyKeyboard: false ===');
console.log('Has ReplyKeyboardBuilder:', result2.includes('ReplyKeyboardBuilder'));
