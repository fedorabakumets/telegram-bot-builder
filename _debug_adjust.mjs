import { computeAdjustStr } from './lib/templates/keyboard/keyboard.renderer.ts';

const layout = {
  rows: [{ buttonIds: ['btn1', 'btn2'] }],
  columns: 2,
  autoLayout: false,
};

console.log('adjustStr:', computeAdjustStr(layout));
