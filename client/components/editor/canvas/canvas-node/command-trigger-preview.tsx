/**
 * @fileoverview Preview-компонент узла триггера команды для холста
 *
 * Отображает команду, список синонимов и режим совпадения
 * прямо на карточке узла в редакторе.
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
 * @returns JSX-элемент с отображением команды, синонимов и режима совпадения
 */
export function CommandTriggerPreview({ node }: CommandTriggerPreviewProps) {
  const command = node.data?.command || '/start';
  const synonyms: string[] = (node.data?.synonyms as string[]) || [];
  const matchMode = (node.data as any)?.matchMode || 'exact';

  return (
    <div className="mt-2 space-y-2">
      {/* Команда */}
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <i className="fas fa-terminal text-yellow-600 dark:text-yellow-400 text-xs" />
        <span className="font-mono text-sm font-semibold text-yellow-700 dark:text-yellow-300">
          {command}
        </span>
      </div>

      {/* Синонимы */}
      {synonyms.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-1">Синонимы ({synonyms.length}):</p>
          <div className="flex flex-wrap gap-1">
            {synonyms.slice(0, 4).map((s, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-700"
              >
                {s}
              </span>
            ))}
            {synonyms.length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                +{synonyms.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Match mode badge */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Режим:</span>
        <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
          {matchMode === 'exact' ? 'точное' : matchMode === 'contains' ? 'содержит' : 'нечёткое'}
        </span>
      </div>
    </div>
  );
}
