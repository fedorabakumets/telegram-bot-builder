/**
 * @fileoverview Кнопка выхода
 * @description Кнопка для выхода из аккаунта Telegram
 */

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки выхода
 */
export interface LogoutButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Кнопка выхода из аккаунта
 */
export function LogoutButton({ onClick, isVertical, className }: LogoutButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all font-semibold',
        isVertical ? 'w-full justify-center' : 'flex items-center justify-center',
        className
      )}
      title="Выход"
    >
      <LogOut className="h-3.5 w-3.5" />
    </Button>
  );
}
