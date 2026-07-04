/**
 * @fileoverview Property-based тесты (fast-check) серверной части редизайна
 * файлового хранилища — свойства корректности из design.md. Покрывают:
 *   - Property 3 (квота безлимитна ⟺ ENV пуст/0) — `readStorageLimitBytes`;
 *   - Property 4 (корректность флага превышения, мягкий лимит) — `computeQuotaWarning`;
 *   - Property 5 (сохранность чтения из нужного хранилища) — `StorageRegistry.resolveBackend`.
 *
 * Модуль `storage-registry` импортирует `../database/db` (создаёт пул pg). В
 * тестах БД не нужна — пул замокан, реестр наполняется фейковыми бэкендами в
 * памяти, что делает Property 5 чистым юнит-уровневым свойством (задача 10.2).
 * @module server/storage/tests/storage-properties.pbt.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';

// Заглушаем модуль БД: реестр строится без реального подключения к Postgres.
vi.mock('../../database/db', () => ({
  db: {},
  pool: { end: () => {} },
  closeDbPool: () => {},
}));

import {
  readStorageLimitBytes,
  BYTES_PER_GB,
  STORAGE_LIMIT_GB_ENV,
  LOCAL_DEFAULT_ID,
} from '../storage-config';
import { computeQuotaWarning } from '../compute-quota-warning';
import { StorageRegistryImpl } from '../storage-registry';
import type { StorageBackend } from '../storage-backend';

/** Сохранённое исходное значение ENV для восстановления после тестов */
let originalLimit: string | undefined;

beforeEach(() => {
  originalLimit = process.env[STORAGE_LIMIT_GB_ENV];
});

afterEach(() => {
  if (originalLimit === undefined) {
    delete process.env[STORAGE_LIMIT_GB_ENV];
  } else {
    process.env[STORAGE_LIMIT_GB_ENV] = originalLimit;
  }
});

describe('Property 3: квота безлимитна ⟺ ENV пуст/0 — readStorageLimitBytes', () => {
  // Validates: Requirements 4.3
  it('положительное конечное число ГБ → round(GB * 1024^3); иначе → null', () => {
    fc.assert(
      fc.property(
        // Произвольная строка ENV: смесь чисел, дробей, мусора, пробелов, пустого.
        fc.oneof(
          fc.double({ min: -1000, max: 1000, noNaN: true }).map((n) => String(n)),
          fc.string({ maxLength: 10 }),
          fc.constantFrom('', '   ', '0', '0.0', '-1', 'abc', '1e3', 'Infinity'),
        ),
        (raw) => {
          process.env[STORAGE_LIMIT_GB_ENV] = raw;
          const result = readStorageLimitBytes();

          const trimmed = raw.trim();
          const gb = Number(trimmed);
          const unlimited = trimmed.length === 0 || !Number.isFinite(gb) || gb <= 0;

          if (unlimited) {
            expect(result).toBeNull();
          } else {
            expect(result).toBe(Math.floor(gb * BYTES_PER_GB));
            expect(Number.isInteger(result as number)).toBe(true);
          }
        },
      ),
    );
  });

  it('безлимит ⟺ значение отсутствует/пустое/≤0 (явная двусторонняя проверка)', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.0001, max: 100000, noNaN: true }), (gb) => {
        process.env[STORAGE_LIMIT_GB_ENV] = String(gb);
        expect(readStorageLimitBytes()).toBe(Math.floor(gb * BYTES_PER_GB));
        process.env[STORAGE_LIMIT_GB_ENV] = String(-gb);
        expect(readStorageLimitBytes()).toBeNull();
      }),
    );
  });
});

describe('Property 4: корректность флага превышения (мягкий лимит) — computeQuotaWarning', () => {
  // Validates: Requirements 4.7
  // Домен limitBytes согласован с Property 3: реально достижимы только null
  // (безлимит) либо положительное число байт; 0/отрицательные → null ещё на
  // этапе readStorageLimitBytes, поэтому не входят в пространство входов.
  it('quotaExceeded === true ⟺ (limitBytes !== null) ∧ (usedBytes > limitBytes)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000_000 }),
        fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 1_000_000_000 })),
        (usedBytes, limitBytes) => {
          const { quotaExceeded } = computeQuotaWarning(usedBytes, limitBytes);
          const expected = limitBytes !== null && usedBytes > limitBytes;
          expect(quotaExceeded).toBe(expected);
        },
      ),
    );
  });

  it('при безлимите (null) флаг превышения всегда снят независимо от usedBytes', () => {
    fc.assert(
      fc.property(fc.nat({ max: Number.MAX_SAFE_INTEGER }), (usedBytes) => {
        expect(computeQuotaWarning(usedBytes, null).quotaExceeded).toBe(false);
      }),
    );
  });
});

