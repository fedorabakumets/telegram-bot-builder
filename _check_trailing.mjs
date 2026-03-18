import { generateMessageLoggingCode } from './lib/templates/middleware/middleware.renderer.js';
const code = generateMessageLoggingCode(true, true, 49);
const trailing = code.match(/\n+$/);
console.log('trailing newlines in loggingCode:', trailing ? trailing[0].length : 0);
console.log('last 300 chars:', JSON.stringify(code.slice(-300)));
