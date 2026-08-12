/**
 * @fileoverview Правила клика по шагам мастера рассылки
 * @module client/components/editor/broadcast/wizard/can-navigate-broadcast-step
 */

import { validateBroadcastMessage } from '../utils/validate-broadcast-message';
import type { NewBroadcastFormData } from '../types';

/**
 * Можно ли перейти на targetStep с текущего (назад всегда, вперёд — если «Далее» уже доступна)
 * @param targetStep - Целевой шаг 1–3
 * @param currentStep - Текущий шаг 1–3
 * @param formData - Данные формы
 * @returns true если переход разрешён
 */
export function canNavigateBroadcastStep(
  targetStep: number,
  currentStep: number,
  formData: NewBroadcastFormData,
): boolean {
  if (targetStep < 1 || targetStep > 3) return false;
  if (targetStep === currentStep) return false;
  if (targetStep < currentStep) return true;

  const hasBots = (formData.tokenIds?.length ?? 0) > 0;
  if (targetStep >= 2 && !hasBots) return false;
  if (targetStep >= 3 && !validateBroadcastMessage(formData).isValid) return false;
  return true;
}
