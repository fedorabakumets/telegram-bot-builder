/**
 * @fileoverview Юнит-тесты `buildOrderedEntries` — упорядочивание file_id по
 * токенам ботов для столбца таблицы: выбранный токен первым, остальные по
 * возрастанию tokenId; при пустой карте — одиночный fileId (Req 8.3).
 * Соответствует разделу «buildFileIdsByToken (приоритет/порядок)» задачи 10.1.
 * @module components/editor/files/tests/cell-file-ids.test
 */

import { describe, it, expect } from 'vitest';

import { buildOrderedEntries } from '../panel/table/cell-file-ids';
import type { ProjectFile } from '../hooks/use-project-files';

/**
 * Создаёт минимальную запись `ProjectFile` для тестов.
 * @param over - Частичные поля файла
 * @returns Объект ProjectFile с дефолтами
 */
function makeFile(over: Partial<ProjectFile>): ProjectFile {
  return {
    id: 1,
    source: 'uploaded',
    mediaType: 'photo',
    fileId: null,
    fileName: 'f.jpg',
    fileSize: 1,
    duration: null,
    createdAt: null,
    ...over,
  };
}

describe('buildOrderedEntries', () => {
  it('ставит выбранный токен первым (Req 8.3)', () => {
    const file = makeFile({ fileIdsByToken: { 1: 'A', 5: 'B', 3: 'C' } });
    const entries = buildOrderedEntries(file, 5);
    expect(entries[0]).toEqual({ tokenId: 5, fileId: 'B' });
  });

  it('сортирует остальные токены по возрастанию tokenId (детерминированный порядок)', () => {
    const file = makeFile({ fileIdsByToken: { 9: 'X', 2: 'Y', 7: 'Z' } });
    const entries = buildOrderedEntries(file, 7);
    expect(entries.map((e) => e.tokenId)).toEqual([7, 2, 9]);
  });

  it('при отсутствии выбранного токена сортирует строго по возрастанию', () => {
    const file = makeFile({ fileIdsByToken: { 3: 'A', 1: 'B', 2: 'C' } });
    const entries = buildOrderedEntries(file, null);
    expect(entries.map((e) => e.tokenId)).toEqual([1, 2, 3]);
  });

  it('даёт детерминированный результат независимо от порядка ключей карты', () => {
    const a = buildOrderedEntries(makeFile({ fileIdsByToken: { 1: 'A', 2: 'B', 3: 'C' } }), 2);
    const b = buildOrderedEntries(makeFile({ fileIdsByToken: { 3: 'C', 2: 'B', 1: 'A' } }), 2);
    expect(a).toEqual(b);
    expect(a.map((e) => e.tokenId)).toEqual([2, 1, 3]);
  });

  it('возвращает одиночный fileId при пустой карте (обратная совместимость)', () => {
    const file = makeFile({ fileId: 'SINGLE', tokenId: 8, fileIdsByToken: {} });
    expect(buildOrderedEntries(file)).toEqual([{ tokenId: 8, fileId: 'SINGLE' }]);
  });

  it('возвращает tokenId=null для одиночного fileId без привязки токена', () => {
    const file = makeFile({ fileId: 'SINGLE', tokenId: null });
    expect(buildOrderedEntries(file)).toEqual([{ tokenId: null, fileId: 'SINGLE' }]);
  });

  it('возвращает пустой массив, когда нет ни карты, ни одиночного fileId', () => {
    expect(buildOrderedEntries(makeFile({ fileId: null }))).toEqual([]);
  });
});
