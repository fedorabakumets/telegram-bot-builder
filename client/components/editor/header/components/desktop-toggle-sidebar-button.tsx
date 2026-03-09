/**
 * @fileoverview Десктопная кнопка переключения сайдбара
 * @description Кнопка для показа/скрытия боковой панели в десктопной версии
 */

import { Button } from '@/components/ui/button';
import { Sidebar } from 'lucide-react';
import { cn } from '@/lib/bot-generator/utils';

/**
 * Свойства десктопной кнопки переключения сайдбара
 */
export interface DesktopToggleSidebarButtonProps {
  /** Видимость сайдбара */
  sidebarVisible?: boolean;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Десктопная кнопка переключения видимости боковой панели
 */
export function DesktopToggleSidebarButton({ sidebarVisible, onClick }: DesktopToggleSidebarButtonProps) {
  return (
    <Button
      variant={sidebarVisible ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0',
        sidebarVisible
          ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40'
          : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'
      )}
      title={sidebarVisible ? 'Скрыть боковую панель' : 'Показать боковую панель'}
      data-testid="button-toggle-sidebar"
    >
      <Sidebar className="w-3.5 h-3.5" />
    </Button>
  );
}
