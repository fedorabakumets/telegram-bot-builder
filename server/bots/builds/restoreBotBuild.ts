/**
 * @fileoverview Восстановление кода бота на диск из сохранённой сборки
 * @module server/bots/builds/restoreBotBuild
 */

import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { readStreamToBuffer, unpackBotBuild } from "./botBuildCodec";
import type { BotBuildDeps } from "./botBuildDeps";

/** Входные данные восстановления сборки */
export interface RestoreBotBuildInput {
  /** ID токена */
  tokenId: number;
  /** Отпечаток генерации */
  fingerprint: string;
  /** Куда записать основной .py */
  mainFile: string;
}

/**
 * Скачивает сборку по отпечатку, проверяет целостность и атомарно пишет код на диск.
 * @param input - Токен, отпечаток и путь основного файла
 * @param deps - Таблица и хранилище
 * @returns true, если код восстановлен; false — сборки с таким отпечатком нет
 * @throws Если хранилище недоступно или сборка повреждена
 */
export async function restoreBotBuild(input: RestoreBotBuildInput, deps: BotBuildDeps): Promise<boolean> {
  const build = await deps.findBuild(input.tokenId, input.fingerprint);
  if (!build) return false;

  const backend = await deps.resolveBackend(build.storageConfigId);
  if (!backend) throw new Error(`Хранилище сборки "${build.storageConfigId}" не найдено`);

  const packed = await readStreamToBuffer(await backend.get(build.objectKey));
  const code = unpackBotBuild(packed, { size: build.size, sha256: build.sha256 });

  await mkdir(dirname(input.mainFile), { recursive: true });
  const tmpFile = `${input.mainFile}.${process.pid}.tmp`;
  await writeFile(tmpFile, code);
  await rename(tmpFile, input.mainFile);
  return true;
}
