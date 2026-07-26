/**
 * @fileoverview Позиции нод ботов на холсте с localStorage
 * @module bot/canvas/use-bot-node-layout
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

/** Позиция ноды на холсте */
export interface NodePos {
  /** X */
  left: number;
  /** Y */
  top: number;
}

const NODE_W = 220;
const NODE_H = 88;
const GAP_X = 48;
const GAP_Y = 40;
const COLS = 3;
const PAD = 48;

/**
 * Сетка по умолчанию для индекса
 * @param index - Индекс в списке токенов
 * @returns Позиция left/top
 */
export function defaultGridPos(index: number): NodePos {
  return {
    left: PAD + (index % COLS) * (NODE_W + GAP_X),
    top: PAD + Math.floor(index / COLS) * (NODE_H + GAP_Y),
  };
}

/**
 * Ключ localStorage для layout проекта
 * @param projectId - ID проекта
 * @returns Ключ
 */
function storageKey(projectId: number): string {
  return `bot-canvas-layout:${projectId}`;
}

/**
 * Читает сохранённые позиции из localStorage
 * @param projectId - ID проекта
 * @returns Карта позиций (ключи-строки)
 */
function readSaved(projectId: number): Record<string, NodePos> {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (raw) return JSON.parse(raw) as Record<string, NodePos>;
  } catch { /* */ }
  return {};
}

/**
 * Позиции нод с персистом; drag обновляет left/top
 * @param projectId - ID проекта
 * @param tokenIds - ID токенов на холсте
 * @returns positions, setNodePos, contentSize
 */
export function useBotNodeLayout(projectId: number, tokenIds: number[]) {
  const [saved, setSaved] = useState<Record<string, NodePos>>(() => readSaved(projectId));

  useEffect(() => {
    setSaved(readSaved(projectId));
  }, [projectId]);

  const idsKey = tokenIds.join(',');
  const positions = useMemo(() => {
    const next: Record<number, NodePos> = {};
    tokenIds.forEach((id, i) => {
      next[id] = saved[String(id)] ?? defaultGridPos(i);
    });
    return next;
  }, [idsKey, saved]);

  const setNodePos = useCallback((tokenId: number, pos: NodePos, persistNow = false) => {
    const clamped = { left: Math.max(0, pos.left), top: Math.max(0, pos.top) };
    setSaved((prev) => {
      const next = { ...prev, [String(tokenId)]: clamped };
      if (persistNow) {
        try {
          localStorage.setItem(storageKey(projectId), JSON.stringify(next));
        } catch { /* */ }
      }
      return next;
    });
  }, [projectId]);

  const contentSize = useMemo(() => {
    let maxL = PAD + COLS * NODE_W + (COLS - 1) * GAP_X;
    let maxT = PAD + NODE_H;
    for (const p of Object.values(positions)) {
      maxL = Math.max(maxL, p.left + NODE_W + PAD);
      maxT = Math.max(maxT, p.top + NODE_H + PAD);
    }
    return { width: Math.max(1400, maxL), height: Math.max(1000, maxT) };
  }, [positions]);

  return { positions, setNodePos, contentSize };
}
