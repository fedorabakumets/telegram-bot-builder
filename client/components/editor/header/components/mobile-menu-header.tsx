/**
 * @fileoverview Заголовок мобильного меню
 * @description Заголовок с логотипом и названием для мобильного меню
 */

import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

/**
 * Свойства заголовка мобильного меню
 */
export interface MobileMenuHeaderProps {
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Заголовок мобильного меню с логотипом
 */
export function MobileMenuHeader({ className }: MobileMenuHeaderProps) {
  return (
    <SheetHeader className={`px-4 sm:px-6 py-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm ${className || ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center">
          <i className="fab fa-telegram-plane text-white text-sm"></i>
        </div>
        <SheetTitle className="text-left text-lg font-bold">Меню</SheetTitle>
      </div>
    </SheetHeader>
  );
}
