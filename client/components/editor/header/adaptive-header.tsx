/**
 * @fileoverview Адаптивная шапка редактора. Узкая шапка прокручивается по горизонтали.
 */

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
import { ProjectArchiveBadge } from './components/project-archive-badge';
import { EditorLearnButton } from '@/components/editor/canvas/learn';
import { requestEditorLearn, useEditorLearnActive } from '@/components/editor/canvas/learn/editor-learn-bridge';

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
  onOpenMobileProperties,
  isCurrentProjectArchived = false,
  onUnarchiveCurrentProject,
  isUnarchivePending = false,
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
  const learnActive = useEditorLearnActive();

  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;

  // Классы для контейнера с адаптивной высотой для мобильных устройств
  const containerClasses = [
    'bg-background dark:bg-slate-950 border-b border-border/50 relative z-50',
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
      <header className={`${containerClasses} w-full min-w-0 overflow-x-auto overflow-y-hidden`}>
        <div className="flex w-max min-w-full items-center gap-2">
        <div className="flex shrink-0 items-center">
          {/* Переключатель проекта — без лого, лого живёт в сайдбаре */}
          {projects && projects.length > 0 && currentProjectId && onProjectChange && (
            <ProjectSwitcher
              projects={projects}
              currentProjectId={currentProjectId}
              currentProjectName={projectName}
              onSelect={onProjectChange}
            />
          )}

          {isCurrentProjectArchived && onUnarchiveCurrentProject && (
            <ProjectArchiveBadge
              onUnarchive={onUnarchiveCurrentProject}
              disabled={isUnarchivePending}
            />
          )}

          <Separator />
          {/* Мобильные кнопки перенесены на FAB канваса — см. mobile-canvas-fab.tsx */}
        </div>

        <div className="flex shrink-0 grow items-center gap-1 lg:gap-2">
          <Navigation
            currentTab={currentTab}
            onTabChange={onTabChange}
            isVertical={isVertical}
            isCompact={isCompact}
          />

          {currentTab === 'editor' ? (
            <EditorLearnButton active={learnActive} onStart={requestEditorLearn} />
          ) : null}

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
        </div>

        {/* Мобильная кнопка меню — скрыта, функционал перенесён на FAB и навигацию */}
        {/* <div className="lg:hidden">
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
        </div> */}
      </header>
    </>
  );
}