/** @fileoverview Навигация по сообщениям открытого диалога. */

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { BotMessageWithMedia } from '../types';

/** Свойства навигации по истории. */
interface MessageNavigationProps {
  /** Сообщения в порядке отображения. */
  messages: BotMessageWithMedia[];
  /** Контейнер прокручиваемой истории. */
  scrollRef: RefObject<HTMLDivElement>;
  /** Общее число сохранённых сообщений либо null, если оно неизвестно. */
  total: number | null;
}

/**
 * Показывает отметки сообщений и позволяет перейти к нужному месту истории.
 * @param props - Сообщения и контейнер истории
 * @returns Панель навигации или null для короткой истории
 */
export function MessageNavigation({ messages, scrollRef, total }: MessageNavigationProps) {
  const [active, setActive] = useState(0);
  /** Границы сообщений, видимых в области переписки. */
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 0]);
  /** Позиция отметки под указателем или клавиатурным фокусом. */
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  /** Каждому загруженному сообщению соответствует собственная отметка. */
  const indexes = messages.map((_, index) => index);
  /** Удерживаемый указатель продолжает управлять шкалой за её границами. */
  const pointer = useRef<number | null>(null);
  const lastDragged = useRef<number | null>(null);

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    /** Находит сообщение, ближайшее к верхнему краю истории. */
    const update = () => {
      const top = viewport.getBoundingClientRect().top;
      const nodes = Array.from(viewport.querySelectorAll<HTMLElement>('[data-dialog-index]'));
      const bottom = viewport.getBoundingClientRect().bottom;
      const visible = nodes.filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.bottom > top + 8 && rect.top < bottom - 8;
      });
      if (visible.length) {
        const first = Number(visible[0].dataset.dialogIndex);
        const last = Number(visible[visible.length - 1].dataset.dialogIndex);
        setActive(first);
        setVisibleRange((previous) => previous[0] === first && previous[1] === last ? previous : [first, last]);
      }
    };
    viewport.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(viewport);
    viewport.querySelectorAll<HTMLElement>('[data-dialog-index]').forEach((node) => resize.observe(node));
    update();
    return () => { viewport.removeEventListener('scroll', update); resize.disconnect(); };
  }, [messages, scrollRef]);

  if (messages.length < 2) return null;
  const closest = indexes.reduce((best, index) =>
    Math.abs(index - active) < Math.abs(best - active) ? index : best, indexes[0]);

  /** Прокручивает историю к сообщению, указанному в предпросмотре. */
  const navigate = (index: number) => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    const target = viewport?.querySelector<HTMLElement>(`[data-dialog-index="${index}"]`);
    if (viewport && target) viewport.scrollTop += target.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  };

  /**
   * Находит отметку по вертикали указателя и сразу прокручивает к сообщению.
   * @param nav - Контейнер отметок
   * @param clientY - Вертикальная координата указателя
   */
  const scrub = (nav: HTMLElement, clientY: number) => {
    const ticks = nav.querySelectorAll<HTMLButtonElement>('button');
    if (!ticks.length) return;
    const first = ticks[0].getBoundingClientRect();
    const last = ticks[ticks.length - 1].getBoundingClientRect();
    const fraction = (clientY - first.top) / Math.max(1, last.bottom - first.top);
    const index = Math.max(0, Math.min(messages.length - 1, Math.floor(fraction * messages.length)));
    if (lastDragged.current === index) return;
    lastDragged.current = index;
    setFocusedIndex(index);
    navigate(index);
  };

  return (
    <nav aria-label="Навигация по сообщениям" className="group/nav relative z-10 flex min-h-0 w-10 shrink-0 touch-none select-none flex-col items-center justify-center py-2"
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return;
        event.preventDefault(); pointer.current = event.pointerId; lastDragged.current = null;
        event.currentTarget.setPointerCapture(event.pointerId); scrub(event.currentTarget, event.clientY);
      }}
      onPointerMove={(event) => { if (pointer.current === event.pointerId) scrub(event.currentTarget, event.clientY); }}
      onPointerUp={(event) => { if (pointer.current === event.pointerId) { pointer.current = null; event.currentTarget.releasePointerCapture(event.pointerId); setFocusedIndex(null); } }}
      onPointerCancel={() => { pointer.current = null; setFocusedIndex(null); }}
      onLostPointerCapture={() => { pointer.current = null; setFocusedIndex(null); }}>
      {indexes.map((index, position) => {
        const message = messages[index];
        /** Номер отсчитывается от начала сохранённой истории. */
        const number = total !== null && total >= messages.length ? total - messages.length + index + 1 : null;
        const label = number === null ? 'Сообщение' : `Сообщение ${number}`;
        const preview = (message.messageText || 'Сообщение без текста').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        /** Соседние отметки расширяются слабее выбранной. */
        const distance = focusedIndex === null ? Infinity : Math.abs(position - focusedIndex);
        const width = distance === 0 ? 'w-7' : distance === 1 ? 'w-5' : distance === 2 ? 'w-3' : 'w-2';
        /** Отметка относится к видимому участку истории. */
        const isVisible = index >= visibleRange[0] && index <= visibleRange[1];
        /** У краёв шкалы карточка раскрывается внутрь области переписки. */
        const previewPosition = position < 5 ? 'top-0' : position >= indexes.length - 5 ? 'bottom-0' : 'top-1/2 -translate-y-1/2';
        return (
          <button key={index} type="button" aria-label={`${label}: ${preview}`}
            aria-current={isVisible ? 'true' : undefined}
            onMouseEnter={() => setFocusedIndex(position)}
            onMouseLeave={() => setFocusedIndex(null)}
            onFocus={() => setFocusedIndex(position)}
            onBlur={() => setFocusedIndex(null)}
            onClick={(event) => { if (event.detail === 0) navigate(index); }}
            className="group relative flex min-h-0 max-h-3 w-9 flex-1 items-center justify-start rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            <span className={`h-0.5 rounded-full transition-[width,background-color,opacity] duration-200 ease-out ${isVisible && distance > 2 ? 'w-4' : width} ${distance === 0 || isVisible ? 'bg-zinc-900 opacity-100 dark:bg-zinc-100' : index === closest ? 'bg-zinc-700 opacity-70 dark:bg-zinc-200' : 'bg-zinc-500 opacity-30 group-hover/nav:opacity-70 group-focus-within/nav:opacity-70 dark:bg-zinc-400'}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute left-full z-20 ml-3 hidden w-80 max-w-[min(20rem,65vw)] rounded-xl border border-zinc-300 bg-white p-3 text-left text-sm leading-relaxed text-zinc-800 shadow-lg group-hover:block group-focus-visible:block dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${previewPosition}`}>
              <span className="mb-1 block font-medium">{label}</span>
              <span className="line-clamp-3 block break-words text-zinc-600 dark:text-zinc-300">{preview}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
