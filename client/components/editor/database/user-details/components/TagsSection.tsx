/**
 * @fileoverview Компонент тегов пользователя
 * @description Отображает список тегов пользователя
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserBotData } from '@shared/schema';

/**
 * @interface TagsSectionProps
 * @description Свойства компонента тегов
 */
interface TagsSectionProps {
  /** Данные пользователя */
  user: UserBotData;
}

/**
 * Компонент тегов пользователя
 * @param {TagsSectionProps} props - Свойства компонента
 * @returns {JSX.Element | null} Секция с тегами или null
 */
export function TagsSection({ user }: TagsSectionProps): React.JSX.Element | null {
  if (!user.tags || !Array.isArray(user.tags) || user.tags.length === 0) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <Label className="text-xs sm:text-sm font-semibold">Теги</Label>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-1.5 pl-5 sm:pl-6">
          {user.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
              {String(tag)}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}
