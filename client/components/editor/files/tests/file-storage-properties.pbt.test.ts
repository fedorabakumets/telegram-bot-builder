/**
 * @fileoverview Property-based тесты (fast-check) клиентской части редизайна
 * файлового хранилища — свойства корректности из design.md. Покрывают:
 *   - Property 1 (идемпотентность прикрепления, multi) — `mergeAttachedMedia`;
 *   - Property 2 (приоритет выбранного токена) — `buildOrderedEntries`;
 *   - Property 7 (обратимость JSON file_id) — `toNodeRef`.
 * Генераторы строят случайные наборы ссылок, токенов и карт file_id, проверяя,
 * что свойства держатся на всём пространстве входов (задача 10.2).
 * @module components/editor/files/tests/file-storage-properties.pbt.test
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import { mergeAttachedMedia, toNodeRef } from '../panel/attach-node-refs';
import { buildOrderedEntries } from '../panel/table/cell-file-ids';
import type { ProjectFile } from '../hooks/use-project-files';

/**
 * Создаёт минимальную запись `ProjectFile` для генераторов, переопределяя поля.
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

/**
 * Генератор непустой карты `fileIdsByToken` (Record<number, string>) с
 * уникальными числовыми токенами и непустыми значениями file_id (чтобы они не
 * отбрасывались нормализацией).
 * @returns Arbitrary, дающий `{ map, tokenIds }`
 */
function nonEmptyTokenMap() {
  return fc
    .uniqueArray(
      fc.tuple(
        fc.integer({ min: 1, max: 10_000 }),
        fc.string({ minLength: 1, maxLength: 12 }).filter((s) => s.trim().length > 0),
      ),
      { minLength: 1, maxLength: 8, selector: (t) => t[0] },
    )
    .map((pairs) => {
      const map: Record<number, string> = {};
      const tokenIds: number[] = [];
      for (const [tokenId, fileId] of pairs) {
        map[tokenId] = fileId;
        tokenIds.push(tokenId);
      }
      return { map, tokenIds };
    });
}

describe('Property 1: идемпотентность прикрепления (multi) — mergeAttachedMedia', () => {
  // Validates: Requirements 3.8
  it('повторное слияние тех же refs не меняет результат: merge(merge(s,r),r) === merge(s,r)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ maxLength: 20 }), { maxLength: 12 }),
        fc.array(fc.string({ maxLength: 20 }), { maxLength: 12 }),
        (current, refs) => {
          const once = mergeAttachedMedia(current, refs, true);
          const twice = mergeAttachedMedia(once, refs, true);
          expect(twice).toEqual(once);
        },
      ),
    );
  });

  it('результат слияния не содержит дубликатов и сохраняет текущие значения (current без дублей)', () => {
    fc.assert(
      fc.property(
        // current без предсуществующих дублей: функция не дедуплицирует уже
        // имеющиеся значения, лишь не добавляет повторно новые refs.
        fc.uniqueArray(fc.string({ maxLength: 20 }), { maxLength: 12 }),
        fc.array(fc.string({ maxLength: 20 }), { maxLength: 12 }),
        (current, refs) => {
          const merged = mergeAttachedMedia(current, refs, true);
          // Нет дубликатов в итоговом наборе.
          expect(new Set(merged).size).toBe(merged.length);
          // Все исходные значения current присутствуют (множественный режим дозаписывает).
          for (const c of current) expect(merged).toContain(c);
        },
      ),
    );
  });
});

/**
 * Генератор непустой карты file_id вместе с выбранным существующим в ней
 * токеном — чтобы проверять приоритет именно присутствующего selectedTokenId.
 * @returns Arbitrary, дающий `{ map, tokenIds, selected }`
 */
function tokenMapWithSelected() {
  return nonEmptyTokenMap().chain((gen) =>
    fc.constantFrom(...gen.tokenIds).map((selected) => ({ ...gen, selected })),
  );
}

describe('Property 2: приоритет выбранного токена — buildOrderedEntries', () => {
  // Validates: Requirements 8.3
  it('первый элемент соответствует selectedTokenId, если он есть в записях', () => {
    fc.assert(
      fc.property(tokenMapWithSelected(), ({ map, selected }) => {
        const file = makeFile({ url: null, fileIdsByToken: map });
        const entries = buildOrderedEntries(file, selected);
        expect(entries[0].tokenId).toBe(selected);
        expect(entries[0].fileId).toBe(map[selected]);
      }),
    );
  });

  it('всегда возвращает все записи карты ровно по одному разу (детерминированный порядок)', () => {
    fc.assert(
      fc.property(nonEmptyTokenMap(), fc.integer({ min: 1, max: 10_000 }), (gen, selected) => {
        const file = makeFile({ url: null, fileIdsByToken: gen.map });
        const entries = buildOrderedEntries(file, selected);
        expect(entries.length).toBe(gen.tokenIds.length);
        expect(new Set(entries.map((e) => e.tokenId)).size).toBe(gen.tokenIds.length);
        // Если selected присутствует в карте — он первый.
        if (gen.tokenIds.includes(selected)) {
          expect(entries[0].tokenId).toBe(selected);
        }
      }),
    );
  });
});

describe('Property 7: обратимость JSON file_id — toNodeRef', () => {
  // Validates: Requirements 8.3
  it('toNodeRef для file_id-файла даёт {__type:"file_id"} с той же fileIdsByToken', () => {
    fc.assert(
      fc.property(
        nonEmptyTokenMap(),
        fc.constantFrom<ProjectFile['mediaType']>('photo', 'video', 'audio', 'document'),
        (gen, mediaType) => {
          const file = makeFile({ url: null, mediaType, fileIdsByToken: gen.map });
          const ref = toNodeRef(file);
          expect(ref).not.toBeNull();
          const parsed = JSON.parse(ref as string);
          expect(parsed.__type).toBe('file_id');
          expect(parsed.mediaType).toBe(mediaType);
          // Ключи в JSON — строковые; собираем ожидаемую карту со строковыми ключами.
          const expected: Record<string, string> = {};
          for (const tokenId of gen.tokenIds) expected[String(tokenId)] = gen.map[tokenId];
          expect(parsed.fileIdsByToken).toEqual(expected);
        },
      ),
    );
  });
});
