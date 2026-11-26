/**
 * @fileoverview Обёртка AutoTransitionSection
 * 
 * Компонент для отображения секции автоперехода.
 */

import { AutoTransitionSection } from '../navigation/auto-transition-section';
import type { Node } from '@shared/schema';

/** Параметры узла для отображения автоперехода. */
interface AutoTransitionWrapperProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы для навигации */
  getAllNodesFromAllSheets: any[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
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
  keyboardType,
  collectUserInput
}: AutoTransitionWrapperProps) {
  // Если включен сбор ответов, выключаем автопереход
  if (collectUserInput === true && selectedNode.data.enableAutoTransition) {
    onNodeUpdate(selectedNode.id, { enableAutoTransition: false });
  }

  // Скрываем секцию только если есть клавиатура
  if (keyboardType !== 'none') {
    return null;
  }

  return (
    <AutoTransitionSection
      selectedNode={selectedNode}
      getAllNodesFromAllSheets={getAllNodesFromAllSheets}
      onNodeUpdate={onNodeUpdate}
    />
  );
}
