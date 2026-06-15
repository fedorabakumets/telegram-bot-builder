/**
 * @fileoverview Выпадающее меню "В проект" для переноса узлов в другой проект
 * @module canvas/multi-selection-project-menu
 */

import { useState, useRef, useEffect } from 'react';

/**
 * Свойства выпадающего меню выбора проекта
 */
interface MultiSelectionProjectMenuProps {
  /** Список других проектов (без текущего) */
  projects: Array<{ id: number; name: string; ownerId: number | null }>;
  /** Колбэк переноса в выбранный проект */
  onMoveToProject: (targetProjectId: number) => void;
}

/**
 * Выпадающее меню со списком других проектов. Перенос выделенных узлов
 * выполняется в новый лист выбранного проекта. Общие проекты (ownerId === null)
 * помечаются значком 👥.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки с выпадающим списком проектов
 */
export function MultiSelectionProjectMenu({ projects, onMoveToProject }: MultiSelectionProjectMenuProps) {
  /** Открыто ли меню */
  const [open, setOpen] = useState(false);
  /** Ref контейнера для закрытия по клику вне */
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрываем меню при клике вне компонента
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="h-8 px-3 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        title="Перенести выделенные узлы в другой проект (в новый лист)"
      >
        <i className="fas fa-diagram-project text-xs" />
        В проект
        <i className="fas fa-caret-down text-[10px]" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 min-w-44 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl py-1 z-50">
          {projects.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">Нет других проектов</div>
          )}
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => { onMoveToProject(project.id); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors truncate flex items-center gap-1.5"
            >
              {project.ownerId === null && <span title="Общий проект">👥</span>}
              <span className="truncate">{project.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
