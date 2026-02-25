/**
 * @fileoverview Компонент справки по горячим клавишам редактора
 *
 * Содержит Popover с информацией обо всех горячих клавишах
 * для работы с холстом редактора бота.
 */

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Компонент кнопки справки по горячим клавишам
 *
 * @returns JSX элемент кнопки с Popover справки
 */
export function KeyboardShortcutsHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 group flex items-center justify-center">
          <i className="fas fa-keyboard text-slate-600 dark:text-slate-400 text-sm group-hover:text-blue-500 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" className="w-72 p-3 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Масштаб</h4>
            <div className="space-y-1.5 text-xs">
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
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
            <h4 className="font-medium text-sm mb-2">Редактирование</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Удалить узел:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Delete</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Дублировать:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + C / D</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Копировать (буфер):</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + Shift + C</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Вставить (буфер):</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + V</code>
              </div>
              <div className="flex justify-center text-gray-500 dark:text-gray-500 text-xs italic">
                Работают и русские клавиши: С, М, В
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
            <h4 className="font-medium text-sm mb-2">История</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Отменить:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + Z</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Повторить:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + Y / Shift + Z</code>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
            <h4 className="font-medium text-sm mb-2">Навигация</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Масштаб:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + колесо</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Панорамирование:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Alt + ЛКМ</code>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
            <h4 className="font-medium text-sm mb-2">Файл</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Сохранить:</span>
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + S</code>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
