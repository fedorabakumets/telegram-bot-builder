/**
 * @fileoverview Переключатель включения сбора ответов
 * 
 * Компонент переключателя для включения/выключения сбора ответов пользователя.
 */

import { Switch } from '@/components/ui/switch';
import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface UserInputToggleProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Компонент переключателя сбора ответов
 * 
 * @param {UserInputToggleProps} props - Пропсы компонента
 * @returns {JSX.Element} Переключатель
 */
export function UserInputToggle({
  selectedNode,
  onNodeUpdate
}: UserInputToggleProps) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40">
      <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Включить</span>
      <Switch
        checked={selectedNode.data.collectUserInput ?? false}
        onCheckedChange={(checked) => {
          onNodeUpdate(selectedNode.id, { collectUserInput: checked });
        }}
      />
    </div>
  );
}
