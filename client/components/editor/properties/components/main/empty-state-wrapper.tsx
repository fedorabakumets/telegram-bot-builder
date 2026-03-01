/**
 * @fileoverview Обёртка EmptyState для панели свойств
 * 
 * Компонент отображает пустое состояние когда узел не выбран.
 */

import { EmptyState } from '../layout/empty-state';

/** Пропсы компонента */
interface EmptyStateWrapperProps {
  /** Выбранный узел */
  selectedNode: any | null;
  /** Функция закрытия панели */
  onClose?: () => void;
}

/**
 * Компонент обёртки EmptyState
 * 
 * @param {EmptyStateWrapperProps} props - Пропсы компонента
 * @returns {JSX.Element | null} EmptyState или null
 */
export function EmptyStateWrapper({ selectedNode, onClose }: EmptyStateWrapperProps) {
  if (!selectedNode) {
    return <EmptyState onClose={onClose} />;
  }
  return null;
}
