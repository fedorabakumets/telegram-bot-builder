/**
 * @fileoverview Кнопка переключения видимости сайдбара
 * @description Мобильная кнопка для показа/скрытия боковой панели
 */

import { Button } from '@/components/ui/button';
import { Sidebar } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства кнопки переключения сайдбара
 */
export interface ToggleSidebarButtonProps {
  /** Видимость сайдбара */
  sidebarVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Мобильная кнопка переключения видимости боковой панели
 */
export function ToggleSidebarButton({ sidebarVisible, onClick }: ToggleSidebarButtonProps) {
  return (
    <Button
      size="sm"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs',
        sidebarVisible
          ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
      title={sidebarVisible ? 'Скрыть боковую панель' : 'Показать боковую панель'}
      data-testid="button-mobile-toggle-sidebar"
    >
      <Sidebar className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
      <span className="sm:hidden">{sidebarVisible ? 'Скрыть' : 'Показать'} панель</span>
    </Button>
  );
}
