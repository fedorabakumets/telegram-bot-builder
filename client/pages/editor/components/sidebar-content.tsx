/**
 * @fileoverview Компонент содержимого сайдбара редактора
 *
 * Выбирает между CodePanel и ComponentsSidebar в зависимости от состояния.
 *
 * @module SidebarContent
 */

import { CodePanel } from '@/components/editor/code/panel';
import { ComponentsSidebar } from '@/components/editor/sidebar/components-sidebar';
import type { BotData, BotProject } from '@shared/schema';
import type { ComponentDefinition } from '@shared/schema';
import type { CodeFormat } from '@/components/editor/code/hooks';
import type { SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';

/** Параметры компонента SidebarContent */
export interface SidebarContentProps {
  /** Флаг видимости панели кода */
  codePanelVisible: boolean;
  /** Текущая вкладка */
  currentTab: string;
  /** Все проекты */
  allProjects: BotProject[];
  /** Активный проект */
  activeProject: BotProject;
  /** Конфигурация гибкого макета */
  flexibleLayoutConfig: SimpleLayoutConfig;
  /** Установить конфигурацию макета */
  setFlexibleLayoutConfig: React.Dispatch<React.SetStateAction<SimpleLayoutConfig>>;
  /** Выбранный формат кода */
  selectedFormat: CodeFormat;
  /** Обработчик смены формата */
  onFormatChange: (format: CodeFormat) => void;
  /** Все секции свёрнуты */
  areAllCollapsed: boolean;
  /** Установить флаг свёрнутости */
  setAreAllCollapsed: (v: boolean) => void;
  /** Показать полный код */
  showFullCode: boolean;
  /** Установить флаг полного кода */
  setShowFullCode: (v: boolean) => void;
  /** Сгенерированный контент кода */
  generatedCodeContent: Record<string, string>;
  /** Флаг загрузки кода */
  isCodeLoading: boolean;
  /** Отображаемый контент */
  displayContent: string;
  /** Применить JSON */
  onApplyJson: (json: string) => void;
  /** Редактируемый контент */
  editedJsonContent: string;
  /** Сбросить редактор */
  onResetEditor: () => void;
  /** Закрыть панель кода */
  onToggleCodePanel: () => void;
  /** Обработчик перетаскивания компонента */
  onComponentDrag: (component: ComponentDefinition) => void;
  /** Обработчик добавления компонента */
  onComponentAdd: (component: ComponentDefinition) => void;
  /** Обновить конфигурацию макета */
  onLayoutChange: (config: unknown) => void;
  /** Перейти к проектам */
  onGoToProjects: () => void;
  /** Выбрать проект */
  onProjectSelect: (id: number) => void;
  /** ID активного листа */
  activeSheetId: string | undefined;
  /** Контент заголовка */
  headerContent: React.ReactNode;
  /** Контент canvas */
  canvasContent: React.ReactNode;
  /** Контент свойств */
  propertiesContent: React.ReactNode;
  /** Переключить canvas */
  onToggleCanvas: () => void;
  /** Переключить заголовок */
  onToggleHeader: () => void;
  /** Переключить свойства */
  onToggleProperties: () => void;
  /** Обработчики листов */
  onSheetAdd: () => void;
  onSheetDelete: (id: string) => void;
  onSheetRename: (id: string, name: string) => void;
  onSheetDuplicate: (id: string) => void;
  onSheetSelect: (id: string) => void;
  /** Мобильный режим */
  isMobile: boolean;
  /** Закрыть сайдбар */
  onClose: () => void;
  /** Фокус на узле */
  onNodeFocus: (nodeId: string, buttonId?: string) => void;
}

/**
 * Компонент содержимого сайдбара.
 * Показывает CodePanel если панель кода активна, иначе ComponentsSidebar.
 *
 * @param props - Параметры компонента
 * @returns JSX элемент сайдбара
 */
export function SidebarContent(props: SidebarContentProps) {
  const { codePanelVisible, currentTab, flexibleLayoutConfig } = props;

  const getVisible = (id: string) =>
    flexibleLayoutConfig.elements.find(el => el.id === id)?.visible ?? true;

  if (codePanelVisible) {
    return (
      <div className="h-full border-r bg-background">
        <CodePanel
          botDataArray={props.allProjects.map(p => p.data as BotData)}
          projectIds={props.allProjects.map(p => p.id)}
          projectName={props.activeProject.name}
          onClose={props.onToggleCodePanel}
          selectedFormat={props.selectedFormat}
          onFormatChange={props.onFormatChange}
          areAllCollapsed={props.areAllCollapsed}
          onCollapseChange={props.setAreAllCollapsed}
          showFullCode={props.showFullCode}
          onShowFullCodeChange={props.setShowFullCode}
          codeContent={props.generatedCodeContent}
          isLoading={props.isCodeLoading}
          displayContent={props.displayContent}
          onApplyJson={props.onApplyJson}
          editedContent={props.editedJsonContent}
          onResetEditor={props.onResetEditor}
        />
      </div>
    );
  }

  if (currentTab !== 'editor') return null;

  return (
    <ComponentsSidebar
      onComponentDrag={props.onComponentDrag}
      onComponentAdd={props.onComponentAdd}
      onLayoutChange={props.onLayoutChange}
      onGoToProjects={props.onGoToProjects}
      onProjectSelect={props.onProjectSelect}
      currentProjectId={props.activeProject.id}
      activeSheetId={props.activeSheetId}
      headerContent={props.headerContent}
      sidebarContent={<div>Sidebar</div>}
      canvasContent={props.canvasContent}
      propertiesContent={props.propertiesContent}
      onToggleCanvas={props.onToggleCanvas}
      onToggleHeader={props.onToggleHeader}
      onToggleProperties={props.onToggleProperties}
      onShowFullLayout={() => {
        props.setFlexibleLayoutConfig(prev => ({
          ...prev,
          elements: prev.elements.map(el => ({ ...el, visible: true })),
        }));
      }}
      canvasVisible={getVisible('canvas')}
      headerVisible={getVisible('header')}
      propertiesVisible={getVisible('properties')}
      showLayoutButtons={!getVisible('canvas') && !getVisible('header')}
      onSheetAdd={props.onSheetAdd}
      onSheetDelete={props.onSheetDelete}
      onSheetRename={props.onSheetRename}
      onSheetDuplicate={props.onSheetDuplicate}
      onSheetSelect={props.onSheetSelect}
      isMobile={props.isMobile}
      onClose={props.onClose}
      onNodeFocus={props.onNodeFocus}
    />
  );
}
