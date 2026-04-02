/**
 * @fileoverview Компонент статистики кода
 * Отображает количество строк, функций, классов и ключей JSON
 */

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CodeFormat } from '../hooks/use-code-generator';

/**
 * Свойства компонента статистики кода
 */
interface CodeStatsProps {
  /** Содержимое кода */
  content: string;
  /** Выбранный формат */
  selectedFormat: CodeFormat;
  /** Состояние загрузки */
  isLoading: boolean;
  /** Состояние сворачивания блоков */
  collapseState: boolean;
  /** Колбэк переключения сворачивания */
  onToggleCollapse: () => void;
  /** Колбэк показа полного кода */
  onShowFullCode?: () => void;
}

/**
 * Вычисляет статистику кода
 * @param content - Содержимое кода
 * @param format - Формат кода
 * @returns Объект со статистикой
 */
function computeStats(content: string, format: CodeFormat) {
  if (!content || content.trim() === '' || content.startsWith('# Ошибка')) {
    return { totalLines: 0, truncated: false, functions: 0, classes: 0 };
  }
  const lines = content.split(/\r?\n/);
  return {
    totalLines: lines.length,
    truncated: false,
    functions: format === 'python' ? (content.match(/^def |^async def /gm) || []).length : 0,
    classes: format === 'python' ? (content.match(/^class /gm) || []).length : 0,
  };
}

/**
 * Компонент статистики кода
 * @param props - Свойства компонента
 * @returns JSX элемент статистики
 */
export function CodeStats({ content, selectedFormat, isLoading, collapseState, onToggleCollapse, onShowFullCode }: CodeStatsProps) {
  const stats = computeStats(content, selectedFormat);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted/30 rounded-md border border-border/50">
        <i className="fas fa-spinner fa-spin text-sm"></i>
        <span className="text-sm">Генерация кода...</span>
      </div>
    );
  }

  if (!content || content.trim() === '') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted/30 rounded-md border border-border/50">
        <i className="fas fa-info-circle text-sm"></i>
        <span className="text-sm">Нажмите на вкладку формата для загрузки кода</span>
      </div>
    );
  }

  if (content.startsWith('# Ошибка')) {
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800/40">
        <i className="fas fa-exclamation-triangle text-sm"></i>
        <span className="text-sm">Ошибка генерации кода</span>
      </div>
    );
  }

  return (
    <>
      {stats.totalLines > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-blue-50/50 dark:bg-blue-900/25 border border-blue-200/50 dark:border-blue-800/50 rounded-md p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{stats.totalLines}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">Строк</div>
          </div>
          {selectedFormat === 'python' && stats.functions > 0 && (
            <div className="bg-green-50/50 dark:bg-green-900/25 border border-green-200/50 dark:border-green-800/50 rounded-md p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">{stats.functions}</div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">Функции</div>
            </div>
          )}
          {selectedFormat === 'python' && stats.classes > 0 && (
            <div className="bg-purple-50/50 dark:bg-purple-900/25 border border-purple-200/50 dark:border-purple-800/50 rounded-md p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">{stats.classes}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">Классы</div>
            </div>
          )}
          {selectedFormat === 'json' && (
            <div className="bg-cyan-50/50 dark:bg-cyan-900/25 border border-cyan-200/50 dark:border-cyan-800/50 rounded-md p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-xl font-bold text-cyan-600 dark:text-cyan-400">{(content.match(/"/g) || []).length / 2}</div>
              <div className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">Ключей</div>
            </div>
          )}
        </div>
      )}

      <Separator className="my-2 xs:my-3" />

      {stats.totalLines > 0 && (
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 text-xs xs:text-sm">
          <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
            <span className="text-muted-foreground whitespace-nowrap">Размер: {Math.round(content.length / 1024)} KB</span>
            {(selectedFormat === 'python' || selectedFormat === 'json') && (
              <Button size="sm" variant="ghost" onClick={onToggleCollapse} className="h-7 xs:h-8 px-1.5 xs:px-2 text-xs" data-testid="button-toggle-all-functions">
                <i className={`fas ${collapseState ? 'fa-expand' : 'fa-compress'} text-xs`}></i>
                <span className="hidden xs:inline ml-1">{collapseState ? 'Развернуть' : 'Свернуть'}</span>
              </Button>
            )}
          </div>
          {stats.truncated && onShowFullCode && (
            <Button size="sm" variant="outline" onClick={onShowFullCode} className="h-7 xs:h-8 px-2 text-xs xs:text-sm whitespace-nowrap" data-testid="button-show-full-code">
              Показать всё ({stats.totalLines})
            </Button>
          )}
        </div>
      )}
    </>
  );
}
