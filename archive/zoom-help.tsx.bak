/**
 * @fileoverview Компонент справки по управлению масштабом холста
 * 
 * Содержит Popover с информацией о горячих клавишах
 * для управления масштабом и панорамированием.
 */

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Компонент кнопки справки по управлению масштабом
 * 
 * @returns JSX элемент кнопки с Popover справки
 */
export function ZoomHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center">
          <i className="fas fa-question-circle text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-500 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="w-64 p-3">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Управление масштабом</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Увеличить:</span>
              <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + +</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Уменьшить:</span>
              <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + -</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Сбросить:</span>
              <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + 0</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Уместить всё:</span>
              <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + 1</code>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Масштабирование:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + колесо</code>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600 dark:text-gray-400">Панорамирование:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Alt + ЛКМ</code>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
