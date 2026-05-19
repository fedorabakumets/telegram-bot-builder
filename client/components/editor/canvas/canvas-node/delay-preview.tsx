/**
 * @fileoverview Превью ноды задержки на холсте
 * @module components/editor/canvas/canvas-node/delay-preview
 */

/** Пропсы компонента превью задержки */
interface DelayPreviewProps {
  /** Данные ноды */
  data: any;
}

/**
 * Форматирует задержку в читаемую строку
 * @param value - Значение
 * @param unit - Единица измерения
 * @returns Человекочитаемое описание
 */
function formatDelay(value: string, unit: string): string {
  const labels: Record<string, string> = {
    seconds: 'сек',
    minutes: 'мин',
    hours: 'ч',
    days: 'дн',
    weeks: 'нед',
  };
  return `${value} ${labels[unit] || 'сек'}`;
}

/**
 * Компонент превью ноды задержки на холсте.
 * Компактный стиль как у schedule_trigger.
 */
export function DelayPreview({ data }: DelayPreviewProps) {
  const value = data?.seconds || '3';
  const unit = data?.unit || 'seconds';
  const mode = data?.mode || 'blocking';
  const modeIcon = mode === 'background' ? '⚡' : '●';
  const modeLabel = mode === 'background' ? 'фоновый' : 'пауза';

  return (
    <div className="px-3 py-2 text-xs space-y-1">
      <div className="flex items-center gap-1.5">
        <i className="fas fa-stopwatch text-amber-500 text-[10px]" />
        <span className="font-semibold text-amber-700 dark:text-amber-300 text-[11px]">Задержка</span>
      </div>
      <div className="font-medium text-amber-700 dark:text-amber-300 truncate">
        {formatDelay(value, unit)}
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-[10px]">
        {modeIcon} {modeLabel}
      </div>
    </div>
  );
}
