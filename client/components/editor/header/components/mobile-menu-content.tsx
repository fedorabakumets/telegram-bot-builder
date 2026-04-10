/**
 * @fileoverview Контент мобильного меню
 * @description Содержимое мобильного меню: навигация и действия
 */

import { MobileNavigation } from './mobile-navigation';
import { MobileActions } from './mobile-actions';
import type { HeaderTab } from '../types';
import type { AppUser } from '@/types/telegram-user';

/**
 * Свойства контента мобильного меню
 */
export interface MobileMenuContentProps {
  /** Текущая активная вкладка */
  currentTab: HeaderTab;
  /** Обработчик изменения вкладки */
  onTabChange: (tab: HeaderTab) => void;
  /** Обработчики переключения панелей */
  onToggleHeader?: () => void;
  onToggleSidebar?: () => void;
  onToggleCanvas?: () => void;
  onToggleProperties?: () => void;
  onToggleCode?: () => void;
  onToggleCodeEditor?: () => void;
  onOpenFileExplorer?: () => void;
  /** Обработчики шаблонов */
  onLoadTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  /** Состояния видимости панелей */
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  canvasVisible?: boolean;
  propertiesVisible?: boolean;
  codeVisible?: boolean;
  codeEditorVisible?: boolean;
  /** Пользователь приложения */
  user?: AppUser | null;
  /** Флаг загрузки авторизации */
  isLoading?: boolean;
  /** Обработчик выхода */
  onLogout?: () => void;
  /** Обработчик входа */
  onLogin?: () => void;
  /** Обработчик закрытия меню */
  onCloseMenu?: () => void;
}

/**
 * Контент мобильного меню с навигацией и действиями
 */
export function MobileMenuContent({
  currentTab,
  onTabChange,
  onToggleHeader,
  onToggleSidebar,
  onToggleCanvas,
  onToggleProperties,
  onToggleCode,
  onToggleCodeEditor,
  onOpenFileExplorer,
  onLoadTemplate,
  onSaveAsTemplate,
  headerVisible,
  sidebarVisible,
  canvasVisible,
  propertiesVisible,
  codeVisible,
  codeEditorVisible,
  user,
  isLoading,
  onLogout,
  onLogin,
  onCloseMenu,
}: MobileMenuContentProps) {
  return (
    <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
      {/* Навигация */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Навигация</h3>
        <MobileNavigation
          currentTab={currentTab}
          onTabChange={onTabChange}
          onClose={onCloseMenu}
        />
      </div>

      {/* Действия */}
      <div className="border-t border-border/50 pt-4">
        <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Действия</h3>
        <MobileActions
          onToggleHeader={onToggleHeader}
          onToggleSidebar={onToggleSidebar}
          onToggleCanvas={onToggleCanvas}
          onToggleProperties={onToggleProperties}
          onToggleCode={onToggleCode}
          onToggleCodeEditor={onToggleCodeEditor}
          onOpenFileExplorer={onOpenFileExplorer}
          onLoadTemplate={onLoadTemplate}
          onSaveAsTemplate={onSaveAsTemplate}
          headerVisible={headerVisible}
          sidebarVisible={sidebarVisible}
          canvasVisible={canvasVisible}
          propertiesVisible={propertiesVisible}
          codeVisible={codeVisible}
          codeEditorVisible={codeEditorVisible}
          onCloseMenu={onCloseMenu}
          user={user}
          isLoading={isLoading}
          onLogout={onLogout}
          onLogin={onLogin}
        />
      </div>
    </div>
  );
}
