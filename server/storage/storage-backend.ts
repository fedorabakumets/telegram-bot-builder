/**
 * @fileoverview Контракты абстракции файлового хранилища: метаданные сохранённого
 * объекта (`StoredObject`), интерфейс бэкенда (`StorageBackend`) и реестр хранилищ
 * (`StorageRegistry`). Фундамент мульти-хранилища (несколько S3 + несколько
 * локальных папок одновременно), резолвинг бэкенда по configId при чтении/записи.
 * @module server/storage/storage-backend
 */

/** Метаданные сохранённого объекта */
export interface StoredObject {
  /** Тип бэкенда ("local" | "s3") */
  backend: string;
  /** ID конфигурации хранилища (storage_configs.id) */
  configId: string;
  /** Относительный путь/ключ объекта */
  key: string;
  /** Публичный/проксируемый URL */
  url: string;
  /** Размер в байтах */
  size: number;
}

/** Абстракция файлового бэкенда (один инстанс = одно сконфигурированное хранилище) */
export interface StorageBackend {
  /** Тип бэкенда ("local" | "s3") */
  readonly backend: string;
  /** ID конфигурации (storage_configs.id); определяет конкретное хранилище */
  readonly configId: string;
  /** Человекочитаемое имя (для UI) */
  readonly name: string;
  /** Только для чтения (нельзя выбрать целевым для записи) */
  readonly readOnly: boolean;
  /**
   * Сохранить буфер по ключу
   * @param key - Относительный путь/ключ объекта в хранилище
   * @param data - Содержимое объекта в виде буфера
   * @param mime - MIME-тип сохраняемого объекта
   * @returns Метаданные сохранённого объекта
   */
  put(key: string, data: Buffer, mime: string): Promise<StoredObject>;
  /**
   * Прочитать объект как поток
   * @param key - Относительный путь/ключ объекта в хранилище
   * @returns Читаемый поток с содержимым объекта
   */
  get(key: string): Promise<NodeJS.ReadableStream>;
  /**
   * Удалить объект
   * @param key - Относительный путь/ключ объекта в хранилище
   */
  delete(key: string): Promise<void>;
  /**
   * Получить URL для доступа/проксирования
   * @param key - Относительный путь/ключ объекта в хранилище
   * @returns Публичный/проксируемый URL объекта
   */
  getUrl(key: string): string;
}

/**
 * Реестр хранилищ: загружает ВСЕ конфиги из storage_configs (несколько S3 +
 * несколько локальных папок), строит по инстансу StorageBackend на каждый,
 * и резолвит нужный бэкенд по configId при чтении/записи.
 */
export interface StorageRegistry {
  /**
   * Активное хранилище для новых загрузок (isActive=true)
   * @returns Бэкенд, выбранный целевым для новых загрузок
   */
  getActiveBackend(): StorageBackend;
  /**
   * Бэкенд по configId записи media_files (для чтения файла из его хранилища)
   * @param configId - ID конфигурации хранилища; null = дефолтное локальное (local-default)
   * @returns Бэкенд, соответствующий переданному configId
   */
  resolveBackend(configId: string | null): StorageBackend;
  /**
   * Все доступные хранилища (для селектора/фильтра/менеджера)
   * @returns Список всех зарегистрированных бэкендов
   */
  list(): StorageBackend[];
  /**
   * Только доступные для записи (не readOnly) — для выбора цели загрузки
   * @returns Список бэкендов, доступных для записи
   */
  listWritable(): StorageBackend[];
  /**
   * Перезагрузить реестр из storage_configs (после правок через API)
   */
  reload(): Promise<void>;
}
