import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useMediaQuery } from '@/components/editor/properties/media/use-media-query';
import { CodeResizeHandle } from '../code-resize-handle';
import { DialogResizeHandle } from '../dialog-resize-handle';
import { FlexibleLayoutProps } from './types';
import { useElementContent } from './hooks';
import { getVisibleElements, getElementsByPosition, calculateTotalRightSize, isUsersTabLayout } from './utils';
import { EmptyState } from './components';

/**
 * @fileoverview Гибкий компонент макета интерфейса
 * @description Позволяет настраивать расположение элементов интерфейса
 */

/**
 * Гибкий компонент макета
 * @param props - Свойства компонента
 * @returns JSX элемент макета
 */
export const FlexibleLayout: React.FC<FlexibleLayoutProps> = ({
  config,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  codeContent,
  codeEditorContent,
  dialogContent,
  userDetailsContent,
  fileExplorerContent,
  onConfigChange,
  hideOnMobile = false,
}) => {
  const isMobile = useMediaQuery('(max-width: 1200px)');

  const { getElementContent } = useElementContent({
    headerContent,
    sidebarContent,
    canvasContent,
    propertiesContent,
    codeContent,
    codeEditorContent,
    dialogContent,
    userDetailsContent,
    fileExplorerContent,
  });

  const visibleElements = getVisibleElements(config, hideOnMobile, isMobile);

  const createSimpleLayout = () => {
    if (visibleElements.length === 0) {
      return (
        <EmptyState
          config={config}
          isMobile={isMobile}
          hideOnMobile={hideOnMobile}
          onConfigChange={onConfigChange}
        />
      );
    }

    // Если есть только один элемент
    if (visibleElements.length === 1) {
      const singleElement = visibleElements[0];
      return (
        <div className="h-full w-full overflow-hidden bg-background">
          <div className="h-full w-full">
            {getElementContent(singleElement.type)}
          </div>
        </div>
      );
    }

    // Определяем элементы по позициям
    const { topEl, bottomEl, leftEl, rightElements, centerEl } = getElementsByPosition(visibleElements);

    const totalRightSize = calculateTotalRightSize(rightElements);

    // Если есть только верхняя/нижняя панель и основной контент
    if (topEl && !leftEl && rightElements.length === 0 && (centerEl || bottomEl)) {
      // Скрываем ResizableHandle на мобильных устройствах для вкладки "Бот"

      return (
        <ResizablePanelGroup direction="vertical" className="h-full gap-0">
          <ResizablePanel id="top-panel" order={1} defaultSize={isMobile ? 7 : topEl.size} minSize={isMobile ? 7 : 15} maxSize={30} className="p-0 m-0">
            <div className="h-full bg-background overflow-auto">
              {getElementContent(topEl.type)}
            </div>
          </ResizablePanel>
          <ResizableHandle className="!hidden" style={{ height: 0, margin: 0, padding: 0 }} />
          <ResizablePanel id="main-panel" order={2} defaultSize={isMobile ? 93 : (100 - topEl.size)} className="p-0 m-0">
            <div className="h-full bg-background overflow-auto">
              {centerEl ? getElementContent(centerEl.type) : (bottomEl ? getElementContent(bottomEl.type) : null)}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Если есть боковые панели и основной контент
    if ((leftEl || rightElements.length > 0) && centerEl && !topEl && !bottomEl) {
      const leftSize = leftEl?.size || 0;
      const isUsersTab = isUsersTabLayout(leftEl, rightElements);
      const hasDialog = rightElements.some(el => el.type === 'dialog');
      const centerMinSize = isUsersTab ? 20 : 50;
      const centerMaxSize = isUsersTab ? 80 : (rightElements.length > 0 ? 70 : 85);
      const sideMinSize = isUsersTab ? 10 : 15;
      const sideMaxSize = isUsersTab ? 45 : 40;

      return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {leftEl && (
            <>
              <ResizablePanel
                id="left-panel"
                order={1}
                defaultSize={leftSize}
                minSize={sideMinSize}
                maxSize={sideMaxSize}
                className="overflow-hidden"
              >
                <div className="h-full w-full bg-background overflow-hidden flex flex-col">
                  {getElementContent(leftEl.type)}
                </div>
              </ResizablePanel>
              {leftEl.type === 'userDetails' ? (
                <DialogResizeHandle direction="vertical" />
              ) : (
                <CodeResizeHandle direction="vertical" />
              )}
            </>
          )}
          <ResizablePanel
            id="center-panel"
            order={2}
            defaultSize={centerEl.size || 50}
            minSize={centerMinSize}
            maxSize={centerMaxSize}
            className="overflow-hidden"
          >
            <div className="h-full w-full bg-background overflow-hidden flex flex-col">
              {getElementContent(centerEl.type)}
            </div>
          </ResizablePanel>
          {rightElements.length > 0 && (
            <>
              {hasDialog ? (
                <DialogResizeHandle direction="vertical" />
              ) : (
                <CodeResizeHandle direction="vertical" />
              )}
              <ResizablePanel
                id="right-panel"
                order={3}
                defaultSize={totalRightSize}
                minSize={sideMinSize}
                maxSize={sideMaxSize}
                className="overflow-hidden"
              >
                <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                  {rightElements.flatMap((rightEl, index) => [
                    ...(index > 0 ? [<ResizableHandle key={`handle-${rightEl.id}`} withHandle />] : []),
                    <ResizablePanel
                      key={`panel-${rightEl.id}`}
                      id={`right-subpanel-${rightEl.id}`}
                      order={index + 1}
                      defaultSize={totalRightSize > 0 ? (rightEl.size / totalRightSize) * 100 : 50}
                      minSize={sideMinSize}
                      maxSize={100}
                      className="overflow-hidden"
                    >
                      <div className="h-full w-full overflow-hidden flex flex-col">
                        {getElementContent(rightEl.type)}
                      </div>
                    </ResizablePanel>
                  ])}
                </ResizablePanelGroup>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      );
    }

    // Комбинированный макет (верх + боковые панели)
    return (
      <div className="h-full flex flex-col">
        {topEl && (
          <div className="bg-background" style={{ minHeight: `${topEl.size}rem` }}>
            {getElementContent(topEl.type)}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {leftEl && (
              <>
                <ResizablePanel
                  id="combo-left-panel"
                  order={1}
                  defaultSize={leftEl.size}
                  minSize={leftEl.type === 'userDetails' ? 10 : 15}
                  maxSize={leftEl.type === 'userDetails' ? 45 : 40}
                  className="w-full overflow-hidden"
                >
                  <div className="h-full w-full border-r border-border bg-background overflow-hidden">
                    {getElementContent(leftEl.type)}
                  </div>
                </ResizablePanel>
                {leftEl.type === 'userDetails' ? (
                  <DialogResizeHandle direction="vertical" />
                ) : (
                  <CodeResizeHandle direction="vertical" />
                )}
              </>
            )}
            <ResizablePanel
              id="combo-center-panel"
              order={2}
              defaultSize={rightElements.length > 0 ? 60 : 80}
              minSize={rightElements.some(el => el.type === 'dialog') || leftEl?.type === 'userDetails' ? 20 : 50}
              maxSize={rightElements.length > 0 ? 80 : 85}
              className="overflow-hidden"
            >
              <div className="h-full w-full bg-background overflow-hidden flex flex-col">
                {centerEl ? getElementContent(centerEl.type) : null}
              </div>
            </ResizablePanel>
            {rightElements.length > 0 && (
              <>
                {rightElements.some(el => el.type === 'dialog') ? (
                  <DialogResizeHandle direction="vertical" />
                ) : (
                  <CodeResizeHandle direction="vertical" />
                )}
                <ResizablePanel
                  id="combo-right-panel"
                  order={3}
                  defaultSize={totalRightSize}
                  minSize={rightElements.some(el => el.type === 'dialog') ? 10 : 15}
                  maxSize={rightElements.some(el => el.type === 'dialog') ? 45 : 40}
                  className="w-full overflow-hidden"
                >
                  <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                    {rightElements.flatMap((rightEl, index) => [
                      ...(index > 0 ? [<ResizableHandle key={`handle-${rightEl.id}`} withHandle className="bg-gradient-to-r from-transparent via-slate-200/0 to-transparent hover:from-purple-500/15 hover:via-purple-500/30 hover:to-purple-500/15 dark:hover:from-purple-600/15 dark:hover:via-purple-500/25 dark:hover:to-purple-600/15 transition-all duration-300 w-0.5 hover:w-1.5 active:w-2 cursor-col-resize relative flex items-center justify-center group shadow-sm hover:shadow-md" />] : []),
                      <ResizablePanel
                        key={`panel-${rightEl.id}`}
                        id={`combo-right-subpanel-${rightEl.id}`}
                        order={index + 1}
                        defaultSize={totalRightSize > 0 ? (rightEl.size / totalRightSize) * 100 : 50}
                        minSize={rightEl.type === 'dialog' ? 10 : 10}
                        maxSize={100}
                        className="overflow-hidden"
                      >
                        <div className="h-full w-full overflow-hidden flex flex-col">
                          {getElementContent(rightEl.type)}
                        </div>
                      </ResizablePanel>
                    ])}
                  </ResizablePanelGroup>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
        {bottomEl && (
          <div className="border-t border-border bg-background" style={{ minHeight: `${bottomEl.size}px` }}>
            {getElementContent(bottomEl.type)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden">
      {createSimpleLayout()}
    </div>
  );
};

/**
 * @exports FlexibleLayout
 * @description Экспортирует компонент FlexibleLayout по умолчанию
 */
export default FlexibleLayout;