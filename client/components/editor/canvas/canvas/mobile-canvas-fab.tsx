/**
 * @fileoverview Плавающая панель действий (FAB) для мобильных устройств на канвасе.
 *
 * Отображает кнопки быстрого доступа к боковой панели компонентов
 * и панели свойств выбранного узла на экранах < 1200px.
 */

import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';

/**
 * Свойства компонента плавающей панели
 */
interface MobileCanvasFabProps {
  /** Открытие мобильной боковой панели компонентов */
  onOpenMobileSidebar?: () => void;
  /** Открытие мобильной панели свойств */
  onOpenMobileProperties?: () => void;
  /** Панель компонентов включена в раскладке редактора. */
  sidebarVisible?: boolean;
  /** Панель свойств включена в раскладке редактора. */
  propertiesVisible?: boolean;
  /** ID выбранного узла (null — ничего не выбрано) */
  selectedNodeId: string | null;
  /** Выбрано сообщение с редактируемым текстом. */
  isMessage: boolean;
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
  sidebarVisible,
  propertiesVisible,
  selectedNodeId,
  isMessage,
}: MobileCanvasFabProps) {
  const compact = useMediaQuery('(max-width: 1200px)');
  const mobileLayout = useIsMobile();
  const showComponents = onOpenMobileSidebar && (mobileLayout || !sidebarVisible);
  const showProperties = selectedNodeId && onOpenMobileProperties && (mobileLayout || !propertiesVisible);

  if (!compact || (!showComponents && !showProperties)) return null;

  return (
    <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-2 pointer-events-auto">
      {/* Кнопка свойств — появляется при выборе узла */}
      {showProperties && <button
        type="button"
        onClick={onOpenMobileProperties}
        className={`
          gap-2 px-3 h-10 text-sm rounded-full flex items-center justify-center
          bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
          shadow-lg border border-gray-200/50 dark:border-slate-600/50
          text-gray-700 dark:text-gray-200
          active:scale-95 transition-all duration-200
          ${selectedNodeId ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
        `}
        aria-label={isMessage ? "Изменить текст" : "Открыть свойства"}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {isMessage ? "Изменить текст" : "Свойства"}
      </button>}

      {/** Кнопка компонентов доступна, когда палитра скрыта. */}
      {showComponents && <button
        type="button"
        onClick={onOpenMobileSidebar}
        className="
          gap-2 px-3 h-10 text-sm rounded-full flex items-center justify-center
          bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
          shadow-lg border border-gray-200/50 dark:border-slate-600/50
          text-gray-700 dark:text-gray-200
          active:scale-95 transition-all duration-200
        "
        aria-label="Добавить блок"
      >
        <Plus className="w-4 h-4" /> Добавить блок
      </button>}
    </div>
  );
}
