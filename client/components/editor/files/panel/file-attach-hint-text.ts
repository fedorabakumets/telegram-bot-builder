/**
 * @fileoverview Тексты подсказки, как прикрепить файл к ноде.
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
 * @returns Текст подсказки на русском
 */
export function getAttachHintText(kind: AttachHintKind, nodeLabel?: string): string {
  if (kind === 'page-need-node') {
    return 'Режим прикрепления включён. Выбери ноду на холсте — к ней попадут отмеченные файлы.';
  }
  if (kind === 'modal-idle') {
    return 'Отметь файлы галочкой слева. Прикрепить к ноде можно, если окно открыто из свойств ноды («Файл из хранилища»).';
  }
  if (kind === 'ready') {
    const label = (nodeLabel ?? 'нода').trim() || 'нода';
    return `К ноде «${label}»: отметь файлы галочкой слева и нажми «Прикрепить» внизу. Загрузка сама по себе файл к ноде не добавляет.`;
  }
  return 'Чтобы прикрепить файл к ноде: выбери ноду на холсте, включи «Режим прикрепления», отметь файлы галочкой и нажми «Прикрепить» внизу.';
}
