/**
 * @fileoverview Перенос листа между двумя проектами живой БД (live-редактирование)
 * @description Db-обёртка над moveSheetBetweenProjects: читает оба проекта из БД
 * через GET /api/projects/:id, применяет чистый перенос листа, затем пишет
 * результат обратно. Порядок записи безопасный: СНАЧАЛА целевой проект (PUT target,
 * где лист появляется), и только при успехе — исходный (PUT source, где лист
 * удаляется в режиме move). Если запись target провалилась, source не трогается,
 * поэтому лист не теряется. В режиме copy исходный проект не пишется вовсе.
 * @module lib/bot-tools/sheet-move-ops-db
 */

import { fetchProjectFromDb } from './project-db-read.ts';
import {
  updateProjectInDb,
  type UpdateProjectInDbOptions,
} from './project-db.ts';
import { moveSheetBetweenProjects, type MoveSheetMode } from './sheet-move-ops.ts';

/** Опции переноса листа между проектами над живой БД */
export type MoveSheetToProjectDbOptions = UpdateProjectInDbOptions;

/** Успешный результат переноса листа между проектами в БД */
export interface MoveSheetToProjectDbSuccess {
  /** Признак успеха */
  ok: true;
  /** ID исходного проекта */
  sourceProjectId: number;
  /** ID целевого проекта */
  targetProjectId: number;
  /** id листа в целевом проекте (новый) */
  newSheetId: string;
  /** Имя добавленного листа в целевом проекте */
  newSheetName: string;
  /** Режим операции */
  mode: MoveSheetMode;
  /** Подтверждённые изменения проектов */
  persistence: { target: unknown; source?: unknown };
  /** Эффект операции */
  effect: "application";
  /** Статус сохранения */
  outcome: "saved";
}

/** Результат переноса листа между проектами в БД с ошибкой */
export interface MoveSheetToProjectDbError {
  /** Текст ошибки */
  error: string;
  /** Доп. детали (HTTP-статус, тело, валидация) */
  details?: unknown;
  /** Частично выполненный перенос требует сверки перед повтором */
  outcome?: "partial" | "unknown";
  /** Исход удаления из источника при частичном переносе */
  sourceOutcome?: "not_saved" | "unknown";
  /** Подтверждённый эффект в целевом проекте */
  persistence?: unknown;
}

/** Объединённый тип возврата moveSheetToProjectInDb */
export type MoveSheetToProjectDbResult = MoveSheetToProjectDbSuccess | MoveSheetToProjectDbError;

/**
 * Переносит (move) или копирует (copy) лист из одного проекта живой БД в другой
 * и обновляет оба холста (live). Лист получает свежие id нод/веток, внутренние
 * связи ремаппятся, кросс-листовые ссылки обрываются.
 *
 * Порядок записи: сначала целевой проект (где лист появляется), затем — только
 * при успехе и только в режиме move — исходный (где лист удаляется). Это
 * исключает потерю листа при сбое первой записи.
 * @param sourceProjectId - ID исходного проекта
 * @param targetProjectId - ID целевого проекта
 * @param sheetId - ID переносимого листа в исходном проекте
 * @param mode - 'move' (перенос) или 'copy' (копирование), по умолчанию 'copy'
 * @param options - Опции записи в БД (URL API, заметка к версии, данные агента)
 * @returns Результат успеха или ошибки
 */
export async function moveSheetToProjectInDb(
  sourceProjectId: number,
  targetProjectId: number,
  sheetId: string,
  mode: MoveSheetMode = 'copy',
  options?: MoveSheetToProjectDbOptions,
): Promise<MoveSheetToProjectDbResult> {
  if (sourceProjectId === targetProjectId) {
    return { error: 'Исходный и целевой проект совпадают — используй duplicate_sheet' };
  }

  const sourceFetched = await fetchProjectFromDb(sourceProjectId, options);
  if ('error' in sourceFetched) return { error: `Источник: ${sourceFetched.error}` };
  const targetFetched = await fetchProjectFromDb(targetProjectId, options);
  if ('error' in targetFetched) return { error: `Цель: ${targetFetched.error}` };

  const moved = moveSheetBetweenProjects(
    sourceFetched.data,
    targetFetched.data,
    sheetId,
    mode,
  );
  if ('error' in moved) return { error: moved.error };

  // Шаг 1: пишем целевой проект (лист появляется здесь)
  const targetSave = await updateProjectInDb(targetProjectId, moved.target, { ...options, expectedRevision: targetFetched.revision });
  if ('error' in targetSave) {
    return { error: `Не удалось подтвердить запись целевого проекта: ${targetSave.error}`, details: targetSave, ...(targetSave.outcome === "unknown" ? { outcome: "unknown" as const } : {}) };
  }

  let sourceReceipt: unknown;
  // Шаг 2: в режиме move удаляем лист из источника (только после успеха цели)
  if (mode === 'move') {
    const sourceSave = await updateProjectInDb(sourceProjectId, moved.source, { ...options, expectedRevision: sourceFetched.revision });
    if ('error' in sourceSave) {
      return {
        error:
          `Лист сохранён в целевом проекте, но удаление из исходного не подтверждено: ${sourceSave.error}. ` +
          `Перечитайте оба проекта перед повтором операции.`,
        details: sourceSave,
        outcome: "partial",
        sourceOutcome: sourceSave.outcome === "unknown" ? "unknown" : "not_saved",
        persistence: targetSave.persistence,
      };
    }
    sourceReceipt = sourceSave.persistence;
  }

  return {
    ok: true,
    sourceProjectId,
    targetProjectId,
    newSheetId: moved.newSheetId,
    newSheetName: moved.newSheetName,
    mode,
    effect: "application",
    outcome: "saved",
    persistence: { target: targetSave.persistence, ...(sourceReceipt ? { source: sourceReceipt } : {}) },
  };
}
