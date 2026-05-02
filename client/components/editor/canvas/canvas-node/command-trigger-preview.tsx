/**
 * @fileoverview Preview-компонент узла триггера команды для холста
 *
 * Отображает команду (например /start) и, если задан deepLinkParam,
 * показывает бейдж с параметром deep link под командой.
 * Это позволяет визуально различать несколько узлов /start
 * с разными deep link параметрами прямо на холсте.
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
 * Показывает команду моноширинным шрифтом. Если у узла задан
 * deepLinkParam — отображает бейдж с параметром deep link.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент с отображением команды и опционального deep link параметра
 */
export function CommandTriggerPreview({ node }: CommandTriggerPreviewProps) {
  /** Команда триггера, например "/start" */
  const command = node.data?.command || '/start';

  /** Параметр deep link, например "ref_" или "promo" */
  const deepLinkParam: string = (node.data as any)?.deepLinkParam || '';

  /** Режим совпадения: точное или по префиксу */
  const matchMode: string = (node.data as any)?.deepLinkMatchMode || 'exact';

  /** Отображаемый текст параметра с суффиксом для режима startsWith */
  const paramLabel = deepLinkParam
    ? `?start=${deepLinkParam}${matchMode === 'startsWith' ? '…' : ''}`
    : '';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm font-semibold text-yellow-300">
        {command}
      </span>
      {paramLabel && (
        <span className="font-mono text-xs text-yellow-500/70 dark:text-yellow-400/50 truncate max-w-[160px]">
          {paramLabel}
        </span>
      )}
    </div>
  );
}
