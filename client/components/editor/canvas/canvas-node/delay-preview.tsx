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
 * Компонент превью ноды задержки на холсте.
 * Показывает время и режим.
 */
export function DelayPreview({ data }: DelayPreviewProps) {
  const seconds = data?.seconds || '3';
  const mode = data?.mode || 'blocking';
  const modeLabel = mode === 'background' ? '🚀 фоновый' : '⏸ пауза';

  return (
    <div className="px-2 py-1 text-xs">
      <div className="font-medium text-amber-700 dark:text-amber-300">⏱ {seconds}с</div>
      <div className="text-gray-500 dark:text-gray-400 text-[10px]">{modeLabel}</div>
    </div>
  );
}
