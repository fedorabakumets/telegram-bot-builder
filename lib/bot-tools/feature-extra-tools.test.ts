/** @fileoverview Проверки новых разделов на изолированном HTTP хранилище. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerProjectFilesTools } from './mcp-register-project-files-tools';
import { registerBotSettingsTools } from './mcp-register-bot-settings-tools';
import { registerTemplateTools } from './mcp-register-template-tools';
import { registerVersionLogExtraTools } from './mcp-register-version-log-extra-tools';
import { z } from 'zod';
import { setBotSettings, botEnvRequest, setBotProfile } from './bot-settings-db';
import { projectFilesRequest, uploadProjectBytes } from './project-files-db';
import { templatesRequest } from './templates-db';
import { createVersionCheckpoint } from './version-log-extra-db';
import { getBotSettingsHandler } from '../../server/routes/projectRoutes/handlers/getBotSettingsHandler';
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), token: vi.fn() }));
vi.mock('./api-fetch.ts', () => ({ apiFetch: mocks.fetch }));
vi.mock('../../server/storages/storage', () => ({ storage: { getBotToken: mocks.token } }));
/** Создаёт JSON ответ имитации API. */
function response(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status }); }
beforeEach(() => { vi.resetAllMocks(); });
describe('Файлы, настройки, шаблоны и версии', () => {
  it('регистрирует все действия и отвергает серверные пути и неизвестные настройки', () => {
    const tools = new Map<string, any>();
    const server = { registerTool: (name: string, config: unknown) => tools.set(name, config) };
    for (const register of [registerProjectFilesTools, registerBotSettingsTools, registerTemplateTools, registerVersionLogExtraTools]) register(server as never);
    expect(tools.size).toBe(24);
    expect(z.object(tools.get('db_upload_project_file').inputSchema).safeParse({ project_id: 12, file_name: '../private', mime_type: 'text/plain', base64: 'eA==' }).success).toBe(false);
    expect(z.object(tools.get('db_set_bot_settings').inputSchema).safeParse({ project_id: 12, token_id: 9, change: { setting: '../reveal' } }).success).toBe(false);
    expect([...tools.keys()].some(name => /reveal|agent_token|storage_config/.test(name))).toBe(false);
  });
  it('проверяет сохранённое состояние настройки повторным чтением', async () => {
    const state = { id: 9, projectId: 12, logLevel: 'INFO' };
    mocks.fetch.mockImplementation(async (_path, init) => { if (init.method === 'PUT') { Object.assign(state, JSON.parse(init.body)); return response({ success: true }); } return response(state); });
    const value = await setBotSettings(12, 9, { setting: 'log-level', logLevel: 'ERROR' });
    expect(value.persistence?.confirmed).toBe(true);
    expect(state.logLevel).toBe('ERROR');
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });
  it('не выдаёт успешную запись при несовпадении повторного чтения', async () => {
    mocks.fetch.mockResolvedValueOnce(response({ success: true })).mockResolvedValueOnce(response({ logLevel: 'INFO' }));
    expect((await setBotSettings(12, 9, { setting: 'log-level', logLevel: 'ERROR' })).error).toBeDefined();
  });
  it('скрывает все значения ENV после записи и чтения', async () => {
    const stored: any[] = [];
    mocks.fetch.mockImplementation(async (_path, init) => { if (init.method === 'POST') { const value = { id: 1, ...JSON.parse(init.body) }; stored.push(value); return response(value); } return response({ items: stored }); });
    const saved = await botEnvRequest(12, 9, 'POST', undefined, { key: 'PASSWORD', value: 'secret', isSecret: 0 });
    const read = await botEnvRequest(12, 9);
    expect(stored[0].value).toBe('secret');
    expect(JSON.stringify([saved, read])).not.toContain('secret');
    expect(read.items[0].key).toBe('PASSWORD');
  });
  it('проверяет проект токена до безопасного DTO и исключает секреты', async () => {
    mocks.token.mockResolvedValue({ id: 9, projectId: 13, token: 'secret' });
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await getBotSettingsHandler({ params: { id: '12', tokenId: '9' } } as never, res as never);
    expect(res.status).toHaveBeenCalledWith(404);
    mocks.token.mockResolvedValue({ id: 9, projectId: 12, token: 'secret', webhookSecretToken: 'secret', logLevel: 'INFO' });
    await getBotSettingsHandler({ params: { id: '12', tokenId: '9' } } as never, res as never);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('secret');
  });
  it('загружает байты multipart без чтения файлов сервера и скрывает filePath', async () => {
    mocks.fetch.mockResolvedValue(response({ id: 1, projectId: 12, filePath: 'C:/private', fileName: 'a.txt' }));
    const value = await uploadProjectBytes(12, 'a.txt', 'text/plain', Buffer.from('Привет').toString('base64'));
    expect(value.filePath).toBeUndefined();
    expect(mocks.fetch.mock.calls[0][1].body).toBeInstanceOf(FormData);
    expect(await uploadProjectBytes(12, 'a.txt', 'text/plain', 'bad')).toHaveProperty('error');
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });
  it('передаёт фильтры файлов и запрещает выдавать success при отказе удаления', async () => {
    mocks.fetch.mockResolvedValueOnce(response({ files: [{ id: 1, filePath: 'secret' }] })).mockResolvedValueOnce(response({ success: false }));
    const list = await projectFilesRequest(12, 'GET', { category: 'uploaded', fileName: 'a & b' });
    expect(JSON.stringify(list)).not.toContain('secret');
    expect(mocks.fetch.mock.calls[0][0]).toContain('fileName=a+%26+b');
    expect(await projectFilesRequest(12, 'DELETE', {}, { items: [{ id: 1, source: 'uploaded' }] })).toHaveProperty('error');
  });
  it('создаёт checkpoint и подтверждает чтением сохранённой версии', async () => {
    const state: any[] = [];
    mocks.fetch.mockImplementation(async (_path, init) => { if (init.method === 'POST') { state.push({ id: 3, projectId: 12, snapshot: {}, label: JSON.parse(init.body).message }); return response(state[0]); } return response(state[0]); });
    expect((await createVersionCheckpoint(12, 'До правки')).persistence?.confirmed).toBe(true);
    expect(state[0].label).toBe('До правки');
  });
  it('сохраняет шаблон в изолированном API и возвращает отказ на чужой ресурс', async () => {
    const state: any[] = [];
    mocks.fetch.mockImplementation(async (path, init) => { if (path.endsWith('/99')) return response({}, 403); if (init.method === 'POST') { state.push({ id: 1, ...JSON.parse(init.body) }); return response(state[0]); } return response(state[0]); });
    await templatesRequest('POST', undefined, { name: 'Пример', data: {} });
    expect((await templatesRequest('GET', 1)).name).toBe('Пример');
    expect(await templatesRequest('PUT', 99, { name: 'Чужой' })).toHaveProperty('error');
  });
});
