/** @fileoverview Карточки и JSON-каталог из реальных контрактов SDK, без regex-разбора TypeScript. */
import { mkdir, readdir, unlink, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { readMcpDefinitions } from './read-definitions';
import { writeGeneratedFile } from './write-file';

/** Рабочая копия репозитория. */
const root = process.cwd();
const remote = await readMcpDefinitions(false);
const local = await readMcpDefinitions(true);
const remoteIds = new Set(remote.map(action => action.id));
const actions = local.map(action => ({ ...action, transports: remoteIds.has(action.id) ? ['http', 'stdio'] : ['stdio'] }));
for (const directory of [join(root, 'docs/mcp/tools'), join(root, 'lib/generated/mcp-docs/tools')]) {
  await mkdir(directory, { recursive: true });
  const expected = new Set(actions.map(action => `${action.id}.md`));
  for (const name of await readdir(directory)) {
    if (name !== 'README.md' && name.endsWith('.md') && !expected.has(name)) await unlink(join(directory, name));
  }
  for (const action of actions) {
    if (!/^[a-z0-9_]+$/.test(action.id)) throw new Error(`Недопустимый ID карточки: ${action.id}`);
    const example = 'example' in action ? `\`\`\`json\n${JSON.stringify({ action_id: action.id, args: action.example }, null, 2)}\n\`\`\`\n\nСтруктурный пример проверен Zod; ID и данные замените реальными.` : 'Безопасный универсальный пример не сгенерирован. Используйте точную схему и данные пользователя; секреты в документацию не подставляются.';
    const output = action.outputSchema ? `\n\n### Схема результата\n\n\`\`\`json\n${JSON.stringify(action.outputSchema, null, 2)}\n\`\`\`` : '';
    const content = `<!-- @fileoverview Автоматическая карточка реального действия MCP. -->\n# \`${action.id}\`\n\n${action.description ?? ''}\n\nРаздел: ${action.section}. Транспорт: ${action.transports.join(', ')}.\n\n## Параметры\n\n\`\`\`json\n${JSON.stringify(action.inputSchema, null, 2)}\n\`\`\`\n\n## Эффект\n\n\`\`\`json\n${JSON.stringify(action.policy, null, 2)}\n\`\`\`\n\n## Пример вызова\n\n${example}\n\n## Ответ и ошибки\n\nПрежний text content сохранён. Метаданные \`_meta.botcraft\` различают prepared/read/saved/pending/partial/unknown/error/unverified. Только \`persistence.confirmed=true\` подтверждает сохранение. Неизвестный исход требует чтения состояния до повтора; live-доставка и применение ботом проверяются отдельно.${output}\n\n## Ограничения и безопасность\n\nИзучите describe_actions, проверьте реальные ID и права проекта. Для разрушительных и внешних действий требуется явное намерение пользователя. Для повторов сохраняйте requestId, если он объявлен. Отсутствие ошибки транспорта не доказывает сохранение.\n`;
    await writeGeneratedFile(join(directory, `${action.id}.md`), content);
  }
  await writeGeneratedFile(join(directory, 'README.md'), `# Каталог действий MCP\n\nСгенерировано из SDK: ${actions.length} действий.\n\n${actions.map(action => `- [${action.id}](${action.id}.md)`).join('\n')}\n`);
}
await writeGeneratedFile(join(root, 'docs/mcp/action-catalog.json'), JSON.stringify({ version: 1, actions }, null, 2));
for (const section of ['nodes', 'rules', 'workflows', 'reference']) {
  await cp(join(root, 'docs/mcp', section), join(root, 'lib/generated/mcp-docs', section), { recursive: true });
}
console.log(`MCP: ${remote.length} HTTP, ${local.length} stdio; карточки и каталог обновлены.`);
