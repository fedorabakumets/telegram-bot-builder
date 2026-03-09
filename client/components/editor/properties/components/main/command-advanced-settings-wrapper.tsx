/**
 * @fileoverview Обёртка CommandAdvancedSettings
 * 
 * Компонент для отображения расширенных настроек команд.
 */

import { CommandAdvancedSettings } from '../commands/command-advanced-settings';
import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface CommandAdvancedSettingsWrapperProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
}

/**
 * Компонент обёртки CommandAdvancedSettings
 * 
 * @param {CommandAdvancedSettingsWrapperProps} props - Пропсы компонента
 * @returns {JSX.Element} CommandAdvancedSettings
 */
export function CommandAdvancedSettingsWrapper({
  selectedNode,
  onNodeUpdate,
  isOpen,
  onToggle
}: CommandAdvancedSettingsWrapperProps) {
  return (
    <CommandAdvancedSettings
      selectedNode={selectedNode}
      onNodeUpdate={onNodeUpdate}
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
}
