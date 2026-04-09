/**
 * @fileoverview Вывод терминала с автоскроллом и кнопкой прокрутки вниз
 *
 * Компонент отображает строки вывода терминала с поддержкой ANSI,
 * автоматически скроллит вниз при новых строках (если пользователь не листал вверх),
 * и показывает кнопку "↓" когда пользователь прокрутил вверх.
 *
 * @module TerminalOutput
 */

import { useState, useEffect, useCallback } from 'react';
import Ansi from 'ansi-to-react';

/** Строка вывода терминала */
interface TerminalLine {
  /** Уникальный идентификатор строки */
  id: string;
  /** Текстовое содержимое строки */
  content: string;
  /** Тип потока: стандартный вывод или ошибки */
  type: 'stdout' | 'stderr';
}

/** Пропсы компонента вывода терминала */
interface TerminalOutputProps {
  /** Массив строк для отображения */
  lines: TerminalLine[];
  /** Ссылка на контейнер прокрутки */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Высота контейнера (опционально) */
  height?: number;
  /** Масштаб шрифта */
  scale: number;
  /** CSS-класс для обычного текста */
  terminalTextClass: string;
  /** CSS-класс для текста ошибок */
  stderrTextClass: string;
  /** CSS-класс для текста-заглушки */
  placeholderTextClass: string;
}

/**
 * Проверяет, находится ли контейнер в нижней позиции прокрутки
 * @param el - DOM-элемент контейнера
 * @returns true если прокрутка у нижнего края (погрешность 10px)
 */
function checkIsAtBottom(el: HTMLDivElement): boolean {
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
}

/**
 * Компонент вывода терминала с автоскроллом
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalOutput({
  lines,
  containerRef,
  height,
  scale,
  terminalTextClass,
  stderrTextClass,
  placeholderTextClass,
}: TerminalOutputProps) {
  /** Флаг видимости кнопки прокрутки вниз */
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  /**
   * Прокручивает контейнер в самый низ и скрывает кнопку
   */
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
  }, [containerRef]);

  /**
   * Обработчик события прокрутки — обновляет видимость кнопки
   */
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setShowScrollBtn(!checkIsAtBottom(el));
  }, [containerRef]);

  // Автоскролл при появлении новых строк (только если были внизу)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (checkIsAtBottom(el)) {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [lines, containerRef]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto p-4 whitespace-pre-wrap break-all flex flex-col h-full w-full"
        style={{ fontSize: `${scale}em`, lineHeight: `${1.2 * scale}` }}
      >
        {lines.length === 0 ? (
          <div
            className="flex items-center justify-center h-full italic"
            style={{ color: placeholderTextClass }}
          >
            Нет вывода...
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={line.type === 'stderr' ? stderrTextClass : terminalTextClass}
              style={{ wordWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
            >
              <Ansi>{line.content}</Ansi>
            </div>
          ))
        )}
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-primary/80 hover:bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-all"
          title="Прокрутить вниз"
        >
          ↓
        </button>
      )}
    </div>
  );
}
