/**
 * @fileoverview Компонент редактируемой области
 * @description ContentEditable div с placeholder и обработчиками событий.
 * Поддерживает клик по ссылкам для открытия редактора URL.
 */

import type { RefObject } from 'react';

/**
 * Свойства компонента EditorContent
 */
export interface EditorContentProps {
  /** Текущее значение редактора */
  value: string;
  /** Обработчик ввода */
  onInput: () => void;
  /** Обработчик нажатия клавиш */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Текст-заполнитель */
  placeholder: string;
  /** Ref для доступа к DOM элементу */
  innerRef: RefObject<HTMLDivElement>;
  /** Дочерние элементы (например, StatsBar) */
  children?: React.ReactNode;
  /** Callback при клике по ссылке — открывает редактор URL */
  onLinkClick?: () => void;
  /** Callback при потере фокуса — сохраняет текущее выделение */
  onBlur?: () => void;
}

/**
 * Редактируемая область с поддержкой contentEditable
 */
export function EditorContent({
  value,
  onInput,
  onKeyDown,
  placeholder,
  innerRef,
  children,
  onLinkClick,
  onBlur
}: EditorContentProps) {
  /**
   * Перехватывает клик по <a> внутри contenteditable.
   * Предотвращает переход по ссылке и открывает редактор URL.
   */
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      e.preventDefault();
      onLinkClick?.();
    }
  };

  return (
    <div className="relative border border-slate-300/60 dark:border-slate-700/60 rounded-lg bg-white dark:bg-slate-950 overflow-hidden transition-all hover:border-slate-400/80 dark:hover:border-slate-600/80 focus-within:ring-2 focus-within:ring-blue-500/50 dark:focus-within:ring-blue-500/30">
      {/* Placeholder */}
      {!value && (
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 text-slate-400 dark:text-slate-600 text-sm sm:text-base pointer-events-none font-medium">
          {placeholder}
        </div>
      )}

      {/* Редактируемая область */}
      <div
        ref={innerRef}
        contentEditable
        suppressContentEditableWarning={true}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onClick={handleClick}
        onBlur={onBlur}
        className="min-h-[80px] sm:min-h-[100px] max-h-[200px] overflow-y-auto p-3 sm:p-4 w-full text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none whitespace-pre-wrap selection:bg-blue-200 dark:selection:bg-blue-900 [&_tg-spoiler]:inline [&_tg-spoiler]:blur-sm [&_tg-spoiler]:bg-slate-300/70 [&_tg-spoiler]:dark:bg-slate-600/70 [&_tg-spoiler]:rounded [&_tg-spoiler]:px-0.5 [&_tg-spoiler]:cursor-pointer [&_tg-spoiler]:transition-[filter] [&_tg-spoiler]:duration-200 hover:[&_tg-spoiler]:blur-none [&_a]:text-blue-500 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:decoration-blue-400/60 [&_a]:dark:decoration-blue-500/60 [&_a]:underline-offset-2 [&_a]:cursor-pointer"
        style={{
          lineHeight: '1.5',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
        data-placeholder={placeholder}
      />

      {/* Дочерние элементы */}
      {children}
    </div>
  );
}
