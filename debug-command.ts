import { generateCommand } from './lib/bot-generator/templates/command/command.renderer';
import { validParamsWithKeyboard, validParamsWithSynonyms, validParamsWithChecks } from './lib/bot-generator/templates/command/command.fixture';

console.log('=== validParamsWithKeyboard ===');
const keyboardOutput = generateCommand(validParamsWithKeyboard);
console.log(keyboardOutput);
console.log('\n=== Includes checks ===');
console.log('InlineKeyboardBuilder:', keyboardOutput.includes('InlineKeyboardBuilder'));
console.log('InlineKeyboardButton:', keyboardOutput.includes('InlineKeyboardButton'));
console.log('url=:', keyboardOutput.includes('url='));
console.log('https://example.com:', keyboardOutput.includes('https://example.com'));

console.log('\n=== validParamsWithSynonyms ===');
const synonymsOutput = generateCommand(validParamsWithSynonyms);
console.log(synonymsOutput.substring(0, 2000));
console.log('\n=== Includes checks ===');
console.log('ReplyKeyboardBuilder:', synonymsOutput.includes('ReplyKeyboardBuilder'));
console.log('synonym:', synonymsOutput.includes('synonym'));
console.log('chat.type:', synonymsOutput.includes('chat.type'));

console.log('\n=== validParamsWithChecks ===');
const checksOutput = generateCommand(validParamsWithChecks);
console.log(checksOutput.substring(0, 2000));
console.log('\n=== Includes checks ===');
console.log('parse_mode:', checksOutput.includes('parse_mode'));
console.log('HTML:', checksOutput.includes('HTML'));
