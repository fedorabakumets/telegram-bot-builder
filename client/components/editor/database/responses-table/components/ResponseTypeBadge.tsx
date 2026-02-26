/**
 * @fileoverview Компонент бейджа типа ответа
 * @description Отображает тип ответа пользователя
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ResponseTypeBadgeProps } from '../types';

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
    <Badge variant="outline" className="text-[8px] xs:text-[9px] sm:text-[10px] px-1 xs:px-1.5 sm:px-2 py-0 h-auto">
      {typeLabels[type] || String(type)}
    </Badge>
  );
}
