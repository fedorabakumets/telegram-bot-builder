/**
 * @fileoverview Компонент заголовка редактора
 *
 * Рендерит AdaptiveHeader с необходимыми пропсами.
 *
 * @module HeaderContent
 */

import { AdaptiveHeader } from '@/components/editor/header/adaptive-header';
import type { EditorTab } from '../types';
import type { SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';

/** Параметры компонента HeaderContent */
export interface HeaderContentProps {
  /** Конфигурация макета */
  layoutConfig: any;
  /** Гибкая конфигурация макета */
  flexibleLayoutConfig: SimpleLayoutConfig;
  /** Имя проекта */
  projectName: string;
  /** Текущая вкладка */
  currentTab: EditorTab;
  /** Обработчик смены вкладки */
  onTabChange: (tab: EditorTab) => void;
  /** Сохранить как шаблон */
  onSaveAsTemplate: () => void;
  /** Загрузить шаблон */
  onLoadTemplate: () => void;
  /** Открыть менеджер макета */
  onLayoutSettings: () => void;
  /** Переключить код */
  onToggleCode: () => void;
  /** Переключить редактор кода */
  onToggleCodeEditor: () => void;
  /** Открыть мобильный сайдбар */
  onOpenMobileSidebar: () => void;
  /** Открыть мобильную панель свойств */
  onOpenMobileProperties: () => void;
}

/**
 * Компонент заголовка редактора
 *
 * @param props - Параметры компонента
 * @returns JSX элемент заголовка
 */
export function HeaderContent(props: HeaderContentProps) {
  const {
    layoutConfig,
    flexibleLayoutConfig,
    projectName,
    currentTab,
    onTabChange,
    onSaveAsTemplate,
    onLoadTemplate,
    onLayoutSettings,
    onToggleCode,
    onToggleCodeEditor,
    onOpenMobileSidebar,
    onOpenMobileProperties,
  } = props;

  return (
    <AdaptiveHeader
      config={layoutConfig}
      projectName={projectName}
      currentTab={currentTab}
      onTabChange={onTabChange}
      onExport={() => {}}
      onSaveAsTemplate={onSaveAsTemplate}
      onLoadTemplate={onLoadTemplate}
      onLayoutSettings={onLayoutSettings}
      onToggleCode={onToggleCode}
      onToggleCodeEditor={onToggleCodeEditor}
      headerVisible={flexibleLayoutConfig.elements.find((el: SimpleLayoutConfig['elements'][0]) => el.id === 'header')?.visible ?? true}
      sidebarVisible={flexibleLayoutConfig.elements.find((el: SimpleLayoutConfig['elements'][0]) => el.id === 'sidebar')?.visible ?? true}
      propertiesVisible={flexibleLayoutConfig.elements.find((el: SimpleLayoutConfig['elements'][0]) => el.id === 'properties')?.visible ?? true}
      canvasVisible={flexibleLayoutConfig.elements.find((el: SimpleLayoutConfig['elements'][0]) => el.id === 'canvas')?.visible ?? true}
      codeVisible={false}
      codeEditorVisible={false}
      onOpenMobileSidebar={onOpenMobileSidebar}
      onOpenMobileProperties={onOpenMobileProperties}
    />
  );
}
