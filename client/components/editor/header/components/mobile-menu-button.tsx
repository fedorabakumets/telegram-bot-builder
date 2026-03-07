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
      <Button ref={ref} variant="outline" size="sm" className="p-1.5 sm:p-2 h-8 sm:h-9" onClick={onClick}>
        <Menu className="h-4 w-4" />
      </Button>
    );
  }
);
