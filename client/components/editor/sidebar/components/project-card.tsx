/**
 * @fileoverview Компонент карточки проекта для sidebar
 * Отображает информацию о проекте с поддержкой drag-and-drop и управления листами
 * @module components/editor/sidebar/components/project-card
 */

import React, { useEffect, useRef, useState } from 'react';
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
  Box,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  GitBranch,
  GripVertical,
  Image,
  LayoutGrid,
  MessageSquare,
  Radio,
  Save,
  Share2,
  Trash2,
  Zap,
} from 'lucide-react';
import { getNodeTypeLabel } from '@/components/editor/properties/utils/node-formatters';
import { SheetNodeSearch } from './sheet-node-search';
import { useSheetNodeSearch } from '../hooks/use-sheet-node-search';
import { useSheetSearchState } from '../hooks/use-sheet-search-state';

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
  onProjectSelect?: (projectId: number) => void;
  /** Обработчик удаления проекта */
  onProjectDelete: (projectId: number) => void;
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
}

/**
 * Иконка для типа узла
 */
function NodeTypeIcon({ type }: { type: string }) {
  const cls = 'h-3 w-3 flex-shrink-0';
  if (type === 'command_trigger' || type === 'text_trigger') return <Zap className={cls} />;
  if (type === 'message') return <MessageSquare className={cls} />;
  if (type === 'keyboard') return <LayoutGrid className={cls} />;
  if (type === 'condition') return <GitBranch className={cls} />;
  if (type === 'input') return <Save className={cls} />;
  if (type === 'broadcast') return <Radio className={cls} />;
  if (['media', 'photo', 'video', 'audio', 'document'].includes(type)) return <Image className={cls} />;
  return <Box className={cls} />;
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
 * Извлекает список кнопок из узла клавиатуры
 * @param node - Узел проекта
 * @returns Массив текстов кнопок
 */
function getKeyboardButtons(node: any): string[] {
  const buttons = node.data?.buttons;
  if (!Array.isArray(buttons)) return [];
  return buttons.map((b: any) => b.text || '').filter(Boolean);
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
}

/**
 * Содержимое раскрытого аккордеона листа: поиск + список узлов
 * @param props - Свойства компонента SheetAccordionContentProps
 * @returns JSX элемент содержимого аккордеона
 */
function SheetAccordionContent({ nodes, searchQuery, onSearchChange }: SheetAccordionContentProps) {
  const filtered = useSheetNodeSearch(nodes, searchQuery);

  return (
    <div className="ml-5 mt-0.5 mb-1 transition-all">
      <SheetNodeSearch value={searchQuery} onChange={onSearchChange} />
      {filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground opacity-60 px-1.5">
          {nodes.length === 0 ? 'Нет узлов' : 'Не найдено'}
        </div>
      ) : (
        <div className="space-y-0.5">
          {filtered.map((node: any) => {
            const shortContent = getShortContent(node);
            const isKeyboard = node.type === 'keyboard';
            const buttons = isKeyboard ? getKeyboardButtons(node) : [];
            return (
              <div key={node.id} className="px-1.5 py-0.5 rounded text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <NodeTypeIcon type={node.type} />
                  <span className="font-medium flex-shrink-0">
                    {node.type === 'keyboard'
                      ? node.data?.keyboardType === 'reply' ? 'Reply кнопки' : 'Inline кнопки'
                      : getNodeTypeLabel(node.type)}
                  </span>
                  {shortContent && (
                    <span className="truncate opacity-70">
                      {shortContent.length > 30 ? shortContent.slice(0, 30) + '…' : shortContent}
                    </span>
                  )}
                </div>
                {isKeyboard && buttons.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 ml-4">
                    {buttons.map((text, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-xs opacity-80 truncate max-w-[80px]"
                        title={text}
                      >
                        {text}
                      </span>
                    ))}
                  </div>
                )}
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

  const toggleSheetExpanded = (sheetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(sheetId)) {
        next.delete(sheetId);
      } else {
        next.add(sheetId);
      }
      return next;
    });
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
   * Предотвращает всплытие события
   * @param e - Событие клика
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onProjectDelete(project.id);
  };

  /**
   * Обработчик выбора листа
   * @param sheetId - Идентификатор листа
   */
  const handleSheetClick = (sheetId: string) => {
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
        'group p-2.5 xs:p-3 sm:p-4 rounded-lg xs:rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 border backdrop-blur-sm overflow-hidden',
        isActive
          ? 'bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-600/15 dark:from-blue-600/30 dark:via-blue-500/20 dark:to-cyan-600/25 border-blue-500/50 dark:border-blue-400/50 shadow-lg shadow-blue-500/25'
          : 'bg-gradient-to-br from-slate-50/60 to-slate-100/40 dark:from-slate-900/50 dark:to-slate-800/40 border-slate-200/40 dark:border-slate-700/40 hover:border-slate-300/60 dark:hover:border-slate-600/60 hover:bg-gradient-to-br hover:from-slate-100/80 hover:to-slate-100/50 dark:hover:from-slate-800/70 dark:hover:to-slate-700/50 hover:shadow-md hover:shadow-slate-500/20',
        dragState.dragOverProject === project.id || dragState.dragOverSheet === `project-${project.id}`
          ? 'border-blue-500 border-2 shadow-xl shadow-blue-500/50 bg-gradient-to-br from-blue-600/25 to-cyan-600/20 dark:from-blue-600/40 dark:to-cyan-600/30'
          : '',
        dragState.draggedProject?.id === project.id ? 'opacity-50 scale-95' : ''
      )}
    >
      {/* Заголовок проекта */}
      <div className="flex gap-1.5 xs:gap-2 sm:gap-3 mb-2.5 xs:mb-3 sm:mb-4 items-start">
        <div
          data-grip="true"
          className="hidden xs:flex cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 flex-shrink-0 mt-0.5"
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
              className="text-xs xs:text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 break-words leading-tight line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
          <span
            className={cn(
              'text-xs px-1.5 xs:px-2 py-0.5 rounded-full whitespace-nowrap font-semibold flex-shrink-0 transition-all',
              project.ownerId === null
                ? 'bg-blue-500/25 text-blue-700 dark:text-blue-300'
                : 'bg-green-500/25 text-green-700 dark:text-green-300'
            )}
          >
            {project.ownerId === null ? '👥' : '👤'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 p-0 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 rounded-md flex-shrink-0"
            title="Удалить проект"
          >
            <Trash2 className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
          </Button>
        </div>
      </div>

      {/* Метаданные проекта */}
      <div className="flex flex-col xs:flex-row gap-1.5 xs:gap-2 text-xs mb-2.5 xs:mb-3 sm:mb-4 flex-wrap">
        <span className="flex items-center gap-1 bg-blue-500/15 dark:bg-blue-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-blue-400/30 dark:border-blue-500/30 font-semibold text-blue-700 dark:text-blue-300 whitespace-nowrap">
          <Zap className="h-3 w-3" />
          <span className="text-xs">{nodeCount}</span>
        </span>
        <span className="flex items-center gap-1 bg-purple-500/15 dark:bg-purple-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-purple-400/30 dark:border-purple-500/30 font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap">
          <FileText className="h-3 w-3" />
          <span className="text-xs">{sheetsInfo.count}</span>
        </span>
        <span className="flex items-center gap-1 bg-slate-500/15 dark:bg-slate-600/20 px-2 xs:px-2.5 py-1 rounded-md border border-slate-400/30 dark:border-slate-500/30 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
          <Calendar className="h-3 w-3" />
          <span className="text-xs">{formatDate(project.updatedAt).split(',')[0]}</span>
        </span>
      </div>

      {/* Список листов */}
      {sheetsInfo.names.length > 0 && (
        <div className="space-y-0.5 sm:space-y-1">
          {sheetsInfo.names.map((name: string, index: number) => {
            const sheetId = SheetsManager.isNewFormat(projectData) ? projectData.sheets[index]?.id : null;
            const isActiveSheet = currentProjectId === project.id && sheetId === activeSheetId;
            const isEditing = editingState.editingSheetId !== null && sheetId !== null && editingState.editingSheetId === sheetId;
            const isDraggedSheet = dragState.draggedSheet?.sheetId === sheetId && dragState.draggedSheet?.projectId === project.id;

            return (
              <div key={sheetId || index}>
              <div
                className={cn(
                  'flex items-center gap-1 sm:gap-1.5 group/sheet px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md hover:bg-muted/50 transition-colors border-t-2',
                  dragOverSheetIndex === index && draggingSheetIndex !== index
                    ? 'border-blue-500'
                    : 'border-transparent'
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
                {/* Кнопка-стрелка аккордеона (только для нового формата) */}
                {SheetsManager.isNewFormat(projectData) && sheetId && !isEditing && (
                  <button
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                    onClick={(e) => toggleSheetExpanded(sheetId, e)}
                    title={expandedSheets.has(sheetId) ? 'Свернуть' : 'Развернуть'}
                  >
                    {expandedSheets.has(sheetId)
                      ? <ChevronDown className="h-3 w-3" />
                      : <ChevronRight className="h-3 w-3" />
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
                    className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-5 sm:h-6 flex-1 font-medium"
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
                      'text-xs px-1.5 sm:px-2 py-0.5 cursor-grab active:cursor-grabbing transition-all flex-1 font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent inline-flex items-center text-center line-clamp-1',
                      isActiveSheet
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/50 text-foreground hover:bg-muted',
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
                    <span className="truncate">{name || 'Без названия'}</span>
                  </div>
                )}

                {/* Кнопки управления листом */}
                {currentProjectId === project.id && !isEditing && sheetId && (
                  <div className="flex gap-0.5 sm:gap-1 opacity-0 group-hover/sheet:opacity-100 transition-opacity flex-shrink-0">
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
              {SheetsManager.isNewFormat(projectData) && sheetId && expandedSheets.has(sheetId) && (
                <SheetAccordionContent
                  nodes={projectData.sheets[index]?.nodes || []}
                  searchQuery={getSheetQuery(sheetId)}
                  onSearchChange={(q) => setSheetQuery(sheetId, q)}
                />
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
