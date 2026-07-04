/**
 * @fileoverview Шифрование/дешифровка секретных кредов хранилищ (S3) для поля
 * `storage_configs.secretsEnc`. Использует встроенный модуль Node.js `crypto`
 * с алгоритмом AES-256-GCM (аутентифицированное шифрование). Симметричный
 * ключ выводится из переменной окружения `STORAGE_ENCRYPTION_KEY` через
 * scrypt в 32 байта (256 бит).
 *
 * Формат сериализации `secretsEnc` (Req 11.4, 11.5): строка base64 от
 * конкатенации `iv (12 байт) || authTag (16 байт) || ciphertext`. Это даёт
 * самодостаточную строку, из которой при дешифровке извлекаются все
 * компоненты. Открытые значения секретов нигде не логируются и не
 * возвращаются в составе ошибок.
 * @module server/storage/storage-secrets
 */

import {
  randomBytes,
  scryptSync,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";

import type { S3BackendCredentials } from "./s3-backend";

/** Имя переменной окружения с ключом шифрования кредов хранилищ */
export const STORAGE_ENCRYPTION_KEY_ENV = "STORAGE_ENCRYPTION_KEY";

/** Используемый алгоритм аутентифицированного шифрования */
const ALGORITHM = "aes-256-gcm";

/** Длина выводимого ключа в байтах (AES-256 → 32 байта) */
const KEY_LENGTH = 32;

/** Длина вектора инициализации (IV) для GCM в байтах */
const IV_LENGTH = 12;

/** Длина тега аутентификации GCM в байтах */
const AUTH_TAG_LENGTH = 16;

/**
 * Минимально допустимая длина исходного ключа из ENV (символов). Слишком
 * короткий ключ — небезопасен, поэтому отклоняется с явной ошибкой.
 */
const MIN_RAW_KEY_LENGTH = 16;

/**
 * Фиксированная соль для вывода ключа через scrypt. Так как сам секрет
 * хранится в `STORAGE_ENCRYPTION_KEY`, статическая соль допустима: она лишь
 * детерминированно разворачивает секрет в 32-байтный ключ.
 */
const KEY_DERIVATION_SALT = "botcraft-storage-secrets-v1";

/**
 * Проверяет, настроено ли шифрование (присутствует ли непустой ключ в ENV).
 * @returns true, если переменная `STORAGE_ENCRYPTION_KEY` задана и непуста
 */
export function isEncryptionConfigured(): boolean {
  const raw = process.env[STORAGE_ENCRYPTION_KEY_ENV];
  return typeof raw === "string" && raw.trim().length > 0;
}

/**
 * Выводит 32-байтный симметричный ключ из ENV-секрета через scrypt.
 * @returns Буфер ключа длиной 32 байта
 * @throws Error, если ключ отсутствует или короче минимально допустимой длины
 */
function deriveKey(): Buffer {
  const raw = process.env[STORAGE_ENCRYPTION_KEY_ENV];
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error(
      `Шифрование кредов хранилищ не настроено: переменная окружения ${STORAGE_ENCRYPTION_KEY_ENV} не задана`,
    );
  }
  const trimmed = raw.trim();
  if (trimmed.length < MIN_RAW_KEY_LENGTH) {
    throw new Error(
      `Слишком короткий ${STORAGE_ENCRYPTION_KEY_ENV}: требуется минимум ${MIN_RAW_KEY_LENGTH} символов`,
    );
  }
  return scryptSync(trimmed, KEY_DERIVATION_SALT, KEY_LENGTH);
}

/**
 * Шифрует произвольную строку открытого текста.
 * @param plaintext - Строка для шифрования
 * @returns base64-строка вида `iv || authTag || ciphertext`
 * @throws Error, если ключ шифрования не настроен/некорректен
 */
export function encryptString(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/**
 * Дешифрует строку, ранее зашифрованную через {@link encryptString}.
 * @param payload - base64-строка вида `iv || authTag || ciphertext`
 * @returns Исходная строка открытого текста
 * @throws Error, если ключ не настроен, данные повреждены или тег не сходится
 */
export function decryptString(payload: string): string {
  const key = deriveKey();
  const buffer = Buffer.from(payload, "base64");
  if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Повреждённые зашифрованные данные: недостаточная длина");
  }
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/**
 * Сериализует и шифрует креды S3 в строку для хранения в `secretsEnc`.
 * @param credentials - Креды доступа S3 (accessKeyId/secretAccessKey)
 * @returns Зашифрованная base64-строка для поля `storage_configs.secretsEnc`
 * @throws Error, если ключ шифрования не настроен/некорректен
 */
export function encryptCredentials(
  credentials: S3BackendCredentials,
): string {
  const json = JSON.stringify({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
  });
  return encryptString(json);
}

/**
 * Дешифрует и десериализует креды S3 из строки `secretsEnc`.
 * @param secretsEnc - Зашифрованная строка из `storage_configs.secretsEnc`
 * @returns Расшифрованные креды доступа S3
 * @throws Error, если ключ не настроен, данные повреждены или структура неверна
 */
export function decryptCredentials(secretsEnc: string): S3BackendCredentials {
  const json = decryptString(secretsEnc);
  const parsed = JSON.parse(json) as Partial<S3BackendCredentials>;
  if (
    typeof parsed?.accessKeyId !== "string" ||
    typeof parsed?.secretAccessKey !== "string"
  ) {
    throw new Error(
      "Некорректная структура расшифрованных кредов S3: ожидались accessKeyId и secretAccessKey",
    );
  }
  return {
    accessKeyId: parsed.accessKeyId,
    secretAccessKey: parsed.secretAccessKey,
  };
}
