/**
 * @fileoverview Компонент панели инструментов холста
 *
 * Содержит верхнюю панель с кнопками управления масштабом,
 * отмены/повтора, истории действий и другими инструментами.
 * В JSON-режиме скрывает инструменты холста, оставляя только переключатель.
 */

import { ZoomControls } from './zoom-controls';
import { UndoRedoButtons } from './undo-redo-buttons';
import { ActionHistory } from './action-history';
import { SaveButton } from './save-button';
import { AutoLayoutButton } from './auto-layout-button';
import { ClipboardButtons } from './clipboard-buttons';
import { InterfaceToggles } from './interface-toggles';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { Action } from './canvas';
import { CanvasViewToggle } from '@/pages/editor/components/canvas-view-toggle';
import type { CanvasView } from '@/pages/editor/components/canvas-view-toggle';

/** Свойства компонента панели инструментов */
interface CanvasToolbarProps {
  /** Массив узлов на холсте */
  nodes: any[];
  /** Текущий масштаб в процентах */
  zoom: number;
  /** История действий */
  actionHistory: Action[];
  /** Доступность отмены действия */
  canUndo?: boolean;
  /** Доступность повтора действия */
  canRedo?: boolean;
  /** Флаг процесса сохранения */
  isSaving?: boolean;
  /** Идентификатор выбранного узла */
  selectedNodeId: string | null;
  /** Наличие данных в буфере обмена */
  hasClipboardData?: boolean;
  /** Видимость заголовка */
  headerVisible?: boolean;
  /** Видимость боковой панели */
  sidebarVisible?: boolean;
  /** Видимость холста */
  canvasVisible?: boolean;
  /** Видимость панели свойств */
  propertiesVisible?: boolean;
  /** Колбэк уменьшения масштаба */
  onZoomOut: () => void;
  /** Колбэк увеличения масштаба */
  onZoomIn: () => void;
  /** Колбэк сброса масштаба */
  onResetZoom: () => void;
  /** Колбэк уместить всё */
  onFitToContent: () => void;
  /** Колбэк установки уровня масштаба */
  onZoomLevelChange: (level: number) => void;
  /** Колбэк отмены действия */
  onUndo?: () => void;
  /** Колбэк повтора действия */
  onRedo?: () => void;
  /** Колбэк для сохранения */
  onSave?: () => void;
  /** Колбэк для авто-расстановки узлов */
  onAutoLayout?: () => void;
  /** Колбэк для копирования в буфер обмена */
  onCopyToClipboard?: (nodeIds: string[]) => void;
  /** Колбэк для вставки из буфера обмена */
  onPasteFromClipboard?: (offsetX?: number, offsetY?: number) => void;
  /** Позиция последнего клика для вставки */
  lastClickPosition?: { x: number; y: number };
  /** Transform последнего клика (pan и zoom) */
  clickTransform?: { pan: { x: number; y: number }; zoom: number };
  /** Колбэк переключения видимости заголовка */
  onToggleHeader?: () => void;
  /** Колбэк переключения видимости боковой панели */
  onToggleSidebar?: () => void;
  /** Колбэк переключения видимости холста */
  onToggleCanvas?: () => void;
  /** Колбэк переключения видимости панели свойств */
  onToggleProperties?: () => void;
  /** Колбэк начала выделения действия */
  handleMouseDownAction: (index: number) => void;
  /** Колбэк выделения диапазона действий */
  handleMouseOverAction: (index: number) => void;
  /** Колбэк переключения выбора действия */
  toggleActionSelection: (actionId: string) => void;
  /** Выбранные действия для отмены */
  selectedActionsForUndo: Set<string>;
  /** Колбэк отмены выбранных действий */
  handleUndoSelected: () => void;
  /** Текущий режим просмотра холста */
  canvasView?: CanvasView;
  /** Колбэк смены режима просмотра */
  onViewChange?: (view: CanvasView) => void;
  /** Все ли блоки JSON свёрнуты */
  areAllCollapsed?: boolean;
  /** Колбэк переключения сворачивания блоков JSON */
  onToggleCollapse?: () => void;
}

/**
 * Компонент панели инструментов холста
 * В JSON-режиме показывает только переключатель и кнопку fold/unfold
 * @param props - Свойства компонента
 * @returns JSX элемент панели инструментов
 */
