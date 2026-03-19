/**
 * @fileoverview Компонент одного пункта контекстного меню
 */

import { ContextMenuItem as IContextMenuItem } from './context-menu-types';
import { cn } from '@/utils/utils';

/**
 * Пропсы компонента пункта меню
 */
interface ContextMenuItemProps {
  /** Данные пункта меню */
  item: IContextMenuItem;
  /** Обработчик клика (закрывает меню после действия) */
  onAction: (fn: () => void) => void;
}

/**
 * Один кликабельный пункт контекстного меню
 */
export function ContextMenuItemComponent({ item, onAction }: ContextMenuItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left',
        item.danger
          ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
          : 'text-slate-200 hover:bg-white/10 hover:text-white'
      )}
      onClick={() => onAction(item.onClick)}
    >
      <i className={cn(item.icon, 'w-4 text-center opacity-70')} />
      {item.label}
    </button>
  );
}
