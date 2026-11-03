/** @fileoverview Единая проверка активного ввода: ссылка на следующий узел не включает сбор ответа. */
/** Минимальные данные узла для проверки без зависимости от UI и генератора. */
interface InputBehaviorNode {
  /** Тип узла; отдельный input всегда выполняет сбор ответа. */
  type: string;
  /** Режим legacy-сбора; остальные сохранённые настройки не являются включателем. */
  data?: { collectUserInput?: unknown } | null;
}
/**
 * Проверяет явный режим ввода, сохраняя поддержку старых message с collectUserInput=true.
 * @param node - Проверяемый узел
 * @returns Признак самостоятельного input или явно включённого legacy-сбора
 */
export function hasActiveInput(node: InputBehaviorNode): boolean {
  return node.type === 'input' || node.data?.collectUserInput === true;
}
