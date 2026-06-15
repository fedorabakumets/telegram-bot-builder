/**
 * @fileoverview Выпадающее меню "В лист" для группового перемещения узлов
 * @module canvas/multi-selection-sheet-menu
 */

import { useState, useRef, useEffect } from 'react';

/**
 * Свойства выпадающего меню выбора листа
 */
interface MultiSelectionSheetMenuProps {
  /** Список листов проекта (без активного) */
  sheets: Array<{ id: string; name: string }>;
  /** Колбэк перемещения в существующий лист */
  onMoveToSheet: (sheetId: string) => void;
  /** Колбэк перемещения в новый лист */
  onMoveToNewSheet: () => void;
}

/**
 * Выпадающее меню со списком листов и пунктом создания нового листа.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки с выпадающим списком
 */
export function MultiSelectionSheetMenu({ sheets, onMoveToSheet, onMoveToNewSheet }: MultiSelectionSheetMenuProps) {
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
        title="Переместить выделенные узлы в другой лист"
      >
        <i className="fas fa-file-export text-xs" />
        В лист
        <i className="fas fa-caret-down text-[10px]" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 min-w-44 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl py-1 z-50">
          {sheets.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">Нет других листов</div>
          )}
          {sheets.map(sheet => (
            <button
              key={sheet.id}
              onClick={() => { onMoveToSheet(sheet.id); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors truncate"
            >
              {sheet.name}
            </button>
          ))}
          <div className="my-1 h-px bg-slate-200 dark:bg-slate-600" />
          <button
            onClick={() => { onMoveToNewSheet(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
          >
            <i className="fas fa-plus text-[10px]" />
            Создать новый лист
          </button>
        </div>
      )}
    </div>
  );
}
