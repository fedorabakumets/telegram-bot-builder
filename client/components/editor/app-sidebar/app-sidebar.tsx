/**
 * @fileoverview Главный компонент вертикального сайдбара редактора
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/utils';
import { SidebarBrand } from './components/sidebar-brand';
import { SidebarNav } from './components/sidebar-nav';
import { SidebarActions } from './components/sidebar-actions';
import { SidebarFooter } from './components/sidebar-footer';
import { SidebarSeparator } from './components/sidebar-separator';
import type { AppSidebarProps } from './types';

/**
 * Главный компонент сайдбара редактора
 * @param props - Свойства компонента AppSidebarProps
 * @returns JSX элемент вертикального сайдбара
 */
export function AppSidebar({
  projectName,
  botInfo,
  currentTab,
  onTabChange,
  onSaveAsTemplate,
  onLoadTemplate,
  isCollapsed = false,
  onToggleCollapsed,
  headerVisible,
  onToggleHeader,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'h-full flex flex-col z-40',
        'bg-gradient-to-b from-background via-background/95 to-background/90',
        'dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/90',
        'border-r border-border/50',
        'transition-all duration-300',
        isCollapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Бренд */}
      <div className="p-3 flex items-center justify-between">
        <SidebarBrand
          projectName={projectName}
          botInfo={botInfo}
          isCollapsed={isCollapsed}
        />
        {/* Кнопка сворачивания */}
        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className={cn(
              'flex-shrink-0 h-6 w-6 rounded flex items-center justify-center',
              'text-muted-foreground hover:bg-muted/60 transition-colors',
              isCollapsed && 'mx-auto mt-1'
            )}
          >
            {isCollapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />
            }
          </button>
        )}
      </div>

      <SidebarSeparator />

      {/* Основной контент */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        <SidebarNav
          currentTab={currentTab}
          onTabChange={onTabChange}
          isCollapsed={isCollapsed}
        />
        <SidebarSeparator />
        <SidebarActions
          onLoadTemplate={onLoadTemplate}
          onSaveAsTemplate={onSaveAsTemplate}
          isCollapsed={isCollapsed}
        />
      </div>

      <SidebarSeparator />

      {/* Футер */}
      <div className="p-2">
        <SidebarFooter
          isCollapsed={isCollapsed}
          headerVisible={headerVisible}
          onToggleHeader={onToggleHeader}
        />
      </div>
    </aside>
  );
}
