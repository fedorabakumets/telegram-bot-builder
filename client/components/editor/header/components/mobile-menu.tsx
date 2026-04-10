/**
 * @fileoverview Мобильное меню
 * @description Компонент мобильного меню навигации с кнопкой, заголовком и контентом
 */

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileMenuButton } from './mobile-menu-button';
import { MobileMenuHeader } from './mobile-menu-header';
import { MobileMenuContent, type MobileMenuContentProps } from './mobile-menu-content';

/**
 * Свойства мобильного меню
 */
export interface MobileMenuProps extends MobileMenuContentProps {
  /** Дополнительные CSS-классы для контента */
  contentClassName?: string;
}

/**
 * Мобильное меню навигации
 */
export function MobileMenu({
  currentTab,
  onTabChange,
  onToggleHeader,
  onToggleSidebar,
  onToggleCanvas,
  onToggleProperties,
  onToggleCode,
  onToggleCodeEditor,
  onOpenFileExplorer,
  onLoadTemplate,
  onSaveAsTemplate,
  headerVisible,
  sidebarVisible,
  canvasVisible,
  propertiesVisible,
  codeVisible,
  codeEditorVisible,
  user,
  isLoading,
  onLogout,
  onLogin,
  contentClassName,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <MobileMenuButton onClick={() => setIsOpen(true)} />
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96 md:w-[420px] p-0 overflow-y-auto">
        <div className="bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/90 min-h-full flex flex-col">
          <MobileMenuHeader />
          <div className="flex-1 overflow-y-auto">
            <MobileMenuContent
              currentTab={currentTab}
              onTabChange={onTabChange}
              onToggleHeader={onToggleHeader}
              onToggleSidebar={onToggleSidebar}
              onToggleCanvas={onToggleCanvas}
              onToggleProperties={onToggleProperties}
              onToggleCode={onToggleCode}
              onToggleCodeEditor={onToggleCodeEditor}
              onOpenFileExplorer={onOpenFileExplorer}
              onLoadTemplate={onLoadTemplate}
              onSaveAsTemplate={onSaveAsTemplate}
              headerVisible={headerVisible}
              sidebarVisible={sidebarVisible}
              canvasVisible={canvasVisible}
              propertiesVisible={propertiesVisible}
              codeVisible={codeVisible}
              codeEditorVisible={codeEditorVisible}
              user={user}
              isLoading={isLoading}
              onLogout={onLogout}
              onLogin={onLogin}
              onCloseMenu={handleClose}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
