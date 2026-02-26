/**
 * @fileoverview Компонент статистики пользователя (мобильный)
 * @description Отображает количество сообщений и последнюю активность
 */

import { formatDate } from '../../../utils';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента MobileUserStats
 */
interface MobileUserStatsProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент статистики пользователя для мобильного вида
 * @param props - Пропсы компонента
 * @returns JSX компонент статистики
 */
export function MobileUserStats({ user }: MobileUserStatsProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div className="text-muted-foreground">Сообщений</div>
        <div className="font-medium">{user.interactionCount || 0}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Последняя активность</div>
        <div className="font-medium text-xs">{formatDate(user.lastInteraction)}</div>
      </div>
    </div>
  );
}
