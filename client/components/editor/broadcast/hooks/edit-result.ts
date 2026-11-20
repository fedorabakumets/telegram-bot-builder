/** @fileoverview Общая интерпретация результата редактирования рассылки. */

/** Результат изменения отправленных сообщений. */
export interface BroadcastEditResult {
  /** Число подтверждённых изменений в Telegram. */
  edited: number;
  /** Число неудачных изменений. */
  failed: number;
  /** Общий признак успешности, если сервер его передал. */
  ok?: boolean;
  /** Количество сообщений с уже совпадающим содержимым. */
  unchanged?: number;
  /** Количество неподтверждённых результатов. */
  unknown?: number;
  /** Количество сообщений без адреса Telegram. */
  skipped?: number;
  /** Признак подтверждения сохранения, если передан сервером. */
  persistence?: boolean | {
    /** Подтверждено ли сохранение всех изменений. */
    confirmed: boolean;
    /** Количество ошибок сохранения. */
    failed: number;
  };
  /** Общий исход операции. */
  outcome?: string;
}

/**
 * Проверяет полное подтверждение изменений и сохранения.
 * @param result - Результат сервера
 * @returns Признак полного успеха
 */
export function isBroadcastEditComplete(result: BroadcastEditResult) {
  return result.edited + (result.unchanged ?? 0) > 0 && result.failed === 0
    && (result.unknown ?? 0) === 0 && (result.skipped ?? 0) === 0
    && result.ok !== false && isBroadcastEditPersisted(result)
    && (!result.outcome || result.outcome === 'success');
}

/**
 * Проверяет подтверждение сохранения для нового и прежнего форматов API.
 * @param result - Результат сервера
 * @returns Признак подтверждённого сохранения
 */
function isBroadcastEditPersisted(result: BroadcastEditResult) {
  return typeof result.persistence === 'object'
    ? result.persistence.confirmed && result.persistence.failed === 0
    : result.persistence !== false;
}

/**
 * Возвращает честное уведомление о полном, частичном или неуспешном изменении.
 * @param result - Подтверждённый сервером результат
 * @returns Параметры уведомления
 */
export function getBroadcastEditNotice(result: BroadcastEditResult) {
  const success = isBroadcastEditComplete(result);
  const confirmed = result.edited + (result.unchanged ?? 0);
  return {
    title: success ? 'Текст обновлён в Telegram' : confirmed > 0 ? 'Текст обновлён частично' : 'Сообщения в Telegram не изменены',
    description: `Изменено: ${result.edited}. Уже совпадали: ${result.unchanged ?? 0}. Ошибок: ${result.failed}. Не подтверждено: ${result.unknown ?? 0}. Пропущено: ${result.skipped ?? 0}.${!isBroadcastEditPersisted(result) ? ' Сохранение на сайте не подтверждено.' : ''}`,
    variant: success ? 'default' as const : 'destructive' as const,
  };
}
