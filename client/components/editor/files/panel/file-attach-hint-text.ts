/**
 * @fileoverview Тексты подсказки прикрепления файлов к блокам через поиск, список или холст.
 * @module components/editor/files/panel/file-attach-hint-text
 */

/** Режим панели файлов для текста подсказки */
export type AttachHintMode = 'page' | 'modal';

/** Вариант подсказки в зависимости от цели и режима прикрепления */
export type AttachHintKind = 'page-idle' | 'page-need-node' | 'modal-idle' | 'ready';

/** Параметры выбора варианта подсказки */
export interface AttachHintParams {
  /** Страница «Файлы» или модалка выбора */
  mode: AttachHintMode;
  /** Включён ли «Режим прикрепления» (только страница) */
  attachModeEnabled: boolean;
  /** Есть ли целевая нода */
  hasTarget: boolean;
}

/**
 * Определяет вариант подсказки по режиму панели и цели прикрепления.
 * @param params - Режим, флаг режима прикрепления и наличие цели
 * @returns Вариант текста подсказки
 */
export function getAttachHintKind({
  mode,
  attachModeEnabled,
  hasTarget,
}: AttachHintParams): AttachHintKind {
  if (mode === 'modal') return hasTarget ? 'ready' : 'modal-idle';
  if (!attachModeEnabled) return 'page-idle';
  if (!hasTarget) return 'page-need-node';
  return 'ready';
}

/**
 * Собирает текст подсказки для пользователя.
 * @param kind - Вариант подсказки
 * @param nodeLabel - Имя целевой ноды (для `ready`)
 * @param mode - Режим панели для расположения кнопки прикрепления
 * @returns Текст подсказки на русском
 */
export function getAttachHintText(kind: AttachHintKind, nodeLabel?: string, mode: AttachHintMode = 'page'): string {
  if (kind === 'page-need-node') {
    return 'Выберите блок из списка или вставьте его ID. Затем отметьте файлы и нажмите «Прикрепить» над списком файлов. Блок также можно выбрать на холсте.';
  }
  if (kind === 'modal-idle') {
    return 'Отметьте файлы галочками слева. Прикрепление к блоку доступно, если окно открыто из его свойств кнопкой «Из хранилища».';
  }
  if (kind === 'ready') {
    const label = (nodeLabel ?? 'блок').trim() || 'блок';
    const placement = mode === 'modal' ? 'внизу окна' : 'над списком';
    return `К блоку «${label}»: отметьте файлы и нажмите «Прикрепить» ${placement}. Загрузка сама по себе не добавляет файл к блоку.`;
  }
  return 'Включите «Прикрепление к блоку», найдите и выберите блок по тексту или ID. Затем отметьте файлы и нажмите «Прикрепить» над списком. Блок также можно выбрать на холсте.';
}
