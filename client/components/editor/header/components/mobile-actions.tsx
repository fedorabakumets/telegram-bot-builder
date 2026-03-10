/**
 * @fileoverview Мобильные действия
 * @description Компонент отображает все кнопки управления для мобильной версии
 */

import { TelegramChatInvite } from './telegram-chat-invite';
import { ToggleHeaderButton } from './toggle-header-button';
import { ToggleSidebarButton } from './toggle-sidebar-button';
import { ToggleCanvasButton } from './toggle-canvas-button';
import { TogglePropertiesButton } from './toggle-properties-button';
import { ToggleCodeButton } from './toggle-code-button';
import { ToggleCodeEditorButton } from './toggle-code-editor-button';
import { OpenFileExplorerButton } from './open-file-explorer-button';
import { LoadTemplateButton } from './load-template-button';
import { SaveTemplateButton } from './save-template-button';
import { ThemeToggle } from './theme-toggle';
import { UserAuth } from './user-auth';
import type { TelegramUser } from './user-section';

/**
 * Свойства компонента мобильных действий
 */
export interface MobileActionsProps {
  /** Обработчики переключения панелей */
  onToggleHeader?: () => void;
  onToggleSidebar?: () => void;
  onToggleCanvas?: () => void;
  onToggleProperties?: () => void;
  onToggleCode?: () => void;
  onToggleCodeEditor?: () => void;
  onOpenFileExplorer?: () => void;
  /** Обработчики сценариев */
  onLoadTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  /** Состояния видимости панелей */
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  canvasVisible?: boolean;
  propertiesVisible?: boolean;
  codeVisible?: boolean;
  codeEditorVisible?: boolean;
  /** Обработчик закрытия меню */
  onCloseMenu?: () => void;
  /** Данные пользователя */
  user?: TelegramUser | null;
  /** Обработчик выхода */
  onLogout?: () => void;
  /** Обработчик входа */
  onLogin?: () => void;
}

/**
 * Мобильные действия: кнопки управления панелями и сценариями
 */
export function MobileActions({
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
  onCloseMenu,
  user,
  onLogout,
  onLogin,
}: MobileActionsProps) {
  const handleAction = (callback?: () => void) => {
    callback?.();
    onCloseMenu?.();
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <TelegramChatInvite onClick={onCloseMenu} />

      <UserAuth
        user={user || null}
        onLogout={onLogout}
        onLogin={onLogin}
      />

      {/* Кнопки управления состоянием панелей - временно скрыты */}
      {/* {(onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas || onToggleCode) && (
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-2.5">
          {onToggleHeader && (
            <ToggleHeaderButton
              headerVisible={headerVisible}
              onClick={() => handleAction(onToggleHeader)}
            />
          )}
          {onToggleSidebar && (
            <ToggleSidebarButton
              sidebarVisible={sidebarVisible}
              onClick={() => handleAction(onToggleSidebar)}
            />
          )}
          {onToggleCanvas && (
            <ToggleCanvasButton
              canvasVisible={canvasVisible}
              onClick={() => handleAction(onToggleCanvas)}
            />
          )}
          {onToggleProperties && (
            <TogglePropertiesButton
              propertiesVisible={propertiesVisible}
              onClick={() => handleAction(onToggleProperties)}
            />
          )}
          {onToggleCode && (
            <ToggleCodeButton
              codeVisible={codeVisible}
              onClick={() => handleAction(onToggleCode)}
            />
          )}
          {onToggleCodeEditor && (
            <ToggleCodeEditorButton
              codeEditorVisible={codeEditorVisible}
              onClick={() => handleAction(onToggleCodeEditor)}
            />
          )}
          {onOpenFileExplorer && (
            <OpenFileExplorerButton onClick={() => handleAction(onOpenFileExplorer)} />
          )}
        </div>
      )} */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {onLoadTemplate && (
          <LoadTemplateButton onClick={() => handleAction(onLoadTemplate)} />
        )}
        {onSaveAsTemplate && (
          <SaveTemplateButton onClick={() => handleAction(onSaveAsTemplate)} />
        )}
        {/* <div className="flex justify-center sm:col-span-2 pt-2">
          <ThemeToggle />
        </div> */}
      </div>
    </div>
  );
}
