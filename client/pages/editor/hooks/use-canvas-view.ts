/**
 * @fileoverview Хук управления режимом просмотра холста (Холст / JSON)
 * @module UseCanvasView
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CanvasView } from '../components/canvas-view-toggle';
import type { CodeFormat } from '@/components/editor/code/hooks';

/** Параметры хука useCanvasView */
interface UseCanvasViewOptions {
  /** Функция загрузки контента по формату */
  loadContent: (format: CodeFormat) => Promise<void>;
  /** Применить JSON к данным бота */
  onApplyJson: (json: string) => void;
  /** Ref на Monaco Editor */
  editorRef: React.MutableRefObject<any>;
  /** Флаг сброса редактора (игнорировать onChange) */
  isResettingEditorRef: React.MutableRefObject<boolean>;
}

/** Результат хука useCanvasView */
export interface UseCanvasViewResult {
  /** Текущий режим просмотра */
  canvasView: CanvasView;
  /** Редактируемый JSON контент */
  jsonContent: string;
  /** Обработчик смены режима */
  handleViewChange: (view: CanvasView) => void;
  /** Обработчик изменения JSON в редакторе */
  handleJsonChange: (value: string) => void;
  /** Применить JSON и вернуться на холст */
  handleApplyJson: () => void;
}

/**
 * Хук управления переключением между режимами «Холст» и «JSON»
 * @param options - Параметры хука
 * @returns Объект с состоянием и обработчиками
 */
export function useCanvasView({
  loadContent,
  onApplyJson,
  editorRef,
  isResettingEditorRef,
}: UseCanvasViewOptions): UseCanvasViewResult {
  /** Текущий режим просмотра */
  const [canvasView, setCanvasView] = useState<CanvasView>('canvas');
  /** Редактируемый JSON контент */
  const [jsonContent, setJsonContent] = useState('');
  /** Флаг что JSON был изменён пользователем */
  const isDirtyRef = useRef(false);

  /** При переключении на JSON — загружаем контент */
  useEffect(() => {
    if (canvasView === 'json') {
      loadContent('json');
    }
  }, [canvasView, loadContent]);

  /**
   * Обрабатывает смену режима просмотра
   * @param view - Новый режим
   */
  const handleViewChange = useCallback((view: CanvasView) => {
    if (view === 'canvas' && isDirtyRef.current && jsonContent) {
      // При возврате на холст применяем изменения если они есть
      onApplyJson(jsonContent);
    }
    if (view === 'canvas') {
      isDirtyRef.current = false;
      setJsonContent('');
    }
    setCanvasView(view);
  }, [jsonContent, onApplyJson]);

  /**
   * Обрабатывает изменение JSON в Monaco Editor
   * @param value - Новое значение
   */
  const handleJsonChange = useCallback((value: string) => {
    if (isResettingEditorRef.current) return;
    isDirtyRef.current = true;
    setJsonContent(value);
  }, [isResettingEditorRef]);

  /**
   * Применяет JSON и возвращается на холст
   */
  const handleApplyJson = useCallback(() => {
    const val = jsonContent || editorRef.current?.getValue() || '';
    if (val) onApplyJson(val);
    isDirtyRef.current = false;
    setJsonContent('');
    setCanvasView('canvas');
  }, [jsonContent, editorRef, onApplyJson]);

  return { canvasView, jsonContent, handleViewChange, handleJsonChange, handleApplyJson };
}
