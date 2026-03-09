/**
 * @fileoverview Мобильная панель свойств для редактора ботов
 *
 * Компонент отображает свойства выбранного элемента в виде
 * выдвижной панели (Sheet) на мобильных устройствах.
 *
 * @module MobilePropertiesSheet
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ReactNode } from 'react';

/** Пропсы мобильной панели свойств */
interface MobilePropertiesSheetProps {
  /** Открыто ли окно панели */
  open: boolean;
  /** Callback для изменения состояния открытия */
  onOpenChange: (open: boolean) => void;
  /** Контент панели свойств */
  children: ReactNode;
}

/**
 * Мобильная панель свойств элемента
 *
 * @param props - Пропсы компонента
 * @returns JSX компонент панели
 */
export function MobilePropertiesSheet({
  open,
  onOpenChange,
  children,
}: MobilePropertiesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 w-full max-w-full sm:w-96 sm:max-w-md"
      >
        <SheetHeader className="px-4 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <SheetTitle className="text-lg font-semibold">Свойства элемента</SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100vh-60px)] overflow-auto pb-safe">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
