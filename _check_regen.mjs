import { generatePythonCode } from './lib/bot-generator.ts';
import fs from 'fs';
const project = JSON.parse(fs.readFileSync('bots/импортированный_проект_1723_60_53/project.json', 'utf-8'));
const code = generatePythonCode(project, { botName: 'ImportedBot1723', userDatabaseEnabled: true, projectId: 60, enableComments: false });
for (const fn of ['save_user_to_db', 'is_admin', 'init_database', 'handle_command_start', 'log_message']) {
  const count = (code.match(new RegExp(`(async )?def ${fn}`, 'g')) || []).length;
  console.log(`${fn}: ${count}`);
}