export function CanvasToolbar({
  nodes,
  zoom,
  actionHistory,
  canUndo,
  canRedo,
  isSaving,
  selectedNodeId,
  hasClipboardData,
  headerVisible,
  sidebarVisible,
  canvasVisible,
  propertiesVisible,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onFitToContent,
  onZoomLevelChange,
  onUndo,
  onRedo,
  onSave,
  onAutoLayout,
  onCopyToClipboard,
  onPasteFromClipboard,
  lastClickPosition,
  clickTransform,
  onToggleHeader,
  onToggleSidebar,
  onToggleCanvas,
  onToggleProperties,
  handleMouseDownAction,
  handleMouseOverAction,
  toggleActionSelection,
  selectedActionsForUndo,
  handleUndoSelected,
  canvasView,
  onViewChange,
  areAllCollapsed,
  onToggleCollapse,
}: CanvasToolbarProps) {
  const isJson = canvasView === 'json';

  return (
    <div data-canvas-toolbar className="absolute top-0 z-40 pointer-events-none w-full transition-all duration-300" style={{ left: 0, right: 0 }}>
      <div className="flex items-center gap-3 relative z-50 w-full px-4 py-3 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-600/50 shadow-lg shadow-slate-300/10 dark:shadow-black/20 pointer-events-auto">
        <div className="flex items-center canvas-controls overflow-x-auto w-full gap-2 text-sm">

          {/* Инструменты холста — скрыты в JSON-режиме */}
          {!isJson && (
            <div className="flex items-center flex-shrink-0 gap-2">
              <ZoomControls
                zoom={zoom}
                canZoomOut={zoom > 1}
                canZoomIn={zoom < 200}
                canFitToContent={nodes.length > 0}
                onZoomOut={onZoomOut}
                onZoomIn={onZoomIn}
                onResetZoom={onResetZoom}
                onFitToContent={onFitToContent}
                onZoomLevelChange={onZoomLevelChange}
              />
              <UndoRedoButtons
                canUndo={canUndo ?? actionHistory.length > 0}
                canRedo={canRedo}
                onUndo={onUndo}
                onRedo={onRedo}
              />
              <ActionHistory
                actionHistory={actionHistory}
                handleMouseDownAction={handleMouseDownAction}
                handleMouseOverAction={handleMouseOverAction}
                toggleActionSelection={toggleActionSelection}
                selectedActionsForUndo={selectedActionsForUndo}
                handleUndoSelected={handleUndoSelected}
              />
              <SaveButton onSave={onSave} isSaving={isSaving} />
              <AutoLayoutButton onAutoLayout={onAutoLayout} />
              <ClipboardButtons
                onCopyToClipboard={onCopyToClipboard}
                onPasteFromClipboard={onPasteFromClipboard}
                lastClickPosition={lastClickPosition}
                clickTransform={clickTransform}
                selectedNodeId={selectedNodeId}
                hasClipboardData={hasClipboardData}
              />
              <div className="h-6 w-px bg-slate-300/50 dark:bg-slate-600/50" />
              {headerVisible === false && (onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas) && (
                <InterfaceToggles
                  headerVisible={headerVisible}
                  sidebarVisible={sidebarVisible}
                  canvasVisible={canvasVisible}
                  propertiesVisible={propertiesVisible}
                  onToggleHeader={onToggleHeader}
                  onToggleSidebar={onToggleSidebar}
                  onToggleCanvas={onToggleCanvas}
                  onToggleProperties={onToggleProperties}
                />
              )}
            </div>
          )}

          {/* Справка — скрыта в JSON-режиме */}
          {!isJson && <KeyboardShortcutsHelp />}

          {/* Переключатель Холст / JSON + fold/unfold */}
          {onViewChange && (
            <div className={`flex-shrink-0 flex items-center gap-2 ${isJson ? '' : 'ml-auto'}`}>
              {isJson && onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex items-center gap-1 h-6 px-2 text-xs rounded-sm border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={areAllCollapsed ? 'Развернуть всё' : 'Свернуть всё'}
                >
                  {areAllCollapsed ? (
                    <><svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l4 4 4-4M4 8l4 4 4-4"/></svg>Развернуть</>
                  ) : (
                    <><svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4-4 4 4M4 10l4 4 4-4"/></svg>Свернуть</>
                  )}
                </button>
              )}
              <CanvasViewToggle value={canvasView ?? 'canvas'} onChange={onViewChange} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
