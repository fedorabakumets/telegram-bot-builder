/**
 * @fileoverview Какие базы бэкапить по расписанию: база панели (`DATABASE_URL`, метка
 * `DB_BACKUP_LABEL`) и дополнительные из `DB_BACKUP_TARGETS` — например, база ботов на Railway.
 * @module server/database/backups/dbBackupTargets
 */

import { assertBackupLabel, DEFAULT_DB_BACKUP_LABEL } from "./dbBackupConfig";
import type { DbBackupEntry } from "./dbBackupIndex";

/** База для бэкапа по расписанию */
export interface DbBackupTarget {
  /** Метка бэкапов (часть ключа в хранилище) */
  label: string;
  /** Адрес базы PostgreSQL */
  databaseUrl: string;
}

/**
 * Разбирает `DB_BACKUP_TARGETS`: пары `метка=адрес`, разделённые пробелом, переводом строки или `;`
 * @param raw - Значение переменной
 * @returns базы для бэкапа
 * @throws Error при паре без `=` или с недопустимой меткой
 */
export function parseDbBackupTargets(raw: string | undefined): DbBackupTarget[] {
  return (raw ?? "")
    .split(/[\s;]+/)
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf("=");
      if (eq <= 0 || eq === pair.length - 1) throw new Error(`DB_BACKUP_TARGETS: ожидается "метка=адрес", получено "${pair.slice(0, 20)}…"`);
      return { label: assertBackupLabel(pair.slice(0, eq)), databaseUrl: pair.slice(eq + 1) };
    });
}

/**
 * Все базы для бэкапа по расписанию
 * @param env - Переменные окружения
 * @returns база панели (если задан DATABASE_URL) и дополнительные базы
 * @throws Error, если метки повторяются
 */
export function getDbBackupTargets(env: NodeJS.ProcessEnv = process.env): DbBackupTarget[] {
  const targets: DbBackupTarget[] = [];
  const panelUrl = env.DATABASE_URL?.trim();
  if (panelUrl) targets.push({ label: assertBackupLabel(env.DB_BACKUP_LABEL?.trim() || DEFAULT_DB_BACKUP_LABEL), databaseUrl: panelUrl });
  targets.push(...parseDbBackupTargets(env.DB_BACKUP_TARGETS));
  const seen = new Set<string>();
  for (const { label } of targets) {
    if (seen.has(label)) throw new Error(`Метка бэкапа "${label}" повторяется`);
    seen.add(label);
  }
  return targets;
}

/**
 * Проверяет, что последний бэкап метки не старше двух интервалов
 * @param entries - Бэкапы метки
 * @param intervalHours - Интервал расписания
 * @param now - Текущее время
 * @returns текст предупреждения или null, если бэкап свежий
 */
export function staleBackupWarning(entries: DbBackupEntry[], intervalHours: number, now = new Date()): string | null {
  const latest = entries.reduce<number>((max, e) => Math.max(max, Date.parse(e.createdAt) || 0), 0);
  if (latest === 0) return "бэкапов ещё нет";
  const ageHours = (now.getTime() - latest) / 3_600_000;
  return ageHours > intervalHours * 2 ? `последний бэкап ${ageHours.toFixed(1)} ч назад` : null;
}
