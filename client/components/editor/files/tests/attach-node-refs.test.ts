/**
 * @fileoverview Юнит-тесты помощников прикрепления файлов к ноде
 * (`attach-node-refs`): `toNodeRef`, `buildSelectedRefs`, `mergeAttachedMedia`,
 * `isFileIdRef`. Проверяют дедупликацию, одиночный/множественный режимы и
 * формирование JSON-записи file_id (Req 3.8, 8.3). Задача 10.1 (юнит-тесты).
 * @module components/editor/files/tests/attach-node-refs.test
 */

import { describe, it, expect } from 'vitest';

import {
  toNodeRef,
  buildSelectedRefs,
  mergeAttachedMedia,
  isFileIdRef,
} from '../panel/attach-node-refs';
import type { ProjectFile } from '../hooks/use-project-files';

/**
 * Создаёт минимальную запись `ProjectFile` для тестов, переопределяя нужные поля.
 * @param over - Частичные поля файла
 * @returns Объект ProjectFile с дефолтами
 */
function makeFile(over: Partial<ProjectFile>): ProjectFile {
  return {
    id: 1,
    source: 'uploaded',
    mediaType: 'photo',
    fileId: null,
    fileName: 'file.jpg',
    fileSize: 100,
    duration: null,
    createdAt: null,
    ...over,
  };
}

describe('toNodeRef', () => {
  it('возвращает url для файла с локальным объектом', () => {
    const file = makeFile({ url: '/uploads/1/pic.jpg' });
    expect(toNodeRef(file)).toBe('/uploads/1/pic.jpg');
  });

  it('обрезает пробелы у url', () => {
    const file = makeFile({ url: '  /uploads/a.png  ' });
    expect(toNodeRef(file)).toBe('/uploads/a.png');
  });

  it('строит JSON-запись file_id из карты fileIdsByToken', () => {
    const file = makeFile({ url: null, mediaType: 'video', fileIdsByToken: { 7: 'AAA', 3: 'BBB' } });
    const ref = toNodeRef(file);
    expect(ref).not.toBeNull();
    const parsed = JSON.parse(ref as string);
    expect(parsed).toEqual({
      __type: 'file_id',
      mediaType: 'video',
      fileIdsByToken: { '7': 'AAA', '3': 'BBB' },
    });
  });

  it('использует одиночный fileId с tokenId файла при пустой карте', () => {
    const file = makeFile({ url: null, fileId: 'SINGLE', tokenId: 42 });
    const parsed = JSON.parse(toNodeRef(file) as string);
    expect(parsed.fileIdsByToken).toEqual({ '42': 'SINGLE' });
  });

  it('использует selectedTokenId как ключ при отсутствии tokenId файла', () => {
    const file = makeFile({ url: null, fileId: 'SINGLE', tokenId: null });
    const parsed = JSON.parse(toNodeRef(file, 99) as string);
    expect(parsed.fileIdsByToken).toEqual({ '99': 'SINGLE' });
  });

  it('возвращает null, когда нет ни url, ни file_id', () => {
    const file = makeFile({ url: null, fileId: null, fileIdsByToken: {} });
    expect(toNodeRef(file)).toBeNull();
  });

  it('подставляет mediaType="photo" по умолчанию для file_id-файла', () => {
    const file = makeFile({ url: null, mediaType: null, fileIdsByToken: { 1: 'X' } });
    const parsed = JSON.parse(toNodeRef(file) as string);
    expect(parsed.mediaType).toBe('photo');
  });
});

describe('buildSelectedRefs', () => {
  it('дедуплицирует одинаковые ссылки внутри набора (Req 3.8)', () => {
    const files = [
      makeFile({ id: 1, url: '/uploads/a.jpg' }),
      makeFile({ id: 2, url: '/uploads/a.jpg' }),
      makeFile({ id: 3, url: '/uploads/b.jpg' }),
    ];
    expect(buildSelectedRefs(files)).toEqual(['/uploads/a.jpg', '/uploads/b.jpg']);
  });

  it('отбрасывает файлы без ссылки', () => {
    const files = [
      makeFile({ id: 1, url: '/uploads/a.jpg' }),
      makeFile({ id: 2, url: null, fileId: null, fileIdsByToken: {} }),
    ];
    expect(buildSelectedRefs(files)).toEqual(['/uploads/a.jpg']);
  });

  it('возвращает пустой массив для пустого набора', () => {
    expect(buildSelectedRefs([])).toEqual([]);
  });
});

describe('mergeAttachedMedia', () => {
  it('в множественном режиме дозаписывает только отсутствующие ссылки (идемпотентность)', () => {
    const current = ['/uploads/a.jpg'];
    const refs = ['/uploads/a.jpg', '/uploads/b.jpg'];
    expect(mergeAttachedMedia(current, refs, true)).toEqual(['/uploads/a.jpg', '/uploads/b.jpg']);
  });

  it('повторное слияние тех же ссылок не меняет результат (идемпотентность, Req 3.8)', () => {
    const refs = ['/uploads/a.jpg', '/uploads/b.jpg'];
    const once = mergeAttachedMedia([], refs, true);
    const twice = mergeAttachedMedia(once, refs, true);
    expect(twice).toEqual(once);
  });

  it('в одиночном режиме заменяет значение последней выбранной ссылкой', () => {
    const refs = ['/uploads/a.jpg', '/uploads/b.jpg'];
    expect(mergeAttachedMedia(['/old.jpg'], refs, false)).toEqual(['/uploads/b.jpg']);
  });

  it('в одиночном режиме сохраняет текущее значение при пустом выборе', () => {
    expect(mergeAttachedMedia(['/keep.jpg'], [], false)).toEqual(['/keep.jpg']);
  });
});

describe('isFileIdRef', () => {
  it('распознаёт JSON-запись file_id', () => {
    const ref = JSON.stringify({ __type: 'file_id', mediaType: 'photo', fileIdsByToken: { 1: 'X' } });
    expect(isFileIdRef(ref)).toBe(true);
  });

  it('возвращает false для обычного url', () => {
    expect(isFileIdRef('/uploads/a.jpg')).toBe(false);
  });

  it('возвращает false для null/undefined', () => {
    expect(isFileIdRef(null)).toBe(false);
    expect(isFileIdRef(undefined)).toBe(false);
  });
});
