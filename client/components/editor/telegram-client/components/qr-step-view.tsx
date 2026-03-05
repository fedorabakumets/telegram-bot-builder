/**
 * @fileoverview Компонент шага с QR-кодом для авторизации
 *
 * Отображает QR-код, таймер и кнопки управления.
 *
 * @module QrStepView
 */

import { Button } from '@/components/ui/button';
import { CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import { QrCodeGenerator } from './qr-code-generator';
import { QrCountdownBadge } from './qr-countdown-badge';
import type { QrStepViewProps } from '../types';

/**
 * Компонент шага с QR-кодом
 *
 * @param {QrStepViewProps} props - Пропсы компонента
 * @returns {JSX.Element} Шаг с QR-кодом
 *
 * @example
 * ```tsx
 * <QrStepView
 *   qrState={qrState}
 *   isLoading={false}
 *   onCheckStatus={handleCheck}
 *   onRefreshQr={handleRefresh}
 *   onBack={handleBack}
 * />
 * ```
 */
export function QrStepView({
  qrState,
  isLoading,
  onCheckStatus,
  onRefreshQr,
  onBack,
}: QrStepViewProps) {
  const { url, countdown } = qrState;

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 animate-pulse" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Ожидание сканирования...
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg inline-block mb-3 relative">
          {url ? (
            <>
              <QrCodeGenerator value={url} size={200} />
              <QrCountdownBadge countdown={countdown} />
            </>
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>

        <p className="text-xs text-green-700 dark:text-green-300">
          Откройте Telegram → Настройки → Устройства → Подключить устройство
        </p>
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          ✨ QR-код обновляется автоматически. Успейте отсканировать за {countdown} сек!
        </p>
      </div>

      <div className="text-center">
        <Button
          onClick={onCheckStatus}
          disabled={isLoading}
          className="w-full gap-2"
          variant="default"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Проверяем...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Я отсканировал QR-код
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Нажмите после сканирования для проверки
        </p>
      </div>

      {url && (
        <div className="text-center">
          <a
            href={url.replace('tg://', 'https://t.me/')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Открыть ссылку в браузере
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          Назад
        </Button>
        <Button
          onClick={onRefreshQr}
          disabled={isLoading}
          variant="outline"
          className="flex-1"
        >
          Обновить QR
        </Button>
      </div>
    </div>
  );
}
