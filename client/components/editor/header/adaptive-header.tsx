import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LogOut, MessageCircle, Menu, Github, Sliders } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/bot-generator/utils';
import { DesktopLoadTemplateButton } from './components/desktop-load-template-button';
import { DesktopOpenFileExplorerButton } from './components/desktop-open-file-explorer-button';
import { DesktopSaveTemplateButton } from './components/desktop-save-template-button';
import { DesktopToggleCanvasButton } from './components/desktop-toggle-canvas-button';
import { DesktopToggleCodeButton } from './components/desktop-toggle-code-button';
import { DesktopToggleCodeEditorButton } from './components/desktop-toggle-code-editor-button';
import { DesktopToggleHeaderButton } from './components/desktop-toggle-header-button';
import { DesktopTogglePropertiesButton } from './components/desktop-toggle-properties-button';
import { DesktopToggleSidebarButton } from './components/desktop-toggle-sidebar-button';
import { LoadTemplateButton } from './components/load-template-button';
import { OpenFileExplorerButton } from './components/open-file-explorer-button';
import { SaveTemplateButton } from './components/save-template-button';
import { ToggleCanvasButton } from './components/toggle-canvas-button';
import { ToggleCodeButton } from './components/toggle-code-button';
import { ToggleCodeEditorButton } from './components/toggle-code-editor-button';
import { ToggleHeaderButton } from './components/toggle-header-button';
import { TogglePropertiesButton } from './components/toggle-properties-button';
import { ToggleSidebarButton } from './components/toggle-sidebar-button';

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

      {/* Информация о пользователе и выход */}
      {user ? (
        <>
          <div className={cn(
            'flex items-center space-x-2.5 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 dark:from-blue-700/25 dark:to-cyan-600/20 px-3 py-1.5 rounded-lg backdrop-blur-md border border-blue-400/20 dark:border-blue-500/30 shadow-md shadow-blue-500/10',
            isVertical ? 'w-full' : ''
          )}>
            {user.photoUrl && (
              <img
                src={user.photoUrl}
                alt={user.firstName}
                className="w-7 h-7 rounded-full ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
              />
            )}
            {!isVertical && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground">{user.firstName}</p>
                {user.username && (
                  <p className="text-xs text-blue-600 dark:text-blue-300">@{user.username}</p>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className={cn(
              'px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all font-semibold',
              isVertical ? 'w-full justify-center' : 'flex items-center justify-center'
            )}
            title="Выход"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <Button
          onClick={handleTelegramLogin}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
          title="Войти через Telegram"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Вход</span>
        </Button>
      )}

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
                    />
                  </div>

                  {/* Аккаунт */}
                  <div className="border-t border-border/50 pt-4">
                    <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Аккаунт</h3>
                    <div className="flex flex-col gap-3">
                      {user ? (
                        <>
                          <div className="px-4 py-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 dark:from-blue-700/20 dark:to-cyan-600/15 rounded-lg border border-blue-400/20 dark:border-blue-500/20">
                            {user.photoUrl && (
                              <img 
                                src={user.photoUrl} 
                                alt={user.firstName}
                                className="w-10 h-10 rounded-full ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 mb-2"
                              />
                            )}
                            <p className="text-sm font-bold text-foreground">{user.firstName}</p>
                            {user.username && (
                              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">@{user.username}</p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              logout();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full font-medium"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Выход из аккаунта
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleTelegramLogin}
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                          title="Войти через Telegram"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Вход в Telegram
                        </Button>
                      )}
                    </div>
                  </div>
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