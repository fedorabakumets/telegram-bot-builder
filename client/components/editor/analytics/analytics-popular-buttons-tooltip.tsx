/**
 * @fileoverview Кастомный tooltip для графика топ-10 популярных кнопок
 * @description Показывает полную подпись кнопки и количество нажатий
 */

import React from 'react';

/**
 * Кастомный tooltip для горизонтального bar-графика популярных кнопок
 * @param props - Пропсы от recharts (active, payload)
 * @returns JSX элемент tooltip или null
 */
export function PopularButtonsTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string; count: number } }>;
}): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="bg-popover border rounded-md px-2 py-1.5 text-xs shadow-md max-w-[220px]">
      <div className="opacity-80 break-words mb-0.5">{item.label}</div>
      <div className="font-bold tabular-nums">{item.count} нажатий</div>
    </div>
  );
}
