/**
 * @fileoverview Утилита для отслеживания состояния генерации кода
 *
 * Этот модуль предоставляет функции для отслеживания того,
 * какие компоненты кода уже были сгенерированы,
 * чтобы избежать дублирования.
 *
 * @module generation-state
 */

// Глобальное состояние генерации для всего процесса
const globalGenerationState: Map<string, boolean> = new Map();

/**
 * Проверяет, был ли уже сгенерирован компонент с указанным идентификатором
 * @param {string} componentId - Идентификатор компонента
 * @returns {boolean} - true, если компонент уже был сгенерирован
 */
export function hasComponentBeenGenerated(componentId: string): boolean {
  return globalGenerationState.has(componentId);
}

/**
 * Отмечает, что компонент с указанным идентификатором был сгенерирован
 * @param {string} componentId - Идентификатор компонента
 */
export function markComponentAsGenerated(componentId: string): void {
  globalGenerationState.set(componentId, true);
}

/**
 * Сбрасывает состояние генерации (полезно между генерациями разных ботов)
 */
export function resetGenerationState(): void {
  globalGenerationState.clear();
}

/**
 * Возвращает текущее состояние генерации
 * @returns {Map<string, boolean>} - Карта сгенерированных компонентов
 */
export function getGenerationState(): Map<string, boolean> {
  return new Map(globalGenerationState);
}