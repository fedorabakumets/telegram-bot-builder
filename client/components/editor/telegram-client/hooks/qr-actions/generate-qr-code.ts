/**
 * @fileoverview Функция генерации QR-кода для авторизации
 *
 * @module generateQrCode
 */

import type { QrState } from '../../types';
import type { NotificationService } from '../../services';
import { createTelegramAuthService } from '../../services/telegram-auth-service';
import { QR_TOKEN_EXPIRY } from '../../constants';

/**
 * Параметры для генерации QR-кода
 */
export interface GenerateQrCodeParams {
  /** Установить состояние QR */
  setQrState: (state: QrState) => void;
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Сервис уведомлений */
  notifications: NotificationService;
  /** Пароль 2FA (опционально) */
  password?: string;
}

/**
 * Результат генерации QR-кода
 */
export interface GenerateQrCodeResult {
  /** Успешно ли выполнение */
  success: boolean;
  /** Требуется ли пароль 2FA */
  requiresPassword?: boolean;
}

/**
 * Генерирует QR-код для авторизации
 *
 * @param params - Параметры генерации
 * @returns {Promise<GenerateQrCodeResult>} Результат операции
 */
export async function generateQrCode(
  params: GenerateQrCodeParams
): Promise<GenerateQrCodeResult> {
  const { setQrState, setIsLoading, notifications, password } = params;
  const authService = createTelegramAuthService();

  setIsLoading(true);
  try {
    const response = await authService.generateQr(password);

    if (response.success) {
      if (response.requiresPassword) {
        notifications.info('Требуется 2FA', 'Введите пароль двухфакторной аутентификации');
        return { success: true, requiresPassword: true };
      }

      if (response.token && response.qrUrl) {
        setQrState({
          token: response.token,
          url: response.qrUrl,
          password: password || '',
          countdown: response.expires ?? QR_TOKEN_EXPIRY,
        });
        notifications.success('QR-код сгенерирован', 'Отсканируйте QR-код в приложении Telegram');
      }
    } else {
      notifications.error('Ошибка', response.error ?? 'Не удалось сгенерировать QR-код');
    }

    return { success: response.success, requiresPassword: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось сгенерировать QR-код';
    notifications.error('Ошибка', message);
    return { success: false };
  } finally {
    setIsLoading(false);
  }
}
