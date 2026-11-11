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
          <Badge variant="outline" className="text-xs h-5 text-muted-foreground border-border bg-transparent">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </TableCell>
  );
}
