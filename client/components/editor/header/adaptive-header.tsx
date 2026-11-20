/**
 * @fileoverview Компоновка шапки редактора и переходов при отсутствии внешней навигации.
 */

import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import { useTelegramLogin } from '@/components/editor/header/hooks/use-telegram-login';
import { useTelegramAuthListener } from '@/components/editor/header/hooks/use-telegram-auth-listener';
import type { AdaptiveHeaderProps } from './types';
import { Navigation } from './components/navigation';
import { DesktopActionsFull } from './components/desktop-actions-full';
import { Separator } from './components/separator';
import { ProjectArchiveBadge } from './components/project-archive-badge';
import { EditorHorizontalHeader } from './components/editor-horizontal-header';
import { EditorHelpActions } from './components/editor-help-actions';
import { WorkspaceFallbackMenu } from './components/workspace-fallback-menu';

/**
 * Выбирает общую горизонтальную шапку или вертикальную навигацию макета.
 * @param props - Состояние проекта, макета и доступные действия.
 * @returns Шапка активного рабочего пространства.
 */
export function AdaptiveHeader({
  config,
  projectName,
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
  hasWorkspaceSidebar = false,
  propertiesVisible,
  canvasVisible,
  codeVisible,
  codeEditorVisible,
  isCurrentProjectArchived = false,
  onUnarchiveCurrentProject,
  isUnarchivePending = false,
  adminModeContent,
}: AdaptiveHeaderProps) {

  // Проверка авторизации пользователя
  const { user, logout, isLoading, isTelegramUser } = useTelegramAuth();
  const { handleTelegramLogin } = useTelegramLogin();

  // Подключаем listener postMessage один раз на верхнем уровне
  useTelegramAuthListener();

  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;

  if (isVertical) {
    return (
      <header className={`relative z-50 flex h-full w-full flex-col border-r border-border/50 bg-background ${isCompact ? 'text-sm' : ''}`}>
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
          adminModeContent={adminModeContent}
        />
      </header>
    );
  }

  return (
    <EditorHorizontalHeader projectName={projectName} projects={projects} currentProjectId={currentProjectId}
      onProjectChange={onProjectChange}
      projectActions={isCurrentProjectArchived && onUnarchiveCurrentProject && (
        <ProjectArchiveBadge onUnarchive={onUnarchiveCurrentProject} disabled={isUnarchivePending} />
      )}
      help={<EditorHelpActions compact={isCompact || !hasWorkspaceSidebar} canUseSupport={!!user && isTelegramUser(user)}
        showLearning={currentTab === 'editor'} />}
      fallbackActions={(!hasWorkspaceSidebar || adminModeContent) && (
        <>
          {adminModeContent}
          {!hasWorkspaceSidebar && <WorkspaceFallbackMenu currentTab={currentTab} onTabChange={onTabChange}
            onLoadTemplate={onLoadTemplate} onSaveAsTemplate={onSaveAsTemplate}
            user={user} onLogin={handleTelegramLogin} onLogout={logout} isAuthLoading={isLoading} />}
        </>
      )} />
  );
}
