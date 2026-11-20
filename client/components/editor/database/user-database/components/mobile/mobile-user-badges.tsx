/**
 * @fileoverview Спокойные текстовые метки состояния пользователя.
 */
import { UserBotData } from '@shared/schema';
import { userStatus } from '../desktop/user-summary';
import { statusAppearance } from '@shared/status-appearance';

/**
 * Отображает реальные состояния пользователя без декоративных значков.
 * @param props - Данные пользователя.
 * @returns Строка меток состояния.
 */
export function MobileUserBadges({ user }: { /** Данные пользователя. */ user: UserBotData }): React.JSX.Element {
  const status = userStatus(user);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {/** Цвет заморозки совпадает с настольной таблицей. */}
      <span className="users-status" style={{ color: statusAppearance(status).color }}>{status}</span>
      {user.isPremium && <span>Premium</span>}
      {user.isBot && <span>Бот</span>}
    </div>
  );
}
