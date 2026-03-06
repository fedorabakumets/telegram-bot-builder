/**
 * @fileoverview Компонент предупреждения о процессе авторизации через QR
 *
 * Информирует пользователя о шагах авторизации с видео-инструкцией.
 *
 * @module QrAuthWarning
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { QrAuthVideo } from './qr-auth-video';

/**
 * Компонент предупреждения о процессе авторизации
 *
 * @returns {JSX.Element} Предупреждение с видео
 */
export function QrAuthWarning() {
  return (
    <div className="space-y-3">
      <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
        <AlertDescription className="text-sm text-amber-800 dark:text-amber-200 ml-2">
          <div className="space-y-2">
            <p className="font-medium">Для авторизации применяется клиентский API. Она состоит из следующих этапов:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Отсканируйте QR-код.</li>
              <li>Нажмите кнопку «Я отсканировал QR-код».</li>
              <li>Нажмите кнопку «Обновить QR».</li>
              <li>Снова отсканируйте QR-код.</li>
              <li>Нажмите кнопку «Я отсканировал код».</li>
            </ol>
            <p className="text-xs opacity-80">После выполнения этих действий авторизация будет завершена.</p>
          </div>
        </AlertDescription>
      </Alert>

      <QrAuthVideo src="/telegram-qr-auth-guide.mp4" />
    </div>
  );
}
