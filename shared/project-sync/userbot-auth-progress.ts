/**
 * @fileoverview Контракт синхронизации шагов авторизации юзербота без секретов.
 * @module shared/project-sync/userbot-auth-progress
 */

/** Данные шага авторизации для вкладок с доступом к проекту */
export interface UserbotAuthProgress {
  /** Текущий шаг авторизации */
  step: 'code' | '2fa' | 'done';
  /** Телефон для продолжения входа из другой вкладки; отсутствует после входа */
  phone?: string;
}

/**
 * Проверяет данные события и оставляет только разрешённые поля.
 * @param value - Данные WebSocket-события
 * @returns Проверенный шаг либо null
 */
export function parseUserbotAuthProgress(value: unknown): UserbotAuthProgress | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (data.step === 'done') return { step: 'done' };
  if ((data.step === 'code' || data.step === '2fa') && typeof data.phone === 'string' && data.phone.trim()) {
    return { step: data.step, phone: data.phone };
  }
  return null;
}
