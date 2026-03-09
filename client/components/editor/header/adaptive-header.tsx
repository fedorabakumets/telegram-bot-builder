import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import type { AdaptiveHeaderProps } from './types';
import { BrandSection } from './components/brand-section';
import { Navigation } from './components/navigation';
import { DesktopActionsFull } from './components/desktop-actions-full';
import { Separator } from './components/separator';
import { MobileHeaderControls } from './components/mobile-header-controls';
import { MobileMenu } from './components/mobile-menu';

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
        <DesktopActionsFull
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
          onLogout={logout}
          onLogin={handleTelegramLogin}
          isVertical={isVertical}
        />
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
          <MobileHeaderControls
            onOpenMobileSidebar={onOpenMobileSidebar}
            onOpenMobileProperties={onOpenMobileProperties}
          />
        )}
      </div>

      <div className="flex items-center gap-1 lg:gap-2 flex-1">
        <Navigation
          currentTab={currentTab}
          onTabChange={onTabChange}
          isVertical={isVertical}
          isCompact={isCompact}
        />

        {/* Десктопные/Планшетные действия */}
        <DesktopActionsFull
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
          onLogout={logout}
          onLogin={handleTelegramLogin}
          isVertical={isVertical}
        />
      </div>
      
      {/* Мобильная кнопка меню */}
      <div className="lg:hidden">
        <MobileMenu
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
          onLogout={logout}
          onLogin={handleTelegramLogin}
        />
      </div>

    </header>
    </>
  );
}