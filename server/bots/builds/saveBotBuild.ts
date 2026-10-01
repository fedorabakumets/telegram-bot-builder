/**
 * @fileoverview Сохранение сгенерированного кода бота как сборки в хранилище
 * @module server/bots/builds/saveBotBuild
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { buildBotBuildKey } from "./botBuildKey";
import { packBotBuild } from "./botBuildCodec";
import type { BotBuildDeps } from "./botBuildDeps";
import { pruneBotBuilds } from "./pruneBotBuilds";

/** Входные данные сохранения сборки */
export interface SaveBotBuildInput {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Отпечаток генерации */
  fingerprint: string;
  /** Версия генератора */
  generatorVersion: string;
  /** Путь к сгенерированному основному .py на диске */
  mainFile: string;
  /** Сколько сборок оставить на токен после сохранения */
  keep: number;
}

/** Результат: "exists" — сборка уже была, "saved" — записана новая */
export type SaveBotBuildResult = "exists" | "saved";

/**
 * Сохраняет код бота в хранилище и регистрирует сборку в таблице.
 * Сначала пишется объект, затем строка: без строки сборки не существует.
 * @param input - Данные сборки
 * @param deps - Таблица и хранилище
 * @returns Признак, была ли записана новая сборка
 */
export async function saveBotBuild(
  input: SaveBotBuildInput,
  deps: BotBuildDeps,
): Promise<SaveBotBuildResult> {
  if (await deps.findBuild(input.tokenId, input.fingerprint)) return "exists";

  const packed = packBotBuild(await readFile(input.mainFile));
  const backend = await deps.getWritableBackend();
  const objectKey = buildBotBuildKey(input.projectId, input.tokenId, input.fingerprint);
  await backend.put(objectKey, packed.data, "application/gzip");

  const inserted = await deps.insertBuild({
    projectId: input.projectId,
    tokenId: input.tokenId,
    fingerprint: input.fingerprint,
    storageConfigId: backend.configId,
    objectKey,
    fileName: basename(input.mainFile),
    size: packed.size,
    sha256: packed.sha256,
    generatorVersion: input.generatorVersion,
  });
  if (!inserted) return "exists";

  await pruneBotBuilds(input.tokenId, input.keep, deps);
  return "saved";
}
