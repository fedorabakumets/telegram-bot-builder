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
import { PhoneStepView, QrStepView, QrPasswordStepView, TelegramAuthHeader } from './components';
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
  const [step, setStep] = useState<AuthStep>('phone');
  const [countdown, setCountdown] = useState(30);
  const { qrState, isLoading, generateQrCode, checkQrStatus, refreshQrToken, setQrPassword } =
    useQrAuth(onSuccess, onOpenChange);

  // Сброс шага при открытии
  useEffect(() => {
    if (open) setStep('phone');
  }, [open]);

  // Автообновление QR-токена
  useQrPolling({ step, token: qrState.token, refreshQrToken });

  // Синхронизация countdown из хука
  useEffect(() => {
    setCountdown(qrState.countdown);
  }, [qrState.countdown]);

  const handleBack = () => {
    setStep('phone');
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
          {step === 'phone' && (
            <PhoneStepView onGenerateQr={() => generateQrCode()} isLoading={isLoading} />
          )}

          {step === 'qr' && (
            <QrStepView
              qrState={{ ...qrState, countdown }}
              isLoading={isLoading}
              onCheckStatus={checkQrStatus}
              onRefreshQr={refreshQrToken}
              onBack={handleBack}
            />
          )}

          {step === 'qr-password' && (
            <QrPasswordStepView
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