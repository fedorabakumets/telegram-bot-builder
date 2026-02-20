/**
 * @fileoverview Хук для повторной отправки кода верификации Telegram
 *
 * Предоставляет функционал для отправки кода через голосовой звонок
 * при авторизации в Telegram Client API.
 *
 * @module useTelegramResendCode
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Свойства хука для повторной отправки кода
 */
interface UseTelegramResendCodeProps {
  /** Номер телефона */
  phoneNumber: string;
  /** Хеш кода подтверждения */
  phoneCodeHash: string;
  /** ID проекта */
  projectId?: number;
  /** Активен ли шаг ввода кода */
  isActive: boolean;
}

/**
 * Хук для управления повторной отправкой кода верификации
 *
 * @param {UseTelegramResendCodeProps} props - Свойства хука
 * @returns {Object} Методы и состояние для управления повторной отправкой
 * @returns {Function} resendCode - Функция отправки кода через звонок
 * @returns {number} resendTimeout - Оставшееся время до доступности повторной отправки
 * @returns {boolean} isLoading - Статус загрузки
 * @returns {Function} onCodeRefresh - Коллбэк для обновления хеша кода
 *
 * @example
 * ```tsx
 * const { resendCode, resendTimeout, isLoading } = useTelegramResendCode({
 *   phoneNumber: '+79991234567',
 *   phoneCodeHash: 'abc123',
 *   projectId: 1,
 *   isActive: true
 * });
 * ```
 */
export function useTelegramResendCode({
  phoneNumber,
  phoneCodeHash,
  projectId,
  isActive
}: UseTelegramResendCodeProps) {
  const [resendTimeout, setResendTimeout] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhoneCodeHash, setCurrentPhoneCodeHash] = useState(phoneCodeHash);
  const { toast } = useToast();

  // Обновляем хеш при изменении пропса
  useEffect(() => {
    setCurrentPhoneCodeHash(phoneCodeHash);
  }, [phoneCodeHash]);

  /**
   * Таймер обратного отсчёта для блокировки повторной отправки
   */
  useEffect(() => {
    if (!isActive || resendTimeout <= 0) return;

    const timer = setInterval(() => {
      setResendTimeout((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, resendTimeout]);

  /**
   * Отправляет код подтверждения через голосовой звонок
   */
  const resendCode = async () => {
    if (resendTimeout > 0 || !phoneNumber || !currentPhoneCodeHash) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/telegram-auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          phoneCodeHash: currentPhoneCodeHash,
          projectId: projectId || 'default'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Обновляем хеш кода, если пришел новый
        if (data.phoneCodeHash && data.phoneCodeHash !== currentPhoneCodeHash) {
          setCurrentPhoneCodeHash(data.phoneCodeHash);
        }
        
        setResendTimeout(10);
        
        const codeType = data.codeType || 'голосовой звонок';
        toast({
          title: 'Код отправлен',
          description: `Код отправлен через ${codeType}. Проверьте ${codeType === 'SMS' ? 'SMS' : 'входящий звонок'}.`,
        });
      } else {
        // Обрабатываем конкретные ошибки
        const errorMsg = data.error || response.statusText || 'Неизвестная ошибка';
        if (errorMsg.includes('PHONE_CODE_EXPIRED')) {
          toast({
            title: 'Код истёк',
            description: 'Срок действия кода истёк. Попробуйте отправить код заново.',
            variant: 'destructive'
          });
        } else if (errorMsg.includes('SEND_CODE_UNAVAILABLE') || errorMsg.includes('SESSION_PASSWORD_NEEDED')) {
          toast({
            title: 'Голосовой звонок недоступен',
            description: 'Telegram не может отправить код через звонок на этот номер. Попробуйте получить код в приложении Telegram.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Ошибка',
            description: errorMsg,
            variant: 'destructive'
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || '';
      if (errorMessage.includes('SEND_CODE_UNAVAILABLE')) {
        toast({
          title: 'Голосовой звонок недоступен',
          description: 'Telegram не поддерживает отправку кода через звонок для вашего номера. Код должен прийти через SMS или в приложении Telegram.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Ошибка сети',
          description: 'Проверьте подключение к интернету или перезапустите сервер',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { resendCode, resendTimeout, isLoading, currentPhoneCodeHash };
}
