/**
 * @fileoverview Компонент гибкого макета редактора
 *
 * Рендерит FlexibleLayout с SimpleLayoutCustomizer и всеми панелями.
 *
 * @module FlexibleLayoutView
 */

import { SimpleLayoutCustomizer } from '@/components/layout/simple-layout-customizer';
import { FlexibleLayout } from '@/components/layout/flexible/flexible-layout';
import { DialogPanel } from '@/components/editor/database/dialog/dialog-panel';
import { UserDetailsPanel } from '@/components/editor/database/user-details/user-details-panel';
import { CodeEditorArea } from '@/components/editor/code/editor';
import type { SimpleLayoutConfig } from '@/components/layout/simple-layout-customizer';
import type { UserBotData, BotProject } from '@shared/schema';
import type { EditorTab } from '../types';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

/** Параметры компонента FlexibleLayoutView */
export interface FlexibleLayoutViewProps {
  /** Конфигурация гибкого макета */
  flexibleLayoutConfig: SimpleLayoutConfig;
  /** Установить конфигурацию макета */
  setFlexibleLayoutConfig: React.Dispatch<React.SetStateAction<SimpleLayoutConfig>>;
  /** Контент заголовка */
  headerContent: React.ReactNode;
  /** Контент сайдбара */
  sidebarContent: React.ReactNode;
  /** Контент canvas */
  canvasContent: React.ReactNode;
  /** Контент свойств */
  propertiesContent: React.ReactNode;
  /** Контент панели кода */
  codeContent: React.ReactNode;
  /** Активный проект */
  activeProject: BotProject;
  /** Выбранный пользователь для диалога */
  selectedDialogUser: UserBotData | null;
  /** Выбранный пользователь для деталей */
  selectedUserDetails: UserBotData | null;
  /** Закрыть панель диалога */
  onCloseDialogPanel: () => void;
  /** Открыть панель диалога */
  onOpenDialogPanel: (user: UserBotData) => void;
  /** Закрыть панель деталей */
  onCloseUserDetailsPanel: () => void;
  /** Открыть панель деталей */
  onOpenUserDetailsPanel: (user: UserBotData) => void;
  /** Выбрать пользователя в диалоге */
  onSelectDialogUser: (user: UserBotData) => void;
  /** Выбрать пользователя в деталях */
  onSelectUserDetails: (user: UserBotData) => void;
  /** Флаг загрузки кода */
  isCodeLoading: boolean;
  /** Отображаемый контент кода */
  displayContent: string;
  /** Выбранный формат */
  selectedFormat: string;
  /** Тема редактора */
  theme: string;
  /** Ref редактора */
  editorRef: MutableRefObject<any>;
  /** Статистика кода */
  codeStats: { totalLines: number; truncated: boolean; functions: number; classes: number; comments: number };
  /** Установить флаг свёрнутости */
  setAreAllCollapsed: Dispatch<SetStateAction<boolean>>;
  /** Все секции свёрнуты */
  areAllCollapsed: boolean;
  /** Обработчик изменения контента */
  onContentChange: (value: string) => void;
  /** Мобильный режим */
  isMobile: boolean;
  /** Текущая вкладка */
  currentTab: EditorTab;
}

/**
 * Компонент гибкого макета редактора.
 * Оборачивает FlexibleLayout в SimpleLayoutCustomizer.
 *
 * @param props - Параметры компонента
 * @returns JSX элемент гибкого макета
 */
export function FlexibleLayoutView(props: FlexibleLayoutViewProps) {
  const {
    flexibleLayoutConfig,
    setFlexibleLayoutConfig,
    headerContent,
    sidebarContent,
    canvasContent,
    propertiesContent,
    codeContent,
    activeProject,
    selectedDialogUser,
    selectedUserDetails,
    onCloseDialogPanel,
    onOpenDialogPanel,
    onCloseUserDetailsPanel,
    onSelectDialogUser,
    onSelectUserDetails,
    isCodeLoading,
    displayContent,
    selectedFormat,
    theme,
    editorRef,
    codeStats,
    setAreAllCollapsed,
    areAllCollapsed,
    onContentChange,
    isMobile,
    currentTab,
  } = props;

  return (
    <SimpleLayoutCustomizer config={flexibleLayoutConfig} onConfigChange={setFlexibleLayoutConfig}>
      <FlexibleLayout
        config={flexibleLayoutConfig}
        headerContent={headerContent}
        sidebarContent={sidebarContent}
        canvasContent={canvasContent}
        propertiesContent={propertiesContent}
        codeContent={codeContent}
        codeEditorContent={
          <div className="h-full flex flex-col">
            <CodeEditorArea
              isMobile={false}
              isLoading={isCodeLoading}
              displayContent={displayContent}
              selectedFormat={selectedFormat as Parameters<typeof CodeEditorArea>[0]['selectedFormat']}
              theme={theme}
              editorRef={editorRef}
              codeStats={codeStats}
              setAreAllCollapsed={setAreAllCollapsed}
              areAllCollapsed={areAllCollapsed}
              onContentChange={onContentChange}
            />
          </div>
        }
        dialogContent={
          selectedDialogUser && (
            <DialogPanel
              key={`dialog-${selectedDialogUser.userId ?? 'none'}`}
              projectId={activeProject.id}
              user={selectedDialogUser}
              onClose={onCloseDialogPanel}
              onSelectUser={onSelectDialogUser}
            />
          )
        }
        userDetailsContent={
          selectedUserDetails && (
            <UserDetailsPanel
              key={`userdetails-${selectedUserDetails.userId ?? 'none'}`}
              projectId={activeProject.id}
              user={selectedUserDetails}
              onClose={onCloseUserDetailsPanel}
              onOpenDialog={onOpenDialogPanel}
              onSelectUser={onSelectUserDetails}
            />
          )
        }
        onConfigChange={setFlexibleLayoutConfig}
        hideOnMobile={isMobile}
        currentTab={currentTab}
      />
    </SimpleLayoutCustomizer>
  );
}
