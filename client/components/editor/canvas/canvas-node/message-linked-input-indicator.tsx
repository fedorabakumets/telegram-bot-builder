/**
 * @fileoverview Компактный индикатор связанного `input`-узла внутри `message`-узла на холсте.
 */

import type { Node } from '@/types/bot';
import { getMessageInputCollectionState } from '../../properties/utils/linked-input-node';

/**
 * Свойства компактного индикатора связи `message` с `input`.
 */
interface MessageLinkedInputIndicatorProps {
  /** Узел сообщения. */
  node: Node;
  /** Все узлы холста для поиска связанного `input`. */
  allNodes?: Node[];
}

/**
 * Показывает, что `message` связан с отдельным `input`-узлом.
 *
 * @param {MessageLinkedInputIndicatorProps} props - Свойства компонента.
 * @returns {JSX.Element | null} Индикатор связи или `null`.
 */
export function MessageLinkedInputIndicator({ node, allNodes = [] }: MessageLinkedInputIndicatorProps) {
  if (node.type !== 'message') return null;

  const state = getMessageInputCollectionState(
    node,
    allNodes.map((candidate) => ({ node: candidate, sheetId: '', sheetName: 'Текущий лист' }))
  );
  if (!state.summary || (!state.isEnabled && !state.isLegacy)) return null;

  const linkedVariable = state.summary.inputVariable || 'не задана';

  return (
    <div className="mb-4 rounded-xl border border-cyan-200/60 dark:border-cyan-800/40 bg-cyan-50/70 dark:bg-cyan-950/20 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-cyan-700 dark:text-cyan-300">
        <i className="fas fa-link text-[10px]" />
        <span className="font-medium">
          {state.isLegacy ? 'Старый сбор ответа' : 'Сохраняет ответ'}
        </span>
        <span className="text-cyan-600/80 dark:text-cyan-400/80">в {linkedVariable}</span>
      </div>
    </div>
  );
}
