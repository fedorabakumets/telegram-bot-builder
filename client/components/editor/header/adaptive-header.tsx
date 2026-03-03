import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import type { AdaptiveHeaderProps } from './types';
import { BrandSection } from './components/brand-section';
import { Navigation } from './components/navigation';
import { MobileNavigation } from './components/mobile-navigation';
import { MobileActions } from './components/mobile-actions';
import { DesktopActions } from './components/desktop-actions';
import { Separator } from './components/separator';
import { TelegramChatInvite } from './components/telegram-chat-invite';
import { GithubButton } from './components/github-button';
import { ThemeToggle } from './components/theme-toggle';
import { UserAuth } from './components/user-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/bot-generator/utils';

export function AdaptiveHeader({
  config,
  projectName,
  botInfo,
  currentTab,
  onTabChange,
  onSaveAsTemplate,
  onLoadTemplate,
  onToggleHeader,
  onToggleSidebar,
  onToggleProperties,
  onToggleCanvas,
  onToggleCode,
  onToggleCodeEditor,
  onOpenFileExplorer,
  headerVisible,
  sidebarVisible,
  propertiesVisible,
  canvasVisible,
  codeVisible,
  codeEditorVisible,
  onOpenMobileSidebar,
  onOpenMobileProperties
}: AdaptiveHeaderProps) {

  // Состояние для мобильного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Проверка авторизации пользователя
  const { user, logout } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();

  // Определяем мобильное устройство
  const isMobile = useIsMobile();

  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;

  // Классы для контейнера с адаптивной высотой для мобильных устройств
  const containerClasses = [
    'bg-gradient-to-r from-background via-background/95 to-background/90 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/90 backdrop-blur-sm relative z-50',
    isVertical ? 'h-full w-full border-r flex flex-col' : `h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-between md:flex-wrap md:justify-start md:gap-1.5 lg:gap-2 lg:flex-nowrap lg:justify-between px-2 sm:px-3 md:px-4 lg:px-6`,
    isCompact ? 'text-sm' : ''
  ].join(' ');

  // Компонент действий
  const Actions = () => (
    <div className={cn(
      'flex',
      isVertical ? 'flex-col space-y-2 p-2' : 'hidden lg:flex flex-wrap items-center gap-1 lg:w-auto lg:order-none lg:ml-auto'
    )}>
      <DesktopActions
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
        isVertical={isVertical}
      />

      {isVertical && (
        <div className="h-px w-full bg-border my-2"></div>
      )}

      <UserAuth
        user={user}
        onLogout={logout}
        onLogin={handleTelegramLogin}
        isVertical={isVertical}
      />

      <div className={cn(
        'text-xs font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-700/20 dark:to-cyan-600/20 rounded-lg border border-blue-400/20 dark:border-blue-500/30 backdrop-blur-sm',
        isVertical ? 'w-full px-3 py-1.5' : 'hidden md:flex items-center px-3 py-1.5'
      )}>
        <TelegramChatInvite variant="desktop" />
      </div>

      <GithubButton />

      <div className="max-sm:col-span-1 max-sm:flex max-sm:justify-center">
        <ThemeToggle />
      </div>
    </div>
  );

  if (isVertical) {
    return (
      <header className={containerClasses}>
        <BrandSection
          projectName={projectName}
          botInfo={botInfo}
          isVertical={isVertical}
          isCompact={isCompact}
          isMobile={isMobile}
        />
        <Separator />
        <div className="flex-1 overflow-y-auto">
          <Navigation
            currentTab={currentTab}
            onTabChange={onTabChange}
            isVertical={isVertical}
            isCompact={isCompact}
          />
        </div>
        <Separator />
        <Actions />
      </header>
    );
  }

  return (
    <>
      <header className={containerClasses}>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-1.5 md:order-first flex-shrink-0">
        <BrandSection
          projectName={projectName}
          botInfo={botInfo}
          isVertical={isVertical}
          isCompact={isCompact}
          isMobile={isMobile}
        />
        <Separator />
        {/* Мобильные кнопки компонентов и свойств после разделителя */}
        {isMobile && !isVertical && (
          <div className="flex items-center gap-2 sm:gap-2">
            {onOpenMobileSidebar && (
              <button
                onClick={onOpenMobileSidebar}
                className="group p-2 sm:p-2 bg-blue-500/10 dark:bg-blue-400/15 rounded-lg border border-blue-300/30 dark:border-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-400/25 hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/25"
                title="Открыть панель компонентов"
                data-testid="button-mobile-components"
              >
                <Menu className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
              </button>
            )}
            {onOpenMobileProperties && (
              <button
                onClick={onOpenMobileProperties}
                className="group p-2 sm:p-2 bg-purple-500/10 dark:bg-purple-400/15 rounded-lg border border-purple-300/30 dark:border-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-400/25 hover:border-purple-400/50 dark:hover:border-purple-400/30 transition-all duration-200 hover:shadow-md hover:shadow-purple-500/25"
                title="Открыть панель свойств"
                data-testid="button-mobile-properties"
              >
                <Sliders className="w-4 h-4 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200" />
              </button>
            )}
          </div>
        )}
      </div>

      <Navigation
        currentTab={currentTab}
        onTabChange={onTabChange}
        isVertical={isVertical}
        isCompact={isCompact}
      />

      {/* Десктопные/Планшетные действия */}
      <Actions />
      
      {/* Мобильная кнопка меню */}
      <div className="lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="p-1.5 sm:p-2 h-8 sm:h-9">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 md:w-[420px] p-0 overflow-y-auto">
            <div className="bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/90 min-h-full flex flex-col">
              {/* Заголовок меню */}
              <SheetHeader className="px-4 sm:px-6 py-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center">
                    <i className="fab fa-telegram-plane text-white text-sm"></i>
                  </div>
                  <SheetTitle className="text-left text-lg font-bold">Меню</SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
                  {/* Навигация */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Навигация</h3>
                    <MobileNavigation
                      currentTab={currentTab}
                      onTabChange={onTabChange}
                      onClose={() => setIsMobileMenuOpen(false)}
                    />
                  </div>

                  {/* Действия */}
                  <div className="border-t border-border/50 pt-4">
                    <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Действия</h3>
                    <MobileActions
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
                      onCloseMenu={() => setIsMobileMenuOpen(false)}
                      user={user}
                      onLogout={logout}
                      onLogin={handleTelegramLogin}
                    />
                  </div>

                  {/* Аккаунт удален - перенесен в MobileActions */}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

    </header>
    </>
  );
}