/**
 * @fileoverview Компактная карточка проекта и его листов в боковой панели
 * Отображает информацию о проекте с поддержкой drag-and-drop и управления листами
 * @module components/editor/sidebar/components/project-card
 */

import React, { useEffect, useRef, useState } from 'react';
import { useEditorAppearance } from '../../shared/use-editor-appearance';
import { BotProject } from '@shared/schema';
import { SheetsManager } from '@/utils/sheets/sheets-manager';
import { cn } from '@/utils/utils';
import { formatDate } from '../handlers/format-date';
import { getNodeCount } from '../handlers/get-node-count';
import { getSheetsInfo } from '../handlers/get-sheets-info';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  GripVertical,
  Search,
  Share2,
  Trash2,
  Zap,
} from 'lucide-react';
import { getNodeIcon, getNodeColor, getNodeName } from '@/components/editor/shared/node-registry';
import { SheetNodeSearch } from './sheet-node-search';
import { useSheetNodeSearch } from '../hooks/use-sheet-node-search';
import { useSheetSearchState } from '../hooks/use-sheet-search-state';
import { HighlightText } from './highlight-text';
import { useNodeSelection } from '../hooks/use-node-selection';
import { DeleteProjectDialog } from './delete-project-dialog';
import { ProjectCardArchiveButton } from './project-card-archive-button';

/**
 * Состояние drag-and-drop для проектов и листов
 */
export interface DragState {
  /** Перетаскиваемый проект */
  draggedProject: BotProject | null;
  /** Проект, над которым находится курсор при перетаскивании */
  dragOverProject: number | null;
  /** Перетаскиваемый лист */
  draggedSheet: { sheetId: string; projectId: number } | null;
  /** Лист, над которым находится курсор при перетаскивании */
  dragOverSheet: string | null;
}

/**
 * Состояние редактирования имени листа
 */
export interface EditingState {
  /** Идентификатор редактируемого листа */
  editingSheetId: string | null;
  /** Текущее имя редактируемого листа */
  editingSheetName: string;
}

/**
 * Состояние редактирования имени проекта
 */
export interface EditingProjectState {
  /** Идентификатор редактируемого проекта */
  editingProjectId: number | null;
  /** Текущее имя редактируемого проекта */
  editingProjectName: string;
}

/**
 * Пропсы компонента ProjectCard
 */
