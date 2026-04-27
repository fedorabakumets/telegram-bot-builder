/**
 * @fileoverview Хук управления режимом просмотра холста (Холст / JSON)
 * @module UseCanvasView
 */

import { useState, useCallback } from 'react';
import type { CanvasView } from '../components/canvas-view-toggle';
import type { BotDataWithSheets } from '@shared/schema';

/** Параметры хука useCanvasView */
interface UseCanvasViewOptions {
  /** Данные бота с листами для сериализации в JSON */
  botDataWithSheets: BotDataWithSheets | null;
  /** Применить JSON к данным бота */
  onApplyJson: (json: string) => void;
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
  botDataWithSheets,
  onApplyJson,
}: UseCanvasViewOptions): UseCanvasViewResult {
  /** Текущий режим просмотра */
  const [canvasView, setCanvasView] = useState<CanvasView>('canvas');
  /** Редактируемый JSON контент */
  const [jsonContent, setJsonContent] = useState('');

  /**
   * Обрабатывает смену режима просмотра.
   * При переключении на JSON — сериализует botDataWithSheets напрямую.
   * @param view - Новый режим
   */
  const handleViewChange = useCallback((view: CanvasView) => {
    if (view === 'json') {
      const serialized = JSON.stringify(botDataWithSheets, null, 2);
      setJsonContent(serialized);
    } else {
      setJsonContent('');
    }
    setCanvasView(view);
  }, [botDataWithSheets]);

  /**
   * Обрабатывает изменение JSON в Monaco Editor
   * @param value - Новое значение
   */
  const handleJsonChange = useCallback((value: string) => {
    setJsonContent(value);
  }, []);

  /**
   * Применяет JSON и возвращается на холст
   */
  const handleApplyJson = useCallback(() => {
    if (jsonContent) onApplyJson(jsonContent);
    setJsonContent('');
    setCanvasView('canvas');
  }, [jsonContent, onApplyJson]);

  return { canvasView, jsonContent, handleViewChange, handleJsonChange, handleApplyJson };
}
