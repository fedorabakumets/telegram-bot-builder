/**
 * @fileoverview Компонент статистики пользователя (мобильный)
 * @description Отображает количество сообщений и последнюю активность
 */

import { sourceColor } from '@shared/source-color';
import { formatDate } from '../../../utils';
import { UserBotData } from '@shared/schema';
import { userSource } from '../desktop/user-summary';

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
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <div className="text-muted-foreground">Сообщений</div>
        <div className="mt-1 font-medium tabular-nums">{user.incomingMessageCount?.toLocaleString('ru-RU') ?? '—'}</div>
      </div>
      <div><div className="text-muted-foreground">Нажатий кнопок</div>
        <div className="mt-1 font-medium tabular-nums">{user.buttonClickCount?.toLocaleString('ru-RU') ?? '—'}</div></div>
      <div><div className="text-muted-foreground">Источник</div>
        <div className="mt-1 break-words" style={{ color: sourceColor(userSource(user)) }}>{userSource(user)}</div></div>
      <div>
        <div className="text-muted-foreground">Последняя активность</div>
        <div className="mt-1 font-medium tabular-nums">{formatDate(user.lastInteraction)}</div>
      </div>
    </div>
  );
}
