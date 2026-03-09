/**
 * @fileoverview Компонент приглашения в Telegram-чат
 * @description Отображает ссылку на чат поддержки в Telegram
 */

import { useIsMobile } from '../hooks/use-mobile';

/**
 * Свойства компонента приглашения в чат
 */
export interface TelegramChatInviteProps {
  /** Обработчик клика (для закрытия меню) */
  onClick?: () => void;
  /** Вариант отображения: mobile или desktop */
  variant?: 'mobile' | 'desktop';
}

/**
 * Приглашение присоединиться к Telegram-чату
 */
export function TelegramChatInvite({ onClick, variant = 'mobile' }: TelegramChatInviteProps) {
  const isMobile = useIsMobile();
  const showDesktopLabel = !isMobile && variant === 'desktop';

  if (variant === 'desktop') {
    return (
      <>
        <span className="hidden sm:inline-block text-slate-700 dark:text-slate-300">
          Мы в Telegram:
        </span>
        <a
          href="https://t.me/bot_builder_chat"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-blue-600 dark:text-blue-300 hover:underline font-semibold"
          onClick={onClick}
        >
          @bot_builder_chat
        </a>
      </>
    );
  }

  return (
    <div className="px-3 py-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-700/20 dark:to-cyan-600/20 rounded-lg border border-blue-400/20 dark:border-blue-500/30 backdrop-blur-sm text-center">
      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        Присоединяйтесь к нашему чату в Telegram:
      </p>
      <a
        href="https://t.me/bot_builder_chat"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-300 hover:underline font-semibold text-sm"
        onClick={onClick}
      >
        @bot_builder_chat
      </a>
    </div>
  );
}
