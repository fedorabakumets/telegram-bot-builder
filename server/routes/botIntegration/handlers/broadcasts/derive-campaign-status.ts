/**
 * @fileoverview Вычисление статуса кампании рассылки по статусам дочерних рассылок
 * @module botIntegration/handlers/broadcasts/derive-campaign-status
 */

import type { BroadcastCampaignStatus } from "@shared/schema";

/** Статусы, при которых кампания считается завершённой */
const TERMINAL_STATUSES: BroadcastCampaignStatus[] = ["done", "failed", "stopped", "partial"];

/**
 * Вычисляет агрегированный статус кампании по статусам её дочерних рассылок.
 * Правила: есть running → running; все одинаковые → этот статус;
 * микс done/stopped → stopped; любой микс с failed → partial.
 * @param childStatuses - Статусы дочерних рассылок
 * @returns Статус кампании
 */
export function deriveCampaignStatus(childStatuses: string[]): BroadcastCampaignStatus {
  if (childStatuses.length === 0) return "pending";

  const unique = new Set(childStatuses);

  if (unique.size === 1 && unique.has("pending")) return "pending";
  if (unique.has("running") || unique.has("pending")) return "running";

  if (unique.size === 1) {
    const [only] = Array.from(unique);
    if (only === "done" || only === "failed" || only === "stopped") return only;
    return "partial";
  }

  // Остались миксы терминальных статусов: done / failed / stopped
  return unique.has("failed") ? "partial" : "stopped";
}

/**
 * Проверяет, является ли статус кампании завершённым
 * @param status - Статус кампании
 * @returns true, если кампания больше не выполняется
 */
export function isTerminalCampaignStatus(status: BroadcastCampaignStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
