/**
 * @fileoverview Компонент ячейки статусов пользователя
 * @description Отображает бейдж Premium (активен/заблокирован скрыты)
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
        {/* Активен/Неактивен — скрыто */}
        {/* Заблокирован — скрыто */}
        {Boolean(user.isPremium) ? (
          <Badge variant="outline" className="text-xs h-5 text-yellow-600 border-yellow-400">
            <Crown className="w-2.5 h-2.5 mr-0.5" />
            Premium
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>
    </TableCell>
  );
}
