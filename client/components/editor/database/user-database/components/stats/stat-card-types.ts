/**
 * @fileoverview Типы для компонента статистической карточки
 * @description Интерфейс пропсов для карточек статистики
 */

import { LucideIcon } from 'lucide-react';

/**
 * Пропсы для компонента статистической карточки
 */
export interface StatCardProps {
  /** Иконка статистики */
  icon: LucideIcon;
  /** Короткая метка для отображения */
  label: string;
  /** Полное описание для tooltip */
  fullLabel?: string;
  /** Значение статистики */
  value?: number;
  /** Градиент для иконки */
  gradient: string;
  /** Цвет фона */
  bg: string;
  /** Цвет кольца (для desktop) */
  ring?: string;
  /** Тестовый ID */
  testId: string;
}
