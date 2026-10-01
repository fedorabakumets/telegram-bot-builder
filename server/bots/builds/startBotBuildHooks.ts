/**
 * @fileoverview Точки подключения сборок к запуску бота: восстановление и сохранение
 * без влияния на старт — сбой хранилища только пишет предупреждение в лог
 * @module server/bots/builds/startBotBuildHooks
 */

import { getBotBuildsKeep, isBotBuildStorageEnabled } from "./botBuildConfig";
import { createDefaultBotBuildDeps, type BotBuildDeps } from "./botBuildDeps";
import { restoreBotBuild } from "./restoreBotBuild";
import { saveBotBuild } from "./saveBotBuild";

/** Контекст сборки при запуске бота */
export interface StartBotBuildContext {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
  /** Отпечаток генерации */
  fingerprint: string;
  /** Версия генератора */
  generatorVersion: string;
  /** Путь к основному .py */
  mainFile: string;
}

/**
 * Возвращает текст ошибки для лога.
 * @param error - Пойманное исключение
 * @returns Сообщение
 */
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Пытается восстановить код бота из хранилища вместо повторной генерации.
 * @param ctx - Контекст сборки
 * @param deps - Зависимости (для тестов)
 * @returns true, если код восстановлен на диск
 */
export async function restoreBotBuildForStart(
  ctx: StartBotBuildContext,
  deps?: BotBuildDeps,
): Promise<boolean> {
  if (!isBotBuildStorageEnabled()) return false;
  try {
    const restored = await restoreBotBuild(ctx, deps ?? (await createDefaultBotBuildDeps()));
    if (restored) {
      console.log(`📦 [BotBuilds] Код бота взят из хранилища: tokenId=${ctx.tokenId}`);
    }
    return restored;
  } catch (error) {
    console.warn(`⚠️ [BotBuilds] Не удалось восстановить сборку tokenId=${ctx.tokenId}: ${errorText(error)}`);
    return false;
  }
}

/**
 * Сохраняет текущий код бота как сборку, если её ещё нет.
 * @param ctx - Контекст сборки
 * @param deps - Зависимости (для тестов)
 */
export async function persistBotBuildForStart(
  ctx: StartBotBuildContext,
  deps?: BotBuildDeps,
): Promise<void> {
  if (!isBotBuildStorageEnabled()) return;
  try {
    const result = await saveBotBuild(
      { ...ctx, keep: getBotBuildsKeep() },
      deps ?? (await createDefaultBotBuildDeps()),
    );
    if (result === "saved") {
      console.log(`📦 [BotBuilds] Сборка сохранена в хранилище: tokenId=${ctx.tokenId}`);
    }
  } catch (error) {
    console.warn(`⚠️ [BotBuilds] Не удалось сохранить сборку tokenId=${ctx.tokenId}: ${errorText(error)}`);
  }
}
