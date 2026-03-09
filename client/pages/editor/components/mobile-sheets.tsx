/**
 * @fileoverview Компонент мобильных Sheet элементов
 *
 * Рендерит мобильные панели свойств и сайдбара.
 *
 * @module MobileSheets
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ReactNode } from 'react';

/** Параметры компонента MobileSheets */
export interface MobileSheetsProps {
  /** Флаг видимости мобильного сайдбара */
  showMobileSidebar: boolean;
  /** Установить видимость мобильного сайдбара */
  setShowMobileSidebar: (show: boolean) => void;
  /** Флаг видимости мобильной панели свойств */
  showMobileProperties: boolean;
  /** Установить видимость мобильной панели свойств */
  setShowMobileProperties: (show: boolean) => void;
  /** Контент сайдбара */
  sidebarContent: ReactNode;
  /** Контент панели свойств */
  propertiesContent: ReactNode;
}

/**
 * Компонент мобильных Sheet элементов
 *
 * @param props - Параметры компонента
 * @returns JSX элемент мобильных панелей
 */
export function MobileSheets(props: MobileSheetsProps) {
  const {
    showMobileSidebar,
    setShowMobileSidebar,
    showMobileProperties,
    setShowMobileProperties,
    sidebarContent,
    propertiesContent,
  } = props;

  return (
    <>
      {/* Мобильный sidebar */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Компоненты</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-auto">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>

      {/* Мобильная панель свойств */}
      <Sheet open={showMobileProperties} onOpenChange={setShowMobileProperties}>
        <SheetContent side="right" className="p-0 w-full max-w-full sm:w-96 sm:max-w-md">
          <SheetHeader className="px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <SheetTitle className="text-lg font-semibold">Свойства элемента</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-60px)] overflow-auto pb-safe">
            {propertiesContent}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
