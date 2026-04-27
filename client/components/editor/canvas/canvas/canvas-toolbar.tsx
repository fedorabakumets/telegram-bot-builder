/**
 * @fileoverview РљРѕРјРїРѕРЅРµРЅС‚ РїР°РЅРµР»Рё РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ С…РѕР»СЃС‚Р°
 *
 * РЎРѕРґРµСЂР¶РёС‚ РІРµСЂС…РЅСЋСЋ РїР°РЅРµР»СЊ СЃ РєРЅРѕРїРєР°РјРё СѓРїСЂР°РІР»РµРЅРёСЏ РјР°СЃС€С‚Р°Р±РѕРј,
 * РѕС‚РјРµРЅС‹/РїРѕРІС‚РѕСЂР°, РёСЃС‚РѕСЂРёРё РґРµР№СЃС‚РІРёР№ Рё РґСЂСѓРіРёРјРё РёРЅСЃС‚СЂСѓРјРµРЅС‚Р°РјРё.
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

/**
 * РЎРІРѕР№СЃС‚РІР° РєРѕРјРїРѕРЅРµРЅС‚Р° РїР°РЅРµР»Рё РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ
 */
interface CanvasToolbarProps {
  /** РњР°СЃСЃРёРІ СѓР·Р»РѕРІ РЅР° С…РѕР»СЃС‚Рµ */
  nodes: any[];
  /** РўРµРєСѓС‰РёР№ РјР°СЃС€С‚Р°Р± РІ РїСЂРѕС†РµРЅС‚Р°С… */
  zoom: number;
  /** РСЃС‚РѕСЂРёСЏ РґРµР№СЃС‚РІРёР№ */
  actionHistory: Action[];
  /** Р”РѕСЃС‚СѓРїРЅРѕСЃС‚СЊ РѕС‚РјРµРЅС‹ РґРµР№СЃС‚РІРёСЏ */
  canUndo?: boolean;
  /** Р”РѕСЃС‚СѓРїРЅРѕСЃС‚СЊ РїРѕРІС‚РѕСЂР° РґРµР№СЃС‚РІРёСЏ */
  canRedo?: boolean;
  /** Р¤Р»Р°Рі РїСЂРѕС†РµСЃСЃР° СЃРѕС…СЂР°РЅРµРЅРёСЏ */
  isSaving?: boolean;
  /** РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ РІС‹Р±СЂР°РЅРЅРѕРіРѕ СѓР·Р»Р° */
  selectedNodeId: string | null;
  /** РќР°Р»РёС‡РёРµ РґР°РЅРЅС‹С… РІ Р±СѓС„РµСЂРµ РѕР±РјРµРЅР° */
  hasClipboardData?: boolean;
  /** Р’РёРґРёРјРѕСЃС‚СЊ Р·Р°РіРѕР»РѕРІРєР° */
  headerVisible?: boolean;
  /** Р’РёРґРёРјРѕСЃС‚СЊ Р±РѕРєРѕРІРѕР№ РїР°РЅРµР»Рё */
  sidebarVisible?: boolean;
  /** Р’РёРґРёРјРѕСЃС‚СЊ С…РѕР»СЃС‚Р° */
  canvasVisible?: boolean;
  /** Р’РёРґРёРјРѕСЃС‚СЊ РїР°РЅРµР»Рё СЃРІРѕР№СЃС‚РІ */
  propertiesVisible?: boolean;
  /** РљРѕР»Р±СЌРє СѓРјРµРЅСЊС€РµРЅРёСЏ РјР°СЃС€С‚Р°Р±Р° */
  onZoomOut: () => void;
  /** РљРѕР»Р±СЌРє СѓРІРµР»РёС‡РµРЅРёСЏ РјР°СЃС€С‚Р°Р±Р° */
  onZoomIn: () => void;
  /** РљРѕР»Р±СЌРє СЃР±СЂРѕСЃР° РјР°СЃС€С‚Р°Р±Р° */
  onResetZoom: () => void;
  /** РљРѕР»Р±СЌРє СѓРјРµСЃС‚РёС‚СЊ РІСЃС‘ */
  onFitToContent: () => void;
  /** РљРѕР»Р±СЌРє СѓСЃС‚Р°РЅРѕРІРєРё СѓСЂРѕРІРЅСЏ РјР°СЃС€С‚Р°Р±Р° */
  onZoomLevelChange: (level: number) => void;
  /** РљРѕР»Р±СЌРє РѕС‚РјРµРЅС‹ РґРµР№СЃС‚РІРёСЏ */
  onUndo?: () => void;
  /** РљРѕР»Р±СЌРє РїРѕРІС‚РѕСЂР° РґРµР№СЃС‚РІРёСЏ */
  onRedo?: () => void;
  /** РљРѕР»Р±СЌРє РґР»СЏ СЃРѕС…СЂР°РЅРµРЅРёСЏ */
  onSave?: () => void;
  /** Колбэк для авто-расстановки узлов */
  onAutoLayout?: () => void;
  /** РљРѕР»Р±СЌРє РґР»СЏ РєРѕРїРёСЂРѕРІР°РЅРёСЏ РІ Р±СѓС„РµСЂ РѕР±РјРµРЅР° */
  onCopyToClipboard?: (nodeIds: string[]) => void;
  /** РљРѕР»Р±СЌРє РґР»СЏ РІСЃС‚Р°РІРєРё РёР· Р±СѓС„РµСЂР° РѕР±РјРµРЅР° */
  onPasteFromClipboard?: (offsetX?: number, offsetY?: number) => void;
  /** РџРѕР·РёС†РёСЏ РїРѕСЃР»РµРґРЅРµРіРѕ РєР»РёРєР° РґР»СЏ РІСЃС‚Р°РІРєРё */
  lastClickPosition?: { x: number; y: number };
  /** Transform РїРѕСЃР»РµРґРЅРµРіРѕ РєР»РёРєР° (pan Рё zoom) */
  clickTransform?: { pan: { x: number; y: number }; zoom: number };
  /** РљРѕР»Р±СЌРє РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ РІРёРґРёРјРѕСЃС‚Рё Р·Р°РіРѕР»РѕРІРєР° */
  onToggleHeader?: () => void;
  /** РљРѕР»Р±СЌРє РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ РІРёРґРёРјРѕСЃС‚Рё Р±РѕРєРѕРІРѕР№ РїР°РЅРµР»Рё */
  onToggleSidebar?: () => void;
  /** РљРѕР»Р±СЌРє РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ РІРёРґРёРјРѕСЃС‚Рё С…РѕР»СЃС‚Р° */
  onToggleCanvas?: () => void;
  /** РљРѕР»Р±СЌРє РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ РІРёРґРёРјРѕСЃС‚Рё РїР°РЅРµР»Рё СЃРІРѕР№СЃС‚РІ */
  onToggleProperties?: () => void;
  /** РљРѕР»Р±СЌРє РЅР°С‡Р°Р»Р° РІС‹РґРµР»РµРЅРёСЏ РґРµР№СЃС‚РІРёСЏ */
  handleMouseDownAction: (index: number) => void;
  /** РљРѕР»Р±СЌРє РІС‹РґРµР»РµРЅРёСЏ РґРёР°РїР°Р·РѕРЅР° РґРµР№СЃС‚РІРёР№ */
  handleMouseOverAction: (index: number) => void;
  /** РљРѕР»Р±СЌРє РїРµСЂРµРєР»СЋС‡РµРЅРёСЏ РІС‹Р±РѕСЂР° РґРµР№СЃС‚РІРёСЏ */
  toggleActionSelection: (actionId: string) => void;
  /** Р’С‹Р±СЂР°РЅРЅС‹Рµ РґРµР№СЃС‚РІРёСЏ РґР»СЏ РѕС‚РјРµРЅС‹ */
  selectedActionsForUndo: Set<string>;
  /** Колбэк отмены выбранных действий */
  handleUndoSelected: () => void;
  /** Текущий режим просмотра холста */
  canvasView?: CanvasView;
  /** Колбэк смены режима просмотра */
  onViewChange?: (view: CanvasView) => void;
}

