/**
 * @fileoverview Обёртка AutoTransitionSection
 * 
 * Компонент для отображения секции автоперехода.
 */

import { AutoTransitionSection } from '../navigation/auto-transition-section';
import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface AutoTransitionWrapperProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы для навигации */
  getAllNodesFromAllSheets: any[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
  /** Тип клавиатуры */
  keyboardType?: string;
  /** Флаг сбора пользовательского ввода */
  collectUserInput?: boolean;
}

/**
 * Компонент обёртки AutoTransitionSection
 * 
 * @param {AutoTransitionWrapperProps} props - Пропсы компонента
 * @returns {JSX.Element | null} AutoTransitionSection или null
 */
export function AutoTransitionWrapper({
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate,
  isOpen,
  onToggle,
  keyboardType,
  collectUserInput
}: AutoTransitionWrapperProps) {
  if (keyboardType !== 'none' || collectUserInput === true) {
    return null;
  }

  return (
    <AutoTransitionSection
      selectedNode={selectedNode}
      getAllNodesFromAllSheets={getAllNodesFromAllSheets}
      onNodeUpdate={onNodeUpdate}
      isOpen={isOpen}
      onToggle={onToggle}
    />
  );
}
