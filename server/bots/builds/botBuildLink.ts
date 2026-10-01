/**
 * @fileoverview Ссылка на сборку для исполнителя на другой машине: временный presigned URL
 * объекта в S3 и данные для проверки целостности. Ключи S3 исполнителю не нужны.
 * @module server/bots/builds/botBuildLink
 */

import type { BotBuildDeps } from "./botBuildDeps";

/** Срок жизни ссылки на сборку по умолчанию (с): хватает на очередь запуска и повторы */
export const BOT_BUILD_LINK_TTL_SECONDS = 600;

/** Что нужно исполнителю, чтобы скачать и проверить сборку */
export interface BotBuildLink {
  /** Временная ссылка на сжатый код (gzip) */
  url: string;
  /** sha256 несжатого кода (hex) */
  sha256: string;
  /** Размер несжатого кода в байтах */
  size: number;
  /** Отпечаток генерации: имя каталога сборки в кеше исполнителя */
  fingerprint: string;
  /** Имя основного .py бота */
  fileName: string;
}

/** Хранилище, умеющее выдавать временные ссылки (S3) */
interface PresignableBackend {
  /**
   * Подписанная ссылка на объект
   * @param key - Ключ объекта
   * @param expiresInSeconds - Срок жизни ссылки
   * @returns URL
   */
  getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * Проверяет, может ли хранилище выдать временную ссылку
 * @param backend - Хранилище
 * @returns true для S3
 */
function isPresignable(backend: unknown): backend is PresignableBackend {
  return typeof (backend as PresignableBackend | null)?.getPresignedUrl === "function";
}

/**
 * Возвращает ссылку на сборку токена с заданным отпечатком
 * @param tokenId - ID токена
 * @param fingerprint - Отпечаток генерации
 * @param deps - Таблица и хранилища
 * @param ttlSeconds - Срок жизни ссылки
 * @returns ссылка или причина, по которой её нет
 */
export async function getBotBuildLink(
  tokenId: number,
  fingerprint: string,
  deps: Pick<BotBuildDeps, "findBuild" | "resolveBackend">,
  ttlSeconds: number = BOT_BUILD_LINK_TTL_SECONDS,
): Promise<BotBuildLink | { error: string }> {
  const build = await deps.findBuild(tokenId, fingerprint);
  if (!build) return { error: "сборка не найдена в bot_builds" };
  const backend = await deps.resolveBackend(build.storageConfigId);
  if (!backend) return { error: `хранилище ${build.storageConfigId} недоступно` };
  if (!isPresignable(backend)) {
    return { error: `хранилище ${build.storageConfigId} не выдаёт ссылки (нужен S3, задайте BOT_BUILDS_STORAGE_ID)` };
  }
  return {
    url: await backend.getPresignedUrl(build.objectKey, ttlSeconds),
    sha256: build.sha256,
    size: build.size,
    fingerprint: build.fingerprint,
    fileName: build.fileName,
  };
}
