/**
 * @fileoverview Шаги раздела обучения «Панель инструментов»
 * @module components/editor/canvas/learn/editor-learn-toolbar-steps
 */

import type { EditorLearnStep } from './editor-learn-steps';

/**
 * Селектор кнопки по началу подсказки или подписи
 * @param label - Начало title / aria-label
 * @returns CSS-селектор
 */
function byLabel(label: string): string {
  return `[title^="${label}"], [aria-label^="${label}"]`;
}

/**
 * Селектор группы кнопок на тулбаре холста
 * @param group - Имя группы из data-learn-toolbar
 * @returns CSS-селектор
 */
function group(group: string): string {
  return `[data-learn-toolbar="${group}"]`;
}

/** Шаги по тулбару холста слева направо */
export const EDITOR_LEARN_TOOLBAR_STEPS: EditorLearnStep[] = [
  {
    id: 'tb-intro',
    title: 'Тулбар',
    focus: 'none',
    spotlight: '[data-canvas-toolbar]',
    task: 'none',
    text:
      'Полоса над полем — инструменты холста. Пройдём её слева направо. ' +
      'Часть кнопок попросим нажать: «Далее» включится после нажатия.',
  },
  {
    id: 'tb-zoom',
    title: 'Масштаб',
    focus: 'none',
    spotlight: group('zoom'),
    task: 'click',
    clickTarget: byLabel('Уместить в экран'),
    waitHint: 'Нажмите «Уместить в экран»',
    text:
      'Слева масштаб: минус, процент и плюс. Кнопка с рамкой «Уместить в экран» (Ctrl + 1) показывает весь бот сразу. ' +
      'Нажмите её — поле подстроится под все блоки.',
  },
  {
    id: 'tb-undo',
    title: 'Отмена',
    focus: 'none',
    spotlight: group('undo'),
    task: 'none',
    text:
      'Стрелки отменяют и повторяют действие (Ctrl + Z и Ctrl + Y). ' +
      'Рядом — история действий: в ней можно выбрать несколько шагов и откатить их разом.',
  },
  {
    id: 'tb-save',
    title: 'Сохранение',
    focus: 'none',
    spotlight: group('save'),
    task: 'none',
    text:
      'Дискета сохраняет бот (Ctrl + S). Стрелка рядом — сохранить с заметкой, это отметка, к которой легко вернуться. ' +
      'Часы — история версий: из неё восстанавливают прошлый вариант.',
  },
  {
    id: 'tb-layout',
    title: 'Расстановка',
    focus: 'none',
    spotlight: group('layout'),
    task: 'click',
    clickTarget: byLabel('Авто-расстановка'),
    waitHint: 'Нажмите «Авто-расстановка»',
    text:
      '«Авто-расстановка» (Shift + A) раскладывает блоки ровными рядами по стрелкам. ' +
      'Нажмите и посмотрите. Не понравилось — Ctrl + Z вернёт как было.',
  },
  {
    id: 'tb-clipboard',
    title: 'Буфер',
    focus: 'none',
    spotlight: group('clipboard'),
    task: 'none',
    text:
      'Копировать и вставить — переносит блоки между листами и даже между проектами. ' +
      'Выделите блок, скопируйте и вставьте в другом месте.',
  },
  {
    id: 'tb-search',
    title: 'Поиск',
    focus: 'none',
    spotlight: group('search'),
    task: 'click',
    clickTarget: byLabel('Поиск узлов'),
    waitHint: 'Нажмите лупу «Поиск узлов»',
    text:
      'Лупа ищет блок по тексту на текущем листе (Ctrl + F). Рядом рамка для выделения нескольких блоков и порталы к другим листам. ' +
      'Нажмите лупу, чтобы открыть поиск.',
  },
  {
    id: 'tb-view',
    title: 'JSON',
    focus: 'none',
    spotlight: group('view'),
    task: 'none',
    text:
      'Справа переключатель «Холст / JSON». JSON — тот же бот в виде текста: его удобно копировать и отдавать ИИ. ' +
      'Слева от переключателя — подсказка со всеми горячими клавишами.',
  },
  {
    id: 'tb-done',
    title: 'Готово',
    focus: 'none',
    task: 'none',
    text:
      'Это весь тулбар. Главное запомнить три клавиши: Ctrl + S — сохранить, Ctrl + Z — отменить, Ctrl + 1 — показать весь бот.',
  },
];
