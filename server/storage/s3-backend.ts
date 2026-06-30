/**
 * @fileoverview S3-совместимый бэкенд хранилища (`S3Backend`): реализация
 * `StorageBackend` поверх `@aws-sdk/client-s3`. Совместим с AWS S3 и MinIO
 * (через кастомный `endpoint` + `forcePathStyle`). Один инстанс привязан к
 * одному конфигу `storage_configs` (свой бакет/endpoint/креды), поэтому
 * несколько S3-хранилищ = несколько независимых инстансов.
 *
 * Безопасность (Req 12.4): бакеты по умолчанию приватные. URL объекта
 * отдаётся либо как публичный (если задан `publicUrlBase` — например, CDN/
 * публичный бакет), либо как серверный прокси-эндпоинт
 * `/api/media/s3-proxy/<configId>/<key>`, который читает объект через SDK и
 * стримит его клиенту, не раскрывая бакет напрямую. Дополнительно
 * поддерживаются временные presigned-ссылки (`getPresignedUrl`).
 * @module server/storage/s3-backend
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { StorageBackend, StoredObject } from "./storage-backend";

/** Несекретные параметры S3-хранилища (поле config.s3 в storage_configs) */
export interface S3BackendParams {
  /**
   * Кастомный endpoint S3-совместимого сервиса (например, MinIO:
   * `http://localhost:9000`). Пусто/undefined → штатный AWS S3.
   */
  endpointUrl?: string;
  /** Регион S3 (для MinIO допустимо любое валидное значение, например `us-east-1`) */
  region: string;
  /** Имя бакета */
  bucket: string;
  /** Path-style адресация (`true` обязательно для MinIO; AWS — обычно `false`) */
  forcePathStyle: boolean;
  /**
   * Базовый публичный URL для прямой отдачи объектов (CDN/публичный бакет),
   * без завершающего слеша. Пусто → отдача через серверный прокси (приватно).
   */
  publicUrlBase?: string;
}

/** Расшифрованные креды S3 (передаются извне; в S3-бэкенде не хранятся в открытом виде на диске) */
export interface S3BackendCredentials {
  /** Идентификатор ключа доступа (accessKeyId) */
  accessKeyId: string;
  /** Секретный ключ доступа (secretAccessKey) */
  secretAccessKey: string;
}

/** Полная конфигурация инстанса S3-бэкенда */
export interface S3BackendOptions {
  /** ID конфигурации хранилища (storage_configs.id) */
  configId: string;
  /** Человекочитаемое имя (для UI) */
  name: string;
  /** Только для чтения (нельзя выбрать целевым для записи) */
  readOnly: boolean;
  /** Несекретные параметры S3 */
  s3: S3BackendParams;
  /** Расшифрованные креды доступа */
  credentials: S3BackendCredentials;
}

/** Базовый путь серверного прокси-эндпоинта для приватной отдачи S3-объектов */
export const S3_PROXY_BASE = "/api/media/s3-proxy";

/**
 * S3-совместимый бэкенд: пишет/читает/удаляет объекты в одном бакете.
 * Один инстанс обслуживает один сконфигурированный S3-конфиг.
 */
export class S3Backend implements StorageBackend {
  /** Тип бэкенда (всегда "s3") */
  public readonly backend = "s3";
  /** ID конфигурации (storage_configs.id) */
  public readonly configId: string;
  /** Человекочитаемое имя (для UI) */
  public readonly name: string;
  /** Только для чтения */
  public readonly readOnly: boolean;

  /** Имя бакета, в который пишутся/читаются объекты */
  private readonly bucket: string;
  /** Базовый публичный URL (без завершающего слеша) либо undefined для прокси */
  private readonly publicUrlBase?: string;
  /** Сконфигурированный клиент AWS SDK v3 */
  private readonly client: S3Client;

