/**
 * @fileoverview Секция медиа-переменных
 * 
 * Компонент для отображения списка прикреплённых медиа-переменных.
 */

import { MediaVariablesList } from '../media/media-variables-list';
import type { ProjectVariable } from '../../utils/variables-utils';

/** Пропсы компонента */
interface MediaVariablesSectionProps {
  /** Список медиа-переменных */
  variables: ProjectVariable[];
  /** Функция удаления переменной */
  onRemove: (name: string) => void;
}

/**
 * Компонент секции медиа-переменных
 * 
 * @param {MediaVariablesSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} MediaVariablesList
 */
export function MediaVariablesSection({
  variables,
  onRemove
}: MediaVariablesSectionProps) {
  return (
    <MediaVariablesList
      variables={variables}
      onRemove={onRemove}
    />
  );
}