export interface ProjectCardProps {
  /** Объект проекта для отображения */
  project: BotProject;
  /** Флаг активного проекта */
  isActive: boolean;
  /** Идентификатор текущего проекта */
  currentProjectId?: number;
  /** Идентификатор активного листа */
  activeSheetId?: string;
  /** Обработчик выбора проекта */
  onProjectSelect?: (projectId: number, sheetId?: string) => void;
  /** Обработчик удаления проекта */
  onProjectDelete: (projectId: number) => void;
  /** Обработчик дублирования проекта */
  onProjectDuplicate?: (projectId: number) => void;
  /** Обработчик выбора листа */
  onSheetSelect?: (sheetId: string) => void;
  /** Обработчик переименования листа */
  onSheetRename?: (sheetId: string, name: string) => void;
  /** Обработчик дублирования листа */
  onSheetDuplicate?: (sheetId: string) => void;
  /** Обработчик удаления листа */
  onSheetDelete?: (sheetId: string) => void;
  /** Состояние drag-and-drop */
  dragState: DragState;
  /** Обработчик начала перетаскивания проекта */
  onProjectDragStart: (e: React.DragEvent) => void;
  /** Обработчик завершения перетаскивания проекта */
  onProjectDragEnd?: (e: React.DragEvent) => void;
  /** Обработчик клика по проекту */
  onProjectClick?: () => void;
  /** Обработчик перетаскивания над проектом */
  onProjectDragOver: (e: React.DragEvent) => void;
  /** Обработчик ухода с проекта при перетаскивании */
  onProjectDragLeave: () => void;
  /** Обработчик сброса на проект */
  onProjectDrop: (e: React.DragEvent) => void;
  /** Обработчик начала перетаскивания листа */
  onSheetDragStart: (e: React.DragEvent, sheetId: string) => void;
  /** Обработчик перетаскивания над листом */
  onSheetDragOver: (e: React.DragEvent) => void;
  /** Обработчик ухода с листа при перетаскивании */
  onSheetDragLeave: () => void;
  /** Обработчик сброса на лист */
  onSheetDrop: (e: React.DragEvent, targetSheetId: string) => void;
  /** Состояние редактирования */
  editingState: EditingState;
  /** Обработчик начала редактирования имени листа */
  onStartEditingSheet: (sheetId: string, name: string) => void;
  /** Обработчик сохранения имени листа */
  onSaveSheetName: () => void;
  /** Обработчик отмены редактирования имени листа */
  onCancelEditSheetName: () => void;
  /** Обработчик изменения имени листа при редактировании */
  onEditingSheetNameChange: (name: string) => void;
  /** Состояние редактирования проекта */
  projectEditingState?: EditingProjectState;
  /** Обработчик начала редактирования имени проекта */
  onStartEditingProject?: (projectId: number, name: string) => void;
  /** Обработчик сохранения имени проекта */
  onSaveProjectName?: () => void;
  /** Обработчик отмены редактирования имени проекта */
  onCancelEditProjectName?: () => void;
  /** Обработчик изменения имени проекта при редактировании */
  onEditingProjectNameChange?: (name: string) => void;
  /** Список всех проектов для dropdown перемещения */
  allProjects?: BotProject[];
  /** Обработчик перемещения листа в другой проект */
  onMoveSheetToProject?: (sourceProjectId: number, targetProjectId: number, sheetId: string) => void;
  /** Обработчик изменения порядка листов внутри проекта */
  onSheetReorder?: (projectId: number, fromIndex: number, toIndex: number) => void;
  /** Обработчик начала touch перетаскивания проекта */
  onTouchStart?: (e: React.TouchEvent) => void;
  /** Обработчик движения touch перетаскивания проекта */
  onTouchMove?: (e: React.TouchEvent) => void;
  /** Обработчик окончания touch перетаскивания проекта */
  onTouchEnd?: (e: React.TouchEvent) => void;
  /** Колбэк для фокусировки на узле канваса */
  onNodeFocus?: (nodeId: string, buttonId?: string) => void;
  /** Колбэк массового перемещения узлов между листами */
  onBulkMoveNodes?: (sourceSheetId: string, nodeIds: string[], targetSheetId: string) => void;
  /** true — список архивных проектов */
  isArchivedView?: boolean;
  /** Поместить проект в архив */
  onArchiveProject?: (projectId: number) => void;
  /** Вернуть проект из архива */
  onUnarchiveProject?: (projectId: number) => void;
  /** Блокировка кнопок архива */
  isArchivePending?: boolean;
}

/**
 * Краткий контент узла (до 30 символов)
 * @param node - Узел проекта
 * @returns Строка с кратким описанием содержимого узла
 */
function getShortContent(node: any): string {
  if (node.type === 'command_trigger') return node.data?.command || '';
  if (node.type === 'text_trigger') return node.data?.textSynonyms?.[0] || '';
  if (node.type === 'message') return node.data?.messageText || '';
  if (node.type === 'input') return node.data?.inputVariable || '';
  return '';
}


/**
 * Пропсы компонента SheetAccordionContent
 */
interface SheetAccordionContentProps {
  /** Список узлов листа */
  nodes: any[];
  /** Текущий поисковый запрос */
  searchQuery: string;
  /** Обработчик изменения поискового запроса */
  onSearchChange: (query: string) => void;
  /** Колбэк для фокусировки на узле канваса, опционально с фокусом на кнопке и постоянной подсветкой */
  onNodeFocus?: (nodeId: string, buttonId?: string, persist?: boolean) => void;
  /** Список других листов проекта для перемещения */
  availableSheets?: Array<{ id: string; name: string }>;
  /** Колбэк массового перемещения узлов */
  onBulkMoveNodes?: (nodeIds: string[], targetSheetId: string) => void;
  /** Скрыть встроенное поле поиска (при активном глобальном поиске) */
  hideSearch?: boolean;
}

