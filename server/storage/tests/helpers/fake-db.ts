/**
 * @fileoverview Лёгкая in-memory подмена слоя БД (`server/database/db`) для
 * интеграционных тестов редизайна файлового хранилища (задача 10.3).
 *
 * Реальный `db` создаёт пул Postgres и требует `DATABASE_URL`. В тестах он не
 * нужен: здесь собран минимальный фейк drizzle-инстанса, который поддерживает
 * ровно те цепочки вызовов, что используют тестируемые модули:
 *
 *  - `db.select(fields?).from(table).where(...).limit(n).orderBy(...)` → массив строк;
 *  - `db.insert(table).values(v).returning()` / `.onConflictDoUpdate(...)` → upsert/insert;
 *  - `db.delete(table).where(...)` → удаление.
 *
 * Состояние хранится в общем синглтоне {@link state}, который тест настраивает
 * в `beforeEach` через {@link resetFakeDb}. Условия WHERE намеренно
 * игнорируются: тесты кладут в стор только релевантные строки, поэтому
 * результат однозначен, а сами тестируемые функции (хендлеры, денормализация,
 * реестр) исполняются по-настоящему — это и есть интеграция уровня модулей.
 * @module server/storage/tests/helpers/fake-db
 */

import { getTableName } from "drizzle-orm";

import { storageConfigs, mediaFiles, mediaFileTokens } from "@shared/schema";

/** Строка реестра хранилищ в in-memory сторе */
export interface FakeStorageConfigRow {
  /** Стабильный идентификатор конфига */
  id: string;
  /** Человекочитаемое имя */
  name: string;
  /** Тип бэкенда ("local" | "s3") */
  backend: string;
  /** Активен ли для записи */
  isActive: boolean;
  /** Несекретные параметры */
  config: Record<string, unknown>;
  /** Зашифрованные креды (null для local) */
  secretsEnc: string | null;
  /** Только чтение */
  readOnly: boolean;
  /** Дата создания */
  createdAt?: Date | null;
}

/** Строка media_files в in-memory сторе */
export interface FakeMediaFileRow {
  /** Внутренний ID */
  id: number;
  /** ID проекта */
  projectId?: number;
  /** Размер файла в байтах */
  fileSize?: number;
  /** Тип бэкенда ("local" | "s3") */
  storageBackend?: string;
  /** ID конфигурации хранилища */
  storageConfigId?: string | null;
  /** Прочие поля записи */
  [key: string]: unknown;
}

/** Строка media_file_tokens в in-memory сторе */
export interface FakeTokenRow {
  /** ID медиафайла */
  mediaFileId: number;
  /** ID токена бота */
  tokenId: number;
  /** Telegram file_id */
  fileId: string;
}

/** Общее изменяемое состояние фейкового стора (синглтон) */
export interface FakeDbState {
  /** Записи реестра хранилищ */
  storageConfigs: FakeStorageConfigRow[];
  /** Записи media_files */
  mediaFiles: FakeMediaFileRow[];
  /** Записи media_file_tokens */
  mediaFileTokens: FakeTokenRow[];
  /** Счётчик для генерации id media_files */
  seq: number;
}

/** Синглтон состояния — общий между тестом и замоканным db */
export const state: FakeDbState = {
  storageConfigs: [],
  mediaFiles: [],
  mediaFileTokens: [],
  seq: 0,
};

/**
 * Сбрасывает состояние стора к пустому. Вызывать в `beforeEach`.
 */
export function resetFakeDb(): void {
  state.storageConfigs = [];
  state.mediaFiles = [];
  state.mediaFileTokens = [];
  state.seq = 0;
}

/**
 * Вычисляет результат SELECT по таблице и набору запрошенных полей.
 * @param table - Таблица drizzle (по имени определяется источник)
 * @param fields - Объект запрошенных полей (или undefined для всех полей)
 * @returns Массив строк-результатов
 */
function resolveSelect(table: unknown, fields: Record<string, unknown> | undefined): unknown[] {
  const name = getTableName(table as never);

  if (name === getTableName(storageConfigs)) {
    if (fields && "id" in fields && Object.keys(fields).length === 1) {
      return state.storageConfigs.map((r) => ({ id: r.id }));
    }
    return state.storageConfigs.map((r) => ({ ...r }));
  }

  if (name === getTableName(mediaFiles)) {
    // count() → { value: N }
    if (fields && "value" in fields) {
      return [{ value: state.mediaFiles.length }];
    }
    // sum(fileSize) только по локальным бэкендам (Req 4.4) → { total: "N" }
    if (fields && "total" in fields) {
      const sum = state.mediaFiles
        .filter((r) => r.storageBackend === "local")
        .reduce((acc, r) => acc + (Number(r.fileSize) || 0), 0);
      return [{ total: String(sum) }];
    }
    return state.mediaFiles.map((r) => ({ ...r }));
  }

  if (name === getTableName(mediaFileTokens)) {
    return state.mediaFileTokens.map((r) => ({ ...r }));
  }

  return [];
}

