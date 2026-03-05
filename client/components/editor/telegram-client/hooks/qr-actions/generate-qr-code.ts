/**
 * @fileoverview Функция генерации QR-кода для авторизации
 *
 * @module generateQrCode
 */

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { QrState } from '../types';

/**
 * Параметры для генерации QR-кода
 */
export interface GenerateQrCodeParams {
  /** Установить состояние QR */
  setQrState: (state: QrState) => void;
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
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
 *
 * @example
 * ```tsx
 * const result = await generateQrCode({ setQrState, setIsLoading, password });
 * if (result.requiresPassword) {
 *   setStep('qr-password');
 * }
 * ```
 */
export async function generateQrCode(
  params: GenerateQrCodeParams
): Promise<GenerateQrCodeResult> {
  const { setQrState, setIsLoading, password } = params;
  const { toast } = useToast();

  setIsLoading(true);
  try {
    const response = await apiRequest('POST', '/api/telegram-auth/qr-generate', {
      password: password || '',
    });

    if (response.success) {
      if (response.requiresPassword) {
        toast({
          title: 'Требуется 2FA',
          description: 'Введите пароль двухфакторной аутентификации',
        });
        return { success: true, requiresPassword: true };
      }

      if (response.token && response.qrUrl) {
        setQrState({
          token: response.token,
          url: response.qrUrl,
          password: password || '',
          countdown: response.expires || 30,
        });
        toast({
          title: 'QR-код сгенерирован',
          description: 'Отсканируйте QR-код в приложении Telegram',
        });
      }
    } else {
      toast({
        title: 'Ошибка',
        description: response.error || 'Не удалось сгенерировать QR-код',
        variant: 'destructive',
      });
    }

    return { success: response.success, requiresPassword: false };
  } catch (error: any) {
    toast({
      title: 'Ошибка',
      description: error.message || 'Не удалось сгенерировать QR-код',
      variant: 'destructive',
    });
    return { success: false };
  } finally {
    setIsLoading(false);
  }
}
