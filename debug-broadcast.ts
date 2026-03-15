import { generateBroadcast } from './lib/bot-generator/templates/broadcast/broadcast.renderer';
import { validParamsClientBroadcast } from './lib/bot-generator/templates/broadcast/broadcast.fixture';

console.log('=== validParamsClientBroadcast ===');
const result = generateBroadcast(validParamsClientBroadcast);
console.log(result.substring(0, 2000));
console.log('\n=== Includes checks ===');
console.log('handle_broadcast:', result.includes('handle_broadcast'));
console.log('client:', result.includes('client'));
console.log('broadcast_2:', result.includes('broadcast_2'));