/**
 * Применяет INSERT/UPSERT к стору.
 * @param table - Целевая таблица
 * @param values - Значение(я) для вставки
 * @returns Массив вставленных строк (для `.returning()`)
 */
function applyInsert(table: unknown, values: unknown): unknown[] {
  const name = getTableName(table as never);

  if (name === getTableName(mediaFiles)) {
    const row = { ...(values as Record<string, unknown>), id: ++state.seq, createdAt: new Date() } as FakeMediaFileRow;
    state.mediaFiles.push(row);
    return [row];
  }

  if (name === getTableName(mediaFileTokens)) {
    const rows = (Array.isArray(values) ? values : [values]) as FakeTokenRow[];
    for (const r of rows) {
      const existing = state.mediaFileTokens.find(
        (t) => t.mediaFileId === r.mediaFileId && t.tokenId === r.tokenId,
      );
      if (existing) {
        existing.fileId = r.fileId; // upsert: обновляем file_id
      } else {
        state.mediaFileTokens.push({ ...r });
      }
    }
    return rows;
  }

  if (name === getTableName(storageConfigs)) {
    const rows = (Array.isArray(values) ? values : [values]) as FakeStorageConfigRow[];
    state.storageConfigs.push(...rows.map((r) => ({ ...r })));
    return rows;
  }

  return [];
}

/**
 * Применяет DELETE к стору (WHERE игнорируется — тесты держат одну запись).
 * @param table - Целевая таблица
 */
function applyDelete(table: unknown): void {
  const name = getTableName(table as never);
  if (name === getTableName(storageConfigs)) {
    state.storageConfigs = [];
  } else if (name === getTableName(mediaFiles)) {
    state.mediaFiles = [];
  } else if (name === getTableName(mediaFileTokens)) {
    state.mediaFileTokens = [];
  }
}

/**
 * Создаёт thenable-builder SELECT, поддерживающий .from/.where/.limit/.orderBy
 * и `await`.
 * @param fields - Запрошенные поля select
 * @returns Объект-builder
 */
function makeSelectBuilder(fields: Record<string, unknown> | undefined) {
  let table: unknown;
  let limit: number | undefined;
  const exec = (): unknown[] => {
    let rows = resolveSelect(table, fields);
    if (typeof limit === "number") rows = rows.slice(0, limit);
    return rows;
  };
  const builder = {
    from(t: unknown) {
      table = t;
      return builder;
    },
    where() {
      return builder;
    },
    limit(n: number) {
      limit = n;
      return builder;
    },
    orderBy() {
      return builder;
    },
    then<T>(onF: (v: unknown[]) => T, onR?: (e: unknown) => T) {
      return Promise.resolve()
        .then(exec)
        .then(onF, onR);
    },
  };
  return builder;
}

/**
 * Создаёт builder INSERT с .values(...).returning()/.onConflictDoUpdate(...).
 * @param table - Целевая таблица
 * @returns Объект-builder
 */
function makeInsertBuilder(table: unknown) {
  return {
    values(v: unknown) {
      const run = () => applyInsert(table, v);
      return {
        returning() {
          return Promise.resolve().then(run);
        },
        onConflictDoUpdate() {
          return Promise.resolve().then(run);
        },
        then<T>(onF: (v: unknown[]) => T, onR?: (e: unknown) => T) {
          return Promise.resolve().then(run).then(onF, onR);
        },
      };
    },
  };
}

/**
 * Создаёт builder DELETE с .where(...) (awaitable).
 * @param table - Целевая таблица
 * @returns Объект-builder
 */
function makeDeleteBuilder(table: unknown) {
  const run = () => {
    applyDelete(table);
  };
  return {
    where() {
      return Promise.resolve().then(run);
    },
    then<T>(onF: (v: unknown) => T, onR?: (e: unknown) => T) {
      return Promise.resolve().then(run).then(onF, onR);
    },
  };
}

/** Фейковый drizzle-инстанс с минимально достаточным API */
export const fakeDb = {
  /**
   * Имитация select.
   * @param fields - Запрошенные поля (опционально)
   * @returns Builder SELECT
   */
  select(fields?: Record<string, unknown>) {
    return makeSelectBuilder(fields);
  },
  /**
   * Имитация insert.
   * @param table - Целевая таблица
   * @returns Builder INSERT
   */
  insert(table: unknown) {
    return makeInsertBuilder(table);
  },
  /**
   * Имитация delete.
   * @param table - Целевая таблица
   * @returns Builder DELETE
   */
  delete(table: unknown) {
    return makeDeleteBuilder(table);
  },
};

/** Модуль-замена для `server/database/db` (используется в vi.mock-фабрике) */
export const fakeDbModule = {
  db: fakeDb,
  pool: { end() {} },
  closeDbPool() {},
};
