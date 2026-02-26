/**
 * @fileoverview Компонент бейджа типа ответа
 * @description Отображает тип ответа пользователя
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * @interface ResponseTypeBadgeProps
 * @description Свойства бейджа типа
 */
interface ResponseTypeBadgeProps {
  /** Тип ответа */
  type?: string;
}

/**
 * Компонент бейджа типа ответа
 * @param {ResponseTypeBadgeProps} props - Свойства компонента
 * @returns {JSX.Element | null} Бейдж или null
 */
export function ResponseTypeBadge({ type }: ResponseTypeBadgeProps): React.JSX.Element | null {
  if (!type) return null;

  const typeLabels: Record<string, string> = {
    text: 'Текст',
    number: 'Число',
    email: 'Email',
    phone: 'Телефон'
  };

  return (
    <Badge variant="outline" className="text-xs">
      {typeLabels[type] || String(type)}
    </Badge>
  );
}
