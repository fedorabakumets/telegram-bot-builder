/**
 * @fileoverview Компонент отображения тегов пользователя
 * @description Показывает список тегов пользователя
 */

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента UserTags
 */
interface UserTagsProps {
  /** Список тегов */
  tags: string[];
}

/**
 * Компонент тегов пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент тегов или null
 */
export function UserTags({ tags }: UserTagsProps): React.JSX.Element | null {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div>
      <Label className="text-sm font-medium">Теги</Label>
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary">
            {String(tag)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
