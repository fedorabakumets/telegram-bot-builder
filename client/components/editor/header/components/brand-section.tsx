/**
 * @fileoverview Компонент бренда (логотип + название)
 * @description Объединяет логотип и название проекта в единую секцию
 */

import { cn } from '@/lib/bot-generator/utils';
import { Logo } from './logo';
import { Title } from './title';
import type { BotInfo } from '../types';

/**
 * Свойства компонента бренда
 */
export interface BrandSectionProps {
  /** Название проекта */
  projectName: string;
  /** Информация о боте */
  botInfo?: BotInfo | null;
  /** Вертикальное расположение */
  isVertical?: boolean;
  /** Компактный режим */
  isCompact?: boolean;
  /** Мобильный режим */
  isMobile?: boolean;
  /** Дополнительные CSS-классы */
  className?: string;
}

/**
 * Секция бренда с логотипом и названием проекта
 */
export function BrandSection({ projectName, botInfo, isVertical, isCompact, isMobile, className }: BrandSectionProps) {
  return (
    <div
      className={cn(
        'flex items-center flex-shrink-0 min-w-0',
        isVertical ? 'flex-col space-y-2 p-4' : 'gap-2 sm:gap-2.5',
        className
      )}
    >
      <Logo isVertical={isVertical} isCompact={isCompact} />
      <Title
        projectName={projectName}
        botInfo={botInfo}
        isVertical={isVertical}
        isCompact={isCompact}
        isMobile={isMobile}
      />
    </div>
  );
}