  /**
   * @param options - Полная конфигурация S3-бэкенда (параметры + креды)
   */
  constructor(options: S3BackendOptions) {
    this.configId = options.configId;
    this.name = options.name;
    this.readOnly = options.readOnly;
    this.bucket = options.s3.bucket;

    const base = (options.s3.publicUrlBase || "").trim();
    // Нормализуем publicUrlBase: убираем завершающие слеши.
    this.publicUrlBase = base ? base.replace(/\/+$/, "") : undefined;

    const endpoint = (options.s3.endpointUrl || "").trim();
    // Конструируем клиент: при заданном endpoint (MinIO/совместимые) передаём
    // его явно вместе с forcePathStyle; иначе используется штатный AWS S3.
    this.client = new S3Client({
      region: options.s3.region,
      forcePathStyle: options.s3.forcePathStyle,
      credentials: {
        accessKeyId: options.credentials.accessKeyId,
        secretAccessKey: options.credentials.secretAccessKey,
      },
      ...(endpoint ? { endpoint } : {}),
    });
  }

  /**
   * Нормализует ключ объекта: убирает ведущие слеши и приводит разделители к
   * POSIX-стилю (S3-ключи всегда используют `/`).
   * @param key - Относительный ключ объекта
   * @returns Очищенный ключ объекта
   */
  private normalizeKey(key: string): string {
    return String(key).replace(/\\/g, "/").replace(/^\/+/, "");
  }

  /**
   * Сохраняет буфер в бакет под заданным ключом.
   * @param key - Относительный ключ объекта в бакете
   * @param data - Содержимое объекта в виде буфера
   * @param mime - MIME-тип объекта (пишется в ContentType)
   * @returns Метаданные сохранённого объекта
   */
  async put(key: string, data: Buffer, mime: string): Promise<StoredObject> {
    const normKey = this.normalizeKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: normKey,
        Body: data,
        ContentType: mime || "application/octet-stream",
      }),
    );
    return {
      backend: this.backend,
      configId: this.configId,
      key: normKey,
      url: this.getUrl(normKey),
      size: data.length,
    };
  }

  /**
   * Читает объект из бакета в виде потока.
   * @param key - Относительный ключ объекта в бакете
   * @returns Читаемый поток с содержимым объекта
   */
  async get(key: string): Promise<NodeJS.ReadableStream> {
    const normKey = this.normalizeKey(key);
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: normKey }),
    );
    const body = res.Body;
    if (!body) {
      throw new Error(`Пустое тело ответа S3 для ключа: ${normKey}`);
    }
    // В Node.js окружении SDK возвращает Body как Readable-поток.
    return body as NodeJS.ReadableStream;
  }

  /**
   * Удаляет объект из бакета (идемпотентно: S3 не считает отсутствие ошибкой).
   * @param key - Относительный ключ объекта в бакете
   */
  async delete(key: string): Promise<void> {
    const normKey = this.normalizeKey(key);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: normKey }),
    );
  }

  /**
   * Строит URL объекта. Если задан `publicUrlBase` — прямой публичный URL;
   * иначе серверный прокси-эндпоинт `/api/media/s3-proxy/<configId>/<key>`
   * (приватная отдача без прямого доступа к бакету, см. Req 12.4).
   * @param key - Относительный ключ объекта в бакете
   * @returns Публичный либо проксируемый URL объекта
   */
  getUrl(key: string): string {
    const normKey = this.normalizeKey(key);
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${this.encodeKey(normKey)}`;
    }
    return `${S3_PROXY_BASE}/${encodeURIComponent(this.configId)}/${this.encodeKey(normKey)}`;
  }

  /**
   * Кодирует сегменты ключа для безопасной вставки в URL, сохраняя `/`.
   * @param key - Очищенный ключ объекта
   * @returns Ключ с URL-кодированными сегментами
   */
  private encodeKey(key: string): string {
    return key.split("/").map(encodeURIComponent).join("/");
  }

  /**
   * Генерирует временную presigned-ссылку прямого доступа к объекту в S3.
   * Альтернатива прокси для безопасной отдачи приватных объектов (Req 12.4).
   * @param key - Относительный ключ объекта в бакете
   * @param expiresInSeconds - Срок жизни ссылки в секундах (по умолчанию 900 = 15 минут)
   * @returns Подписанный временный URL объекта
   */
  async getPresignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const normKey = this.normalizeKey(key);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: normKey });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
