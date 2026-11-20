/** @fileoverview Сохранение и атомарное резервирование ближайших запусков расписаний. */
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { pool } from '../../database/db';
import { nextCheckRun, type CheckSchedule, type CheckScheduleSettings } from '../../../shared/check-schedule';
import type { CheckHistoryKind } from '../../../shared/check-history';
/** Область немедленного запуска после сохранения, исключающая чужие расписания. */
export interface CheckScheduleScope {
  /** Проект. */ projectId: number;
  /** Вид проверки. */ kind: CheckHistoryKind;
  /** Выбранный бот либо все. */ tokenId: number | null;
}
/** Проецирует строку расписания без личности инициатора и служебной резервации. @param row - Строка БД. @returns Публичные настройки. */
export function mapCheckSchedule(row: Record<string, any>): CheckSchedule {
  /** После потери процесса неподтверждённый запуск не остаётся в состоянии ожидания бесконечно. */
  const interrupted = row.last_outcome === 'starting' && row.last_run_at && Date.now() - row.last_run_at.getTime() > 120_000;
  return { kind: row.kind, tokenId: row.token_id, enabled: row.enabled, every: row.every_count, unit: row.unit,
    firstAt: row.first_at.toISOString(), nextRunAt: row.next_run_at.toISOString(),
    lastRunAt: row.last_run_at?.toISOString() ?? null, lastOutcome: interrupted ? 'unknown' : row.last_outcome };
}
/** Изолируемое хранилище расписаний. @param database - Пул. @returns Чтение, запись и резервирование. */
export function createCheckScheduleStore(database: Pool = pool) {
  /** Читает только явно выбранную область проекта. */
  async function get(projectId: number, kind: CheckHistoryKind, tokenId: number | null) {
    const result = await database.query('SELECT * FROM check_schedules WHERE project_id=$1 AND kind=$2 AND token_id IS NOT DISTINCT FROM $3::integer', [projectId,kind,tokenId]);
    return result.rows[0] ? mapCheckSchedule(result.rows[0]) : null;
  }
  /** Текущая минута означает немедленный первый запуск; будущая дата сохраняет отложенный запуск. */
  async function save(projectId: number, kind: CheckHistoryKind, tokenId: number | null, userId: number, settings: CheckScheduleSettings) {
    const now = new Date();
    const immediate = settings.enabled && Math.floor(Date.parse(settings.firstAt)/60_000) === Math.floor(now.getTime()/60_000);
    const firstAt = immediate ? now.toISOString() : settings.firstAt;
    const next = immediate ? now : nextCheckRun(firstAt, settings.every, settings.unit, now);
    const row = (await database.query(`INSERT INTO check_schedules(project_id,kind,token_id,created_by,enabled,every_count,unit,first_at,next_run_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(project_id,kind,(COALESCE(token_id,0))) DO UPDATE SET
      created_by=EXCLUDED.created_by,enabled=EXCLUDED.enabled,every_count=EXCLUDED.every_count,unit=EXCLUDED.unit,
      first_at=EXCLUDED.first_at,next_run_at=EXCLUDED.next_run_at,updated_at=now() RETURNING *`,
    [projectId,kind,tokenId,userId,settings.enabled,settings.every,settings.unit,firstAt,next])).rows[0];
    return mapCheckSchedule(row);
  }
  /** Одна транзакция переносит следующий запуск до внешних действий: другие процессы не повторят ту же попытку. */
  async function claim(now = new Date(), scope?: CheckScheduleScope) {
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      const row = (await client.query(`SELECT * FROM check_schedules WHERE enabled AND next_run_at<=$1
        AND ($2::integer IS NULL OR (project_id=$2 AND kind=$3 AND token_id IS NOT DISTINCT FROM $4::integer))
        ORDER BY next_run_at LIMIT 1 FOR UPDATE SKIP LOCKED`, [now,scope?.projectId ?? null,scope?.kind ?? null,scope?.tokenId ?? null])).rows[0];
      if (!row) { await client.query('COMMIT'); return null; }
      const claimId = randomUUID(), next = nextCheckRun(row.first_at.toISOString(), row.every_count, row.unit, now);
      await client.query(`UPDATE check_schedules SET next_run_at=$2,last_run_at=$3,last_outcome='starting',claim_id=$4 WHERE id=$1`, [row.id,next,now,claimId]);
      await client.query('COMMIT'); return { ...row, claim_id: claimId };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  /** Записывает только безопасный результат именно этой попытки, сохраняя более новые результаты. */
  async function outcome(id: number, claimId: string, result: 'started' | 'skipped_active' | 'error' | 'access_revoked' | 'bot_removed') {
    await database.query(`UPDATE check_schedules SET last_outcome=$3,enabled=CASE WHEN $3 IN ('access_revoked','bot_removed') THEN false ELSE enabled END
      WHERE id=$1 AND claim_id=$2`, [id,claimId,result]);
  }
  return { get, save, claim, outcome };
}
/** Хранилище текущего приложения. */
export const checkScheduleStore = createCheckScheduleStore();
