import { generateImports } from './lib/bot-generator/templates/imports/imports.renderer';
import { validParamsAllEnabled, validParamsAllDisabled } from './lib/bot-generator/templates/imports/imports.fixture';

console.log('=== validParamsAllEnabled ===');
const allEnabled = generateImports(validParamsAllEnabled);
console.log(allEnabled);
console.log('\n=== validParamsAllDisabled ===');
const allDisabled = generateImports(validParamsAllDisabled);
console.log(allDisabled);
