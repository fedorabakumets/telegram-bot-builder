/**
 * @fileoverview Пояснения к результату графика по таблице.
 */
import { TABLE_CHART_LIMIT } from './types';

/** Сведения, по которым выбираются пояснения. */
export interface TableChartWarningInput {
  /** Сколько групп получилось до сокращения. */
  groupCount: number;
  /** Сколько строк участвовало. */
  rowCount: number;
  /** Средняя длина подписи группы. */
  avgLabelLength: number;
  /** Был ли нечисловой столбец заменён подсчётом количества. */
  coercedToCount: boolean;
}

/**
 * Собирает короткие пояснения, если график сокращён или плохо читается.
 * @param input - Итоги подсчёта.
 * @returns Список пояснений.
 */
export function tableChartWarnings(input: TableChartWarningInput): string[] {
  const warnings: string[] = [];
  if (input.coercedToCount) warnings.push('Столбец значения не числовой, поэтому посчитано количество строк.');
  if (input.groupCount > TABLE_CHART_LIMIT) {
    warnings.push(`Показаны ${TABLE_CHART_LIMIT} групп с наибольшими значениями из ${input.groupCount}.`);
  }
  const uniqueness = input.rowCount > 0 ? input.groupCount / input.rowCount : 0;
  if (input.rowCount >= 8 && input.groupCount > 8 && uniqueness > 0.85) {
    warnings.push('Большинство значений категории не повторяются, поэтому график трудно читать.');
  }
  if (input.avgLabelLength > 32) warnings.push('Подписи категорий длинные и могут накладываться друг на друга.');
  return warnings;
}
