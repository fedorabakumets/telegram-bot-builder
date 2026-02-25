/**
 * @fileoverview Компонент панели инструментов холста
 * 
 * Содержит верхнюю панель с кнопками управления масштабом,
 * отмены/повтора, истории действий и другими инструментами.
 */

import { ZoomControls } from './zoom-controls';
import { UndoRedoButtons } from './undo-redo-buttons';
import { ActionHistory } from './action-history';
import { SaveButton } from './save-button';
import { ClipboardButtons } from './clipboard-buttons';
import { InterfaceToggles } from './interface-toggles';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { Action } from './canvas';

/**
 * Свойства компонента панели инструментов
 */
interface CanvasToolbarProps {
  /** Массив узлов на холсте */
  nodes: any[];
  /** Текущий масштаб в процентах */
  zoom: number;
  /** История действий */
  actionHistory: Action[];
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
  /** Колбэк для копирования в буфер обмена */
  onCopyToClipboard?: (nodeIds: string[]) => void;
  /** Колбэк для вставки из буфера обмена */
  onPasteFromClipboard?: () => void;
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
}

/**
 * Компонент панели инструментов холста
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент панели инструментов
 */
export function CanvasToolbar({
  nodes,
  zoom,
  actionHistory,
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
  onCopyToClipboard,
  onPasteFromClipboard,
  onToggleHeader,
  onToggleSidebar,
  onToggleCanvas,
  onToggleProperties,
  handleMouseDownAction,
  handleMouseOverAction,
  toggleActionSelection,
  selectedActionsForUndo,
  handleUndoSelected
}: CanvasToolbarProps) {
  return (
    <div className="absolute top-0 z-40 pointer-events-none w-full transition-all duration-300" style={{ left: 0, right: 0 }}>
      <div className="flex items-center gap-3 relative z-50 w-full px-4 py-3 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-600/50 shadow-lg shadow-slate-300/10 dark:shadow-black/20 pointer-events-auto">
        <div className="flex items-center canvas-controls overflow-x-auto w-full gap-2 text-sm">
          <div className="flex items-center flex-shrink-0 gap-2">
            {/* Кнопки масштаба */}
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

            {/* Кнопки отмены/повтора */}
            <UndoRedoButtons
              canUndo={actionHistory.length > 0}
              canRedo={canRedo}
              onUndo={onUndo}
              onRedo={onRedo}
            />

            {/* История действий */}
            <ActionHistory
              actionHistory={actionHistory}
              handleMouseDownAction={handleMouseDownAction}
              handleMouseOverAction={handleMouseOverAction}
              toggleActionSelection={toggleActionSelection}
              selectedActionsForUndo={selectedActionsForUndo}
              handleUndoSelected={handleUndoSelected}
            />

            <SaveButton onSave={onSave} isSaving={isSaving} />

            {/* Межпроектное копирование/вставка */}
            <ClipboardButtons
              onCopyToClipboard={onCopyToClipboard}
              onPasteFromClipboard={onPasteFromClipboard}
              selectedNodeId={selectedNodeId}
              hasClipboardData={hasClipboardData}
            />

            {/* Разделитель */}
            <div className="h-6 w-px bg-slate-300/50 dark:bg-slate-600/50" />

            {/* Кнопки управления интерфейсом */}
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

          {/* Справка */}
          <KeyboardShortcutsHelp />
        </div>
      </div>
    </div>
  );
}
