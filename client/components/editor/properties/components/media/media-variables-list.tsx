/**
 * @fileoverview Список медиа-переменных
 * 
 * Отображает список прикреплённых медиа-переменных.
 */

import { Label } from '@/components/ui/label';
import { MediaVariableBadge } from './media-variable-badge';
import type { ProjectVariable } from '../../utils/variables-utils';

/** Пропсы компонента списка */
interface MediaVariablesListProps {
  /** Список медиа-переменных */
  variables: ProjectVariable[];
  /** Функция удаления переменной */
  onRemove: (name: string) => void;
}

/**
 * Компонент списка медиа-переменных
 * 
 * @param {MediaVariablesListProps} props - Пропсы компонента
 * @returns {JSX.Element} Список медиа-переменных
 */
export function MediaVariablesList({ variables, onRemove }: MediaVariablesListProps) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Прикрепленные медиа</Label>
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <MediaVariableBadge
            key={`${variable.nodeId}-${variable.name}`}
            variable={variable}
            onRemove={onRemove}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Эти переменные содержат file_id медиафайлов, полученных от пользователей
      </div>
    </div>
  );
}
