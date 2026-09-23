/**
 * @fileoverview Компонент посимвольного появления текста
 * @module components/editor/auth/TypewriterText
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/utils';
import { useTypewriter } from './hooks/use-typewriter';

/** Пропсы печатного текста */
export interface TypewriterTextProps {
  /** Полный текст */
  text: string;
  /** CSS-классы */
  className?: string;
  /** Задержка перед стартом (мс) */
  delayMs?: number;
  /** Интервал между символами (мс) */
  speedMs?: number;
  /** Показывать мигающий курсор до конца печати */
  showCursor?: boolean;
  /** Вызов после завершения печати */
  onDone?: () => void;
}

/**
 * Рендерит текст с эффектом появления по символам
 * @param props - Свойства
 * @returns JSX элемент
 */
export function TypewriterText({
  text,
  className,
  delayMs = 400,
  speedMs = 34,
  showCursor = true,
  onDone,
}: TypewriterTextProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const doneFiredRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const { text: visible, done } = useTypewriter(text, {
    delayMs,
    speedMs,
    disabled: reduceMotion,
  });

  useEffect(() => {
    doneFiredRef.current = false;
  }, [text]);

  useEffect(() => {
    if (!done || doneFiredRef.current) return;
    doneFiredRef.current = true;
    onDone?.();
  }, [done, onDone]);

  return (
    <span className={cn('inline', className)} aria-label={text}>
      <span aria-hidden="true">{visible}</span>
      {showCursor && !done ? (
        <span
          className="inline-block w-[0.55ch] ml-0.5 -mb-0.5 h-[1.05em] align-[-0.15em] bg-current animate-pulse"
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}
