/**
 * @fileoverview Компонент шага с QR-кодом для авторизации
 *
 * Композиция компонентов для отображения QR-кода.
 *
 * @module QrStepView
 */

import { QrStatusHeader } from './qr-status-header';
import { QrCodeDisplay } from './qr-code-display';
import { QrInfoText } from './qr-info-text';
import { QrStatusButton } from './qr-status-button';
import { QrActionButtons } from './qr-action-buttons';
import { QrAuthWarning } from './qr-auth-warning';
import type { QrStepViewProps } from '../types/telegram-auth-view-props';

/**
 * Компонент шага с QR-кодом
 *
 * @param {QrStepViewProps} props - Пропсы компонента
 * @returns {JSX.Element} Шаг с QR-кодом
 */
export function QrStepView({ qrState, isLoading, onCheckStatus, onRefreshQr, onBack, isRefreshing = false }: QrStepViewProps) {
  const { url, countdown } = qrState;

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <QrStatusHeader />
        <QrCodeDisplay url={url} countdown={countdown} isRefreshing={isRefreshing} />
        <QrInfoText countdown={countdown} />
      </div>

      <QrAuthWarning />

      <QrStatusButton onClick={onCheckStatus} isLoading={isLoading} />

      <QrActionButtons onBack={onBack} onRefresh={onRefreshQr} isLoading={isLoading} />
    </div>
  );
}
