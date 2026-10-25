/**
 * @fileoverview Узкие проверки MCP-каталога документации.
 * @module lib/bot-tools/mcp-tool-docs.test
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { registerToolDocsTools } from './mcp-tool-docs.ts';

/** Эмуляция MCP-сервера для проверки зарегистрированных обработчиков. */
function makeServer() {
  const handlers = new Map<string, (args: Record<string, string>) => Promise<unknown>>();
  return {
    handlers,
    registerTool(name: string, _options: unknown, handler: (args: Record<string, string>) => Promise<unknown>) {
      handlers.set(name, handler);
    },
  };
}

describe('MCP документация инструментов', () => {
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

  it('каталог не содержит Markdown с fileoverview и пустых карточек', async () => {
    const directory = join(process.cwd(), 'docs', 'mcp', 'tools');
    const files = (await readdir(directory)).filter((file) => file.endsWith('.md') && file !== 'README.md');
    const registrationFiles = (await readdir(join(process.cwd(), 'lib', 'bot-tools'))).filter((file) => file.startsWith('mcp-register-') && file.endsWith('.ts'));
    const registration = (await Promise.all(registrationFiles.map((file) => readFile(join(process.cwd(), 'lib', 'bot-tools', file), 'utf8')))).join('\n');
    const registeredNames = [...registration.matchAll(/registerTool\(\s*['"]([^'"]+)['"]/g)].map((match) => `${match[1]}.md`);
    expect([...files].sort()).toEqual([...new Set(registeredNames)].sort());
    for (const file of files) {
      const content = await readFile(join(directory, file), 'utf8');
      expect(content.startsWith('# ')).toBe(true);
      expect(content).not.toContain('@fileoverview');
      expect(content).toContain('## Параметры');
      expect(content).toContain('## Ограничения и безопасность');
    }
  });
});
