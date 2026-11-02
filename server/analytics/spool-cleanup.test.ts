/** @fileoverview Проверки изоляции очистки очереди, повторного удаления и защиты путей. */
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { deleteAnalyticsSpool } from './spool-cleanup';
/** Только временные корни текущего теста. */
const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
/** Создаёт изолированное дерево без настоящих аналитических данных. */
async function root(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'analytics-cleanup-')); roots.push(directory);
  for (const scope of ['12/3','12/4','13/3']) {
    await mkdir(join(directory, scope), { recursive: true });
    await writeFile(join(directory, scope, 'pending.sqlite3'), 'тест');
  }
  return directory;
}
describe('Очистка локальных фактов удалённой области', () => {
  it('удаляет только выбранного бота, затем выбранный проект; повтор безопасен', async () => {
    const directory = await root();
    await deleteAnalyticsSpool(12, 3, directory);
    await expect(readFile(join(directory, '12/3/pending.sqlite3'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(join(directory, '12/4/pending.sqlite3'), 'utf8')).toBe('тест');
    await deleteAnalyticsSpool(12, undefined, directory);
    await deleteAnalyticsSpool(12, undefined, directory);
    expect(await readFile(join(directory, '13/3/pending.sqlite3'), 'utf8')).toBe('тест');
  });
  it('отклоняет нечисловые, отрицательные и неконечные области до файловых операций', async () => {
    const directory = await root();
    for (const id of [-1, 0, NaN, Infinity, '../13' as unknown as number]) await expect(deleteAnalyticsSpool(id, undefined, directory)).rejects.toThrow('Некорректная область');
    await expect(deleteAnalyticsSpool(12, -3, directory)).rejects.toThrow('Некорректная область');
    expect(await readFile(join(directory, '13/3/pending.sqlite3'), 'utf8')).toBe('тест');
  });
  it('не следует ссылкам проекта или бота за пределы корня', async () => {
    const directory = await root(), outside = await root();
    await symlink(join(outside, '13'), join(directory, '14'), process.platform === 'win32' ? 'junction' : 'dir');
    await expect(deleteAnalyticsSpool(14, undefined, directory)).rejects.toThrow('символической');
    await expect(deleteAnalyticsSpool(14, 3, directory)).rejects.toThrow('Реальный каталог');
    expect(await readFile(join(outside, '13/3/pending.sqlite3'), 'utf8')).toBe('тест');
  });
});
