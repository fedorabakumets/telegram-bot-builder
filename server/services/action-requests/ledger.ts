/** @fileoverview Постоянный журнал заявок: захват до эффекта и запрет повторного выполнения после неопределённого исхода. */
import { createHash } from 'node:crypto';
/** Минимальный SQL-интерфейс, позволяющий изолированные проверки без рабочей базы. */
export interface RequestSql {
  /** Выполняет параметризованный запрос. */
  query(text: string, values: unknown[]): Promise<{ rows: any[]; rowCount?: number | null }>;
}
/** Ключ подтверждённого авторизацией действия. */
export interface ActionRequestKey {
  /** Область проекта либо владельца шаблона. */
  scope: string;
  /** Стабильное имя действия. */
  action: string;
  /** Идентификатор одной попытки. */
  requestId: string;
}
/** Состояние ранее принятой заявки. */
export interface ActionRequestRecord {
  /** Отпечаток всех значимых аргументов. */
  request_hash: string;
  /** Состояние исполнения, не предполагающее автоматического восстановления. */
  state: 'pending' | 'completed' | 'unknown';
  /** Код сохранённого ответа. */
  status: number | null;
  /** Разрешённая квитанция без секретов. */
  receipt: unknown;
}
/** Канонизирует вложенные JSON-аргументы без изменения порядка массивов. @param value - Значение. @returns Канонический JSON. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => JSON.stringify(key) + ':' + canonical(item)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}
/** Вычисляет отпечаток, не сохраняя исходное тело. @param input - Параметры, запрос и тело без requestId. @returns SHA-256. */
export function actionRequestHash(input: unknown): string {
  return createHash('sha256').update(canonical(input)).digest('hex');
}
/** Постоянный журнал без аренды и повторного захвата: сбой процесса оставляет pending. */
export class ActionRequestLedger {
  /** Создаёт журнал. @param sql - SQL-подключение с автокоммитом до внешнего эффекта. */
  constructor(private readonly sql: RequestSql) {}
  /** Захватывает заявку атомарно. @param key - Авторизованный ключ. @param hash - Отпечаток. @returns Захват либо прежняя запись. */
  async claim(key: ActionRequestKey, hash: string): Promise<{ acquired: boolean; record?: ActionRequestRecord }> {
    const args = [key.scope, key.action, key.requestId, hash];
    const inserted = await this.sql.query('INSERT INTO action_requests(scope,action,request_id,request_hash) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING request_id', args);
    if (inserted.rows.length) return { acquired: true };
    const prior = await this.sql.query('SELECT request_hash,state,status,receipt FROM action_requests WHERE scope=$1 AND action=$2 AND request_id=$3', args.slice(0, 3));
    if (!prior.rows[0]) throw new Error('Заявка исчезла после конфликта; выполнение запрещено');
    return { acquired: false, record: prior.rows[0] };
  }
  /** Фиксирует квитанцию до отправки ответа. @param key - Ключ. @param status - HTTP-код. @param receipt - Безопасная квитанция. @returns Завершение записи. */
  async complete(key: ActionRequestKey, status: number, receipt: unknown): Promise<void> {
    const result = await this.sql.query("UPDATE action_requests SET state='completed',status=$4,receipt=$5::jsonb,updated_at=now() WHERE scope=$1 AND action=$2 AND request_id=$3 AND state='pending' RETURNING request_id", [key.scope, key.action, key.requestId, status, JSON.stringify(receipt)]);
    if (!result.rows.length) throw new Error('Не удалось подтвердить запись квитанции');
  }
  /** Сохраняет безопасный частичный результат до следующего шага. @param key - Ключ. @param receipt - Квитанция уже созданного объекта. @returns Подтверждение записи. */
  async checkpoint(key: ActionRequestKey, receipt: unknown): Promise<void> {
    const result = await this.sql.query("UPDATE action_requests SET receipt=$4::jsonb,updated_at=now() WHERE scope=$1 AND action=$2 AND request_id=$3 AND state='pending' RETURNING request_id", [key.scope, key.action, key.requestId, JSON.stringify(receipt)]);
    if (!result.rows.length) throw new Error('Не удалось записать частичную квитанцию');
  }
  /** Отмечает неопределённый исход без повторного запуска. @param key - Ключ. @returns Завершение записи. */
  async unknown(key: ActionRequestKey): Promise<void> {
    await this.sql.query("UPDATE action_requests SET state='unknown',updated_at=now() WHERE scope=$1 AND action=$2 AND request_id=$3 AND state='pending'", [key.scope, key.action, key.requestId]);
  }
}
