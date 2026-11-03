/**
 * @fileoverview Изолированная проверка MCP чтения, сохранения и защиты от потери изменений.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { updateProjectInDb } from './project-db.ts';
import { fetchProjectFromDb } from './project-db-read.ts';
import { updateNodeInDb } from './node-ops-db.ts';
import { applyOpsInDb } from './batch-ops.ts';
import { moveSheetToProjectInDb } from './sheet-move-ops-db.ts';
/** Создаёт валидный сценарий для проверок сохранения. */
function scenario() { return { version: 2, activeSheetId: 's', sheets: [{ id: 's', name: 'Лист', nodes: [{ id: 'm', type: 'message', position: { x: 0, y: 0 }, data: { messageText: 'До', buttons: [] } }] }] }; }
/** Создаёт квитанцию сервера после реальной записи. */
function receipt(revision = 8) { return { id: 1, revision, persistence: { confirmed: true, projectId: 1, revision }, sideEffects: { liveBroadcast: 'failed' } }; }
describe('подтверждение записи MCP', () => {
 beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
 afterEach(() => vi.unstubAllGlobals());
 it('передаёт прочитанную ревизию и возвращает подтверждённую запись с отдельным эффектом broadcast', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: scenario(), revision: 7 })).mockResolvedValueOnce(Response.json(receipt()));
  const result = await updateNodeInDb(1, 'm', { data: { messageText: 'После' } }, undefined, { skipValidation: true });
  const request = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
  expect(request.expectedRevision).toBe(7);
  expect(request.data.sheets[0].nodes[0].data.messageText).toBe('После');
  expect(result).toMatchObject({ ok: true, outcome: 'saved', persistence: { confirmed: true, revision: 8 }, sideEffects: { liveBroadcast: 'failed' } });
 });
 it('не считает пустой или неподтверждённый 2xx сохранением', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ id: 1, revision: 8 }));
  expect(await updateProjectInDb(1, scenario(), { skipValidation: true })).toHaveProperty('error');
 });
 it('помечает нечитаемую квитанцию и обрыв связи неизвестным исходом', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('not json', { status: 200 }));
  expect(await updateProjectInDb(1, scenario(), { skipValidation: true })).toMatchObject({ outcome: 'unknown' });
  vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
  expect(await updateProjectInDb(1, scenario(), { skipValidation: true })).toMatchObject({ outcome: 'unknown' });
 });
 it('не выдаёт HTTP 500 за гарантированное отсутствие записи', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ error: 'server' }, { status: 500 }));
  expect(await updateProjectInDb(1, scenario(), { skipValidation: true })).toMatchObject({ outcome: 'unknown', status: 500 });
 });
 it('не пишет после отсутствующей ноды', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: scenario(), revision: 7 }));
  expect(await updateNodeInDb(1, 'missing', { data: { messageText: 'X' } })).toHaveProperty('error');
  expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('не пишет частично успешную пачку', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: scenario(), revision: 7 }));
  const result = await applyOpsInDb(1, [{ op: 'update_node', node_id: 'm', patch: { data: { messageText: 'X' } } }, { op: 'remove_node', node_id: 'missing' }]);
  expect(result).toMatchObject({ failedIndex: 1 });
  expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('не выполняет незащищённый RMW против старого сервера без revision', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: scenario() }));
  expect(await fetchProjectFromDb(1)).toHaveProperty('error');
 });
 it('возвращает частичный перенос, если цель сохранена, а источник конфликтует', async () => {
  const source = scenario(); source.sheets.push({ ...structuredClone(source.sheets[0]), id: 'other' });
  const target = scenario(); target.sheets[0].id = 'target'; target.activeSheetId = 'target';
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: source, revision: 7 }))
   .mockResolvedValueOnce(Response.json({ data: target, revision: 2 }))
   .mockResolvedValueOnce(Response.json({ id: 2, revision: 3, persistence: { confirmed: true, projectId: 2, revision: 3 } }))
   .mockResolvedValueOnce(Response.json({ code: 'PROJECT_CONFLICT' }, { status: 409 }));
  const result = await moveSheetToProjectInDb(1, 2, 's', 'move', { skipValidation: true });
  expect(result).toMatchObject({ outcome: 'partial', persistence: { confirmed: true, projectId: 2, revision: 3 } });
  expect(vi.mocked(fetch).mock.calls.slice(2).map((call) => JSON.parse(String(call[1]?.body)).expectedRevision)).toEqual([2, 7]);
 });
 it('возвращает конфликт вместо автоматического перезаписывания', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ data: scenario(), revision: 7 })).mockResolvedValueOnce(Response.json({ code: 'PROJECT_CONFLICT' }, { status: 409 }));
  expect(await updateNodeInDb(1, 'm', { data: { messageText: 'X' } }, undefined, { skipValidation: true })).toMatchObject({ status: 409 });
  expect(fetch).toHaveBeenCalledTimes(2);
 });
});
