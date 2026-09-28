/**
 * @fileoverview localStorage для режима обучения редактора
 * @module components/editor/canvas/learn/editor-learn-storage
 */

const STORAGE_KEY = 'botcraft:editor-learn-dismissed';
const DONE_KEY = 'botcraft:editor-learn-done';

/**
 * Пропускал ли пользователь автозапуск обучения
 * @returns true если обучение скрыто до ручного запуска
 */
export function isEditorLearnDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Помечает обучение как пропущенное или закрытое
 */
export function dismissEditorLearn(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Снимает пометку — обучение снова можно запустить
 */
export function clearEditorLearnDismissed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Разделы, пройденные до конца
 * @returns Набор идентификаторов разделов
 */
export function getEditorLearnDoneSections(): Set<string> {
  try {
    const raw = localStorage.getItem(DONE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

/**
 * Отмечает раздел пройденным
 * @param sectionId - Идентификатор раздела
 */
export function markEditorLearnSectionDone(sectionId: string): void {
  try {
    const done = getEditorLearnDoneSections();
    done.add(sectionId);
    localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
  } catch {
    /* ignore */
  }
}
