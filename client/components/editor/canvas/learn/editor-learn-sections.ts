/**
 * @fileoverview Разделы обучения редактора для меню «Обучение»
 * @module components/editor/canvas/learn/editor-learn-sections
 */

import { EDITOR_LEARN_STEPS, type EditorLearnStep } from './editor-learn-steps';
import { EDITOR_LEARN_TOOLBAR_STEPS } from './editor-learn-toolbar-steps';

/** Идентификатор раздела обучения */
export type EditorLearnSectionId = 'basics' | 'toolbar';

/** Раздел обучения */
export interface EditorLearnSection {
  /** Идентификатор раздела */
  id: EditorLearnSectionId;
  /** Название в меню */
  title: string;
  /** Короткое пояснение в меню */
  description: string;
  /** Шаги раздела */
  steps: EditorLearnStep[];
}

/** Разделы в порядке показа в меню */
export const EDITOR_LEARN_SECTIONS: EditorLearnSection[] = [
  {
    id: 'basics',
    title: 'Основы',
    description: 'Команда, сообщение, стрелка и свой текст',
    steps: EDITOR_LEARN_STEPS,
  },
  {
    id: 'toolbar',
    title: 'Панель инструментов',
    description: 'Масштаб, отмена, сохранение, поиск и JSON',
    steps: EDITOR_LEARN_TOOLBAR_STEPS,
  },
];

/**
 * Раздел по идентификатору
 * @param id - Идентификатор раздела
 * @returns Раздел, по умолчанию «Основы»
 */
export function getEditorLearnSection(id: EditorLearnSectionId): EditorLearnSection {
  return EDITOR_LEARN_SECTIONS.find((section) => section.id === id) ?? EDITOR_LEARN_SECTIONS[0];
}
