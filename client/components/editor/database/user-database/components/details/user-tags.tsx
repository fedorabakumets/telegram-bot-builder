/**
 * @fileoverview Компонент отображения тегов пользователя
 * @description Показывает список тегов пользователя
 */

import { Badge } from '@/components/ui/badge';

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
      <h3 className="text-sm font-medium">Теги</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="max-w-full whitespace-normal break-all font-normal">
            {String(tag)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