/**
 * РљРѕРјРїРѕРЅРµРЅС‚ РїР°РЅРµР»Рё РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ С…РѕР»СЃС‚Р°
 *
 * @param props - РЎРІРѕР№СЃС‚РІР° РєРѕРјРїРѕРЅРµРЅС‚Р°
 * @returns JSX СЌР»РµРјРµРЅС‚ РїР°РЅРµР»Рё РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ
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
}: CanvasToolbarProps) {
  return (
    <div data-canvas-toolbar className="absolute top-0 z-40 pointer-events-none w-full transition-all duration-300" style={{ left: 0, right: 0 }}>
      <div className="flex items-center gap-3 relative z-50 w-full px-4 py-3 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-600/50 shadow-lg shadow-slate-300/10 dark:shadow-black/20 pointer-events-auto">
        <div className="flex items-center canvas-controls overflow-x-auto w-full gap-2 text-sm">
          <div className="flex items-center flex-shrink-0 gap-2">
            {/* РљРЅРѕРїРєРё РјР°СЃС€С‚Р°Р±Р° */}
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

            {/* РљРЅРѕРїРєРё РѕС‚РјРµРЅС‹/РїРѕРІС‚РѕСЂР° */}
            <UndoRedoButtons
              canUndo={canUndo ?? actionHistory.length > 0}
              canRedo={canRedo}
              onUndo={onUndo}
              onRedo={onRedo}
            />

            {/* РСЃС‚РѕСЂРёСЏ РґРµР№СЃС‚РІРёР№ */}
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

            {/* РњРµР¶РїСЂРѕРµРєС‚РЅРѕРµ РєРѕРїРёСЂРѕРІР°РЅРёРµ/РІСЃС‚Р°РІРєР° */}
            <ClipboardButtons
              onCopyToClipboard={onCopyToClipboard}
              onPasteFromClipboard={onPasteFromClipboard}
              lastClickPosition={lastClickPosition}
              clickTransform={clickTransform}
              selectedNodeId={selectedNodeId}
              hasClipboardData={hasClipboardData}
            />

            {/* Р Р°Р·РґРµР»РёС‚РµР»СЊ */}
            <div className="h-6 w-px bg-slate-300/50 dark:bg-slate-600/50" />

            {/* РљРЅРѕРїРєРё СѓРїСЂР°РІР»РµРЅРёСЏ РёРЅС‚РµСЂС„РµР№СЃРѕРј */}
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

          {/* Переключатель Холст / JSON */}
          {onViewChange && (
            <div className="ml-auto flex-shrink-0">
              <CanvasViewToggle value={canvasView ?? 'canvas'} onChange={onViewChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
