import { generateKeyboard } from './lib/templates/keyboard/keyboard.renderer.ts';

const result = generateKeyboard({
  keyboardType: 'inline',
  buttons: [
    { id: 'btn1', text: 'B1', action: 'goto', target: 'x' },
    { id: 'btn2', text: 'B2', action: 'goto', target: 'y' },
  ],
  keyboardLayout: {
    rows: [{ buttonIds: ['btn1', 'btn2'] }],
    columns: 2,
    autoLayout: false,
  },
  nodeId: 'test',
  indentLevel: '    ',
});

console.log(result);