/**
 * Создаёт фейковый `StorageBackend` с заданным `configId` (методы-заглушки —
 * `resolveBackend` их не вызывает, проверяется только маршрутизация).
 * @param configId - ID конфигурации хранилища
 * @param backend - Тип бэкенда ("local" | "s3")
 * @returns Объект, удовлетворяющий интерфейсу StorageBackend
 */
function fakeBackend(configId: string, backend: 'local' | 's3' = 'local'): StorageBackend {
  return {
    backend,
    configId,
    name: `fake:${configId}`,
    readOnly: false,
    put: async () => ({ backend, configId, key: '', url: '', size: 0 }),
    get: async () => {
      throw new Error('not used');
    },
    delete: async () => {},
    getUrl: () => '',
  };
}

/**
 * Собирает `StorageRegistryImpl`, наполненный фейковыми бэкендами для
 * переданных `configId` (плюс обязательный `local-default`), и выставляет
 * активный конфиг. Внутреннее состояние задаётся напрямую, минуя БД/reload().
 * @param configIds - Список идентификаторов конфигов хранилищ
 * @param activeId - Активный для записи конфиг либо null
 * @returns Готовый к резолву экземпляр реестра
 */
function buildRegistry(configIds: string[], activeId: string | null): StorageRegistryImpl {
  const registry = new StorageRegistryImpl();
  const map = new Map<string, StorageBackend>();
  for (const id of configIds) map.set(id, fakeBackend(id));
  // Гарантируем наличие локального дефолта для резолва null/неизвестных.
  if (!map.has(LOCAL_DEFAULT_ID)) map.set(LOCAL_DEFAULT_ID, fakeBackend(LOCAL_DEFAULT_ID));
  // Внутренние поля приватны в TS, но доступны в рантайме — задаём состояние напрямую.
  (registry as unknown as { backends: Map<string, StorageBackend> }).backends = map;
  (registry as unknown as { activeConfigId: string | null }).activeConfigId = activeId;
  return registry;
}

/**
 * Генератор уникального непустого списка configId (строк) с гарантированным
 * присутствием `local-default`.
 * @returns Arbitrary списка идентификаторов конфигов
 */
function configIdsArb() {
  return fc
    .uniqueArray(fc.string({ minLength: 1, maxLength: 16 }).filter((s) => s.trim().length > 0), {
      minLength: 0,
      maxLength: 8,
    })
    .map((ids) => Array.from(new Set([...ids, LOCAL_DEFAULT_ID])));
}

describe('Property 5: сохранность чтения из нужного хранилища — resolveBackend', () => {
  // Validates: Requirements 10.4
  it('resolveBackend(configId) возвращает бэкенд того же configId независимо от активного', () => {
    fc.assert(
      fc.property(
        configIdsArb().chain((ids) =>
          fc.record({
            ids: fc.constant(ids),
            target: fc.constantFrom(...ids),
            active: fc.oneof(fc.constant(null), fc.constantFrom(...ids)),
          }),
        ),
        ({ ids, target, active }) => {
          const registry = buildRegistry(ids, active);
          expect(registry.resolveBackend(target).configId).toBe(target);
        },
      ),
    );
  });

  it('resolveBackend(null) всегда возвращает local-default', () => {
    fc.assert(
      fc.property(
        configIdsArb(),
        fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 16 })),
        (ids, active) => {
          const validActive = active && ids.includes(active) ? active : null;
          const registry = buildRegistry(ids, validActive);
          expect(registry.resolveBackend(null).configId).toBe(LOCAL_DEFAULT_ID);
        },
      ),
    );
  });

  it('неизвестный configId безопасно откатывается к local-default', () => {
    fc.assert(
      fc.property(configIdsArb(), fc.string({ minLength: 1, maxLength: 20 }), (ids, unknown) => {
        fc.pre(!ids.includes(unknown));
        const registry = buildRegistry(ids, null);
        expect(registry.resolveBackend(unknown).configId).toBe(LOCAL_DEFAULT_ID);
      }),
    );
  });

  it('добавление/удаление других конфигов не меняет резолв для целевого файла', () => {
    fc.assert(
      fc.property(
        configIdsArb().chain((ids) =>
          fc.record({
            ids: fc.constant(ids),
            target: fc.constantFrom(...ids),
            extra: fc.uniqueArray(fc.string({ minLength: 1, maxLength: 16 }), { maxLength: 5 }),
          }),
        ),
        ({ ids, target, extra }) => {
          // Реестр A — исходный набор; реестр B — с добавленными другими конфигами.
          const regA = buildRegistry(ids, null);
          const regB = buildRegistry([...ids, ...extra], target);
          expect(regA.resolveBackend(target).configId).toBe(target);
          expect(regB.resolveBackend(target).configId).toBe(target);
          expect(regA.resolveBackend(target).configId).toBe(regB.resolveBackend(target).configId);
        },
      ),
    );
  });
});
