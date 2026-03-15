import { generateConfig } from './lib/bot-generator/templates/config/config.renderer';
import { validParamsAllEnabled, validParamsAllDisabled } from './lib/bot-generator/templates/config/config.fixture';

console.log('=== validParamsAllEnabled ===');
const allEnabled = generateConfig(validParamsAllEnabled);
console.log(allEnabled);
console.log('\n=== validParamsAllDisabled ===');
const allDisabled = generateConfig(validParamsAllDisabled);
console.log(allDisabled);
