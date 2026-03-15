import { generateDatabase } from './lib/bot-generator/templates/database/database.renderer';

console.log('=== userDatabaseEnabled=false ===');
const disabled = generateDatabase({ userDatabaseEnabled: false });
console.log(JSON.stringify(disabled));
console.log('=== userDatabaseEnabled=true ===');
const enabled = generateDatabase({ userDatabaseEnabled: true });
console.log(JSON.stringify(enabled.substring(0, 500)));
