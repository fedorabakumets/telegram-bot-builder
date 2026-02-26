/**
 * @fileoverview Компонент бейджей статусов пользователя
 * @description Отображает бейджи: активен, premium, заблокирован, бот
 */

import { Badge } from '@/components/ui/badge';
import { Crown, UserX } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента MobileUserBadges
 */
interface MobileUserBadgesProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент бейджей статусов пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент бейджей
 */
export function MobileUserBadges({ user }: MobileUserBadgesProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant={Number(user.isActive) === 1 ? 'default' : 'secondary'}>
        {Number(user.isActive) === 1 ? 'Активен' : 'Неактивен'}
      </Badge>
      {Number(user.isPremium) === 1 && (
        <Badge variant="outline" className="text-yellow-600">
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      )}
      {Number(user.isBlocked) === 1 && (
        <Badge variant="destructive">Заблокирован</Badge>
      )}
      {Number(user.isBot) === 1 && (
        <Badge variant="outline">Бот</Badge>
      )}
    </div>
  );
}
