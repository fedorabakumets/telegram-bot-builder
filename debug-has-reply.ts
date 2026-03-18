import { hasReplyKeyboardButtons } from './lib/templates/filters/node-predicates.ts';

// Тест 1: reply клавиатура без кнопок
const nodes1: any = [{
  data: { keyboardType: 'reply', buttons: [] }
}];
console.log('Test 1 (reply keyboardType, no buttons):', hasReplyKeyboardButtons(nodes1));

// Тест 2: reply клавиатура с кнопками
const nodes2: any = [{
  data: { keyboardType: 'reply', buttons: [{ id: '1', text: 'Btn', action: 'goto', target: 'x' }] }
}];
console.log('Test 2 (reply keyboardType, with buttons):', hasReplyKeyboardButtons(nodes2));

// Тест 3: inline клавиатура
const nodes3: any = [{
  data: { keyboardType: 'inline', buttons: [] }
}];
console.log('Test 3 (inline keyboardType):', hasReplyKeyboardButtons(nodes3));
