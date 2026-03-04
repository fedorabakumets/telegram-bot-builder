/**
 * @fileoverview Хук управления макетом редактора
 *
 * Управляет видимостью элементов гибкого макета.
 */

import { useCallback, useState, useMemo } from 'react';
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
  // Храним только ручные изменения видимости
  const [manualVisibility, setManualVisibility] = useState<Map<string, boolean>>(new Map());

  // Вычисляем конфигурацию на основе вкладки и ручных изменений
  const flexibleLayoutConfig = useMemo(() => {
    const baseConfig = createBaseConfig(isMobile, currentTab);
    
    // Применяем ручные изменения только для элементов, которые могут быть изменены вручную
    return {
      ...baseConfig,
      elements: baseConfig.elements.map(el => {
        // Для dialog и userDetails всегда используем базовую видимость из вкладки
        if (el.id === 'dialog' || el.id === 'userDetails') {
          return el;
        }
        
        // Для sidebar и properties применяем ручные изменения только на вкладке editor
        if ((el.id === 'sidebar' || el.id === 'properties') && currentTab === 'editor') {
          const manual = manualVisibility.get(el.id);
          if (manual !== undefined) {
            return { ...el, visible: manual };
          }
        }
        
        // Для code и codeEditor применяем ручные изменения только на вкладке export
        if ((el.id === 'code' || el.id === 'codeEditor') && currentTab === 'export') {
          const manual = manualVisibility.get(el.id);
          if (manual !== undefined) {
            return { ...el, visible: manual };
          }
        }
        
        return el;
      })
    };
  }, [isMobile, currentTab, manualVisibility]);

  const setFlexibleLayoutConfig = useCallback((updater: React.SetStateAction<SimpleLayoutConfig>) => {
    setManualVisibility(prev => {
      const newMap = new Map(prev);
      const config = typeof updater === 'function' ? updater({
        elements: [],
        compactMode: false,
        showGrid: true
      }) : updater;
      
      config.elements.forEach(el => {
        // Сохраняем только ручные изменения видимости
        if (el.id !== 'dialog' && el.id !== 'userDetails') {
          newMap.set(el.id, el.visible);
        }
      });
      
      return newMap;
    });
  }, []);

  const toggleElementVisibility = useCallback((elementId: 'header' | 'sidebar' | 'canvas' | 'properties' | 'code' | 'codeEditor' | 'dialog' | 'userDetails' | 'fileExplorer') => {
    setManualVisibility(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(elementId);
      newMap.set(elementId, current === undefined ? !createBaseConfig(isMobile, currentTab).elements.find(e => e.id === elementId)?.visible : !current);
      return newMap;
    });
  }, [isMobile, currentTab]);

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
