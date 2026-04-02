/**
 * @fileoverview Хук состояний кода
 *
 * Управляет состояниями редактора кода.
 *
 * @module UseCodeStates
 */

import { useState, useRef } from 'react';
import type { CodeFormat } from '@/components/editor/code/hooks';

/** Результат работы хука useCodeStates */
export interface UseCodeStatesResult {
  /** Выбранный формат кода */
  selectedFormat: CodeFormat;
  /** Тема редактора */
  theme: 'light' | 'dark';
  /** Флаг сворачивания всех блоков */
  areAllCollapsed: boolean;
  /** Флаг показа полного кода */
  showFullCode: boolean;
  /** Флаг видимости редактора кода */
  codeEditorVisible: boolean;
  /** Флаг видимости панели кода */
  codePanelVisible: boolean;
  /** Ссылка на редактор Monaco */
  editorRef: React.MutableRefObject<any>;
  /** Установить selectedFormat */
  setSelectedFormat: React.Dispatch<React.SetStateAction<CodeFormat>>;
  /** Установить theme */
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  /** Установить areAllCollapsed */
  setAreAllCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  /** Установить showFullCode */
  setShowFullCode: React.Dispatch<React.SetStateAction<boolean>>;
  /** Установить codeEditorVisible */
  setCodeEditorVisible: React.Dispatch<React.SetStateAction<boolean>>;
  /** Установить codePanelVisible */
  setCodePanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Хук для управления состояниями кода
 *
 * @returns Объект с состояниями и сеттерами
 */
export function useCodeStates(): UseCodeStatesResult {
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('python');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [areAllCollapsed, setAreAllCollapsed] = useState(true);
  const [showFullCode, setShowFullCode] = useState(false);
  const [codeEditorVisible, setCodeEditorVisible] = useState(false);
  const [codePanelVisible, setCodePanelVisible] = useState(false);
  const editorRef = useRef<any>(null);

  return {
    selectedFormat,
    theme,
    areAllCollapsed,
    showFullCode,
    codeEditorVisible,
    codePanelVisible,
    editorRef,
    setSelectedFormat,
    setTheme,
    setAreAllCollapsed,
    setShowFullCode,
    setCodeEditorVisible,
    setCodePanelVisible,
  };
}
