import { generateMultiSelectButtonHandler } from './lib/templates/handlers/multi-select-button-handler/multi-select-button-handler.renderer.ts';
import { validParamsMetroSelection } from './lib/templates/handlers/multi-select-button-handler/multi-select-button-handler.fixture.ts';

const result = generateMultiSelectButtonHandler(validParamsMetroSelection);
const idx = result.indexOf('show_metro_keyboard');
console.log('show_metro_keyboard at:', idx);
if (idx >= 0) {
  console.log(result.substring(idx, idx + 50));
}
// Search for True
console.log('True occurrences:', (result.match(/True/g) || []).length);
const idx2 = result.indexOf('show_metro_keyboard = True');
console.log('exact match:', idx2);
