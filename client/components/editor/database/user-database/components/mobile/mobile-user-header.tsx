/**
 * @fileoverview Имя пользователя и его идентификатор Telegram в компактной карточке.
 */
import { UserBotData } from '@shared/schema';

/** Свойства заголовка карточки. */
interface MobileUserHeaderProps {
  /** Данные пользователя. */
  user: UserBotData;
  /** Форматирует имя пользователя. */
  formatUserName: (user: UserBotData) => string;
}

/**
 * Показывает переносимое имя и идентификатор Telegram.
 * @param props - Данные пользователя и форматирование имени.
 * @returns Заголовок карточки.
 */
export function MobileUserHeader({ user, formatUserName }: MobileUserHeaderProps): React.JSX.Element {
  return (
    <div className="min-w-0 flex-1">
      <div className="break-words text-sm font-medium leading-5">{formatUserName(user)}</div>
      <div className="mt-1 break-all text-xs text-muted-foreground tabular-nums">Telegram ID: {user.userId}</div>
    </div>
  );
}
