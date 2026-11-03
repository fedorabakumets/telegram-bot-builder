/**
 * @fileoverview Проверки фактического сохранения старых MCP-действий без живых проектов и ботов.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectInDb, renameProjectInDb, archiveProjectInDb, deleteProjectInDb, reorderProjectsInDb } from './project-ops-db.ts';
import { deleteVersionInDb, pruneVersionsInDb } from './version-ops-db.ts';
import { startBotInDb, stopBotInDb, restartAllBotsInDb, deleteBotTokenInDb } from './bot-runtime-db.ts';
import { updateBotTokenInDb } from './bot-token-update-db.ts';
/** Возвращает мок-ответ API с заданным состоянием. */
function reply(value: unknown, status = 200) { vi.mocked(fetch).mockResolvedValueOnce(Response.json(value, { status })); }
/** Перечитывает точный сценарий из последнего отправленного запроса создания. */
function createdProjectReply() {
 vi.mocked(fetch).mockImplementationOnce(async () => {
  const calls = vi.mocked(fetch).mock.calls;
  const payload = JSON.parse(String(calls[calls.length - 2][1]?.body));
  return Response.json({ id: 8, name: 'Новый', data: payload.data });
 });
}
describe('старые изменяющие инструменты', () => {
 beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
 afterEach(() => vi.unstubAllGlobals());
 it('создание подтверждает существование проекта повторным чтением', async () => {
  reply({ id: 8, name: 'Новый' }, 201); createdProjectReply();
  expect(await createProjectInDb('Новый')).toMatchObject({ projectId: 8, outcome: 'saved', persistence: { confirmed: true, method: 'readback' } });
 });
 it('одна requestId создаёт одинаковое тело после повторной генерации scaffold', async () => {
  reply({ id: 8, name: 'Новый' }, 201); createdProjectReply();
  reply({ id: 8, name: 'Новый' }, 201); createdProjectReply();
  const options = { requestId: 'cae87b13-0ce8-4780-b9f8-3543d398dfb0' };
  await createProjectInDb('Новый', options); await createProjectInDb('Новый', options);
  expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe(vi.mocked(fetch).mock.calls[2][1]?.body);
 });
 it('HTTP 201 без доступного созданного проекта не означает сохранение', async () => {
  reply({ id: 8, name: 'Новый' }, 201); reply({}, 404);
  expect(await createProjectInDb('Новый')).toMatchObject({ outcome: 'unknown', receipt: { projectId: 8 } });
 });
 it('не теряет checkpoint созданного проекта из durable HTTP 202', async () => {
  reply({ state: 'unknown', requestId: 'cae87b13-0ce8-4780-b9f8-3543d398dfb0', retryable: false, receipt: { id: 8, name: 'Новый', token: 'не выводить' } }, 202);
  const result = await createProjectInDb('Новый');
  expect(result).toMatchObject({ outcome: 'unknown', retryable: false, receipt: { projectId: 8 } });
  expect(JSON.stringify(result)).not.toContain('не выводить'); expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('переименование не подменяет сохранённое имя запрошенным', async () => {
  reply({}); reply({ id: 1, name: 'Старое' });
  expect(await renameProjectInDb(1, 'Новое')).toMatchObject({ outcome: 'unknown' });
 });
 it('архив требует проект в личном архиве после записи', async () => {
  reply({ success: true }); reply([]);
  expect(await archiveProjectInDb(1)).toMatchObject({ outcome: 'unknown' });
 });
 it('частично применённый порядок не выдаётся за подтверждённое сохранение', async () => {
  reply({ success: true }); reply({ id: 1, sortOrder: 0 }); reply({ id: 2, sortOrder: 99 });
  expect(await reorderProjectsInDb([1, 2])).toMatchObject({ outcome: 'unknown' });
 });
 it('удаление подтверждается отсутствием проекта, а не текстом success', async () => {
  reply({ message: 'success' }); reply({ id: 1 });
  expect(await deleteProjectInDb(1, { confirm: true })).toMatchObject({ outcome: 'unknown' });
  reply({ message: 'success' }); reply({}, 404);
  expect(await deleteProjectInDb(1, { confirm: true })).toMatchObject({ outcome: 'saved', deleted: true });
 });
 it('удаление версии не считает deleted:false успехом', async () => {
  reply({ deleted: false }); expect(await deleteVersionInDb(1, 2)).toMatchObject({ outcome: 'unknown' }); expect(fetch).toHaveBeenCalledTimes(1);
 });
 it('очистка версий требует фактического числа RETURNING, включая честный ноль', async () => {
  reply({ deleted: 4 }); expect(await pruneVersionsInDb(1)).toMatchObject({ outcome: 'unknown' });
  reply({ deleted: 0, persistence: { confirmed: true, projectId: 1, affectedRows: 0 } });
  expect(await pruneVersionsInDb(1)).toMatchObject({ deleted: 0, outcome: 'saved' });
 });
 it('новый секрет токена требует квитанции совпадения поля, без возврата секрета', async () => {
  const secret = `123456789:${'a'.repeat(35)}`;
  reply({ id: 2 }); expect(await updateBotTokenInDb(1, 2, secret)).toMatchObject({ outcome: 'unknown' });
  reply({ id: 2, token: secret, persistence: { confirmed: true, resourceId: 2, projectId: 1, secretMatched: true } });
  const saved = await updateBotTokenInDb(1, 2, secret); expect(saved).toMatchObject({ outcome: 'saved' }); expect(JSON.stringify(saved)).not.toContain(secret);
 });
 it('принятие запуска не означает работающий процесс', async () => {
  reply({ message: 'queued' }); expect(await startBotInDb(1)).toMatchObject({ outcome: 'pending', persistence: { confirmed: false } });
 });
 it('остановка требует stopped при повторном чтении', async () => {
  reply({ message: 'ok' }); reply({ status: 'running' });
  expect(await stopBotInDb(1, 2, { confirm: true })).toMatchObject({ outcome: 'unknown' });
  reply({ message: 'ok' }); reply({ status: 'stopped', restorePending: false });
  expect(await stopBotInDb(1, 2, { confirm: true })).toMatchObject({ outcome: 'saved', effect: 'external' });
 });
 it('частичные рестарты не становятся полным успехом', async () => {
  reply({ restarted: 1, failed: 1, results: [] }); expect(await restartAllBotsInDb(1, { confirm: true })).toMatchObject({ outcome: 'partial' });
 });
 it('удалённый токен проверяется по авторизованному списку', async () => {
  reply({ message: 'ok' }); reply([{ id: 2 }]); expect(await deleteBotTokenInDb(1, 2, { confirm: true })).toMatchObject({ outcome: 'unknown' });
 });
});
