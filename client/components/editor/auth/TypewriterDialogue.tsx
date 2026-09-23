/**
 * @fileoverview Последовательные реплики с печатным текстом (как в играх)
 * @module components/editor/auth/TypewriterDialogue
 */

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/utils/utils';
import { TypewriterText } from './TypewriterText';

/** Реплика: текст и опциональная ссылка после печати */
export interface DialogueLine {
  /** Текст реплики */
  text: string;
  /** Ссылка, показывается после допечатки */
  link?: {
    /** URL */
    href: string;
    /** Подпись ссылки */
    label: string;
  };
}

/** Пропсы диалога */
export interface TypewriterDialogueProps {
  /** Реплики по порядку */
  lines: Array<string | DialogueLine>;
  /** CSS-классы контейнера */
  className?: string;
  /** Класс каждой реплики */
  lineClassName?: string;
  /** Пауза перед первой репликой (мс) */
  startDelayMs?: number;
  /** Пауза между репликами (мс) */
  gapMs?: number;
  /** Скорость печати символа (мс) */
  speedMs?: number;
  /** Вызов после каждой завершённой реплики (индекс с 0) */
  onLineDone?: (index: number) => void;
  /** Вызов когда все реплики допечатаны */
  onAllDone?: () => void;
}

/**
 * Приводит реплику к единому виду
 * @param line - строка или объект
 * @returns Нормализованная реплика
 */
function normalizeLine(line: string | DialogueLine): DialogueLine {
  return typeof line === 'string' ? { text: line } : line;
}

/**
 * Печатает реплики одну за другой
 * @param props - Свойства
 * @returns JSX элемент
 */
export function TypewriterDialogue({
  lines,
  className,
  lineClassName,
  startDelayMs = 200,
  gapMs = 420,
  speedMs = 30,
  onLineDone,
  onAllDone,
}: TypewriterDialogueProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const firedRef = useRef<Set<number>>(new Set());
  const normalized = lines.map(normalizeLine);

  const handleLineDone = useCallback((index: number) => {
    if (firedRef.current.has(index)) return;
    firedRef.current.add(index);

    setCompleted((prev) => (prev.includes(index) ? prev : [...prev, index]));
    onLineDone?.(index);

    if (index >= normalized.length - 1) {
      onAllDone?.();
      return;
    }

    window.setTimeout(() => {
      setActiveIndex((current) => (current === index ? index + 1 : current));
    }, gapMs);
  }, [gapMs, normalized.length, onAllDone, onLineDone]);

  if (!normalized.length) return null;

  return (
    <div className={cn('space-y-2 text-center', className)} role="status" aria-live="polite">
      {normalized.map((line, index) => {
        if (index > activeIndex) return null;
        const isActive = index === activeIndex && !completed.includes(index);
        const isDone = completed.includes(index);

        return (
          <p key={`${index}-${line.text.slice(0, 12)}`} className={cn('leading-relaxed', lineClassName)}>
            {isDone ? (
              <>
                <span>{line.text}</span>
                {line.link ? (
                  <>
                    {' '}
                    <a
                      href={line.link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {line.link.label}
                    </a>
                  </>
                ) : null}
              </>
            ) : isActive ? (
              <TypewriterText
                text={line.text}
                delayMs={index === 0 ? startDelayMs : 80}
                speedMs={speedMs}
                onDone={() => handleLineDone(index)}
              />
            ) : null}
          </p>
        );
      })}
    </div>
  );
}
