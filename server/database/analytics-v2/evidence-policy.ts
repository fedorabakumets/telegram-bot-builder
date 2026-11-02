/** @fileoverview Явная проверенная область старого писателя и строгая классификация исторических свидетельств. */
/** Подтверждённая оператором область аудированной старой сборки. */
export interface LegacyEvidencePolicy {
  /** Проект. */ projectId: number;
  /** Бот проекта. */ tokenId: number;
  /** Верхняя граница проверенной истории, не расширяемая при возобновлении. */ throughMessageId: number;
  /** Username бота в исследованной истории без @. */ historicalUsername: string;
  /** SHA256 исследованного файла; не заменяет отсутствующую версию каждой строки. */ writerSha256: string;
}
/** Строка истории только для проверки; произвольные данные не копируются в свидетельство. */
export interface LegacyEvidenceRow {
  /** ID сохранённой строки, не Telegram callback ID. */ id: number;
  /** Отправитель. */ user_id: string;
  /** Тип записи. */ message_type: string;
  /** Исходный текст, используемый только при распознавании адресной команды. */ message_text: string | null;
  /** Старая структура метаданных. */ message_data: Record<string, unknown> | null;
  /** Физический ID Telegram-сообщения. */ telegram_message_id: number | null;
  /** Тип чата. */ chat_type: string;
  /** ID чата. */ chat_id: string | null;
  /** Время сохранения, не гарантированное время доставки Telegram. */ created_at: Date;
  /** Узел старого writer. */ node_id: string | null;
}
/**
 * Проверяет явную политику и нормализует безопасный username.
 * @param input - Область, fingerprint и неизменяемая верхняя граница.
 * @returns Нормализованная политика.
 */
export function validateEvidencePolicy(input: LegacyEvidencePolicy): LegacyEvidencePolicy {
  if (![input.projectId, input.tokenId, input.throughMessageId].every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('Укажите корректную область и верхний ID истории');
  if (!/^[a-f0-9]{64}$/.test(input.writerSha256) || !/^[A-Za-z0-9_]{1,32}$/.test(input.historicalUsername)) throw new Error('Нужны fingerprint проверенной сборки и исторический username');
  return { ...input, historicalUsername: input.historicalUsername.toLowerCase() };
}
/**
 * Отделяет доказательство контакта от callback с настоящей идентичностью.
 * @param row - Сохранённая строка.
 * @param policy - Проверенная область писателя.
 * @returns Основание либо отсутствие доказательства.
 */
export function classifyLegacyEvidence(row: LegacyEvidenceRow, policy: LegacyEvidencePolicy): 'legacy_callback' | 'addressed_command' | 'physical_callback' | null {
  if (row.message_type !== 'user' || !/^[1-9][0-9]{0,19}$/.test(row.user_id) || !['private', 'group', 'supergroup'].includes(row.chat_type)) return null;
  const data = row.message_data || {};
  if (data.button_clicked === true) {
    const ids = [data.callback_query_id, data.callback_id].filter(value => value !== undefined && value !== null).map(String);
    if (ids.length && ids.every(id => /^[0-9]{1,30}$/.test(id)) && new Set(ids).size === 1) return 'physical_callback';
    if (Object.keys(data).sort().join(',') !== 'button_clicked,button_text,callback_data' || row.telegram_message_id || row.node_id) return null;
    return typeof data.callback_data === 'string' && (data.button_text === null || typeof data.button_text === 'string') ? 'legacy_callback' : null;
  }
  const command = row.message_text?.match(/^\/[A-Za-z0-9_]{1,32}@([A-Za-z0-9_]{1,32})(?:\s|$)/);
  return row.telegram_message_id && ['group', 'supergroup'].includes(row.chat_type) && command?.[1].toLowerCase() === policy.historicalUsername ? 'addressed_command' : null;
}
