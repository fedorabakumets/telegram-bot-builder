/**
 * @fileoverview Кнопка открытия мобильного меню
 * @description Кнопка-гамбургер для открытия мобильного меню навигации
 */

import { forwardRef } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Свойства кнопки мобильного меню
 */
export interface MobileMenuButtonProps {
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Кнопка открытия мобильного меню
 */
export const MobileMenuButton = forwardRef<HTMLButtonElement, MobileMenuButtonProps>(
  ({ onClick }, ref) => {
    return (
      <Button ref={ref} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted/60" onClick={onClick}>
        <Menu className="h-4 w-4" />
      </Button>
    );
  }
);
