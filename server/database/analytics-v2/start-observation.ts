/** @fileoverview Строгий разбор исторического /start с сохранением только безопасной публичной метки. */
import type { LegacyBackfillRow } from './backfill-event';
/** Строка входящего сообщения с безопасными признаками принадлежности команды. */
export interface StartObservationRow extends LegacyBackfillRow {
  /** Исходный текст нужен только локальному разбору и не копируется в наблюдение. */ message_text: string | null;
  /** Существующее подтверждённое событие с той же физической идентичностью. */ directed_event: boolean;
  /** Профиль явно помечен ботом. */ is_bot: boolean;
}
/** Безопасное наблюдение, не являющееся подтверждённой рекламной атрибуцией. */
export interface StartObservation {
  /** Человек, написавший команду. */ user: string;
  /** Физическая идентичность входящего сообщения. */ key: string;
  /** Время сохранения старой строки. */ at: string;
  /** Публичная метка, без auth-кодов. */ marker: string | null;
  /** Тип наблюдения без подтверждения авторизации или реферала. */ category: 'marker' | 'no_marker' | 'referral_unknown' | 'auth_candidate';
}
/**
 * Разбирает команду без обращения к изменяемому deep_link_param профиля.
 * @param row - Старая строка переписки.
 * @param username - Проверенный username текущего бота.
 * @returns Минимальное наблюдение либо безопасный код пропуска.
 */
export function parseStartObservation(row: StartObservationRow, username: string | null): { observation?: StartObservation; reason?: string } {
  const senderIsBot = [row.message_data?.from_user, row.message_data?.from].some(sender => sender && typeof sender === 'object' && (sender as { is_bot?: unknown }).is_bot === true);
  if (row.message_type !== 'user' || row.is_bot || senderIsBot || row.message_data?.sender_chat || !/^[1-9][0-9]{0,19}$/.test(row.user_id || '') || row.message_data?.button_clicked === true) return { reason: 'not_human_message' };
  if (!['private', 'group', 'supergroup'].includes(row.chat_type || '')) return { reason: 'unsupported_chat' };
  const match = row.message_text?.trimEnd().match(/^\/start(?:@([A-Za-z0-9_]{1,32}))?(?:\s+([\s\S]*))?$/);
  if (!match) return { reason: 'not_start_command' };
  if (match[1] && match[1].toLowerCase() !== username?.toLowerCase()) return { reason: 'other_bot_command' };
  if (row.chat_type !== 'private' && !match[1] && !row.directed_event) return { reason: 'unconfirmed_group_command' };
  const chat = row.chat_id || (row.chat_type === 'private' ? row.user_id : null);
  if (!Number.isSafeInteger(row.telegram_message_id) || Number(row.telegram_message_id) <= 0 || !chat || !/^-?[0-9]{1,20}$/.test(chat)) return { reason: 'message_identity_missing' };
  const at = row.created_at ? new Date(row.created_at).getTime() : NaN;
  if (!Number.isFinite(at) || at > Date.now() + 300000) return { reason: 'invalid_timestamp' };
  const payload = (match[2] || '').trim();
  const base = { user: row.user_id!, key: `msg:${chat}:${row.telegram_message_id}`, at: new Date(at).toISOString() };
  if (payload.toLowerCase().includes('link_')) return { observation: { ...base, marker: null, category: 'auth_candidate' } };
  if (!payload) return { observation: { ...base, marker: null, category: 'no_marker' } };
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(payload)) return { reason: 'invalid_public_marker' };
  return { observation: { ...base, marker: payload, category: /^ref(?:_|$)/i.test(payload) ? 'referral_unknown' : 'marker' } };
}
