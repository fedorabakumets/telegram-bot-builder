/**
 * @fileoverview Подготовка строки start_bot на исполнителе: сборка из S3 скачивается
 * в кеш, поле build заменяется путём bot_file к локальной копии.
 * @module server/runner/runnerStartCommand
 */

import { ensureCachedBuild, parseRunnerBuild, type FetchBuild } from "./runnerBuildCache";

/** Готовая к отправке строка */
export interface PreparedLine {
  /** Строка для stdin воркера */
  line: string;
  /** ID токена запускаемого бота (для start_bot со сборкой) */
  tokenId?: number;
  /** Отпечаток сборки, если код взят из кеша */
  fingerprint?: string;
}

/** Бота нельзя запустить: код не получен */
export interface PrepareFailure {
  /** ID токена */
  tokenId: number;
  /** Причина для лога бота */
  error: string;
}

/**
 * Готовит строку команды для воркера
 * @param line - Строка JSON от панели
 * @param cacheDir - Каталог кеша сборок
 * @param fetchBuild - Скачивание сборки
 * @returns строка как есть, строка с локальным bot_file или причина отказа
 */
export async function prepareWorkerLine(
  line: string,
  cacheDir: string,
  fetchBuild: FetchBuild,
): Promise<PreparedLine | PrepareFailure> {
  if (!line.includes('"build"')) return { line };
  const command = JSON.parse(line) as { cmd?: string; token_id?: number; build?: unknown; bot_file?: string };
  if (command.cmd !== "start_bot" || command.build === undefined) return { line };
  const tokenId = command.token_id ?? 0;
  try {
    const build = parseRunnerBuild(command.build);
    command.bot_file = await ensureCachedBuild(build, cacheDir, fetchBuild);
    delete command.build;
    return { line: JSON.stringify(command), tokenId, fingerprint: build.fingerprint };
  } catch (error) {
    return { tokenId, error: `Исполнитель не получил код бота: ${error instanceof Error ? error.message : String(error)}` };
  }
}
