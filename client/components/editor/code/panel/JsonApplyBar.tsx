/**
 * @fileoverview Панель применения изменений JSON
 * Отображается при наличии несохранённых изменений в JSON-редакторе
 */

import { Button } from '@/components/ui/button';

/**
 * Свойства компонента панели применения JSON
 */
interface JsonApplyBarProps {
  /** Есть ли несохранённые изменения */
  isDirty: boolean;
  /** Текст ошибки валидации (если есть) */
  error: string | null;
  /** Колбэк применения изменений */
  onApply: () => void;
  /** Колбэк сброса изменений */
  onReset: () => void;
}

/**
 * Панель применения изменений JSON
 * Показывает статус изменений, кнопки применения/сброса и ошибки валидации
 * @param props - Свойства компонента
 * @returns JSX элемент панели или null если нет изменений
 */
export function JsonApplyBar({ isDirty, error, onApply, onReset }: JsonApplyBarProps) {
  if (!isDirty && !error) return null;

  /** Определяет CSS классы фона в зависимости от состояния */
  const bgClass = error
    ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700'
    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700';

  return (
    <div className={`rounded-md border px-3 py-2 space-y-1.5 ${bgClass}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm">
          {error ? (
            <i className="fas fa-exclamation-circle text-red-500 text-xs" />
          ) : (
            <i className="fas fa-pencil-alt text-amber-500 text-xs" />
          )}
          <span className={error ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}>
            {error ? 'Невалидный JSON' : 'Есть несохранённые изменения'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="h-7 px-2 text-xs"
            data-testid="button-json-reset"
          >
            Сбросить
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            disabled={!!error}
            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            data-testid="button-json-apply"
          >
            Применить
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">{error}</p>
      )}
    </div>
  );
}
