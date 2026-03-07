/**
 * @fileoverview Переключатель включения условных сообщений
 * 
 * Компонент переключателя для включения/выключения условных сообщений.
 */

import { Switch } from '@/components/ui/switch';
import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface ConditionalMessagesToggleProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция раскрытия секции */
  onToggle?: () => void;
}

/**
 * Компонент переключателя условных сообщений
 * 
 * @param {ConditionalMessagesToggleProps} props - Пропсы компонента
 * @returns {JSX.Element} Переключатель
 */
export function ConditionalMessagesToggle({
  selectedNode,
  onNodeUpdate,
  onToggle
}: ConditionalMessagesToggleProps) {
  return (
    <div className="flex items-center gap-2.5 p-3 sm:p-4 md:p-5 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/40 dark:border-purple-800/40">
      <span className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">Включить</span>
      <Switch
        checked={selectedNode.data.enableConditionalMessages ?? false}
        onCheckedChange={(checked) => {
          // Сначала раскрываем секцию
          if (checked && onToggle) {
            onToggle();
          }
          onNodeUpdate(selectedNode.id, { enableConditionalMessages: checked });
        }}
      />
    </div>
  );
}
