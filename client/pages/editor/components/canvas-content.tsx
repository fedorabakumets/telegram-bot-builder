/**
 * @fileoverview Компонент содержимого canvas
 *
 * Рендерит контент вкладки редактора в зависимости от текущей вкладки.
 *
 * @module CanvasContent
 */

import { Canvas } from '@/components/editor/canvas/canvas/canvas';
import { UserDatabasePanel } from '@/components/editor/database/user-database/user-database-panel';
import { GroupsPanel } from '@/components/editor/groups/groups-panel';
import type { EditorTab } from '../types';
import type { BotDataWithSheets, UserBotData, BotProject } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Параметры компонента CanvasContent */
export interface CanvasContentProps {
  /** Текущая вкладка */
  currentTab: EditorTab;
  /** Данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Обработчик обновления данных бота */
  onBotDataUpdate: (data: BotDataWithSheets) => void;
  /** Узлы */
  nodes: any[];
  /** Выбранный ID узла */
  selectedNodeId: string | null;
  /** Обработчик выбора узла */
  onNodeSelect: (id: string | null) => void;
  /** Добавить узел */
  onNodeAdd: () => void;
  /** Удалить узел */
  onNodeDelete: (id: string) => void;
  /** Дублировать узел */
  onNodeDuplicate: (id: string) => void;
  /** Переместить узел */
  onNodeMove: (id: string, pos: { x: number; y: number }) => void;
  /** Конец перемещения узла */
  onNodeMoveEnd: () => void;
  /** Обновить узлы */
  onNodesUpdate: (nodes: any[]) => void;
  /** Отменить действие */
  onUndo: () => void;
  /** Повторить действие */
  onRedo: () => void;
  /** Можно ли отменить */
  canUndo: boolean;
  /** Можно ли повторить */
  canRedo: boolean;
  /** Сохранить проект */
  onSave: () => void;
  /** Сохранение в процессе */
  isSaving: boolean;
  /** Копировать в буфер */
  onCopyToClipboard: (nodes: any[]) => void;
  /** Вставить из буфера */
  onPasteFromClipboard: () => void;
  /** Есть данные в буфере */
  hasClipboardData: () => boolean;
  /** Узел перетаскивается */
  isNodeBeingDragged: boolean;
  /** Установить флаг перетаскивания */
  setIsNodeBeingDragged: (dragged: boolean) => void;
  /** Переключить заголовок */
  onToggleHeader: () => void;
  /** Переключить сайдбар */
  onToggleSidebar: () => void;
  /** Переключить свойства */
  onToggleProperties: () => void;
  /** Переключить canvas */
  onToggleCanvas: () => void;
  /** Видимость заголовка */
  headerVisible: boolean;
  /** Видимость сайдбара */
  sidebarVisible: boolean;
  /** Видимость свойств */
  propertiesVisible: boolean;
  /** Видимость canvas */
  canvasVisible: boolean;
  /** Открыть мобильный сайдбар */
  onOpenMobileSidebar: () => void;
  /** Открыть мобильные свойства */
  onOpenMobileProperties: () => void;
  /** Логирование действий */
  onActionLog: (type: string, description: string) => void;
  /** История действий */
  actionHistory: any[];
  /** Обработчик открытия панели диалога */
  onOpenDialogPanel: (user: UserBotData) => void;
  /** Обработчик открытия панели деталей */
  onOpenUserDetailsPanel: (user: UserBotData) => void;
}

/**
 * Компонент содержимого canvas
 *
 * @param props - Параметры компонента
 * @returns JSX элемент контента
 */
export function CanvasContent(props: CanvasContentProps) {
  const { currentTab } = props;
  const { data: projects = [] } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects'),
  });
  const project = projects[0];

  if (currentTab === 'editor') {
    return (
      <Canvas
        botData={props.botDataWithSheets || undefined}
        onBotDataUpdate={props.onBotDataUpdate}
        nodes={props.nodes}
        selectedNodeId={props.selectedNodeId}
        onNodeSelect={props.onNodeSelect}
        onNodeAdd={props.onNodeAdd}
        onNodeDelete={props.onNodeDelete}
        onNodeDuplicate={props.onNodeDuplicate}
        onNodeMove={props.onNodeMove}
        onNodeMoveEnd={props.onNodeMoveEnd}
        onNodesUpdate={props.onNodesUpdate}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        onSave={props.onSave}
        isSaving={props.isSaving}
        onCopyToClipboard={props.onCopyToClipboard}
        onPasteFromClipboard={props.onPasteFromClipboard}
        hasClipboardData={props.hasClipboardData()}
        onToggleHeader={props.onToggleHeader}
        onToggleSidebar={props.onToggleSidebar}
        onToggleProperties={props.onToggleProperties}
        onToggleCanvas={props.onToggleCanvas}
        headerVisible={props.headerVisible}
        sidebarVisible={props.sidebarVisible}
        propertiesVisible={props.propertiesVisible}
        canvasVisible={props.canvasVisible}
        onOpenMobileSidebar={props.onOpenMobileSidebar}
        onActionLog={props.onActionLog}
        actionHistory={props.actionHistory}
      />
    );
  }

  if (currentTab === 'users') {
    return (
      <div className="h-full">
        <UserDatabasePanel
          projectId={project?.id ?? 0}
          projectName={project?.name ?? ''}
          onOpenDialogPanel={props.onOpenDialogPanel}
          onOpenUserDetailsPanel={props.onOpenUserDetailsPanel}
        />
      </div>
    );
  }

  if (currentTab === 'groups') {
    return (
      <div className="h-full">
        <GroupsPanel projectId={project?.id ?? 0} projectName={project?.name ?? ''} />
      </div>
    );
  }

  return null;
}
