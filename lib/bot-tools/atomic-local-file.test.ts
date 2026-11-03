/**
 * @fileoverview Проверки атомарных локальных файлов в изолированном временном каталоге.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { atomicWriteVerified } from './atomic-local-file.ts';
import { saveProject } from './project-io.ts';
import { scaffoldMinimalProject } from './project-mutate.ts';
vi.mock('node:fs/promises', async () => { const actual = await vi.importActual<typeof fs>('node:fs/promises'); return { ...actual, rename: vi.fn(actual.rename) }; });
let temporaryRoot = '';
describe('атомарная запись локального файла', () => {
 beforeEach(async () => { temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'botcraft-local-proof-')); });
 afterEach(async () => {
  vi.restoreAllMocks();
  // Удаляем только созданный тестом каталог непосредственно внутри системного temp.
  if (path.dirname(path.resolve(temporaryRoot)) !== path.resolve(os.tmpdir())) throw new Error('Небезопасный путь очистки теста');
  await fs.rm(temporaryRoot, { recursive: true, force: true });
 });
 it('возвращает local_file и hash только после повторного чтения', async () => {
  const target = path.join(temporaryRoot, 'file.json');
  await fs.writeFile(target, 'old'); const receipt = await atomicWriteVerified(target, 'new', temporaryRoot);
  expect(await fs.readFile(target, 'utf8')).toBe('new'); expect(receipt).toMatchObject({ effect: 'local_file', outcome: 'saved', persistence: { confirmed: true } });
  expect(await fs.readdir(temporaryRoot)).toEqual(['file.json']);
 });
 it('ошибка rename сохраняет предыдущий файл и удаляет временный', async () => {
  const target = path.join(temporaryRoot, 'file.json'); await fs.writeFile(target, 'old');
  vi.mocked(fs.rename).mockRejectedValueOnce(new Error('rename denied'));
  await expect(atomicWriteVerified(target, 'new', temporaryRoot)).rejects.toMatchObject({ outcome: 'error' });
  expect(await fs.readFile(target, 'utf8')).toBe('old'); expect(await fs.readdir(temporaryRoot)).toEqual(['file.json']);
 });
 it('save_project сохраняет локальный JSON, не объявляя запись в приложение', async () => {
  vi.spyOn(process, 'cwd').mockReturnValue(temporaryRoot);
  const result = await saveProject('test-bot', scaffoldMinimalProject().project);
  expect(result).toMatchObject({ effect: 'local_file', outcome: 'saved', persistence: { confirmed: true } });
  expect(JSON.parse(await fs.readFile(path.join(temporaryRoot, 'bots', 'test-bot', 'project.json'), 'utf8'))).toHaveProperty('sheets');
 });
});
