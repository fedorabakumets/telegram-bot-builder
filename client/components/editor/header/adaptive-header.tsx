import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { useTelegramAuthListener } from '@/components/editor/header/hooks/use-telegram-auth-listener';
import { useMiniAppAuth } from '@/components/editor/header/hooks/use-mini-app-auth';
import type { AdaptiveHeaderProps } from './types';
import { Navigation } from './components/navigation';
import { DesktopActionsFull } from './components/desktop-actions-full';
import { Separator } from './components/separator';
import { MobileHeaderControls } from './components/mobile-header-controls';
import { MobileMenu } from './components/mobile-menu';
import { Logo } from './components/logo';
import { ProjectSwitcher } from './components/project-switcher';

export function AdaptiveHeader({
  config,
  projectName,
  botInfo,
  projects,
  currentProjectId,
  onProjectChange,
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
  const { user, logout, isLoading } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();

  // Подключаем listener postMessage один раз на верхнем уровне
  useTelegramAuthListener();
  // Автоматическая авторизация при открытии как Mini App
  useMiniAppAuth();

  // Определяем мобильное устройство
  const isMobile = useIsMobile();

  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;

  // Классы для контейнера с адаптивной высотой для мобильных устройств
  const containerClasses = [
    'bg-background dark:bg-slate-950 relative z-50',
    isVertical ? 'h-full w-full border-r flex flex-col' : `h-14 flex items-center justify-between gap-2 px-3 lg:px-4`,
    isCompact ? 'text-sm' : ''
  ].join(' ');

  if (isVertical) {
    return (
      <header className={containerClasses}>
        {/* BrandSection скрыт — перенесён в боковое меню */}
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
          isLoading={isLoading}
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
        <div className="flex items-center gap-0 md:order-first flex-shrink-0">
          {/* Переключатель проекта — без лого, лого живёт в сайдбаре */}
          {projects && projects.length > 0 && currentProjectId && onProjectChange && (
            <ProjectSwitcher
              projects={projects}
              currentProjectId={currentProjectId}
              onSelect={onProjectChange}
            />
          )}

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
            isLoading={isLoading}
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
            isLoading={isLoading}
            onLogout={logout}
            onLogin={handleTelegramLogin}
          />
        </div>
      </header>
    </>
  );
}