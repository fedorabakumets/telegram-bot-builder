/**
 * @fileoverview Превью узла триггера редактирования сообщения (юзербот) на холсте
 * @module components/editor/canvas/canvas-node/userbot-edit-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы компонента UserbotEditTriggerPreview */
interface UserbotEditTriggerPreviewProps {
  /** Узел типа userbot_edit_trigger */
  node: Node;
}

/**
 * Превью узла триггера редактирования — отображает entity и фильтр
 * @param props - Пропсы компонента
 * @returns JSX элемент превью
 */
export function UserbotEditTriggerPreview({ node }: UserbotEditTriggerPreviewProps) {
  const data = node.data as any;
  const entity = data.userbotEntity || '';
  const filterType = data.filterType || 'any';
  const filterValue = data.filterValue || '';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <i className="fas fa-pen text-amber-500 text-[10px]" />
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate">
          Редактирование (юзербот)
        </span>
      </div>
      {entity && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
          📍 {entity}
        </p>
      )}
      {filterType !== 'any' && filterValue && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
          🔍 {filterType === 'contains' ? 'содержит' : 'regex'}: {filterValue}
        </p>
      )}
    </div>
  );
}
