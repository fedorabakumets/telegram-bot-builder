/**
 * @fileoverview Хук для маппинга типов элементов на контент
 * @description Возвращает контент элемента по его типу
 */

import { ReactNode } from 'react';

/**
 * Параметры хука useElementContent
 */
interface UseElementContentParams {
  /** Контент заголовка */
  headerContent: ReactNode;
  /** Контент боковой панели */
  sidebarContent: ReactNode;
  /** Контент холста */
  canvasContent: ReactNode;
  /** Контент панели свойств */
  propertiesContent: ReactNode;
  /** Контент панели кода */
  codeContent?: ReactNode;
  /** Контент редактора кода */
  codeEditorContent?: ReactNode;
  /** Контент диалогового окна */
  dialogContent?: ReactNode;
  /** Контент информации о пользователе */
  userDetailsContent?: ReactNode;
  /** Контент проводника файлов */
  fileExplorerContent?: ReactNode;
}

/**
 * Хук для получения контента по типу элемента
 * @param params - Параметры с контентом элементов
 * @returns Функция getElementContent
 */
export function useElementContent(params: UseElementContentParams) {
  const {
    headerContent,
    sidebarContent,
    canvasContent,
    propertiesContent,
    codeContent,
    codeEditorContent,
    dialogContent,
    userDetailsContent,
    fileExplorerContent,
  } = params;

  /**
   * Возвращает контент по типу элемента
   * @param type - Тип элемента
   * @returns Контент или null
   */
  function getElementContent(type: string): ReactNode | null {
    switch (type) {
      case 'header':
        return headerContent;
      case 'sidebar':
        return sidebarContent;
      case 'canvas':
        return canvasContent;
      case 'properties':
        return propertiesContent;
      case 'code':
        return codeContent;
      case 'codeEditor':
        return codeEditorContent;
      case 'dialog':
        return dialogContent;
      case 'userDetails':
        return userDetailsContent;
      case 'fileExplorer':
        return fileExplorerContent;
      default:
        return null;
    }
  }

  return { getElementContent };
}
