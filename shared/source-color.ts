/** @fileoverview Общие устойчивые цвета источников в графиках и таблице пользователей. */
/** Палитра источников из аналитики. */
export const SOURCE_COLORS = ['#3b82f6','#10b981','#fbbf24','#fb7185','#a78bfa','#22d3ee','#fb923c','#a3e635'];
/**
 * Закрепляет цвет за названием независимо от периода, сортировки и страницы.
 * @param label - Отображаемое название источника.
 * @returns Цвет из общей палитры аналитики.
 */
export function sourceColor(label: string): string {
  let hash = 0;
  for (const character of label.trim().normalize('NFC')) hash = (Math.imul(hash,31) + character.codePointAt(0)!) >>> 0;
  return SOURCE_COLORS[hash % SOURCE_COLORS.length];
}
