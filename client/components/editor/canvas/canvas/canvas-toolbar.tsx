/**
 * @fileoverview РљРѕРјРїРѕРЅРµРЅС‚ РїР°РЅРµР»Рё РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ С…РѕР»СЃС‚Р°
 *
 * РЎРѕРґРµСЂР¶РёС‚ РІРµСЂС…РЅСЋСЋ РїР°РЅРµР»СЊ СЃ РєРЅРѕРїРєР°РјРё СѓРїСЂР°РІР»РµРЅРёСЏ РјР°СЃС€С‚Р°Р±РѕРј,
 * РѕС‚РјРµРЅС‹/РїРѕРІС‚РѕСЂР°, РёСЃС‚РѕСЂРёРё РґРµР№СЃС‚РІРёР№ Рё РґСЂСѓРіРёРјРё РёРЅСЃС‚СЂСѓРјРµРЅС‚Р°РјРё.
 */

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { canvasToolbarTitles, useCanvasToolbarPreferences, type CanvasToolbarKey } from './canvas-toolbar-preferences';
import { CanvasToolbarMore, CanvasToolbarMoreRow } from './canvas-toolbar-more';
import { ZoomControls } from './zoom-controls';
import { UndoRedoButtons } from './undo-redo-buttons';
import { ActionHistory } from './action-history';
import { VersionHistoryButton } from './version-history-button';
import { SaveButton } from './save-button';
import { AutosaveToggle } from '@/components/editor/staging/autosave-toggle';
import { SaveCheckpointPopover } from './save-checkpoint-popover';
import { AutoLayoutButton } from './auto-layout-button';
import { ClipboardButtons } from './clipboard-buttons';
import { InterfaceToggles } from './interface-toggles';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';
import { NodeSearchButton } from './node-search-button';
import { MarqueeSelectButton } from './marquee-select-button';
import { PortalsToggleButton } from './portals-toggle-button';
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
  /** Доступность восстановления предыдущего вида */
  canRestorePreviousView?: boolean;
  /** Колбэк восстановления предыдущего вида */
  onRestorePreviousView?: () => void;
  /** РљРѕР»Р±СЌРє РѕС‚РјРµРЅС‹ РґРµР№СЃС‚РІРёСЏ */
  onUndo?: () => void;
  /** РљРѕР»Р±СЌРє РїРѕРІС‚РѕСЂР° РґРµР№СЃС‚РІРёСЏ */
  onRedo?: () => void;
  /** РљРѕР»Р±СЌРє РґР»СЏ СЃРѕС…СЂР°РЅРµРЅРёСЏ */
  onSave?: () => void;
  /** Включено ли автосохранение холста */
  autosave?: boolean;
  /** Включить или выключить автосохранение */
  onAutosaveChange?: (enabled: boolean) => void;
  /** Колбэк сохранения с заметкой — создаёт постоянный ручной чекпоинт */
  onSaveWithNote?: (note: string) => void;
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
  /** Колбэк центрирования холста на узле (включает кнопку поиска узлов) */
  onNodeFocus?: (nodeId: string) => void;
  /** Управляемое состояние открытия поиска узлов (для Ctrl+F) */
  searchOpen?: boolean;
  /** Колбэк изменения состояния открытия поиска узлов */
  onSearchOpenChange?: (open: boolean) => void;
  /** Активен ли инструмент рамочного выделения */
  marqueeActive?: boolean;
  /** Колбэк переключения инструмента рамочного выделения */
  onToggleMarquee?: () => void;
  /** Видимость порталов к другим листам */
  showPortals?: boolean;
  /** Колбэк переключения видимости порталов */
  onTogglePortals?: () => void;
  /** Количество порталов (для бейджа на кнопке) */
  portalsCount?: number;
  /** ID проекта (включает кнопку истории версий) */
  projectId?: number;
  /** Колбэк после восстановления версии — перезагрузка холста */
  onRestoreVersion?: () => void;
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
  propertiesVisible,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onFitToContent,
  onZoomLevelChange,
  canRestorePreviousView,
  onRestorePreviousView,
  onUndo,
  onRedo,
  onSave,
  autosave,
  onAutosaveChange,
  onSaveWithNote,
  onAutoLayout,
  onCopyToClipboard,
  onPasteFromClipboard,
  lastClickPosition,
  clickTransform,
  onToggleHeader,
  onToggleSidebar,
  onToggleProperties,
  handleMouseDownAction,
  handleMouseOverAction,
  toggleActionSelection,
  selectedActionsForUndo,
  handleUndoSelected,
  canvasView,
  onViewChange,
  onNodeFocus,
  searchOpen,
  onSearchOpenChange,
  marqueeActive,
  onToggleMarquee,
  showPortals,
  onTogglePortals,
  portalsCount,
  projectId,
  onRestoreVersion,
}: CanvasToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  /** Следит за шириной холста при изменении размеров соседних панелей. */
  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const group = toolbar.closest('#combo-center-panel')?.parentElement;
    const canvas = toolbar.closest('main');
    /** Привязывает плавающий поиск к нижнему краю панели инструментов холста. */
    const measure = () => {
      setWidth(toolbar.clientWidth);
      if (group) {
        const bottom = toolbar.getBoundingClientRect().bottom - group.getBoundingClientRect().top;
        group.style.setProperty('--canvas-toolbar-bottom', `${bottom}px`);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    if (canvas) observer.observe(canvas);
    return () => {
      observer.disconnect();
      group?.style.removeProperty('--canvas-toolbar-bottom');
    };
  }, []);

  const roomy = width >= 520;
  const gap = roomy ? 8 : 4;
  const preferences = useCanvasToolbarPreferences();
  const tools: { /** Ключ команды */ key: CanvasToolbarKey; /** Подпись в меню */ label: string; /** Ширина группы */ size: number; /** Элементы управления */ content: ReactNode }[] = [];

  /**
   * Регистрирует доступный инструмент холста.
   * @param key - Ключ команды.
   * @param size - Ширина кнопки или группы.
   * @param content - Элементы управления.
   */
  const add = (key: CanvasToolbarKey, size: number, content: ReactNode) => tools.push({ key, label: canvasToolbarTitles[key], size, content });

  add('save', 36, <SaveButton onSave={onSave} isSaving={isSaving} />);
  if (onNodeFocus) add('search', 36, <NodeSearchButton nodes={nodes} onNodeFocus={onNodeFocus} open={searchOpen} onOpenChange={onSearchOpenChange} />);
  add('undo', 36, <UndoRedoButtons only="undo" canUndo={canUndo ?? actionHistory.length > 0} onUndo={onUndo} />);
  add('redo', 36, <UndoRedoButtons only="redo" canUndo={false} canRedo={canRedo} onRedo={onRedo} />);
  if (onViewChange) add('view', width >= 360 ? 140 : 100, (<CanvasViewToggle value={canvasView ?? 'canvas'} onChange={onViewChange} />));
  if (onAutosaveChange) add('autosave', roomy ? 128 : 24, (<AutosaveToggle checked={!!autosave} onChange={onAutosaveChange} />));
  add('layout', 36, <AutoLayoutButton onAutoLayout={onAutoLayout} />);
  add('actions', 36, (<ActionHistory
    actionHistory={actionHistory}
    handleMouseDownAction={handleMouseDownAction}
    handleMouseOverAction={handleMouseOverAction}
    toggleActionSelection={toggleActionSelection}
    selectedActionsForUndo={selectedActionsForUndo}
    handleUndoSelected={handleUndoSelected}
  />));
  if (projectId != null) add('versions', 36, <VersionHistoryButton projectId={projectId} onRestored={onRestoreVersion} />);
  if (onToggleMarquee) add('marquee', 36, <MarqueeSelectButton active={marqueeActive ?? false} onToggle={onToggleMarquee} />);
  if (onTogglePortals) add('portals', 36, <PortalsToggleButton active={showPortals ?? false} onToggle={onTogglePortals} count={portalsCount} />);
  if (onSaveWithNote) add('checkpoint', 24, <SaveCheckpointPopover onSaveWithNote={onSaveWithNote} isSaving={isSaving} />);
  if (onCopyToClipboard && selectedNodeId) {
    add('copy', 36, <ClipboardButtons selectedNodeId={selectedNodeId} onCopyToClipboard={onCopyToClipboard} />);
  }
  if (onPasteFromClipboard && hasClipboardData) {
    add('paste', 36, <ClipboardButtons selectedNodeId={null} hasClipboardData onPasteFromClipboard={onPasteFromClipboard}
      lastClickPosition={lastClickPosition} clickTransform={clickTransform} />);
  }
  add('fit', 36, (<ZoomControls
    zoom={zoom}
    canZoomOut={zoom > 1}
    canZoomIn={zoom < 200}
    canFitToContent={nodes.length > 0}
    onZoomOut={onZoomOut}
    onZoomIn={onZoomIn}
    onResetZoom={onResetZoom}
    onFitToContent={onFitToContent}
    onZoomLevelChange={onZoomLevelChange}
    canRestorePreviousView={canRestorePreviousView}
    onRestorePreviousView={onRestorePreviousView}
    hideScaleButtons
  />));
  if (headerVisible === false || sidebarVisible === false) {
    if (onToggleHeader) add('header', 36, <InterfaceToggles headerVisible={headerVisible} onToggleHeader={onToggleHeader} />);
    if (onToggleSidebar) add('sidebar', 36, <InterfaceToggles sidebarVisible={sidebarVisible} onToggleSidebar={onToggleSidebar} />);
    if (onToggleProperties) add('properties', 36, <InterfaceToggles propertiesVisible={propertiesVisible} onToggleProperties={onToggleProperties} />);
  }
  add('help', 36, <KeyboardShortcutsHelp />);

  const byKey = new Map<string, typeof tools[number]>(tools.map(tool => [tool.key, tool]));
  const ordered = preferences.order.flatMap(key => {
    const tool = byKey.get(key);
    return tool && (!preferences.hidden.includes(key) || (key === 'search' && searchOpen)) ? [tool] : [];
  });
  /** Резервируем место для поиска, чтобы Ctrl + F открывал его и на узком холсте. */
  const search = ordered.find(tool => tool.key === 'search');
  /** Переключатель режима занимает место перед меню независимо от порядка инструментов. */
  const view = ordered.find(tool => tool.key === 'view');
  const available = width - (roomy ? 32 : 16);
  const total = ordered.reduce((sum, tool) => sum + tool.size + gap, 0) - gap;
  let remaining = available - (total > available ? (width >= 360 ? 154 : 34) : -gap);
  if (search) remaining -= search.size + gap;
  if (view) remaining -= view.size + gap;
  const visible = [];
  const overflow = [];
  for (const tool of ordered) {
    if (tool === view) continue;
    if (tool === search || tool.size + gap <= remaining) {
      visible.push(tool);
      if (tool !== search) remaining -= tool.size + gap;
    } else {
      overflow.push(tool);
    }
  }

  return (
    <div ref={toolbarRef} data-canvas-toolbar className="@container pointer-events-none absolute inset-x-0 top-0 z-40">
      <div className="canvas-controls pointer-events-auto relative z-50 flex items-center gap-1 border-b border-border bg-background/95 px-2 py-1.5 text-sm shadow-sm backdrop-blur-md @[520px]:gap-2 @[520px]:px-4">
        {visible.map(({ key, content }) => (
          <span key={key} data-learn-toolbar={key} className="inline-flex shrink-0 items-center gap-0.5">{content}</span>
        ))}
        {view && <span data-learn-toolbar="view" className="ml-auto inline-flex shrink-0">{view.content}</span>}
        {overflow.length > 0 && (
          <CanvasToolbarMore learnTargets={overflow.map(tool => tool.key).join(' ')}>
            {overflow.map(({ key, label, content }) => <CanvasToolbarMoreRow key={key} label={label}>{content}</CanvasToolbarMoreRow>)}
          </CanvasToolbarMore>
        )}
      </div>
    </div>
  );
}
