/**
 * @fileoverview Узкие проверки MCP-каталога документации.
 * @module lib/bot-tools/mcp-tool-docs.test
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import * as filesystem from 'node:fs/promises';
import { readKnownDoc, searchKnownDocs } from './mcp-doc-files.ts';
import { registerMcpTools } from './mcp-register-tools.ts';
import { registerToolDocsTools } from './mcp-tool-docs.ts';

/** Обёртка позволяет подставлять Dirent без требования Windows на создание ссылок. */
vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  return { ...actual, readdir: vi.fn(actual.readdir) };
});

/** Эмуляция MCP-сервера для проверки зарегистрированных обработчиков. */
function makeServer() {
  const handlers = new Map<string, (args: Record<string, string>) => Promise<unknown>>();
  return {
    handlers,
    registerTool(name: string, _options: unknown, handler: (args: Record<string, string>) => Promise<unknown>) {
      handlers.set(name, handler);
      return {
        /** Имитирует удаление регистрации в компактном профиле. */
        remove: () => handlers.delete(name),
      };
    },
  };
}

describe('MCP документация инструментов', () => {

  /** Правила сохранения доступны агенту через реальный reader без браузера. */
  it('читает актуальное руководство подтверждения записи и конфликтов', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('get_rule_docs')?.({ rule_name: 'persistence' });
    const text = (response as { content: Array<{ text: string }> }).content[0].text;
    const body = JSON.parse(text);
    expect(body.content).toContain('persistence.confirmed=true');
    expect(body.content).toContain('expected_revision');
    expect(body.content).toContain('0039_action_requests.sql');
    expect(response).not.toHaveProperty('isError', true);
  });

  /** Символьные ссылки не становятся разрешёнными идентификаторами карточек. */
  it('исключает символьные ссылки из чтения и поиска', async () => {
    const entries = [
      { name: 'outside.md', isFile: () => false },
      { name: 'README.md', isFile: () => true },
    ];
    const listing = vi.spyOn(filesystem, 'readdir').mockResolvedValue(entries as never);
    try {
      expect(await readKnownDoc('/docs', 'outside')).toBeUndefined();
      expect(await searchKnownDocs('/docs', 'outside')).toEqual([]);
      const server = makeServer();
      registerToolDocsTools(server as never);
      const response = await server.handlers.get('get_workflow_docs')?.({ task: 'outside' });
      expect(JSON.parse((response as { content: Array<{ text: string }> }).content[0].text)).toHaveProperty('error');
    } finally {
      listing.mockRestore();
    }
  });


  /** Не допускает чтения файлов за пределами разрешённого раздела. */
  it.each([
    ['get_tool_docs', 'tool_name'], ['get_node_docs', 'node_type'], ['get_rule_docs', 'rule_name'],
  ])('защищает %s от подстановки пути', async (tool, parameter) => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    for (const id of ['../../../../AGENTS', '..\\rules\\variables', '../rules/variables', 'C:\\AGENTS', '/AGENTS']) {
      const response = await server.handlers.get(tool)?.({ [parameter]: id });
      const text = (response as { content: Array<{ text: string }> }).content[0].text;
      expect(JSON.parse(text)).toHaveProperty('error');
      expect(response).toHaveProperty('isError', true);
      expect(text).not.toContain('Правила JSDoc');
      expect(text).not.toContain('checked');
    }
  });

  /** Русское описание файловой карточки доступно без встроенной краткой справки. */
  it('ищет по русскому содержимому обычных карточек', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('search_tool_docs')?.({ query: '  РЕКЛАМНЫЕ РАСХОДЫ  ' });
    const text = (response as { content: Array<{ text: string }> }).content[0].text;
    expect(JSON.parse(text).matches).toContain('db_get_acquisition_report');
  });

  it('возвращает содержимое Markdown-карточки', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('get_tool_docs')?.({ tool_name: 'get_node_example' });
    const text = (response as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('# `get_node_example`');
    expect(text).toContain('## Параметры');
  });

  it('ищет карточки по имени', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('search_tool_docs')?.({ query: 'get_node_schema' });
    const text = (response as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('get_node_schema');
  });

  it('возвращает подробные guides нод и правила', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const node = await server.handlers.get('get_node_docs')?.({ node_type: 'input' });
    const rule = await server.handlers.get('get_rule_docs')?.({ rule_name: 'variables' });
    expect((node as { content: Array<{ text: string }> }).content[0].text).toContain('inputVariable');
    expect((rule as { content: Array<{ text: string }> }).content[0].text).toContain('{name}');
  });

  it('ищет по всем разделам документации', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('search_docs')?.({ query: 'inputVariable' });
    expect((response as { content: Array<{ text: string }> }).content[0].text).toContain('nodes');
  });

  it('возвращает workflow для кнопочной навигации', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('get_workflow_docs')?.({ task: 'исправить навигацию кнопки' });
    const text = (response as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('db_report_button_navigation');
  });

  it('возвращает workflow калькулятора', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('get_workflow_docs')?.({ task: 'сделать калькулятор' });
    const text = (response as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('get_node_docs(input)');
  });

  it('не маскирует неизвестный тул как существующий', async () => {
    const server = makeServer();
    registerToolDocsTools(server as never);
    const response = await server.handlers.get('get_tool_docs')?.({ tool_name: 'unknown_tool' });
    const text = (response as { content: Array<{ text: string }> }).content[0].text;
    expect(text).toContain('Карточка не найдена');
  });

  it('каталог соответствует реальной регистрации и содержит заполненные карточки', async () => {
    const directory = join(process.cwd(), 'docs', 'mcp', 'tools');
    const files = (await readdir(directory)).filter((file) => file.endsWith('.md') && file !== 'README.md');
    /** Фактическая регистрация учитывает также динамические имена инструментов. */
    const registry = makeServer();
    registerMcpTools(registry as never, { enableFileTools: true });
    const compactRegistry = makeServer();
    registerMcpTools(compactRegistry as never, { profile: 'compact', enableFileTools: true });
    const registeredNames = [...registry.handlers.keys()]
      .filter((name) => !compactRegistry.handlers.has(name)).map((name) => `${name}.md`);
    expect([...files].sort()).toEqual([...new Set(registeredNames)].sort());
    for (const file of files) {
      const content = await readFile(join(directory, file), 'utf8');
      expect(content.replace(/^<!--[^]*?-->\s*/, '').startsWith('# ')).toBe(true);
      expect(content).toContain('## Параметры');
      expect(content).toMatch(/## (Ограничения и безопасность|Ответ и ошибки)/);
    }
  });
});
