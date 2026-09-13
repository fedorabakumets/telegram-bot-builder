/**
 * @fileoverview Превью узла rate_counter на холсте
 * @module components/editor/canvas/canvas-node/rate-counter-preview
 */

/** Пропсы превью счётчика частоты */
interface RateCounterPreviewProps {
  /** Данные узла */
  data: Record<string, unknown>;
}

/**
 * Компактная карточка счётчика: ключ, окно и переменная результата.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function RateCounterPreview({ data }: RateCounterPreviewProps) {
  const counterKey = String(data?.counterKey ?? '').trim();
  const windowSeconds = String(data?.windowSeconds ?? '60').trim() || '60';
  const saveResultTo = String(data?.saveResultTo ?? 'rate_count').trim() || 'rate_count';

  return (
    <div className="px-3 py-2 text-xs space-y-1">
      <div className="flex items-center gap-1.5">
        <i className="fas fa-chart-line text-sky-500 text-[10px]" />
        <span className="font-semibold text-sky-700 dark:text-sky-300 text-[11px]">
          Счётчик частоты
        </span>
      </div>
      <div className="font-mono text-[10px] text-sky-700 dark:text-sky-300 truncate">
        {counterKey || 'без ключа'}
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-[10px] truncate">
        {windowSeconds}с → {saveResultTo}
      </div>
    </div>
  );
}
