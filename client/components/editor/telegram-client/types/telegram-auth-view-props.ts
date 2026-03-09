/**
 * @fileoverview Типы пропсов для компонентов TelegramAuth
 *
 * @module TelegramAuthViewProps
 */

import type { AuthStep, QrState } from './telegram-auth-state';

/**
 * Пропсы компонента начального шага
 */
export interface StartStepViewProps {
  /** Обработчик генерации QR-кода */
  onGenerateQr: () => void;
  /** Статус загрузки */
  isLoading: boolean;
}

/**
 * Пропсы компонента шага с QR-кодом
 */
export interface QrStepViewProps {
  /** Состояние QR-кода */
  qrState: QrState;
  /** Статус загрузки */
  isLoading: boolean;
  /** Обработчик проверки статуса QR */
  onCheckStatus: () => void;
  /** Обработчик обновления QR */
  onRefreshQr: () => void;
  /** Обработчик возврата назад */
  onBack: () => void;
  /** Статус обновления QR (для анимации) */
  isRefreshing?: boolean;
}

/**
 * Пропсы компонента шага с 2FA паролем
 */
export interface QrPasswordStepViewProps {
  /** Пароль 2FA */
  password: string;
  /** Статус загрузки */
  isLoading: boolean;
  /** Обработчик изменения пароля */
  onPasswordChange: (value: string) => void;
  /** Обработчик отправки пароля */
  onSubmitPassword: () => Promise<void>;
  /** Обработчик возврата назад */
  onBack: () => void;
}
