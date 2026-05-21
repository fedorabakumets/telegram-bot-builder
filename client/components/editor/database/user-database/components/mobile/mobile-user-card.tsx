/**
 * @fileoverview Компонент мобильной карточки пользователя
 * @description Полная карточка пользователя для мобильного вида с кнопкой перехода в диалог
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
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
  /** Обработчик перехода к диалогу с пользователем */
  onNavigateToDialog?: (user: UserBotData) => void;
}

/**
 * Компонент мобильной карточки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент карточки
 */
export function MobileUserCard(props: MobileUserCardProps): React.JSX.Element {
  const { user, index, onNavigateToDialog } = props;

  return (
    <Card key={user.id || index} className="p-4 relative" data-testid={`user-card-mobile-${index}`}>
      {onNavigateToDialog && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={() => onNavigateToDialog(user)}
          title="Открыть диалог"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      )}
      <div className="space-y-3">
        <MobileUserHeader {...props} />
        <MobileUserBadges user={user} />
        <MobileUserStats user={user} />
        <MobileUserResponses user={user} />
      </div>
    </Card>
  );
}
