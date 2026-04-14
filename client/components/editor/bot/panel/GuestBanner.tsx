/**
 * @fileoverview Баннер для гостевых пользователей в панели управления ботами
 * @module components/editor/bot/panel/GuestBanner
 */

import { Button } from '@/components/ui/button';

/**
 * Свойства баннера гостя
 */
interface GuestBannerProps {
  /** Есть ли хотя бы один запущенный бот */
  hasRunningBot: boolean;
  /** Callback для входа через Telegram */
  onLogin: () => void;
}

/**
 * Баннер для гостевых пользователей.
 * Показывает разные сообщения в зависимости от наличия запущенного бота.
 * @param props - Свойства компонента
 * @returns JSX элемент баннера
 */
export function GuestBanner({ hasRunningBot, onLogin }: GuestBannerProps) {
  if (hasRunningBot) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-950/30 dark:border-amber-700">
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">
            🤖 Ваш бот работает!
          </p>
          <p className="text-amber-800 dark:text-amber-300 text-xs mt-0.5">
            Войдите через Telegram — бот останется работать и перейдёт в ваш аккаунт.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onLogin}
          className="shrink-0 border-amber-400 text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          Войти через Telegram
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between dark:bg-blue-950/30 dark:border-blue-800">
      <div>
        <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">
          👋 Вы в гостевом режиме
        </p>
        <p className="text-blue-800 dark:text-blue-300 text-xs mt-0.5">
          Стройте сценарии и скачивайте код бесплатно. Для запуска ботов — войдите через Telegram.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onLogin}
        className="shrink-0 border-blue-300 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900/40"
      >
        Войти через Telegram
      </Button>
    </div>
  );
}
