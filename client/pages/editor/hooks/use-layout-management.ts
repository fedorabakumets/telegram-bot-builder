/**
 * @fileoverview Хук управления макетом редактора
 *
 * Управляет видимостью элементов гибкого макета.
 */

import { useCallback, useState, useEffect } from 'react';
import type { SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';

/** Результат работы хука управления макетом */
interface UseLayoutManagerResult {
  /** Конфигурация макета */
  flexibleLayoutConfig: SimpleLayoutConfig;
  /** Функция обновления конфигурации */
  setFlexibleLayoutConfig: React.Dispatch<React.SetStateAction<SimpleLayoutConfig>>;
  /** Переключение видимости шапки */
  handleToggleHeader: () => void;
  /** Переключение видимости сайдбара */
  handleToggleSidebar: () => void;
  /** Переключение видимости панели свойств */
  handleToggleProperties: () => void;
  /** Переключение видимости холста */
  handleToggleCanvas: () => void;
}

/**
 * Создаёт базовую конфигурацию макета
 *
 * @param isMobile - Флаг мобильного устройства
 * @param currentTab - Текущая вкладка
 * @returns Базовая конфигурация
 */
function createBaseConfig(isMobile: boolean, currentTab: string): SimpleLayoutConfig {
  const headerSize = isMobile ? 2.5 : 3;
  // Показываем sidebar и properties только на вкладке editor
  const showPanels = currentTab === 'editor';
  // Скрываем canvas на вкладке export (Код)
  const showCanvas = currentTab !== 'export';
  // Показываем code и codeEditor только на вкладке export
  const showCodePanels = currentTab === 'export';

  return {
    elements: [
      { id: 'header', type: 'header', name: 'Шапка', position: 'top', size: headerSize, visible: true },
      { id: 'sidebar', type: 'sidebar', name: 'Боковая панель', position: 'left', size: 20, visible: showPanels },
      { id: 'canvas', type: 'canvas', name: 'Холст', position: 'center', size: 35, visible: showCanvas },
      { id: 'properties', type: 'properties', name: 'Свойства', position: 'right', size: 20, visible: showPanels },
      { id: 'code', type: 'code', name: 'Код', position: 'left', size: 25, visible: showCodePanels },
      { id: 'codeEditor', type: 'codeEditor', name: 'Редактор кода', position: 'center', size: 40, visible: showCodePanels },
      { id: 'dialog', type: 'dialog', name: 'Диалог', position: 'right', size: 25, visible: currentTab === 'users' },
      { id: 'userDetails', type: 'userDetails', name: 'Детали пользователя', position: 'left', size: 25, visible: currentTab === 'users' },
      { id: 'fileExplorer', type: 'fileExplorer', name: 'Проводник файлов', position: 'left', size: 25, visible: false },
    ],
    compactMode: false,
    showGrid: true
  };
}

/**
 * Хук для управления макетом редактора
 *
 * @param isMobile - Флаг мобильного устройства
 * @param currentTab - Текущая вкладка
 * @returns Методы управления макетом
 */
export function useLayoutManager(
  isMobile: boolean,
  currentTab: string
): UseLayoutManagerResult {
  const [flexibleLayoutConfig, setFlexibleLayoutConfig] = useState<SimpleLayoutConfig>(
    createBaseConfig(isMobile, currentTab)
  );

  // Обновляем конфигурацию при изменении вкладки
  useEffect(() => {
    setFlexibleLayoutConfig(prev => {
      const newConfig = createBaseConfig(isMobile, currentTab);
      // Сохраняем текущее состояние видимости для ручных изменений
      return {
        ...newConfig,
        elements: newConfig.elements.map(newEl => {
          const prevEl = prev.elements.find(el => el.id === newEl.id);
          // Для dialog и userDetails используем новую видимость из вкладки
          if (newEl.id === 'dialog' || newEl.id === 'userDetails') {
            return newEl;
          }
          // Для sidebar, properties, code и codeEditor сохраняем ручные изменения
          if ((newEl.id === 'sidebar' || newEl.id === 'properties' || newEl.id === 'code' || newEl.id === 'codeEditor') && currentTab !== 'editor' && currentTab !== 'export') {
            return { ...newEl, visible: false };
          }
          return prevEl ? { ...newEl, visible: prevEl.visible } : newEl;
        })
      };
    });
  }, [currentTab, isMobile]);

  const toggleElementVisibility = useCallback((elementId: 'header' | 'sidebar' | 'canvas' | 'properties' | 'code' | 'codeEditor' | 'dialog' | 'userDetails' | 'fileExplorer') => {
    setFlexibleLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === elementId
          ? { ...element, visible: !element.visible }
          : element
      )
    }));
  }, []);

  const handleToggleHeader = useCallback(() => toggleElementVisibility('header'), [toggleElementVisibility]);
  const handleToggleSidebar = useCallback(() => toggleElementVisibility('sidebar'), [toggleElementVisibility]);
  const handleToggleProperties = useCallback(() => toggleElementVisibility('properties'), [toggleElementVisibility]);
  const handleToggleCanvas = useCallback(() => toggleElementVisibility('canvas'), [toggleElementVisibility]);

  return {
    flexibleLayoutConfig,
    setFlexibleLayoutConfig,
    handleToggleHeader,
    handleToggleSidebar,
    handleToggleProperties,
    handleToggleCanvas
  };
}
