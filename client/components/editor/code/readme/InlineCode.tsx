/**
 * @fileoverview Компонент инлайн кода с возможностью копирования
 * При клике копирует содержимое в буфер обмена
 */

import { useState } from 'react';

/**
 * Свойства компонента инлайн кода
 */
interface InlineCodeProps {
  /** Содержимое кода */
  children: React.ReactNode;
}

/**
 * Компонент для инлайн кода с копированием по клику
 * @param props - Свойства компонента
 * @returns JSX элемент кода
 */
export function InlineCode({ children }: InlineCodeProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Обработчик клика — копирует текст в буфер обмена
   * @param e - Событие клика
   */
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = String(children).replace(/^\//, '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <code
      className={`px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono cursor-pointer transition-colors inline-block ${
        copied
          ? 'bg-green-500 text-white'
          : 'bg-muted text-accent-foreground hover:bg-muted/80'
      }`}
      onClick={handleCopy}
      title="Нажмите для копирования"
    >
      {copied ? '✓ Скопировано' : children}
    </code>
  );
}
