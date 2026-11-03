/**
 * @fileoverview Десктопные действия
 * @description Компонент отображает все кнопки управления для десктопной версии
 */

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
  onLoadTemplate,
  onSaveAsTemplate,
  isVertical,
}: DesktopActionsProps) {
  return (
    <div className={cn(
      'flex',
      isVertical
        ? 'flex-col space-y-2 p-2'
        : 'ml-auto flex shrink-0 flex-nowrap items-center gap-1'
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
