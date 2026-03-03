/**
 * @fileoverview Контейнер мобильных кнопок управления
 * @description Контейнер для кнопок открытия панели компонентов и свойств
 */

import { MobileSidebarButton } from './mobile-sidebar-button';
import { MobilePropertiesButton } from './mobile-properties-button';

/**
 * Свойства контейнера мобильных кнопок
 */
export interface MobileHeaderControlsProps {
  /** Обработчик открытия панели компонентов */
  onOpenMobileSidebar?: () => void;
  /** Обработчик открытия панели свойств */
  onOpenMobileProperties?: () => void;
}

/**
 * Контейнер мобильных кнопок управления
 */
export function MobileHeaderControls({
  onOpenMobileSidebar,
  onOpenMobileProperties,
}: MobileHeaderControlsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-2">
      {/* Кнопки управления панелями - временно скрыты */}
      {/* {onOpenMobileSidebar && (
        <MobileSidebarButton onClick={onOpenMobileSidebar} />
      )}
      {onOpenMobileProperties && (
        <MobilePropertiesButton onClick={onOpenMobileProperties} />
      )} */}
    </div>
  );
}
