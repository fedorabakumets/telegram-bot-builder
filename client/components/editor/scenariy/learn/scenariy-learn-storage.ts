/**
 * @fileoverview localStorage для режима обучения сценариев
 * @module components/editor/scenariy/learn/scenariy-learn-storage
 */

const STORAGE_KEY = 'botcraft:scenariy-learn-dismissed';

/**
 * Пропускал ли пользователь автозапуск обучения
 * @returns true если обучение скрыто до ручного запуска
 */
export function isScenariyLearnDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Помечает обучение как пропущенное / закрытое
 */
export function dismissScenariyLearn(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Снимает пометку — снова можно автозапускать и показывать с кнопки
 */
export function clearScenariyLearnDismissed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
