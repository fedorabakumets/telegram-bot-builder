/**
 * @fileoverview Полные десктопные действия
 * @description Все кнопки управления для десктопной версии включая авторизацию
 */

import { DesktopActions } from './desktop-actions';
import { TelegramChatInvite } from './telegram-chat-invite';
import { UserAuth } from './user-auth';
import { Separator } from './separator';
import { cn } from '@/utils/utils';
import type { TelegramUser } from './user-section';

/**
 * Свойства полных десктопных действий
 */
export interface DesktopActionsFullProps {
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
  /** Данные пользователя */
  user?: TelegramUser | null;
  /** Обработчик выхода */
  onLogout?: () => void;
  /** Обработчик входа */
  onLogin?: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Полные десктопные действия со всеми кнопками
 */
export function DesktopActionsFull({
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
  onLogout,
  onLogin,
  isVertical,
}: DesktopActionsFullProps) {
  return (
    <div className={cn(
      'flex',
      isVertical ? 'flex-col space-y-2 p-2' : 'hidden lg:flex flex-wrap items-center gap-1 lg:w-auto lg:order-none lg:ml-auto'
    )}>
      <DesktopActions
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
        isVertical={isVertical}
      />

      {isVertical && (
        <Separator className="w-full" />
      )}

      <UserAuth
        user={user || null}
        onLogout={onLogout}
        onLogin={onLogin}
        isVertical={isVertical}
      />

      <div className={cn(
        'text-xs font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-700/20 dark:to-cyan-600/20 rounded-lg border border-blue-400/20 dark:border-blue-500/30 backdrop-blur-sm',
        isVertical ? 'w-full px-3 py-1.5' : 'hidden md:flex items-center px-3 py-1.5'
      )}>
        <TelegramChatInvite variant="desktop" />
      </div>
    </div>
  );
}
