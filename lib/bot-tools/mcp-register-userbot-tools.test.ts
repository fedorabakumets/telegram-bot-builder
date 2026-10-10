/**
 * @fileoverview Проверка схем и обработчиков MCP-настройки юзербота.
 * @module lib/bot-tools/mcp-register-userbot-tools.test
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { registerUserbotTools } from './mcp-register-userbot-tools.ts';
import { UserbotPutRequestSchema, UserbotSendCodeRequestSchema } from '../../server/swagger/schemas/project-tokens-userbot.ts';

/** Зарегистрированный инструмент для проверки публичного контракта */
interface RegisteredTool {
  /** Схема входных параметров */
  schema: z.ZodObject<z.ZodRawShape>;
  /** Обработчик инструмента */
  call: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Собирает реальные схемы и обработчики без запуска транспорта.
 * @returns Карта зарегистрированных инструментов
 */
function collectTools(): Map<string, RegisteredTool> {
  const tools = new Map<string, RegisteredTool>();
  const server = {
    /**
     * Запоминает инструмент для проверки.
     * @param name - Имя инструмента
     * @param config - Схема параметров
     * @param call - Обработчик
     * @returns Ничего
     */
    registerTool(name: string, config: { /** Схема входа */ inputSchema: z.ZodRawShape }, call: RegisteredTool['call']) {
      tools.set(name, { schema: z.object(config.inputSchema), call });
    },
  };
  registerUserbotTools(server as unknown as McpServer);
  return tools;
}

afterEach(() => vi.unstubAllGlobals());

describe('публичные контракты юзербота', () => {
  it('принимает только корректные идентификаторы и состояние режима', () => {
    const tools = collectTools();
    const settings = tools.get('db_set_userbot_settings')!.schema;
    expect(settings.safeParse({ project_id: 1, token_id: 2, enabled: 0 }).success).toBe(true);
    expect(settings.safeParse({ project_id: 1, token_id: 2, enabled: 2 }).success).toBe(false);
    for (const tool of tools.values()) {
      expect(tool.schema.safeParse({ project_id: -1, token_id: 2 }).success).toBe(false);
    }
    const send = tools.get('db_userbot_send_code')!.schema;
    expect(send.safeParse({ project_id: 1, token_id: 2, api_id: '123', phone: '+7900' }).success).toBe(true);
    expect(send.safeParse({ project_id: 1, token_id: 2, api_id: '', phone: '+7900' }).success).toBe(false);
    const signIn = tools.get('db_userbot_sign_in')!.schema;
    expect(signIn.safeParse({ project_id: 1, token_id: 2, phone: '+7900', code: '' }).success).toBe(false);
    const twoFactor = tools.get('db_userbot_sign_in_2fa')!.schema;
    expect(twoFactor.parse({ project_id: 1, token_id: 2, password: ' pass ' }).password).toBe(' pass ');
    expect(twoFactor.safeParse({ project_id: 1, token_id: 2, password: '' }).success).toBe(false);
  });
  it('каждый обработчик вызывает нужный маршрут и возвращает текстовый результат', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ ok: true, success: true, userbotEnabled: 1 })));
    vi.stubGlobal('fetch', fetchMock);
    const tools = collectTools();
    const inputs = [
      ['db_set_userbot_settings', { enabled: 1 }, '/userbot'],
      ['db_userbot_send_code', { api_id: '123', phone: '+7900' }, '/userbot/send-code'],
      ['db_userbot_sign_in', { phone: '+7900', code: '12345' }, '/userbot/sign-in'],
      ['db_userbot_sign_in_2fa', { password: 'pass' }, '/userbot/sign-in-2fa'],
    ] as const;
    for (const [name, fields, suffix] of inputs) {
      const tool = tools.get(name)!;
      const result = await tool.call(tool.schema.parse({ project_id: 1, token_id: 2, ...fields }));
      expect(result).toMatchObject({ content: [{ type: 'text', text: expect.stringContaining('"ok": true') }] });
      expect(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0]).toEqual(expect.stringContaining(`/api/projects/1/tokens/2${suffix}`));
    }
  });
  it('OpenAPI разрешает пропущенные поля, как действующий REST API', () => {
    expect(UserbotPutRequestSchema.safeParse({ userbotEnabled: 0 }).success).toBe(true);
    expect(UserbotSendCodeRequestSchema.safeParse({ apiId: '123', phone: '+7900' }).success).toBe(true);
  });
});
