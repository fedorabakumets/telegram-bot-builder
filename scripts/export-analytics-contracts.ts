/**
 * @fileoverview Экспорт OpenAPI и карточек MCP новой аналитики без подключения к БД и запуска приложения.
 * @module scripts/export-analytics-contracts
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { registerAnalyticsV2Paths } from '../server/swagger/paths/analytics-v2-paths';
import { registerAnalyticsV2Tools } from '../lib/bot-tools/mcp-register-analytics-v2-tools';
/** Единый служебный заголовок документации. */
const overview = '<!--\n@fileoverview Контракт аналитики v2, автоматически экспортированный из регистрации.\n-->\n\n';
/** Примеры с действительной формой параметров; ID иллюстративные. */
const examples: Record<string, unknown> = {
  db_get_analytics_v2: { project_id: 12, token_id: 3, period: '7d', comparison: 'previous', timezone: 'Europe/Moscow' },
  db_get_acquisition_report: { project_id: 12, from: '2026-11-01T00:00:00+03:00', to: '2026-11-02T00:00:00+03:00', currency: 'RUB' },
  db_get_analytics_history: { project_id: 12, resource: 'expenses', resource_id: 8 },
  db_create_analytics_source: { project_id: 12, data: { name: 'Канал партнёра', kind: 'telegram', url: 'https://t.me/example' } },
  db_create_analytics_placement: { project_id: 12, data: { name: 'Публикация 1 ноября', tokenId: 3, sourceId: 4, startsOn: '2026-11-01', timezone: 'Europe/Moscow' } },
  db_create_analytics_link: { project_id: 12, data: { placementId: 6, purpose: 'acquisition' } },
  db_create_analytics_expense: { project_id: 12, data: { placementId: 6, day: '2026-11-01', amount: '3000.00', currency: 'RUB', allocation: 'single' } },
};
/** Экспортирует только принадлежащие аналитике пути, не изменяя сторонние контракты. */
async function main(): Promise<void> {
  const registry = new OpenAPIRegistry();
  registerAnalyticsV2Paths(registry, [{ cookieAuth: [] }, { agentToken: [] }]);
  const fragment = new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.3', info: { title: 'Analytics', version: '2' } });
  const specPath = resolve('docs/api/openapi.json');
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  spec.paths = { ...spec.paths, ...fragment.paths };
  spec.components ??= {};
  spec.components.schemas = { ...spec.components.schemas, ...fragment.components?.schemas };
  spec.tags ??= [];
  if (!spec.tags.some((tag: { name: string }) => tag.name === 'analytics-v2')) spec.tags.push({ name: 'analytics-v2', description: 'Подтверждённая аналитика, источники и рекламные расходы' });
  writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
  const operationLines = Object.entries(fragment.paths).flatMap(([path, operations]) => Object.entries(operations ?? {}).map(([method, operation]) => {
    const item = operation as { summary?: string; description?: string };
    return `### ${method.toUpperCase()} ${path}\n\n${item.summary}\n\n${item.description ?? 'Доступ: session cookie либо Bearer PAT, в пределах проекта.'}\n`;
  }));
  writeFileSync(resolve('docs/api/analytics-v2.md'), overview + '# API аналитики v2\n\nПолные схемы запросов и ответов: [OpenAPI](openapi.json). Практические примеры и живые обновления: [руководство](analytics-v2-guide.md).\n\n' + operationLines.join('\n'), 'utf8');
  const server = new McpServer({ name: 'analytics-docs', version: '2' });
  registerAnalyticsV2Tools(server);
  const client = new Client({ name: 'docs-export', version: '2' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(st); await client.connect(ct);
    const { tools } = await client.listTools();
    for (const tool of tools) {
      const example = examples[tool.name] ?? (tool.name.startsWith('db_update_') ? { project_id: 12, resource_id: 8, data: { archived: true } } : { project_id: 12 });
      const content = overview + `# ${tool.name}\n\n${tool.description}\n\n## Параметры\n\nСхема публикуется самим MCP и совпадает с авторизованным HTTP API:\n\n\`\`\`json\n${JSON.stringify(tool.inputSchema, null, 2)}\n\`\`\`\n\n## Пример\n\n\`\`\`json\n${JSON.stringify({ tool: tool.name, arguments: example }, null, 2)}\n\`\`\`\n\n## Ответ и ошибки\n\nОтвет API сохраняется без пересчёта. Денежные значения — строки; null цены не равен нулю. В отчётах учитывайте as_of/asOf, coverage, complete и reason. Старые сборки ботов дают неполную историю. Код HTTP 400 означает некорректные параметры, 403 — чужой проект/бот, 404 — отсутствующий объект, 409 — конфликт маршрута start, 503 — временную недоступность. Ошибка помечена isError.\n\n${tool.annotations?.readOnlyHint ? 'Инструмент только читает данные.' : 'Инструмент изменяет указанные рекламные данные проекта; архивирование сохраняет историю.'}\n\nСвязанный процесс: [аналитика и реклама](../workflows/analytics-acquisition.md).\n`;
      for (const directory of ['docs/mcp/tools', 'lib/generated/mcp-docs/tools']) {
        mkdirSync(resolve(directory), { recursive: true });
        writeFileSync(resolve(directory, `${tool.name}.md`), content, 'utf8');
      }
    }
    for (const directory of ['docs/mcp/tools', 'lib/generated/mcp-docs/tools']) {
      const names = readdirSync(resolve(directory)).filter(name => name.endsWith('.md') && name !== 'README.md').sort();
      writeFileSync(resolve(directory, 'README.md'), overview + `# Карточки MCP-инструментов\n\nВсего карточек: ${names.length}. Фактическую схему проверяйте через tools/list.\n\n` + names.map(name => `- [${name.slice(0, -3)}](${name})`).join('\n') + '\n', 'utf8');
    }
    mkdirSync(resolve('lib/generated/mcp-docs/workflows'), { recursive: true });
    writeFileSync(resolve('lib/generated/mcp-docs/workflows/analytics-acquisition.md'), readFileSync(resolve('docs/mcp/workflows/analytics-acquisition.md'), 'utf8'), 'utf8');
    console.log(`Экспортированы ${Object.keys(fragment.paths).length} путей OpenAPI и ${tools.length} карточек MCP`);
  } finally { await client.close(); await server.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
