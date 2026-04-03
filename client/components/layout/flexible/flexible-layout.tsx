/**
 * @fileoverview Гибкий компонент макета интерфейса
 * @description Позволяет настраивать расположение элементов интерфейса.
 * На мобильных устройствах (< 768px) панель кода и редактор кода
 * переключаются через вкладки вместо отображения рядом.
 */

import React from 'react';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { FlexibleLayoutProps } from './types';
import { useElementContent } from './hooks';
import { getVisibleElements, getElementsByPosition, isUsersTabLayout } from './utils';
import { EmptyState, SingleElementLayout, TopBottomLayout, SidePanelsLayout, CombinedLayout, CodeMobileLayout } from './components';

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
  /** Флаг мобильного устройства для переключения вкладок кода */
  const isMobileCode = useMediaQuery('(max-width: 767px)');

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

  /**
   * Проверяет, нужно ли объединить code + codeEditor в мобильный layout
   * @returns true если оба элемента видимы и устройство мобильное
   */
  const shouldUseMobileCodeLayout = (): boolean => {
    if (!isMobileCode) return false;
    const codeEl = visibleElements.find(el => el.type === 'code');
    const codeEditorEl = visibleElements.find(el => el.type === 'codeEditor');
    return !!(codeEl && codeEditorEl);
  };

  /**
   * Возвращает список элементов с заменой code+codeEditor на CodeMobileLayout
   * @returns Модифицированный список видимых элементов
   */
  const getEffectiveElements = () => {
    if (!shouldUseMobileCodeLayout()) return visibleElements;
    // Убираем 'code' (левая панель), заменяем 'codeEditor' (центр) на CodeMobileLayout
    return visibleElements
      .filter(el => el.type !== 'code')
      .map(el => el.type === 'codeEditor' ? { ...el, _isMobileCode: true } : el);
  };

  /**
   * Возвращает контент элемента, подставляя CodeMobileLayout для codeEditor на мобильных
   * @param type - Тип элемента
   * @returns Контент элемента
   */
  const getEffectiveContent = (type: string) => {
    if (type === 'codeEditor' && shouldUseMobileCodeLayout()) {
      return (
        <CodeMobileLayout
          panelContent={codeContent}
          editorContent={codeEditorContent}
        />
      );
    }
    return getElementContent(type);
  };

  const createSimpleLayout = () => {
    const effectiveElements = getEffectiveElements();

    if (effectiveElements.length === 0) {
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
    if (effectiveElements.length === 1) {
      const singleElement = effectiveElements[0];
      return (
        <SingleElementLayout>
          {getEffectiveContent(singleElement.type)}
        </SingleElementLayout>
      );
    }

    // Определяем элементы по позициям
    const { topEl, bottomEl, leftEl, rightElements, centerEl } = getElementsByPosition(effectiveElements);

    // Если есть только верхняя/нижняя панель и основной контент
    if (topEl && !leftEl && rightElements.length === 0 && (centerEl || bottomEl)) {
      return (
        <TopBottomLayout
          topContent={getEffectiveContent(topEl.type)}
          centerContent={centerEl ? getEffectiveContent(centerEl.type) : null}
          bottomContent={bottomEl ? getEffectiveContent(bottomEl.type) : null}
          topSize={topEl.size}
          isMobile={isMobile}
        />
      );
    }

    // Если есть боковые панели и основной контент
    if ((leftEl || rightElements.length > 0) && centerEl && !topEl && !bottomEl) {
      // Фильтруем левый элемент по контенту
      const validLeftContent = leftEl ? getEffectiveContent(leftEl.type) : null;
      
      // Фильтруем правые элементы с null/undefined/false контентом
      const validRightElements = rightElements
        .map(el => ({
          id: el.id,
          type: el.type,
          content: getEffectiveContent(el.type),
          size: el.size,
        }))
        .filter(el => el.content);

      // Проверяем, есть ли фактически показываемые боковые панели
      const hasLeftPanel = validLeftContent !== null;
      const hasRightPanels = validRightElements.length > 0;
      
      // Если нет ни левой, ни правой панели, показываем только центр
      if (!hasLeftPanel && !hasRightPanels) {
        return (
          <SingleElementLayout>
            {getEffectiveContent(centerEl.type)}
          </SingleElementLayout>
        );
      }

      const isUsersTab = hasLeftPanel || hasRightPanels;

      return (
        <SidePanelsLayout
          leftContent={validLeftContent}
          leftType={leftEl?.type}
          centerContent={getEffectiveContent(centerEl.type)}
          centerSize={centerEl.size || 50}
          rightElements={validRightElements}
          isUsersTab={isUsersTab}
        />
      );
    }

    return (
      <CombinedLayout
        topContent={topEl ? getEffectiveContent(topEl.type) : null}
        topSize={topEl?.size}
        leftContent={leftEl ? getEffectiveContent(leftEl.type) : null}
        leftType={leftEl?.type}
        centerContent={centerEl ? getEffectiveContent(centerEl.type) : null}
        rightElements={rightElements
          .map(el => ({
            id: el.id,
            type: el.type,
            content: getEffectiveContent(el.type),
            size: el.size,
          }))
          .filter(el => el.content)}
        bottomContent={bottomEl ? getEffectiveContent(bottomEl.type) : null}
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