import { generateDatabaseCode } from './lib/templates/database/database-code.renderer.js';
const nodes = [
  { type: 'start', id: 'start1', data: { buttons: [] } },
  { type: 'message', id: 'msg1', data: { buttons: [{ action: 'goto', target: 'x' }] } }
];
const code = generateDatabaseCode(true, nodes);
const leading = code.match(/^\n+/);
console.log('leading newlines in databaseCode:', leading ? leading[0].length : 0);
console.log('first 200 chars:', JSON.stringify(code.slice(0, 200)));
