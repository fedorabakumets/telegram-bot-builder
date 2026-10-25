/**
 * @fileoverview Генератор Markdown-карточек MCP из регистрации инструментов.
 * @module tools/generate-mcp-docs
 */

import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Корень каталога MCP-карточек. */
const outputDir = join(process.cwd(), 'docs', 'mcp', 'tools');
/** Runtime-каталог документации, который попадает в Docker вместе с lib. */
const runtimeDir = join(process.cwd(), 'lib', 'generated', 'mcp-docs');
/** Каталог автоматически разделённых старых разделов. */
const referenceDir = join(process.cwd(), 'docs', 'mcp', 'reference');
/** Файлы регистрации MCP-инструментов. */
const sourceFiles = ['lib/bot-tools/mcp-register-tools.ts', ...await import('node:fs/promises').then(({ readdir }) => readdir('lib/bot-tools')).then((files) => files.filter((file) => file.startsWith('mcp-register-') && file.endsWith('.ts')).map((file) => join('lib/bot-tools', file)))];

/** Извлекает имя инструмента и описание из вызова registerTool. */
function collectTools(source) {
  const tools = [];
  const pattern = /registerTool\(\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) {
    const nextTool = source.indexOf('registerTool(', match.index + match[0].length);
    const context = source.slice(match.index, nextTool === -1 ? match.index + 4000 : nextTool);
    const descriptionMatch = context.match(/description:\s*(['"`])([\s\S]*?)\1/);
    const params = [...context.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*):\s*z\.([A-Za-z]+)/g)]
      .filter((item) => item[1] !== 'description')
      .map((item) => {
        const lineEnd = context.indexOf('\n', item.index);
        const fieldSource = context.slice(item.index, lineEnd === -1 ? item.index + 180 : lineEnd);
        return { name: item[1], type: item[2], required: !/\.optional\(\)/.test(fieldSource) };
      });
    tools.push({ name: match[1], description: descriptionMatch?.[2]?.replace(/\s+/g, ' ').trim() ?? '', params: [...new Map(params.map((param) => [param.name, param])).values()] });
  }
  return tools;
}

/** Определяет, меняет ли тул состояние проекта или бота. */
function isMutating(name, description) {
  return /^(add|create|delete|remove|update|rename|move|restore|duplicate|save|connect|disconnect|start|stop|restart|rewrite|apply|set|archive|unarchive|clear|reorder|prune|send|sign|check_chat)/.test(name) || /live|измен|добав|удал|запуск|останов|перезапуск|запис/i.test(description);
}

/** Возвращает карточку инструмента в Markdown. */
function renderTool({ name, description, params }) {
  const mutating = isMutating(name, description);
  const parameterList = params.length ? params.map((param) => `- \`${param.name}\` — ${param.type}; ${param.required ? 'обязательный' : 'необязательный'} параметр.`).join('\\n') : '- Инструмент не объявляет именованных параметров.';
  const safety = mutating
    ? 'Тул может изменять live-БД, проект или состояние бота. Выполняй его только в рамках явной просьбы пользователя и проверь результат после операции.'
    : 'Тул только читает данные или выполняет проверку; он не должен изменять проект, БД или состояние бота.';
  return `# \`${name}\`\n\n## Назначение\n\n${description || 'Назначение определяется контрактом MCP-инструмента.'}\n\n## Когда использовать\n\nИспользуй этот тул только после проверки его фактической схемы и контекста задачи. Если задача относится к другой операции, сначала найди связанный workflow через \`get_workflow_docs\`.\n\n## Параметры\n\nТочные параметры и обязательность берутся из схемы MCP-регистрации. Перед вызовом проверь описание инструмента в MCP-клиенте; не придумывай отсутствующие поля.\n\n## Пример вызова\n\n\`\`\`json\n{\n  "tool": "${name}",\n  "arguments": {}\n}\n\`\`\`\n\n## Пример успешного ответа\n\nФорма ответа зависит от параметров и текущего состояния проекта. Сохрани фактический ответ MCP и проверь поле ошибки, если оно присутствует.\n\n## Типичные ошибки\n\n- Переданы неизвестные или пропущенные обязательные параметры.\n- Использован ID другого проекта, листа или токена.\n- Следующая нода, цель перехода или запись не существует.\n- Агент не проверил ответ инструмента перед следующим действием.\n\n## Ограничения и безопасность\n\n${safety}\n${mutating ? '- Не перезапускай бота автоматически; перезапуск допустим только по явной просьбе пользователя.\n- После операции перечитай состояние и вызови подходящую проверку или логи.\n- Если тул требует `confirm`, передавай его только после подтверждения пользователя.' : '- Не трактуй отсутствие ошибки транспорта как подтверждение бизнес-корректности результата.\n- Для дальнейшего изменения используй отдельный mutating-тул после проверки данных.'}\n\n## Связанные инструменты\n\n- \`get_tool_docs\` — получить карточку этого и связанных тулов.\n- \`search_tool_docs\` — найти подходящие инструменты.\n- \`get_workflow_docs\` — получить рекомендуемую последовательность действий.\n\n## Рекомендуемый следующий шаг\n\nПроверь фактический ответ MCP, затем вызови следующий тул из соответствующего workflow.\n`;
}

const contents = await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8').catch(() => '')));
const tools = [...new Map(contents.flatMap(collectTools).map((tool) => [tool.name, tool])).values()].sort((a, b) => a.name.localeCompare(b.name));
await mkdir(outputDir, { recursive: true });
await Promise.all(tools.map((tool) => writeFile(join(outputDir, `${tool.name}.md`), renderTool(tool), 'utf8')));
await Promise.all(tools.map(async (tool) => {
  const file = join(outputDir, `${tool.name}.md`);
  const content = await readFile(file, 'utf8');
  const fields = tool.params.length ? tool.params.map((param) => `- \`${param.name}\` — ${param.type}; ${param.required ? 'обязательный' : 'необязательный'} параметр.`).join('\n') : '- Инструмент не объявляет именованных параметров.';
  const example = tool.params.length ? `"arguments": { "${tool.params[0].name}": "<значение>" }` : '"arguments": {}';
  const updated = content.replace('Точные параметры и обязательность берутся из схемы MCP-регистрации.', `${fields}\n\nТочные типы и обязательность берутся из схемы MCP-регистрации.`).replace('"arguments": {}', example);
  await writeFile(file, updated, 'utf8');
}));
const links = tools.map((tool) => `- [${tool.name}](${tool.name}.md)`).join('\\n');
const index = `# Карточки MCP-инструментов\\n\\nКарточки сгенерированы из фактической регистрации MCP. Read-only-тулы не изменяют состояние; live и destructive-тулы требуют проверки проекта и явной просьбы пользователя.\\n\\nВсего карточек: **${tools.length}**.\\n\\n## Список\\n\\n${links}\\n\\n## Обновление\\n\\nЗапусти node tools/generate-mcp-docs.mjs после изменения регистрации MCP, затем проверь узкие тесты.\\n`;
await writeFile(join(outputDir, 'README.md'), index, 'utf8');
const workflows = {
  'create-node': 'Создание новой ноды: list_node_types → get_node_schema → get_node_example → create_node → validate_node → validate_bot_project.',
  'update-project': 'Изменение проекта: get_project_db → найти нужные ноды → точечная операция → перечитать проект → validate_bot_project.',
  'button-navigation': 'Навигация кнопок: db_report_button_navigation → db_find_inbound → db_rewrite_button_navigation → validate_bot_project.',
  'input-flow': 'Сбор ввода: message → input с inputVariable → validation/condition → следующий узел; один активный input на ветку.',
  'code-flow': 'Вычисление: input сохраняет значения → code присваивает результат на верхнем уровне → message использует {answer}.',
  'calculator': 'Калькулятор: два input с validationType=number → keyboard → input callback → code → message с {answer}.',
  'start-bot': 'Запуск: db_list_bot_tokens → db_bot_status → db_start_bot → db_bot_status → db_bot_logs.',
  'restart-bot': 'Перезапуск только по явной просьбе: db_bot_status → db_restart_bot → db_bot_status → db_bot_logs.',
  'diagnose-logs': 'Диагностика: db_bot_status → db_bot_logs → db_search_bot_logs → исправление → повторная проверка.',
  'tables': 'Таблицы: db_find_tables → db_list_table_columns → чтение/запись → проверить ответ и ограничения.',
  'telethon-userbot': 'Telethon Userbot: db_set_userbot_settings → db_userbot_send_code → db_userbot_sign_in → при needs_2fa db_userbot_sign_in_2fa → db_restart_bot по просьбе.',
};
const workflowDir = join(process.cwd(), 'docs', 'mcp', 'workflows');
await mkdir(workflowDir, { recursive: true });
await Promise.all(Object.entries(workflows).map(async ([name, text]) => {
  const file = join(workflowDir, `${name}.md`);
  await access(file).catch(() => writeFile(file, `# Workflow: ${name}\n\n${text}\n\nНе выполняй live-операции без подтверждённого проекта и явной просьбы пользователя. После изменения проверь фактический ответ MCP.\n`, 'utf8'));
}));
await mkdir(runtimeDir, { recursive: true });
await Promise.all(['tools', 'nodes', 'rules', 'workflows'].map(async (directory) => {
  await cp(join(process.cwd(), 'docs', 'mcp', directory), join(runtimeDir, directory), { recursive: true });
}));
const legacy = await readFile(join(process.cwd(), 'docs', 'mcp', 'legacy', 'bot-json-prompt-source.md'), 'utf8');
const sections = [...legacy.matchAll(/^#{2,3} .+$/gm)];
await mkdir(referenceDir, { recursive: true });
await Promise.all(sections.map(async (section, index) => {
  const end = sections[index + 1]?.index ?? legacy.length;
  const title = section[0].replace(/^#+\s*/, '').trim();
  const slug = `${String(index + 1).padStart(3, '0')}-${title.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '')}.md`;
  await writeFile(join(referenceDir, slug), `# ${title}\n\n${legacy.slice(section.index + section[0].length, end).trim()}\n`, 'utf8');
}));
await cp(referenceDir, join(runtimeDir, 'reference'), { recursive: true });
console.log(`Создано карточек: ${tools.length}`);
