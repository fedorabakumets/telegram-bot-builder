import { generateKeyboard } from './lib/templates/keyboard/keyboard.renderer.ts';

const params = {
  keyboardType: 'inline',
  buttons: [{ text: 'B', action: 'callback', target: 't', id: 'b1' }],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

// NO warm up - cold start like in tests
const s = Date.now();
for (let i = 0; i < 1000; i++) generateKeyboard(params);
console.log('cold 1000:', Date.now() - s, 'ms');