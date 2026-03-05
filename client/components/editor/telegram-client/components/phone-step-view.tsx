/**
 * @fileoverview Компонент шага авторизации с телефоном
 *
 * Отображает кнопку для генерации QR-кода.
 *
 * @module PhoneStepView
 */

import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import type { PhoneStepViewProps } from '../types';

/**
 * Компонент шага с телефоном
 *
 * @param {PhoneStepViewProps} props - Пропсы компонента
 * @returns {JSX.Element} Шаг с кнопкой QR
 *
 * @example
 * ```tsx
 * <PhoneStepView onGenerateQr={handleGenerate} isLoading={false} />
 * ```
 */
export function PhoneStepView({ onGenerateQr, isLoading }: PhoneStepViewProps) {
  return (
    <>
      <div className="text-center space-y-2">
        <Button
          onClick={onGenerateQr}
          disabled={isLoading}
          className="w-full gap-2"
          variant="default"
        >
          <QrCode className="h-4 w-4" />
          Войти через QR-код
        </Button>
        <p className="text-xs text-muted-foreground">
          Откройте Telegram на телефоне → Настройки → Устройства → Привязать устройство
        </p>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Используйте личный аккаунт Telegram для расширенных возможностей бота</p>
        <p>• QR-код — самый надёжный способ авторизации</p>
        <p>• Используется официальный Telegram Client API</p>
      </div>
    </>
  );
}
