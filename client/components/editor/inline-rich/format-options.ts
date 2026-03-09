/**
 * @fileoverview Конфигурация опций форматирования текста
 * @description Содержит настройки для кнопок форматирования с иконками и горячими клавишами
 */

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  Heading3,
  LucideIcon
} from 'lucide-react';

/**
 * Опция форматирования текста
 */
export interface FormatOption {
  /** Команда форматирования */
  command: string;
  /** Иконка для кнопки */
  icon: LucideIcon;
  /** Название опции */
  name: string;
  /** Горячая клавиша */
  shortcut: string;
  /** Синтаксис Markdown */
  markdown: string;
  /** HTML представление */
  html: string;
}

/**
 * Список доступных опций форматирования
 */
export const formatOptions: FormatOption[] = [
  {
    command: 'bold',
    icon: Bold,
    name: 'Жирный',
    shortcut: 'Ctrl+B',
    markdown: '**текст**',
    html: '<strong>текст</strong>'
  },
  {
    command: 'italic',
    icon: Italic,
    name: 'Курсив',
    shortcut: 'Ctrl+I',
    markdown: '*текст*',
    html: '<em>текст</em>'
  },
  {
    command: 'underline',
    icon: Underline,
    name: 'Подчеркнутый',
    shortcut: 'Ctrl+U',
    markdown: '__текст__',
    html: '<u>текст</u>'
  },
  {
    command: 'strikethrough',
    icon: Strikethrough,
    name: 'Зачеркнутый',
    shortcut: 'Ctrl+Shift+X',
    markdown: '~~текст~~',
    html: '<s>текст</s>'
  },
  {
    command: 'code',
    icon: Code,
    name: 'Код',
    shortcut: 'Ctrl+E',
    markdown: '`код`',
    html: '<code>код</code>'
  },
  {
    command: 'quote',
    icon: Quote,
    name: 'Цитата',
    shortcut: 'Ctrl+Q',
    markdown: '> цитата',
    html: '<blockquote>цитата</blockquote>'
  },
  {
    command: 'heading',
    icon: Heading3,
    name: 'Заголовок',
    shortcut: 'Ctrl+H',
    markdown: '# заголовок',
    html: '<h3>заголовок</h3>'
  }
];
