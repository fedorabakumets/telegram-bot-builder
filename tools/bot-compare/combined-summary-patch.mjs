/** @fileoverview Обновляет итог сравнения после объединения реальных цен сайтов и ботов. */

/** Блок использует те же отсортированные цены, из которых построен общий список. */
export const combinedSummaryCode = `# Итог общей выборки сайтов и ботов, включая частичный результат после FloodWait.
_minimum_text = format(_ns['compare_min_pay'], ',').replace(',', ' ')
_saving_text = format(_ns['compare_savings'], ',').replace(',', ' ')
_ns['compare_summary'] = (f'💚 Дешевле всего: <b>{_minimum_text} ₽</b>\\n📊 Разброс цен: до <b>{_saving_text} ₽</b> экономии'
                          if _ok else '⚠️ Пока нет доступных цен. Сравнить стоимость и рассчитать экономию невозможно.')
if _ns.get('compare_limit_notice'):
    _ns['compare_summary'] = _ns['compare_limit_notice'] + '\\n\\n' + _ns['compare_summary']
`;

/**
 * Меняет только ноду объединения, сохраняя остальные данные проекта и повторяемость операции.
 * @param data - Прочитанный рабочий сценарий проекта.
 * @returns Копия сценария с актуальным текстом общей сводки.
 */
export function patchCombinedSummary(data) {
  const next = structuredClone(data);
  const nodes = next.sheets ? next.sheets.flatMap(sheet => sheet.nodes ?? []) : next.nodes ?? [];
  const merge = nodes.find(node => node.id === 'bot-code-merge-all' && node.type === 'code');
  if (!merge || typeof merge.data?.code !== 'string') throw new Error('Не найдена нода объединения цен');
  const source = merge.data.code;
  const anchor = "logging.info('merge-all:";
  const offset = source.indexOf(anchor);
  const marker = combinedSummaryCode.split('\n')[0];
  if (source.includes(marker)) return next;
  if (offset < 0 || !source.includes("_ns['compare_savings'] =")
    || !source.includes("_ok = sorted(")) throw new Error('Неизвестный формат объединения цен');
  merge.data.code = source.slice(0, offset) + combinedSummaryCode + '\n' + source.slice(offset);
  return next;
}
