/**
 * @fileoverview Хук управления режимом просмотра холста (Холст / JSON)
 * @module UseCanvasView
 */

import { useState, useCallback, useEffect } from 'react';
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
  /** Флаг наличия несохранённых изменений */
  isDirty: boolean;
  /** Ошибка валидации JSON или null */
  jsonError: string | null;
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
  /** Флаг наличия несохранённых изменений пользователя */
  const [isDirty, setIsDirty] = useState(false);
  /** Ошибка валидации JSON */
  const [jsonError, setJsonError] = useState<string | null>(null);

  /**
   * Эффект валидации JSON при каждом изменении содержимого редактора.
   * Устанавливает jsonError если JSON невалиден.
   */
  useEffect(() => {
    if (!jsonContent) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(jsonContent);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Невалидный JSON');
    }
  }, [jsonContent]);

  /**
   * Обрабатывает смену режима просмотра.
   * При переключении на JSON — сериализует botDataWithSheets напрямую.
   * При возврате на холст — сбрасывает isDirty и jsonError.
   * @param view - Новый режим
   */
  const handleViewChange = useCallback((view: CanvasView) => {
    if (view === 'json') {
      const serialized = JSON.stringify(botDataWithSheets, null, 2);
      setJsonContent(serialized);
    } else {
      setJsonContent('');
      setIsDirty(false);
      setJsonError(null);
    }
    setCanvasView(view);
  }, [botDataWithSheets]);

  /**
   * Обрабатывает изменение JSON в Monaco Editor.
   * Устанавливает флаг isDirty при первом изменении.
   * @param value - Новое значение
   */
  const handleJsonChange = useCallback((value: string) => {
    setJsonContent(value);
    setIsDirty(true);
  }, []);

  /**
   * Применяет JSON и возвращается на холст.
   * Не применяет если есть ошибка валидации.
   */
  const handleApplyJson = useCallback(() => {
    if (jsonError) return;
    if (jsonContent) onApplyJson(jsonContent);
    setJsonContent('');
    setIsDirty(false);
    setJsonError(null);
    setCanvasView('canvas');
  }, [jsonContent, jsonError, onApplyJson]);

  return { canvasView, jsonContent, isDirty, jsonError, handleViewChange, handleJsonChange, handleApplyJson };
}
