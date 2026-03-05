/**
 * @fileoverview Компонент авторизации через Telegram Client API
 *
 * Диалог авторизации с использованием QR-кода.
 *
 * @module TelegramAuth
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useQrAuth } from './hooks/use-qr-auth';
import { useQrPolling } from './hooks/use-qr-polling';
import { useCountdown } from './hooks/use-countdown';
import { StartStepView, QrStepView, QrPasswordStepView, TelegramAuthHeader } from './components';
import type { TelegramAuthProps, AuthStep } from './types';

/**
 * Компонент авторизации через Telegram Client API
 *
 * @param {TelegramAuthProps} props - Свойства компонента
 * @returns {JSX.Element} Диалог авторизации
 *
 * @example
 * ```tsx
 * <TelegramAuth
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={() => console.log('Успешная авторизация')}
 * />
 * ```
 */
export function TelegramAuth({ open, onOpenChange, onSuccess }: TelegramAuthProps) {
  const [step, setStep] = useState<AuthStep>('start');
  const { qrState, isLoading, generateQrCode, checkQrStatus, refreshQrToken, setQrPassword, resetQrState } =
    useQrAuth(onSuccess, onOpenChange);

  // Локальный countdown для UI (без лишних ре-рендеров)
  const countdown = useCountdown({ initialValue: 30, isActive: step === 'qr' || step === 'qr-password' });

  // Сброс шага и состояния при открытии/закрытии
  useEffect(() => {
    if (open) {
      setStep('start');
    } else {
      resetQrState();
    }
  }, [open, resetQrState]);

  // Автообновление QR-токена
  useQrPolling({ step, token: qrState.token, refreshQrToken });

  // Переключение на шаг QR при получении URL
  useEffect(() => {
    if (qrState.url && step === 'start') {
      setStep('qr');
    }
  }, [qrState.url, step]);

  const handleBack = () => {
    resetQrState();
    setStep('start');
  };

  const handleSubmitPassword = async () => {
    if (qrState.password.trim()) {
      await generateQrCode(qrState.password);
      setStep('qr');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <TelegramAuthHeader />

        <div className="space-y-4">
          {step === 'start' && (
            <StartStepView key="start" onGenerateQr={() => generateQrCode()} isLoading={isLoading} />
          )}

          {step === 'qr' && (
            <QrStepView
              key="qr"
              qrState={{ ...qrState, countdown }}
              isLoading={isLoading}
              onCheckStatus={checkQrStatus}
              onRefreshQr={refreshQrToken}
              onBack={handleBack}
            />
          )}

          {step === 'qr-password' && (
            <QrPasswordStepView
              key="qr-password"
              password={qrState.password}
              isLoading={isLoading}
              onPasswordChange={setQrPassword}
              onSubmitPassword={handleSubmitPassword}
              onBack={handleBack}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}