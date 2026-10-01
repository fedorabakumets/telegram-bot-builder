/**
 * @fileoverview Код бота для удалённого исполнителя (WORKER_RUNTIME=remote): вместо пути
 * на диске панели исполнитель получает ссылку на сборку в S3 и скачивает её сам.
 * @module server/bots/builds/runnerBuildForStart
 */

import { getWorkerRunnerCodeSource } from "../workerRuntime";
import { getProjectPlacement } from "../botPlacement";
import { isBotBuildStorageEnabled } from "./botBuildConfig";
import { createDefaultBotBuildDeps, type BotBuildDeps } from "./botBuildDeps";
import { getBotBuildLink, type BotBuildLink } from "./botBuildLink";
import type { StartBotBuildContext } from "./startBotBuildHooks";

/** Результат: сборка для исполнителя, ошибка запуска или ничего (код передаётся путём) */
export interface RunnerBuildForStart {
  /** Ссылка на сборку, если исполнитель должен скачать код сам */
  build?: BotBuildLink;
  /** Причина, по которой бота нельзя запустить на исполнителе */
  error?: string;
}

/**
 * Готовит код бота для исполнителя. Вызывается после сохранения сборки.
 * @param ctx - Контекст сборки запускаемого бота
 * @param deps - Зависимости (для тестов)
 * @returns ссылка на сборку, ошибка или пустой объект, если сборка не нужна
 */
export async function resolveRunnerBuildForStart(
  ctx: StartBotBuildContext,
  deps?: Pick<BotBuildDeps, "findBuild" | "resolveBackend">,
): Promise<RunnerBuildForStart> {
  const placement = getProjectPlacement(ctx.projectId);
  if (!placement.runnerId) return {};
  // Сервис Railway папку bots/ панели не видит никогда
  if (placement.railwayProjectId === null && getWorkerRunnerCodeSource() === "path") return {};
  const fallback = "или WORKER_RUNNER_CODE=path, если исполнитель видит папку bots/ панели";
  if (!isBotBuildStorageEnabled()) {
    return { error: `Исполнителю нужен код из S3: включите BOT_ARTIFACT_SOURCE=storage и BOT_BUILDS_STORAGE_ID (${fallback})` };
  }
  try {
    const link = await getBotBuildLink(ctx.tokenId, ctx.fingerprint, deps ?? (await createDefaultBotBuildDeps()));
    if ("error" in link) return { error: `Нет сборки для исполнителя: ${link.error} (${fallback})` };
    return { build: link };
  } catch (error) {
    return { error: `Не удалось выдать ссылку на сборку: ${error instanceof Error ? error.message : String(error)}` };
  }
}
