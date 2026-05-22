/**
 * @fileoverview Плавающая панель действий (FAB) для мобильных устройств на канвасе.
 *
 * Отображает кнопки быстрого доступа к боковой панели компонентов
 * и панели свойств выбранного узла на экранах < 1200px.
 */

import { LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';

/**
 * Свойства компонента плавающей панели
 */
interface MobileCanvasFabProps {
  /** Открытие мобильной боковой панели компонентов */
  onOpenMobileSidebar?: () => void;
  /** Открытие мобильной панели свойств */
  onOpenMobileProperties?: () => void;
  /** ID выбранного узла (null — ничего не выбрано) */
  selectedNodeId: string | null;
}

/**
 * Плавающая панель действий для мобильных устройств
 *
 * @param props - Свойства компонента
 * @returns JSX элемент или null на десктопе
 */
export function MobileCanvasFab({
  onOpenMobileSidebar,
  onOpenMobileProperties,
  selectedNodeId,
}: MobileCanvasFabProps) {
  const isMobile = useMediaQuery('(max-width: 1199px)');

  if (!isMobile) return null;

  return (
    <div className="absolute bottom-24 right-4 z-40 flex flex-col gap-2 pointer-events-auto">
      {/* Кнопка свойств — появляется при выборе узла */}
      <button
        type="button"
        onClick={onOpenMobileProperties}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
          shadow-lg border border-gray-200/50 dark:border-slate-600/50
          text-gray-700 dark:text-gray-200
          active:scale-95 transition-all duration-200
          ${selectedNodeId ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
        `}
        aria-label="Открыть свойства"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* Кнопка компонентов — всегда видна */}
      <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="
          w-12 h-12 rounded-full flex items-center justify-center
          bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
          shadow-lg border border-gray-200/50 dark:border-slate-600/50
          text-gray-700 dark:text-gray-200
          active:scale-95 transition-all duration-200
        "
        aria-label="Открыть компоненты"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>
    </div>
  );
}
