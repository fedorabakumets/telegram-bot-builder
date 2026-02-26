/**
 * @fileoverview Компонент ячейки статусов пользователя
 * @description Отображает бейджи статусов: активен, premium, заблокирован
 */

import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import { Crown } from 'lucide-react';
import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента DesktopStatusCell
 */
interface DesktopStatusCellProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент ячейки статусов
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки статусов
 */
export function DesktopStatusCell({ user }: DesktopStatusCellProps): React.JSX.Element {
  return (
    <TableCell className="py-2">
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={Boolean(user.isActive) ? 'default' : 'secondary'}
          className="text-xs"
        >
          {Boolean(user.isActive) ? 'Активен' : 'Неактивен'}
        </Badge>
        {Boolean(user.isPremium) && (
          <Badge variant="outline" className="text-xs h-5">
            <Crown className="w-2.5 h-2.5 mr-0.5" />
          </Badge>
        )}
        {Boolean(user.isBlocked) && (
          <Badge variant="destructive" className="text-xs">X</Badge>
        )}
      </div>
    </TableCell>
  );
}
