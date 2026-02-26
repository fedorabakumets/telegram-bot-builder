/**
 * @fileoverview Компонент списка ответов пользователя
 * @description Отображает все ответы пользователя в виде списка карточек
 */

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';
import { ResponseData, VariableToQuestionMap } from '../../types';
import { ResponseCard } from './response-card';

/**
 * Пропсы компонента UserResponsesList
 */
interface UserResponsesListProps {
  /** Данные ответов пользователя */
  userData: Record<string, unknown> | unknown;
  /** Карта вопросов */
  variableToQuestionMap: VariableToQuestionMap;
  /** Функция поиска URL фото */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/**
 * Компонент списка ответов
 * @param props - Пропсы компонента
 * @returns JSX компонент списка
 */
export function UserResponsesList({
  userData,
  variableToQuestionMap,
  getPhotoUrlFromMessages,
}: UserResponsesListProps): React.JSX.Element | null {
  // Проверяем что userData это объект
  if (!userData || typeof userData !== 'object' || Array.isArray(userData)) {
    return null;
  }

  const entries = Object.entries(userData);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <Label className="text-base font-semibold">Ответы пользователя</Label>
        <Badge variant="secondary" className="text-xs">
          {String(entries.length)}
        </Badge>
      </div>

      <div className="space-y-4">
        {entries.map(([key, value]) => (
          <ResponseCard
            key={key}
            keyName={key}
            value={value}
            variableToQuestionMap={variableToQuestionMap}
            getPhotoUrlFromMessages={getPhotoUrlFromMessages}
          />
        ))}
      </div>
    </div>
  );
}
