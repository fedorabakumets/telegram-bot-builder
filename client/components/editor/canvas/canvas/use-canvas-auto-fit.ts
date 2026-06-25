/**
 * @fileoverview Хук авто-FIT вида камеры холста (автоуместить сценарий).
 *
 * Отвечает ТОЛЬКО за автоматическое вписывание камеры в границы узлов листа
 * (НЕ за перерасстановку нод — это отдельный Shift+A handleAutoLayout).
 *
 * Чинит нестабильность тогла «автоуместить»:
 *  1. Forced-fit (смена листа/шаблон) дожидается измерения размеров узлов,
 *     а не вписывает вслепую по fallback 320×200; при таймауте — graceful fit.
 *  2. Один путь срабатывания на триггер — нет двойного fit и мерцания.
 *  3. Remote/agent-правки подавляются через suppressAutoFit (вид не дёргается).
 *  4. Debounce на запуск fit — серия быстрых правок даёт одно вписывание.
 */

import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { Node } from '@/types/bot';
import { areNodeSizesReady, buildNodesKey } from './canvas-fit-readiness';

/** Debounce запуска fit — гасит серию быстрых изменений (батч-правки) */
const FIT_DEBOUNCE_MS = 180;

/** Таймаут graceful-fallback: вписать по тому что есть, если размеры не пришли */
const FIT_READY_FALLBACK_MS = 700;

/**
 * Параметры хука авто-FIT камеры.
 */
interface UseCanvasAutoFitParams {
  /** Включён ли авто-FIT при загрузке/смене набора узлов */
  autoFitOnLoad?: boolean;
  /** Подавить авто-FIT (JSON-режим, remote/agent-синхронизация) */
  suppressAutoFit?: boolean;
  /** Инкремент извне — принудительный fit (смена листа, шаблон) */
  fitTrigger?: number;
  /** Узлы активного листа */
  nodes: Node[];
  /** Карта измеренных размеров узлов (из ResizeObserver) */
  nodeSizes: Map<string, { width: number; height: number }>;
  /** Ref на актуальную функцию вписывания содержимого в экран */
  fitToContentRef: MutableRefObject<() => void>;
}

/**
 * Управляет автоматическим вписыванием камеры в содержимое листа.
 *
 * @param params - Параметры авто-FIT.
 */
export function useCanvasAutoFit({
  autoFitOnLoad,
  suppressAutoFit,
  fitTrigger,
  nodes,
  nodeSizes,
  fitToContentRef,
}: UseCanvasAutoFitParams): void {
  /** Ключ последнего вписанного набора узлов — fit только при смене состава */
  const lastNodesKeyRef = useRef<string>('');
  /** Первая загрузка — вписываем всегда, минуя проверку localStorage */
  const isFirstFitRef = useRef(true);
  /** Ожидается принудительный fit (минует localStorage, но ждёт размеры) */
  const forcedFitRef = useRef(false);
  /** Предыдущее значение fitTrigger — для детекции внешнего запроса */
  const prevFitTriggerRef = useRef(fitTrigger);
  /** Ключ набора, для которого взведён fallback-таймер ожидания размеров */
  const pendingKeyRef = useRef<string | null>(null);
  /** Таймер debounce запуска fit */
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Таймер graceful-fallback ожидания размеров */
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Запускает вписывание с debounce — единственный путь вызова fit */
  const scheduleFit = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      fitToContentRef.current();
    }, FIT_DEBOUNCE_MS);
  }, [fitToContentRef]);

  /** Снимает взведённый fallback-таймер ожидания размеров */
  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    pendingKeyRef.current = null;
  }, []);

  /** Фиксирует факт вписывания набора и сбрасывает временные флаги */
  const commitFit = useCallback((nodesKey: string) => {
    clearFallback();
    lastNodesKeyRef.current = nodesKey;
    isFirstFitRef.current = false;
    forcedFitRef.current = false;
    scheduleFit();
  }, [clearFallback, scheduleFit]);

  useEffect(() => {
    // Детектируем внешний принудительный триггер (смена листа / шаблон)
    if (fitTrigger !== prevFitTriggerRef.current) {
      prevFitTriggerRef.current = fitTrigger;
      if (fitTrigger) {
        forcedFitRef.current = true;
        lastNodesKeyRef.current = '';
        clearFallback();
      }
    }

    if (!autoFitOnLoad || nodes.length === 0) return;

    const nodesKey = buildNodesKey(nodes);

    // Remote/agent-синхронизация: фиксируем ключ, но НЕ дёргаем камеру
    if (suppressAutoFit) {
      lastNodesKeyRef.current = nodesKey;
      forcedFitRef.current = false;
      clearFallback();
      return;
    }

    if (nodesKey === lastNodesKeyRef.current) return;

    // Смена листа без forced и не первая загрузка — уважаем тогл localStorage
    if (!isFirstFitRef.current && !forcedFitRef.current) {
      try {
        if (localStorage.getItem('canvas-auto-fit-sheet') === 'false') {
          lastNodesKeyRef.current = nodesKey;
          return;
        }
      } catch { /* localStorage недоступен — разрешаем fit */ }
    }

    // Главный фикс: ждём, пока измерено ≥50% узлов, иначе границы неверные.
    if (!areNodeSizesReady(nodes, nodeSizes)) {
      // Эффект перезапустится при наполнении nodeSizes; заводим graceful-fallback
      if (pendingKeyRef.current !== nodesKey) {
        pendingKeyRef.current = nodesKey;
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = setTimeout(() => {
          fallbackTimerRef.current = null;
          const key = pendingKeyRef.current;
          pendingKeyRef.current = null;
          if (key !== null) commitFit(key);
        }, FIT_READY_FALLBACK_MS);
      }
      return;
    }

    commitFit(nodesKey);
  }, [autoFitOnLoad, suppressAutoFit, fitTrigger, nodes, nodeSizes, commitFit, clearFallback]);

  /** Очистка таймеров при размонтировании */
  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
  }, []);
}