/**
 * Содержимое раскрытого аккордеона листа: поиск + список узлов + массовое перемещение
 * @param props - Свойства компонента SheetAccordionContentProps
 * @returns JSX элемент содержимого аккордеона
 */
function SheetAccordionContent({
  nodes,
  searchQuery,
  onSearchChange,
  onNodeFocus,
  availableSheets = [],
  onBulkMoveNodes,
  hideSearch = false,
}: SheetAccordionContentProps) {
  const filtered = useSheetNodeSearch(nodes, searchQuery);
  const { selectedNodeIds, toggleNode, clearSelection, isSelected, selectedCount } = useNodeSelection();
  /** ID узла, на который последний раз кликнули (подсветка в списке) */
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  /**
   * Обработчик выбора целевого листа для массового перемещения
   * @param sheetId - Идентификатор целевого листа
   */
  const handleBulkMove = (sheetId: string) => {
    if (onBulkMoveNodes && selectedCount > 0) {
      onBulkMoveNodes(Array.from(selectedNodeIds), sheetId);
      clearSelection();
    }
  };

  return (
    <div className="mt-0.5 mb-1 transition-all">
      {!hideSearch && <SheetNodeSearch value={searchQuery} onChange={onSearchChange} />}
      {/* Панель перемещения — над списком, появляется при выборе хотя бы одного узла */}
      {selectedCount > 0 && availableSheets.length > 0 && (
        <div className="px-1.5 py-1 mb-1 flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-muted-foreground flex-shrink-0">↗ в лист:</span>
          {availableSheets.map((sheet) => (
            <button
              key={sheet.id}
              className="text-xs px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-400/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 transition-colors"
              title={sheet.name}
              onClick={(e) => { e.stopPropagation(); handleBulkMove(sheet.id); }}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground opacity-60 px-1.5">
          {nodes.length === 0 ? 'Нет узлов' : 'Не найдено'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((node: any) => {
            const shortContent = getShortContent(node);
            const isKeyboard = node.type === 'keyboard';
            const buttonObjects: Array<{ id: string; text: string }> = isKeyboard
              ? (node.data?.buttons || []).filter((b: any) => b.text)
              : [];
            const selected = isSelected(node.id);
            const nodeColor = getNodeColor(node.type);
            const nodeIcon = getNodeIcon(node.type);
            const nodeName = node.type === 'keyboard'
              ? node.data?.keyboardType === 'reply' ? 'Reply кнопки' : 'Inline кнопки'
              : getNodeName(node.type);
            return (
              <div
                key={node.id}
                className={cn(
                  "group/node flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer border transition-all duration-200",
                  "bg-background",
                  "hover:bg-muted/40",
                  focusedNodeId === node.id
                    ? 'border-primary/60 ring-1 ring-primary/30 shadow-sm shadow-primary/10'
                    : 'border-border/30 hover:border-primary/30'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedNodeId(node.id);
                  if (onNodeFocus && node.id) onNodeFocus(node.id);
                }}
                /** Обработчик тача для мобильных — дублирует onClick при перехвате touch-событий родителем */
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  setFocusedNodeId(node.id);
                  if (onNodeFocus && node.id) onNodeFocus(node.id);
                }}
              >
                {/** Выбор для переноса нужен только при наличии другого листа. */}
                {onBulkMoveNodes && availableSheets.length > 0 && (
                  <input
                    type="checkbox"
                    checked={selected}
                    aria-label={`Выбрать блок «${nodeName}» для переноса`}
                    className="size-4 shrink-0 accent-primary"
                    onClick={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onChange={() => toggleNode(node.id)}
                  />
                )}
                {/* Цветная иконка */}
                <div className={cn(
                  "size-6 rounded-md flex items-center justify-center flex-shrink-0",
                  "transition-transform group-hover/node:scale-110",
                  nodeColor
                )}>
                  <i className={`${nodeIcon} text-xs sm:text-sm`}></i>
                </div>
                {/* Название и описание */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground break-words leading-tight">
                    <HighlightText text={nodeName} query={searchQuery} />
                  </p>
                  {shortContent && (
                    <p className="text-xs text-muted-foreground break-words line-clamp-2">
                      <HighlightText text={shortContent} query={searchQuery} />
                    </p>
                  )}
                  {isKeyboard && buttonObjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {buttonObjects.map((btn) => (
                        <span
                          key={btn.id}
                          className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-xs opacity-80 truncate max-w-[80px] cursor-pointer hover:opacity-100"
                          title={btn.text}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNodeFocus && btn.id) {
                              onNodeFocus(node.id, btn.id);
                            }
                          }}
                        >
                          <HighlightText text={btn.text} query={searchQuery} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Кнопка центрирования на узле (всегда видна для мобильных устройств) */}
                <button
                  className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/15 dark:hover:bg-primary/25 flex items-center justify-center transition-all duration-200 hover:shadow-md hover:shadow-primary/20"
                  title="Центрировать на узле"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNodeFocus && node.id) onNodeFocus(node.id);
                  }}
                >
                  <i className="fas fa-crosshairs text-xs" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Компонент карточки проекта
 * Отображает информацию о проекте, метаданные и список листов
 * Поддерживает drag-and-drop для проектов и листов
 * Поддерживает inline редактирование имени листа
 * @param props - Свойства компонента ProjectCardProps
 * @returns JSX элемент карточки проекта
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  currentProjectId,
  activeSheetId,
  onProjectSelect,
  onProjectDelete,
  onProjectDuplicate,
  onSheetSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSheetRename,
  onSheetDuplicate,
  onSheetDelete,
  dragState,
  onProjectDragStart,
  onProjectDragEnd,
  onProjectClick,
  onProjectDragOver,
  onProjectDragLeave,
  onProjectDrop,
  onSheetDragStart,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSheetDragOver,
  onSheetDragLeave,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSheetDrop,
  editingState,
  onStartEditingSheet,
  onSaveSheetName,
  onCancelEditSheetName,
  onEditingSheetNameChange,
  projectEditingState,
  onStartEditingProject,
  onSaveProjectName,
  onCancelEditProjectName,
  onEditingProjectNameChange,
  allProjects = [],
  onMoveSheetToProject,
  onSheetReorder,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onNodeFocus,
  onBulkMoveNodes,
  isArchivedView = false,
  onArchiveProject,
  onUnarchiveProject,
  isArchivePending = false,
}) => {
  // Используем пропсы для совместимости интерфейса
  // onSheetRename вызывается через onSaveSheetName в родительском компоненте
  // onSheetDragOver и onSheetDrop обрабатываются на уровне листа
  void onSheetRename;
  void onSheetDragOver;
  void onSheetDrop;

  const [dragOverSheetIndex, setDragOverSheetIndex] = useState<number | null>(null);
  const [draggingSheetIndex, setDraggingSheetIndex] = useState<number | null>(null);
  const dragSheetIndexRef = useRef<number | null>(null);
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());
  const { getSheetQuery, setSheetQuery } = useSheetSearchState();
  /** Глобальный поисковый запрос по всем листам */
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  /** Показывать ли диалог подтверждения удаления */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleSheetExpanded = (sheetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasExpanded = expandedSheets.has(sheetId);
    setExpandedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(sheetId)) {
        next.delete(sheetId);
      } else {
        next.add(sheetId);
      }
      return next;
    });
    // При сворачивании — прокрутить к заголовку листа
    if (wasExpanded) {
      const btn = (e.currentTarget as HTMLElement).closest('[data-sheet-id]');
      if (btn) {
        setTimeout(() => btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      }
    }
  };

  const sheetsInfo = getSheetsInfo(project);
  const nodeCount = getNodeCount(project);
  const projectData = project.data as any;

  /**
   * Обработчик начала редактирования имени проекта
   */
  const handleEditProject = (projectId: number, name: string) => {
    if (onStartEditingProject) {
      onStartEditingProject(projectId, name);
    }
  };

  /**
   * Обработчик двойного клика для редактирования имени проекта
   */
  const handleProjectDoubleClick = () => {
    if (onStartEditingProject) {
      handleEditProject(project.id, project.name);
    }
  };

  /**
   * Обработчик клика по карточке проекта
   * Вызывает колбэк выбора проекта и сбрасывает drag-состояние
   */
  const handleCardClick = () => {
    if (onProjectClick) {
      onProjectClick();
    }
    if (onProjectSelect) {
      onProjectSelect(project.id);
    }
  };

  /**
   * Обработчик удаления проекта
   * Открывает диалог подтверждения удаления
   * @param e - Событие клика
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  /**
   * Обработчик выбора листа
   * @param sheetId - Идентификатор листа
   */
  const handleSheetClick = (sheetId: string) => {
    if (currentProjectId !== project.id && onProjectSelect) {
      onProjectSelect(project.id, sheetId);
      return;
    }
    if (onSheetSelect) {
      onSheetSelect(sheetId);
    }
  };

  /**
   * Обработчик начала редактирования имени листа
   * @param sheetId - Идентификатор листа
   * @param name - Текущее имя листа
   */
  const handleEditSheet = (sheetId: string, name: string) => {
    onStartEditingSheet(sheetId, name);
  };

  /**
   * Обработчик дублирования листа
   * @param e - Событие клика
   * @param sheetId - Идентификатор листа
   */
  const handleDuplicateSheet = (e: React.MouseEvent, sheetId: string) => {
    e.stopPropagation();
    if (onSheetDuplicate) {
      onSheetDuplicate(sheetId);
    }
  };

  /**
   * Обработчик удаления листа
   * @param e - Событие клика
   * @param sheetId - Идентификатор листа
   */
  const handleDeleteSheet = (e: React.MouseEvent, sheetId: string) => {
    e.stopPropagation();
    if (onSheetDelete) {
      onSheetDelete(sheetId);
    }
  };

  /**
   * Обработчик перемещения листа в другой проект
   * @param targetProjectId - Идентификатор целевого проекта
   * @param sheetId - Идентификатор перемещаемого листа
   */
  const handleMoveSheet = async (targetProjectId: number, sheetId: string) => {
    if (onMoveSheetToProject) {
      onMoveSheetToProject(project.id, targetProjectId, sheetId);
    }
  };

  /**
   * Обработчик начала перетаскивания проекта
   * Разрешает drag-and-drop, но не мешает выделению текста
   */
  const handleProjectDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;

    // Запрещаем drag-and-drop для элементов ввода текста
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
      e.preventDefault();
      return;
    }

    // Вызываем родительский обработчик (он установит dataTransfer и draggedProject)
    onProjectDragStart(e);
  };

  // Реф для хранения элемента карточки
  const cardRef = useRef<HTMLDivElement>(null);

  // Регистрируем обработчики touch событий напрямую для поддержки тестов
  // В тестах fireEvent с кастомными событиями не всегда корректно работает с React обработчиками
  useEffect(() => {
    const element = cardRef.current;
    if (!element || !onTouchStart || !onTouchMove || !onTouchEnd) return;

    // Обработчики для кастомных событий (используются в тестах)
    const handleCustomTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const reactEvent = touchEvent as unknown as React.TouchEvent;
      onTouchStart(reactEvent);
    };

    const handleCustomTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const reactEvent = touchEvent as unknown as React.TouchEvent;
      onTouchMove(reactEvent);
    };

    const handleCustomTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      const reactEvent = touchEvent as unknown as React.TouchEvent;
      onTouchEnd(reactEvent);
    };

    // Регистрируем обработчики для touch событий
    element.addEventListener('touchstart', handleCustomTouchStart, { passive: true });
    element.addEventListener('touchmove', handleCustomTouchMove, { passive: false });
    element.addEventListener('touchend', handleCustomTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleCustomTouchStart);
      element.removeEventListener('touchmove', handleCustomTouchMove);
      element.removeEventListener('touchend', handleCustomTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const underlineSelection = useEditorAppearance('underlineTabs');
  const isEditingName = projectEditingState?.editingProjectId === project.id;

  return (
    <div
      ref={cardRef}
      draggable={!isEditingName}
      data-project-id={project.id}
      onDragStart={handleProjectDragStart}
      onDragEnd={(e) => {
        onProjectDragEnd?.(e);
      }}
      onDragOver={(e) => {
        // Если тащим лист внутри этой карточки — не перехватываем
        if (dragSheetIndexRef.current !== null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onProjectDragOver(e);
      }}
      onDragLeave={onProjectDragLeave}
      onDrop={(e) => {
        if (dragSheetIndexRef.current !== null) return;
        onProjectDrop(e);
      }}
      onClick={handleCardClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={cn(
        'group rounded-md border p-2 cursor-pointer transition-colors',
        isActive
          ? 'bg-background border-border'
          : 'bg-background border-border hover:border-foreground/30',
        dragState.dragOverProject === project.id || dragState.dragOverSheet === `project-${project.id}`
          ? 'ring-2 ring-ring'
          : '',
        dragState.draggedProject?.id === project.id ? 'opacity-50 scale-95' : ''
      )}
    >
      {/* Заголовок проекта */}
      <div className="flex flex-wrap gap-1 mb-1 items-center">
        <div
          data-grip="true"
          className="hidden xs:flex cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 flex-shrink-0 mt-0.5"
        >
          <GripVertical className="h-4 xs:h-4.5 w-4 xs:w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          {projectEditingState?.editingProjectId === project.id ? (
            <Input
              value={projectEditingState.editingProjectName}
              onChange={(e) => onEditingProjectNameChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveProjectName?.();
                } else if (e.key === 'Escape') {
                  onCancelEditProjectName?.();
                }
              }}
              onBlur={() => onSaveProjectName?.()}
              autoFocus
              className="text-xs xs:text-sm sm:text-base px-1.5 py-0.5 h-auto font-bold"
            />
          ) : (
            <h4
              className={cn("text-sm font-semibold text-foreground break-words leading-tight line-clamp-2", isActive && (underlineSelection ? "underline decoration-2 underline-offset-4" : "text-primary"))}
              onDoubleClick={handleProjectDoubleClick}
              title="Двойной клик для редактирования названия"
            >
              {project.name}
            </h4>
          )}
          {project.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 break-words line-clamp-1 xs:line-clamp-2 leading-relaxed mt-1">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {(onArchiveProject || onUnarchiveProject) && (
            <ProjectCardArchiveButton
              isArchivedView={isArchivedView}
              disabled={isArchivePending}
              onArchive={() => onArchiveProject?.(project.id)}
              onUnarchive={() => onUnarchiveProject?.(project.id)}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onProjectDuplicate?.(project.id);
            }}
            className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 opacity-75 hover:opacity-100 focus-visible:opacity-100 transition-colors hover:bg-blue-500/20 rounded-md flex-shrink-0"
            title="Дублировать проект"
          >
            <Copy className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 opacity-75 hover:opacity-100 focus-visible:opacity-100 transition-colors hover:bg-red-500/20 rounded-md flex-shrink-0"
            title="Удалить проект"
          >
            <Trash2 className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
          </Button>
        </div>
      </div>

      {/** Подписанные счётчики помогают прочитать состав проекта. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          Блоки
          <span className="text-xs">{nodeCount}</span>
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          Листы
          <span className="text-xs">{sheetsInfo.count}</span>
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{formatDate(project.updatedAt).split(',')[0]}</span>
        </span>
      </div>

      {/* Глобальный поиск узлов по всем листам */}
      {sheetsInfo.names.length > 0 && (
        <div className="relative mb-2" onClick={(e) => e.stopPropagation()}>
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Поиск узлов..."
            className="h-7 text-xs pl-7 pr-2 py-0"
          />
        </div>
      )}

      {/* Список листов */}
      {sheetsInfo.names.length > 0 && (
        <div className="space-y-0.5 sm:space-y-1">
          {sheetsInfo.names.map((name: string, index: number) => {
            const sheetId = SheetsManager.isNewFormat(projectData) ? projectData.sheets[index]?.id : null;

            // При активном глобальном поиске — скрываем листы без совпадений
            if (globalSearchQuery.trim()) {
              const sheetNodes: any[] = projectData.sheets?.[index]?.nodes || [];
              const lower = globalSearchQuery.toLowerCase();
              const hasMatch = sheetNodes.some((node: any) => {
                const typeName = getNodeName(node.type).toLowerCase();
                if (typeName.includes(lower)) return true;
                const content = getShortContent(node).toLowerCase();
                if (content.includes(lower)) return true;
                const buttons: string[] = node.data?.buttons?.map((b: any) => b.text || '') ?? [];
                if (buttons.some((text) => text.toLowerCase().includes(lower))) return true;
                return false;
              });
              if (!hasMatch) return null;
            }

            const isActiveSheet = currentProjectId === project.id && sheetId === activeSheetId;
            const isEditing = editingState.editingSheetId !== null && sheetId !== null && editingState.editingSheetId === sheetId;
            const isDraggedSheet = dragState.draggedSheet?.sheetId === sheetId && dragState.draggedSheet?.projectId === project.id;

            return (
              <div key={sheetId || index} className="relative" data-sheet-id={sheetId}>
              <div
                className={cn(
                  'w-full flex items-center justify-between gap-1 px-1 py-1 rounded-md',
                  'sticky top-0 z-10',
                  'bg-background',
                  'hover:bg-muted/40',
                  'transition-colors group/sheet border-t border-border',
                  dragOverSheetIndex === index && draggingSheetIndex !== index
                    ? 'ring-2 ring-zinc-500'
                    : ''
                )}
                onDragOver={(e) => {
                  if (dragSheetIndexRef.current !== null) {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverSheetIndex(index);
                  }
                }}
                onDragLeave={() => setDragOverSheetIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const fromIndex = dragSheetIndexRef.current;
                  if (fromIndex !== null && fromIndex !== index && onSheetReorder) {
                    onSheetReorder(project.id, fromIndex, index);
                  }
                  setDragOverSheetIndex(null);
                  setDraggingSheetIndex(null);
                  dragSheetIndexRef.current = null;
                }}
              >
                {/** Название активного листа выделено насыщенностью текста. */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Кнопка-стрелка аккордеона */}
                  {SheetsManager.isNewFormat(projectData) && sheetId && !isEditing && (
                    <button
                      className="flex-shrink-0 p-1 rounded-md hover:bg-muted/50 transition-colors"
                      onClick={(e) => toggleSheetExpanded(sheetId, e)}
                      title={(expandedSheets.has(sheetId) || globalSearchQuery.trim()) ? 'Свернуть' : 'Развернуть'}
                    >
                      {(expandedSheets.has(sheetId) || globalSearchQuery.trim())
                        ? <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      }
                    </button>
                  )}

                  {isEditing ? (
                    <Input
                      value={editingState.editingSheetName}
                      onChange={(e) => onEditingSheetNameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSaveSheetName();
                        } else if (e.key === 'Escape') {
                          onCancelEditSheetName();
                        }
                      }}
                      onBlur={onSaveSheetName}
                      autoFocus
                      className="text-xs sm:text-sm px-2 py-1 h-7 flex-1 font-medium"
                    />
                  ) : (
                    <div
                      draggable
                      onDragStart={(e) => {
                        if (sheetId) {
                          e.stopPropagation();
                          dragSheetIndexRef.current = index;
                          setDraggingSheetIndex(index);
                          onSheetDragStart(e, sheetId);
                        }
                      }}
                      onDragEnd={(e) => {
                        e.stopPropagation();
                        dragSheetIndexRef.current = null;
                        setDraggingSheetIndex(null);
                        setDragOverSheetIndex(null);
                        onSheetDragLeave();
                      }}
                      className={cn(
                        'truncate cursor-grab active:cursor-grabbing text-sm',
                        isActiveSheet ? (underlineSelection ? 'font-semibold text-foreground underline underline-offset-4' : 'font-semibold text-primary') : 'font-medium text-muted-foreground',
                        isDraggedSheet ? 'opacity-50' : ''
                      )}
                      onClick={() => {
                        if (sheetId) {
                          handleSheetClick(sheetId);
                        }
                      }}
                      onDoubleClick={() => {
                        if (sheetId) {
                          handleEditSheet(sheetId, name);
                        }
                      }}
                      title={name}
                    >
                      {name || 'Без названия'}
                    </div>
                  )}

                  {/* Счётчик узлов */}
                  {SheetsManager.isNewFormat(projectData) && (
                    <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {projectData.sheets[index]?.nodes?.length ?? 0}
                    </span>
                  )}
                </div>

                {/* Правая часть: кнопки управления */}
                {currentProjectId === project.id && !isEditing && sheetId && (
                  <div className="flex gap-0.5 sm:gap-1 opacity-0 group-hover/sheet:opacity-100 group-focus-within/sheet:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded transition-all"
                      onClick={(e) => handleDuplicateSheet(e, sheetId!)}
                      title="Дублировать лист"
                    >
                      <Copy className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    </Button>

                    {allProjects.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded transition-all"
                            title="Переместить в другой проект"
                          >
                            <Share2 className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56" side="top" sideOffset={5}>
                          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Переместить в
                          </div>
                          {allProjects
                            .filter((otherProject) => otherProject.id !== project.id)
                            .map((otherProject) => {
                              const targetInfo = getSheetsInfo(otherProject);
                              const targetNodeCount = getNodeCount(otherProject);
                              return (
                                <DropdownMenuItem
                                  key={otherProject.id}
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleMoveSheet(otherProject.id, sheetId);
                                  }}
                                  className="flex flex-col gap-1.5 cursor-pointer py-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-sm truncate">{otherProject.name}</span>
                                    {otherProject.ownerId === null && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium flex-shrink-0">
                                        👥
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs bg-blue-500/10 dark:bg-blue-600/15 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                                      <Zap className="h-2.5 w-2.5" />
                                      {targetNodeCount}
                                    </span>
                                    <span className="text-xs bg-purple-500/10 dark:bg-purple-600/15 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                                      <FileText className="h-2.5 w-2.5" />
                                      {targetInfo.count}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {sheetsInfo.count > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 sm:h-6 w-5 sm:w-6 p-0 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded transition-all"
                        onClick={(e) => handleDeleteSheet(e, sheetId)}
                        title="Удалить лист"
                      >
                        <Trash2 className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Аккордеон: поиск и список узлов листа */}
              {SheetsManager.isNewFormat(projectData) && sheetId && (expandedSheets.has(sheetId) || globalSearchQuery.trim()) && (
                <SheetAccordionContent
                  nodes={projectData.sheets[index]?.nodes || []}
                  searchQuery={globalSearchQuery.trim() ? globalSearchQuery : getSheetQuery(sheetId)}
                  onSearchChange={(q) => setSheetQuery(sheetId, q)}
                  onNodeFocus={onNodeFocus}
                  hideSearch={sheetsInfo.count === 1 || !!globalSearchQuery.trim()}
                  availableSheets={
                    SheetsManager.isNewFormat(projectData)
                      ? projectData.sheets
                          .filter((s: any) => s.id !== sheetId)
                          .map((s: any) => ({ id: s.id, name: s.name }))
                      : []
                  }
                  onBulkMoveNodes={
                    onBulkMoveNodes
                      ? (nodeIds, targetSheetId) => onBulkMoveNodes(sheetId, nodeIds, targetSheetId)
                      : undefined
                  }
                />
              )}
              </div>
            );
          })}
        </div>
      )}

      {/* Диалог подтверждения удаления проекта */}
      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectName={project.name}
        projectData={projectData}
        onDelete={() => onProjectDelete(project.id)}
      />
    </div>
  );
};
