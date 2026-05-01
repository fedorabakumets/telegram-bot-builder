/**
 * @fileoverview Конфигурация опций форматирования текста
 * @description Содержит настройки для кнопок форматирования с иконками и горячими клавишами.
 * Включает поддержку Telegram-специфичных тегов: tg-spoiler.
 */

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  Link,
  EyeOff,
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
    /** Telegram-специфичный тег скрытого текста (спойлер) */
    command: 'spoiler',
    icon: EyeOff,
    name: 'Спойлер',
    shortcut: 'Ctrl+Shift+S',
    markdown: '||текст||',
    html: '<tg-spoiler>текст</tg-spoiler>'
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
    command: 'link',
    icon: Link,
    name: 'Ссылка',
    shortcut: 'Ctrl+K',
    markdown: '[текст](url)',
    html: '<a href="url">текст</a>'
  }
];
