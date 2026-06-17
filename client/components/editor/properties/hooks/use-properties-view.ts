/**
 * @fileoverview Хук режима панели свойств: форма настроек или JSON node.data
 * @module components/editor/properties/hooks/use-properties-view
 */

import { useCallback, useEffect, useState } from 'react';
import type { Node } from '@shared/schema';
import type { PropertiesView } from '../components/layout/properties-view-toggle';

/** Ключ localStorage для запоминания режима панели */
const STORAGE_KEY = 'properties-panel-view';

/**
 * Сериализует data ноды в отформатированный JSON
 * @param data - Данные узла
 * @returns JSON-строка с отступами
 */
function serializeNodeData(data: Node['data']): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Читает сохранённый режим из localStorage
 * @returns Режим по умолчанию
 */
function readStoredView(): PropertiesView {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'json' ? 'json' : 'form';
  } catch {
    return 'form';
  }
}

/** Параметры хука usePropertiesView */
interface UsePropertiesViewOptions {
  /** Выбранный узел или null */
  selectedNode: Node | null;
  /** Полная замена node.data после Apply */
  onNodeDataReplace: (nodeId: string, newData: Node['data']) => void;
}

/** Результат хука usePropertiesView */
export interface UsePropertiesViewResult {
  /** Текущий режим панели */
  view: PropertiesView;
  /** Запрос смены режима с подтверждением при dirty draft */
  requestViewChange: (next: PropertiesView) => void;
  /** Черновик JSON */
  jsonDraft: string;
  /** Ошибка парсинга JSON */
  jsonError: string | null;
  /** Обработчик изменения текста в редакторе */
  handleJsonChange: (value: string) => void;
  /** Применить JSON к ноде; возвращает успех */
  applyJson: () => boolean;
  /** Можно ли применить JSON (валиден и изменён) */
  canApplyJson: boolean;
}

/**
 * Управляет переключением форма/JSON и черновиком node.data
 * @param options - Параметры хука
 * @returns Состояние и обработчики JSON-режима
 */
export function usePropertiesView({
  selectedNode,
  onNodeDataReplace,
}: UsePropertiesViewOptions): UsePropertiesViewResult {
  const [view, setViewState] = useState<PropertiesView>(readStoredView);
  const [jsonDraft, setJsonDraft] = useState('');
  const [jsonDirty, setJsonDirty] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  /** Сброс черновика при смене выбранной ноды */
  useEffect(() => {
    if (!selectedNode) return;
    setJsonDraft(serializeNodeData(selectedNode.data));
    setJsonDirty(false);
    setJsonError(null);
  }, [selectedNode?.id]);

  /** Синхронизация из формы, если JSON не редактировался вручную */
  useEffect(() => {
    if (!selectedNode || jsonDirty || view !== 'json') return;
    setJsonDraft(serializeNodeData(selectedNode.data));
  }, [selectedNode?.data, selectedNode?.id, jsonDirty, view]);

  /**
   * Сохраняет режим в localStorage
   * @param next - Новый режим
   */
  const persistView = (next: PropertiesView) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage недоступен */
    }
  };

  /**
   * Запрашивает смену режима; при dirty draft спрашивает подтверждение
   * @param next - Целевой режим
   */
  const requestViewChange = useCallback((next: PropertiesView) => {
    if (next === view) return;

    if (view === 'json' && jsonDirty) {
      const confirmed = window.confirm(
        'Есть несохранённые изменения в JSON. Переключить режим без применения?',
      );
      if (!confirmed) return;
      if (selectedNode) {
        setJsonDraft(serializeNodeData(selectedNode.data));
        setJsonDirty(false);
        setJsonError(null);
      }
    }

    if (next === 'json' && selectedNode) {
      setJsonDraft(serializeNodeData(selectedNode.data));
      setJsonDirty(false);
      setJsonError(null);
    }

    setViewState(next);
    persistView(next);
  }, [view, jsonDirty, selectedNode]);

  /**
   * Обновляет черновик и проверяет синтаксис JSON
   * @param value - Новый текст
   */
  const handleJsonChange = useCallback((value: string) => {
    setJsonDraft(value);
    setJsonDirty(true);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Невалидный JSON');
    }
  }, []);

  /**
   * Парсит черновик и заменяет node.data
   * @returns true при успешном применении
   */
  const applyJson = useCallback((): boolean => {
    if (!selectedNode) return false;

    try {
      const parsed = JSON.parse(jsonDraft) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setJsonError('Корень JSON должен быть объектом');
        return false;
      }
      onNodeDataReplace(selectedNode.id, parsed as Node['data']);
      setJsonDirty(false);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Невалидный JSON');
      return false;
    }
  }, [selectedNode, jsonDraft, onNodeDataReplace]);

  const canApplyJson = !jsonError && jsonDirty;

  return {
    view,
    requestViewChange,
    jsonDraft,
    jsonError,
    handleJsonChange,
    applyJson,
    canApplyJson,
  };
}
