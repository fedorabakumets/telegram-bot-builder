/**
 * @fileoverview Десктопные действия
 * @description Компонент отображает все кнопки управления для десктопной версии
 */

import { DesktopToggleHeaderButton } from './desktop-toggle-header-button';
import { DesktopToggleSidebarButton } from './desktop-toggle-sidebar-button';
import { DesktopToggleCanvasButton } from './desktop-toggle-canvas-button';
import { DesktopTogglePropertiesButton } from './desktop-toggle-properties-button';
import { DesktopToggleCodeButton } from './desktop-toggle-code-button';
import { DesktopToggleCodeEditorButton } from './desktop-toggle-code-editor-button';
import { DesktopLoadTemplateButton } from './desktop-load-template-button';
import { DesktopSaveTemplateButton } from './desktop-save-template-button';
import { cn } from '@/utils/utils';

/**
 * Свойства компонента десктопных действий
 */
export interface DesktopActionsProps {
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
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Десктопные действия: кнопки управления панелями и шаблонами
 */
export function DesktopActions({
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
  isVertical,
}: DesktopActionsProps) {
  return (
    <div className={cn(
      'flex',
      isVertical ? 'flex-col space-y-2 p-2' : 'hidden lg:flex flex-wrap items-center gap-1 lg:w-auto lg:order-none lg:ml-auto'
    )}>
      {/* Кнопки управления состоянием панелей — ЗАКОММЕНТИРОВАНО
      {onToggleHeader && (
        <DesktopToggleHeaderButton
          headerVisible={headerVisible}
          onClick={onToggleHeader}
        />
      )}
      {onToggleSidebar && (
        <DesktopToggleSidebarButton
          sidebarVisible={sidebarVisible}
          onClick={onToggleSidebar}
        />
      )}
      {onToggleCanvas && (
        <DesktopToggleCanvasButton
          canvasVisible={canvasVisible}
          onClick={onToggleCanvas}
        />
      )}
      {onToggleProperties && (
        <DesktopTogglePropertiesButton
          propertiesVisible={propertiesVisible}
          onClick={onToggleProperties}
        />
      )}
      {onToggleCode && (
        <DesktopToggleCodeButton
          codeVisible={codeVisible}
          onClick={onToggleCode}
        />
      )}
      {onToggleCodeEditor && (
        <DesktopToggleCodeEditorButton
          codeEditorVisible={codeEditorVisible}
          onClick={onToggleCodeEditor}
        />
      )}
      {onOpenFileExplorer && (
        <DesktopOpenFileExplorerButton onClick={onOpenFileExplorer} />
      )}
      — КОНЕЦ ЗАКОММЕНТИРОВАННОГО БЛОКА */}

      {/* Кнопки сценариев */}
      {onLoadTemplate && (
        <DesktopLoadTemplateButton
          onClick={onLoadTemplate}
          isVertical={isVertical}
        />
      )}
      {onSaveAsTemplate && (
        <DesktopSaveTemplateButton
          onClick={onSaveAsTemplate}
          isVertical={isVertical}
        />
      )}
    </div>
  );
}
