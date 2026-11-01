/** @fileoverview Проверки числовой сортировки файлов и расположения неизвестных размеров. */
import { expect, it } from 'vitest';
import { sortFilePage } from '../panel/table/file-column-sort';
import type { ProjectFile } from '../hooks/use-project-files';

/** Создаёт минимальные данные файла для проверки порядка. */
const file = (id: number, fileSize: number | null) => ({ id, fileSize } as ProjectFile);

it('сортирует размеры численно в обе стороны без изменения исходного массива', () => {
  const files = [file(1, 100), file(2, 20), file(3, 300)];
  expect(sortFilePage(files, { column: 'size', direction: 1 }).map(f => f.id)).toEqual([2, 1, 3]);
  expect(sortFilePage(files, { column: 'size', direction: -1 }).map(f => f.id)).toEqual([3, 1, 2]);
  expect(files.map(f => f.id)).toEqual([1, 2, 3]);
});

it('неизвестный размер остаётся последним при любом направлении', () => {
  const files = [file(1, null), file(2, 0), file(3, 10)];
  expect(sortFilePage(files, { column: 'size', direction: 1 }).map(f => f.id)).toEqual([2, 3, 1]);
  expect(sortFilePage(files, { column: 'size', direction: -1 }).map(f => f.id)).toEqual([3, 2, 1]);
});
