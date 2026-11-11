/**
 * @fileoverview Спокойные текстовые метки состояния пользователя.
 */
import { UserBotData } from '@shared/schema';

/**
 * Отображает реальные состояния пользователя без декоративных значков.
 * @param props - Данные пользователя.
 * @returns Строка меток состояния.
 */
export function MobileUserBadges({ user }: { /** Данные пользователя. */ user: UserBotData }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>{user.isBlocked ? 'Заблокирован' : user.isActive ? 'Активен' : 'Неактивен'}</span>
      {user.isPremium && <span>Premium</span>}
      {user.isBot && <span>Бот</span>}
    </div>
  );
}
