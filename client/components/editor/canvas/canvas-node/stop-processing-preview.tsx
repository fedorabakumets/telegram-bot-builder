/**
 * @fileoverview Превью узла stop_processing на холсте
 * @module components/editor/canvas/canvas-node/stop-processing-preview
 */

/**
 * Компактная карточка «Стоп обработки»: флаг без настраиваемых полей.
 * @returns JSX элемент
 */
export function StopProcessingPreview() {
  return (
    <div className="px-3 py-2 text-xs space-y-1">
      <div className="flex items-center gap-1.5">
        <i className="fas fa-hand-paper text-red-500 text-[10px]" />
        <span className="font-semibold text-red-700 dark:text-red-300 text-[11px]">
          Стоп обработки
        </span>
      </div>
      <div className="font-mono text-[10px] text-red-600/80 dark:text-red-300/80 truncate">
        _stop_processing
      </div>
    </div>
  );
}
