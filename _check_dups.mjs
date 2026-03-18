import { readFileSync } from 'fs';
import { generatePythonCode } from './lib/bot-generator.js';
const proj = JSON.parse(readFileSync('bots/импортированный_проект_1723_60_53/project.json', 'utf-8'));
const code = generatePythonCode(proj, { botName: 'Test', userDatabaseEnabled: true, projectId: 60 });
console.log('save_user_to_db count:', [...code.matchAll(/async def save_user_to_db/g)].length);
console.log('is_admin count:', [...code.matchAll(/async def is_admin/g)].length);
console.log('init_database count:', [...code.matchAll(/async def init_database/g)].length);
console.log('handle_command_start count:', [...code.matchAll(/async def handle_command_start/g)].length);
