/** @fileoverview Журнал внешних действий на основном пуле с фиксацией до вызова внешней системы. */
import { pool } from '../../database/db';
import { ActionRequestLedger } from './ledger';
/** Постоянный журнал; отсутствие миграции блокирует действие вместо небезопасного повтора. */
export const actionRequestLedger = new ActionRequestLedger(pool);
