import { generatePythonCode } from './lib/bot-generator.ts';
import fs from 'fs';
const project = JSON.parse(fs.readFileSync('bots/импортированный_проект_1723_60_53/project.json', 'utf-8'));
const code = generatePythonCode(project, { botName: 'ImportedBot1723', userDatabaseEnabled: true, projectId: 60, enableComments: false });
fs.writeFileSync('bots/импортированный_проект_1723_60_53/generated_bot.py', code, 'utf-8');
const m = code.match(/\n{4,}/g);
console.log('4+ blocks:', m ? m.length : 0);
console.log('lines:', code.split('\n').length);
