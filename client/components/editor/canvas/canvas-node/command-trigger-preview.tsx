/**
 * @fileoverview Preview-компонент узла триггера команды для холста
 *
 * Показывает команду, deep link (для /start) и переменную аргументов
 * (`saveCommandArgsTo`), если задана.
 * @module components/editor/canvas/canvas-node/command-trigger-preview
 */

import { Node } from '@/types/bot';

/**
 * Пропсы компонента CommandTriggerPreview
 */
interface CommandTriggerPreviewProps {
  /** Узел типа command_trigger */
  node: Node;
}

/**
 * Preview-компонент для узла триггера команды
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью команды на холсте
 */
export function CommandTriggerPreview({ node }: CommandTriggerPreviewProps) {
  /** Команда триггера, например "/start" */
  const command = node.data?.command || '/start';

  /** Параметр deep link, например "ref_" или "promo" */
  const deepLinkParam: string = (node.data as any)?.deepLinkParam || '';

  /** Режим совпадения: точное или по префиксу */
  const matchMode: string = (node.data as any)?.deepLinkMatchMode || 'exact';

  /** Имя переменной для аргументов после команды */
  const saveCommandArgsTo: string =
    typeof (node.data as any)?.saveCommandArgsTo === 'string'
      ? (node.data as any).saveCommandArgsTo.trim()
      : '';

  /** Отображаемый текст параметра с суффиксом для режима startsWith */
  const paramLabel = deepLinkParam
    ? `?start=${deepLinkParam}${matchMode === 'startsWith' ? '…' : ''}`
    : '';

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="font-mono text-sm font-semibold text-yellow-300 truncate">
        {command}
      </span>
      {paramLabel && (
        <span className="font-mono text-xs text-yellow-500/70 dark:text-yellow-400/50 truncate max-w-[160px]">
          {paramLabel}
        </span>
      )}
      {saveCommandArgsTo && (
        <span
          className="inline-flex items-center gap-1 max-w-full rounded-md bg-cyan-500/15 dark:bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-700 dark:text-cyan-300"
          title={`Аргументы → {${saveCommandArgsTo}}`}
        >
          <i className="fas fa-code text-[8px] opacity-70" />
          <span className="truncate">{`{${saveCommandArgsTo}}`}</span>
        </span>
      )}
    </div>
  );
}
