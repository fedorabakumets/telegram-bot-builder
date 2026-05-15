/**
 * @fileoverview Превью узла Loop (цикл по массиву) на холсте
 *
 * Компактное отображение: источник → элемент, индекс, флаги.
 *
 * @module components/editor/canvas/canvas-node/loop-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента LoopPreview */
interface LoopPreviewProps {
  /** Узел типа loop */
  node: Node;
}

/**
 * Превью узла цикла на холсте
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function LoopPreview({ node }: LoopPreviewProps) {
  const data = node.data as any;
  const source: string = data?.sourceVariable || '';
  const item: string = data?.itemVariable || 'item';
  const index: string = data?.indexVariable || 'index';
  const parallel: boolean = data?.parallel || false;
  const maxIterations: number = data?.maxIterations || 0;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Заголовок */}
      <div className="flex items-center gap-1.5">
        <span className="text-violet-500 dark:text-violet-400 text-sm">🔄</span>
        <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
          Цикл
        </span>
        {parallel && (
          <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1 py-0.5 rounded">
            ⚡ parallel
          </span>
        )}
      </div>

      {/* Источник → элемент */}
      {source ? (
        <div className="flex items-center gap-1 text-xs">
          <code className="bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">
            {source}
          </code>
          <span className="text-slate-500">→</span>
          <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[60px]">
            {item}
          </code>
        </div>
      ) : (
        <span className="text-xs text-slate-400 italic">Источник не указан</span>
      )}

      {/* Индекс и лимит */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <span>индекс: <code className="text-slate-400">{index}</code></span>
        {maxIterations > 0 && (
          <span>макс: {maxIterations}</span>
        )}
      </div>
    </div>
  );
}
