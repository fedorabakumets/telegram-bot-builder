/**
 * @fileoverview Компонент мобильной карточки пользователя
 * @description Полная карточка пользователя для мобильного вида
 */

import { Card } from '@/components/ui/card';
import { UserBotData } from '@shared/schema';
import { MobileUserHeader } from './mobile-user-header';
import { MobileUserBadges } from './mobile-user-badges';
import { MobileUserStats } from './mobile-user-stats';
import { MobileUserResponses } from '../../../responses-table/components/mobile-user-responses';

/**
 * Пропсы компонента MobileUserCard
 */
interface MobileUserCardProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Индекс в списке */
  index: number;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
}

/**
 * Компонент мобильной карточки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент карточки
 */
export function MobileUserCard(props: MobileUserCardProps): React.JSX.Element {
  const { user, index } = props;

  return (
    <Card key={user.id || index} className="p-4" data-testid={`user-card-mobile-${index}`}>
      <div className="space-y-3">
        <MobileUserHeader {...props} />
        <MobileUserBadges user={user} />
        <MobileUserStats user={user} />
        <MobileUserResponses user={user} />
      </div>
    </Card>
  );
}
