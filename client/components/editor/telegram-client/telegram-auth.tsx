/**
 * @fileoverview Компонент авторизации через Telegram Client API
 *
 * Диалог авторизации с использованием QR-кода.
 *
 * @module TelegramAuth
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Shield } from 'lucide-react';
import { useQrAuth } from './hooks/use-qr-auth';
import { PhoneStepView, QrStepView, QrPasswordStepView } from './components';
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
  useEffect(() => {
    if (step !== 'qr' && step !== 'qr-password') return;
    if (!qrState.token) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshQrToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    const refreshInterval = setInterval(async () => {
      await refreshQrToken();
    }, 25000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(refreshInterval);
    };
  }, [step, qrState.token, refreshQrToken]);

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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Авторизация Telegram Client API
          </DialogTitle>
          <DialogDescription>
            Используйте личный аккаунт Telegram для расширенных возможностей бота
          </DialogDescription>
        </DialogHeader>

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