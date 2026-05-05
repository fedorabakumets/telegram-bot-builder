/**
 * @fileoverview Брендинг сайдбара — переиспользует BrandSection из шапки
 */

import { BrandSection } from '@/components/editor/header/components/brand-section';
import type { BotInfo } from '../types';

/**
 * Пропсы компонента SidebarBrand
 */
interface SidebarBrandProps {
  /** Название проекта */
  projectName: string;
  /** Информация о боте */
  botInfo?: BotInfo | null;
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
}

/**
 * Брендинговая секция сайдбара — использует BrandSection из шапки
 * @param props - Свойства компонента
 * @returns JSX элемент с логотипом и информацией о проекте
 */
export function SidebarBrand({ projectName, botInfo, isCollapsed }: SidebarBrandProps) {
  return (
    <BrandSection
      projectName={projectName}
      botInfo={botInfo}
      isVertical={false}
      isCompact={isCollapsed}
    />
  );
}
