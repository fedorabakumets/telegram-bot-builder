/**
 * @fileoverview Хук deep-link на узел канваса через ?node= и ?button= в URL
 * @module pages/editor/hooks/use-editor-node-url
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BotDataWithSheets, Node } from '@shared/schema';
import {
  getButtonIdFromUrl,
  getNodeIdFromUrl,
  syncEditorUrlParams,
} from '../utils/editor-url-params';
import { findSheetIdByNodeId } from '../utils/find-sheet-by-node-id';

/** Параметры node/button для синхронизации URL (null — не трогать параметры) */
export interface EditorNodeUrlSyncParams {
  /** ID выбранного узла или null для удаления ?node= */
  node: string | null;
  /** ID кнопки или null для удаления ?button= */
  button: string | null;
}

/** Параметры хука useEditorNodeUrl */
export interface UseEditorNodeUrlParams {
  /** ID текущего проекта */
  projectId: number | null;
  /** ID последнего загруженного проекта */
  lastLoadedProjectId: number | null;
  /** Данные проекта с листами */
  botDataWithSheets: BotDataWithSheets | null;
  /** Узлы активного листа на канвасе */
  nodes: Node[];
  /** ID выбранного узла */
  selectedNodeId: string | null;
  /** Установить выбранный узел */
  setSelectedNodeId: (nodeId: string | null) => void;
  /** Сфокусироваться на узле (камера, подсветка, скролл к кнопке) */
  handleNodeFocus: (nodeId: string, buttonId?: string) => void;
  /** Сбросить подсветку узла */
  setHighlightNodeId: (id: string | null) => void;
  /** Переключить активный лист */
  handleSheetSelect: (sheetId: string) => void;
}

/** Результат хука useEditorNodeUrl */
export interface UseEditorNodeUrlResult {
  /** Обёртка выбора узла с синхронизацией URL */
  handleNodeSelect: (nodeId: string) => void;
  /** Обёртка фокуса на узле с синхронизацией ?button= */
  handleNodeFocusWithUrl: (nodeId: string, buttonId?: string) => void;
  /** Параметры node/button для syncEditorUrlParams (null до завершения начальной загрузки) */
  nodeUrlSyncParams: EditorNodeUrlSyncParams | null;
}

/**
 * Управляет загрузкой узла из URL и синхронизацией ?node=/ ?button=
 * @param params - Параметры хука
 * @returns Обработчики и параметры для синхронизации URL
 */
export function useEditorNodeUrl(params: UseEditorNodeUrlParams): UseEditorNodeUrlResult {
  const {
    projectId,
    lastLoadedProjectId,
    botDataWithSheets,
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    handleNodeFocus,
    setHighlightNodeId,
    handleSheetSelect,
  } = params;

  /** ID кнопки для ?button= (сохраняется пока выбран узел) */
  const [urlButtonId, setUrlButtonId] = useState<string | null>(null);
  /** Готовность синхронизировать node/button в URL (после попытки применить deep-link) */
  const [nodeUrlSyncReady, setNodeUrlSyncReady] = useState(false);
  /** Ключ уже применённого deep-link из URL */
  const appliedFromUrlRef = useRef<string | null>(null);
  /** Ожидающий переключения листа deep-link */
  const pendingNodeRef = useRef<{ nodeId: string; buttonId: string | null } | null>(null);

  useEffect(() => {
    appliedFromUrlRef.current = null;
    pendingNodeRef.current = null;
    setUrlButtonId(null);
    setNodeUrlSyncReady(false);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !botDataWithSheets) return;
    if (lastLoadedProjectId !== projectId) return;

    const nodeId = getNodeIdFromUrl();
    if (!nodeId) {
      setNodeUrlSyncReady(true);
      return;
    }

    const applyKey = `${projectId}:${nodeId}`;
    if (appliedFromUrlRef.current === applyKey) return;

    const sheetId = findSheetIdByNodeId(botDataWithSheets.sheets, nodeId);
    if (!sheetId) {
      appliedFromUrlRef.current = applyKey;
      setNodeUrlSyncReady(true);
      syncEditorUrlParams({ node: null, button: null });
      return;
    }

    const buttonId = getButtonIdFromUrl();

    if (botDataWithSheets.activeSheetId !== sheetId) {
      if (!pendingNodeRef.current) {
        pendingNodeRef.current = { nodeId, buttonId };
        handleSheetSelect(sheetId);
      }
      if (!nodes.some(node => node.id === nodeId)) return;
    } else if (!nodes.some(node => node.id === nodeId)) {
      return;
    }

    pendingNodeRef.current = null;
    appliedFromUrlRef.current = applyKey;
    setUrlButtonId(buttonId);
    setSelectedNodeId(nodeId);
    handleNodeFocus(nodeId, buttonId ?? undefined);
    setNodeUrlSyncReady(true);
  }, [
    projectId,
    lastLoadedProjectId,
    botDataWithSheets,
    nodes,
    handleSheetSelect,
    setSelectedNodeId,
    handleNodeFocus,
  ]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId || null);
    setUrlButtonId(null);
    if (!nodeId) setHighlightNodeId(null);
  }, [setSelectedNodeId, setHighlightNodeId]);

  const handleNodeFocusWithUrl = useCallback((nodeId: string, buttonId?: string) => {
    handleNodeFocus(nodeId, buttonId);
    setUrlButtonId(buttonId ?? null);
    setSelectedNodeId(nodeId);
  }, [handleNodeFocus, setSelectedNodeId]);

  const nodeUrlSyncParams = useMemo((): EditorNodeUrlSyncParams | null => {
    if (!nodeUrlSyncReady) return null;
    return {
      node: selectedNodeId || null,
      button: selectedNodeId && urlButtonId ? urlButtonId : null,
    };
  }, [nodeUrlSyncReady, selectedNodeId, urlButtonId]);

  return { handleNodeSelect, handleNodeFocusWithUrl, nodeUrlSyncParams };
}
