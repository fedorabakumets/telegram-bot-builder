/**
 * @fileoverview Кнопка поиска узлов в панели инструментов холста
 *
 * Открывает Popover с полем ввода и списком найденных узлов текущего
 * листа. Клик по результату центрирует холст на выбранном узле.
 * Поддерживает управляемое состояние открытия (для горячей клавиши Ctrl+F).
 */

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSheetNodeSearch } from '@/components/editor/sidebar/hooks/use-sheet-node-search';
import { NodeSearchResultItem } from './node-search-result-item';

/**
 * Свойства компонента кнопки поиска узлов
 */
interface NodeSearchButtonProps {
  /** Массив узлов текущего листа */
  nodes: any[];
  /** Колбэк центрирования холста на узле */
  onNodeFocus: (nodeId: string) => void;
  /** Управляемое состояние открытия (для Ctrl+F) */
  open?: boolean;
  /** Колбэк изменения состояния открытия */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Кнопка поиска узлов с выпадающим списком результатов
 *
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки поиска
 */
export function NodeSearchButton({ nodes, onNodeFocus, open, onOpenChange }: NodeSearchButtonProps) {
  const [query, setQuery] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : internalOpen;
  const results = useSheetNodeSearch(nodes, query);

  /**
   * Меняет состояние открытия (с учётом управляемого режима)
   * @param value - Новое состояние открытия
   */
  function setOpen(value: boolean) {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  }

  /**
   * Обрабатывает выбор узла: центрирует холст и закрывает Popover
   * @param nodeId - Идентификатор выбранного узла
   */
  function handleSelect(nodeId: string) {
    onNodeFocus(nodeId);
    setOpen(false);
  }

  return (
    <Popover open={actualOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center"
          title="Поиск узлов (Ctrl + F)"
        >
          <i className="fas fa-search text-slate-600 dark:text-slate-400 text-sm group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        className="w-80 p-0 overflow-hidden"
        style={{ maxHeight: '420px', display: 'flex', flexDirection: 'column' }}
      >
        {/* Поле ввода */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <i className="fas fa-search text-slate-400 dark:text-slate-500 text-xs" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск узлов..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Список результатов */}
        <div className="overflow-y-auto flex-1 py-1">
          {results.length > 0 ? (
            results.map((node) => (
              <NodeSearchResultItem
                key={node.id}
                node={node}
                query={query}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 px-4">
              <i className="fas fa-search text-slate-300 dark:text-slate-600 text-2xl" />
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                {query.trim() ? 'Ничего не найдено' : 'Введите запрос для поиска узлов'}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
