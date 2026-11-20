/**
 * @fileoverview Главный компонент вертикального сайдбара редактора
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/utils';
import { SidebarBrand } from './components/sidebar-brand';
import { SidebarNav } from './components/sidebar-nav';
import { SidebarActions } from './components/sidebar-actions';
import { SidebarAgentLink } from './components/sidebar-agent-link';
import { SidebarAdminLink } from './components/sidebar-admin-link';
import { SidebarFooter } from './components/sidebar-footer';
import { SidebarSeparator } from './components/sidebar-separator';
import type { AppSidebarProps } from './types';
import { useSidebarPosition } from './hooks/use-sidebar-position';
import './app-sidebar-position.css';

/**
 * Главный компонент сайдбара редактора
 * @param props - Свойства компонента AppSidebarProps
 * @returns JSX элемент вертикального сайдбара
 */
export function AppSidebar({
  currentTab,
  onTabChange,
  onSaveAsTemplate,
  onLoadTemplate,
  isCollapsed: collapsed = false,
  onToggleCollapsed,
  headerVisible,
  onToggleHeader,
}: AppSidebarProps) {
  const position = useSidebarPosition();
  const horizontal = position === 'top' || position === 'bottom';
  /** В горизонтальном режиме элементы занимают ширину иконок. */
  const isCollapsed = horizontal || collapsed;
  return (
    <aside
      data-sidebar-position={position}
      className={cn(
        'h-full flex flex-col z-40',
        /** Нейтральный фон совпадает с рабочей областью без синего оттенка. */
        'bg-background',
        'border-r border-border/50',
        isCollapsed ? 'w-14' : 'w-fit'
      )}
    >
      {/* Бренд + кнопка сворачивания */}
      <div className={cn(
        'app-sidebar-brand',
        /** Верхняя ячейка совпадает по высоте с компактными шапками вкладок. */
        'h-12 px-3 flex items-center flex-shrink-0 border-b border-border/50',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!isCollapsed && (
          <SidebarBrand
            isCollapsed={isCollapsed}
          />
        )}
        {/* Кнопка сворачивания — всегда видна */}
        {onToggleCollapsed && (
          <button
            type="button"
            aria-label={isCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
            aria-expanded={!isCollapsed}
            onClick={onToggleCollapsed}
            className={cn(
              'flex-shrink-0 h-6 w-6 rounded flex items-center justify-center',
              'text-muted-foreground hover:bg-muted/60 transition-colors'
            )}
          >
            {isCollapsed
              ? <ChevronRight className={cn('h-3.5 w-3.5', position === 'right' && 'rotate-180')} />
              : <ChevronLeft className={cn('h-3.5 w-3.5', position === 'right' && 'rotate-180')} />
            }
          </button>
        )}
      </div>

      {/* Основной контент */}
      <div
        className={cn(
          'app-sidebar-navigation flex min-h-0 flex-1 flex-col overflow-y-auto p-2',
          isCollapsed && '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        {/* Подписи групп видны, когда в панели есть место для текста. */}
        {!isCollapsed && <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">Проект</p>}
        <SidebarNav currentTab={currentTab} onTabChange={onTabChange} isCollapsed={isCollapsed} />
        <SidebarSeparator />
        <div role="group" aria-label="Инструменты" className="app-sidebar-tools flex flex-col gap-1">
          {!isCollapsed && <p className="px-2 text-xs font-medium text-muted-foreground">Инструменты</p>}
          <SidebarAgentLink active={currentTab === 'agent'} isCollapsed={isCollapsed} onOpen={() => onTabChange('agent')} />
          <SidebarActions
            onLoadTemplate={onLoadTemplate}
            onSaveAsTemplate={onSaveAsTemplate}
            isCollapsed={isCollapsed}
          />
          <SidebarAdminLink isCollapsed={isCollapsed} />
        </div>
      </div>

      <div className="app-sidebar-divider px-2">
        <SidebarSeparator />
      </div>

      {/* Дополнительный нижний отступ отделяет кнопки от края окна. */}
      <div className="app-sidebar-footer p-2 pb-3">
        <SidebarFooter
          isCollapsed={isCollapsed}
          showVersion={horizontal}
          headerVisible={headerVisible}
          onToggleHeader={onToggleHeader}
          menuSide={position === 'right' ? 'left' : position === 'bottom' ? 'top' : position === 'top' ? 'bottom' : 'right'}
        />
      </div>
    </aside>
  );
}
