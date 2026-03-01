import React from 'react';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { FlexibleLayoutProps } from './types';
import { useElementContent } from './hooks';
import { getVisibleElements, getElementsByPosition, isUsersTabLayout } from './utils';
import { EmptyState, SingleElementLayout, TopBottomLayout, SidePanelsLayout, CombinedLayout } from './components';

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
        <SingleElementLayout>
          {getElementContent(singleElement.type)}
        </SingleElementLayout>
      );
    }

    // Определяем элементы по позициям
    const { topEl, bottomEl, leftEl, rightElements, centerEl } = getElementsByPosition(visibleElements);

    // Если есть только верхняя/нижняя панель и основной контент
    if (topEl && !leftEl && rightElements.length === 0 && (centerEl || bottomEl)) {
      return (
        <TopBottomLayout
          topContent={getElementContent(topEl.type)}
          centerContent={centerEl ? getElementContent(centerEl.type) : null}
          bottomContent={bottomEl ? getElementContent(bottomEl.type) : null}
          topSize={topEl.size}
          isMobile={isMobile}
        />
      );
    }

    // Если есть боковые панели и основной контент
    if ((leftEl || rightElements.length > 0) && centerEl && !topEl && !bottomEl) {
      const isUsersTab = isUsersTabLayout(leftEl, rightElements);

      return (
        <SidePanelsLayout
          leftContent={leftEl ? getElementContent(leftEl.type) : null}
          leftType={leftEl?.type}
          centerContent={getElementContent(centerEl.type)}
          centerSize={centerEl.size || 50}
          rightElements={rightElements.map(el => ({
            id: el.id,
            type: el.type,
            content: getElementContent(el.type),
            size: el.size,
          }))}
          isUsersTab={isUsersTab}
        />
      );
    }

    return (
      <CombinedLayout
        topContent={topEl ? getElementContent(topEl.type) : null}
        topSize={topEl?.size}
        leftContent={leftEl ? getElementContent(leftEl.type) : null}
        leftType={leftEl?.type}
        centerContent={centerEl ? getElementContent(centerEl.type) : null}
        rightElements={rightElements.map(el => ({
          id: el.id,
          type: el.type,
          content: getElementContent(el.type),
          size: el.size,
        }))}
        bottomContent={bottomEl ? getElementContent(bottomEl.type) : null}
        bottomSize={bottomEl?.size}
      />
    );
  };

  return (
    <div className="h-screen overflow-hidden">
      {createSimpleLayout()}
    </div>
  );
}