/**
 * @fileoverview Тонкий контейнер `FilesTabPage` — встраивает переиспользуемую
 * панель `FileStoragePanel` в режиме `page` (полноэкранная вкладка редактора).
 * Адаптирует пропсы вызывающей стороны (editor.tsx) к пропсам панели: проброс
 * селекторов проекта/бота и листов, построение `onGoToNode` (фокус ноды на её
 * листе + открытие свойств, Req 15.3) и `onAttach` (запись выбранных файлов в
 * `attachedMedia` целевой ноды с дедупликацией, Req 3.4, 3.8). Цель прикрепления
 * на странице задаётся выбранной нодой (`attachTarget`). Никакой дублирующейся
 * логики — вся реализация в FileStoragePanel (Req 1.1, 1.6).
 * @module components/editor/files/containers/files-tab-page
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FileStoragePanel } from '../panel/file-storage-panel';
import { mergeAttachedMedia } from '../panel/attach-node-refs';
import type { AttachTarget, SheetInfo } from '../panel/panel-types';

/** Пропсы контейнера полноэкранной вкладки «Файлы» */
export interface FilesTabPageProps {
  /** ID проекта */
  projectId: number;
  /** Выбранный токен бота */
  selectedTokenId?: number | null;
  /** Обработчик выбора токена */
  onSelectToken: (tokenId: number | null) => void;
  /** Список проектов для переключателя */
  allProjects: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange: (projectId: number) => void;
  /** Обработчик обновления данных ноды (для записи attachedMedia) */
  onNodeUpdate?: (nodeId: string, updates: Record<string, any>) => void;
  /** Все листы проекта (для использований и перехода к ноде) */
  allSheets?: SheetInfo[];
  /** Цель прикрепления на странице (выбранная нода); null — прикрепление недоступно */
  attachTarget?: AttachTarget | null;
  /** Переключение на вкладку холста */
  onSwitchToCanvas?: () => void;
  /** Фокус на ноде (камера + выбор + открытие свойств) — приоритетный путь для onGoToNode */
  onFocusNode?: (nodeId: string) => void;
  /** Установка активного листа (fallback, если onFocusNode не задан) */
  onSetActiveSheet?: (sheetId: string) => void;
  /** Установка выбранной ноды (fallback, если onFocusNode не задан) */
  onSelectNode?: (nodeId: string) => void;
}

/**
 * Контейнер вкладки «Файлы»: рендерит FileStoragePanel в режиме страницы.
 * @param props - Свойства контейнера (контекст проекта + колбэки редактора)
 * @returns JSX элемент панели в режиме `page`
 */
export function FilesTabPage({
  projectId,
  selectedTokenId,
  onSelectToken,
  allProjects,
  onProjectChange,
  onNodeUpdate,
  allSheets,
  attachTarget = null,
  onSwitchToCanvas,
  onFocusNode,
  onSetActiveSheet,
  onSelectNode,
}: FilesTabPageProps) {
  const { toast } = useToast();

  /**
   * Переход к ноде на холсте: фокус на ноде (камера + выбор + открытие свойств)
   * через onFocusNode; при его отсутствии — fallback на выбор листа и ноды.
   * Всегда переключает на вкладку холста (Req 15.3).
   */
  const handleGoToNode = useCallback(
    (nodeId: string, sheetId: string) => {
      onSwitchToCanvas?.();
      if (onFocusNode) {
        onFocusNode(nodeId);
        return;
      }
      onSetActiveSheet?.(sheetId);
      onSelectNode?.(nodeId);
    },
    [onSwitchToCanvas, onFocusNode, onSetActiveSheet, onSelectNode],
  );

  /**
   * Прикрепление выбранных файлов к целевой ноде через onNodeUpdate.
   * Сливает ссылки в `attachedMedia` с дедупликацией (идемпотентность — Req 3.8);
   * множественность определяется attachTarget.multi. Активно только при заданном
   * attachTarget (выбрана нода) и наличии onNodeUpdate (Req 3.4).
   */
  const handleAttach = useCallback(
    (fileRefs: string[]) => {
      if (!onNodeUpdate || !allSheets || !attachTarget || fileRefs.length === 0) return;
      const node = allSheets.flatMap((s) => s.nodes).find((n) => n.id === attachTarget.nodeId);
      if (!node) return;
      const current: string[] = Array.isArray(node.data.attachedMedia) ? node.data.attachedMedia : [];
      const merged = mergeAttachedMedia(current, fileRefs, attachTarget.multi);
      onNodeUpdate(attachTarget.nodeId, { attachedMedia: merged });
      toast({ title: `Файлы прикреплены к ноде «${attachTarget.nodeLabel}»` });
    },
    [onNodeUpdate, allSheets, attachTarget, toast],
  );

  return (
    <FileStoragePanel
      mode="page"
      projectId={projectId}
      selectedTokenId={selectedTokenId}
      onSelectToken={onSelectToken}
      allProjects={allProjects}
      onProjectChange={onProjectChange}
      attachTarget={attachTarget}
      onAttach={handleAttach}
      allSheets={allSheets}
      onGoToNode={handleGoToNode}
    />
  );
}
