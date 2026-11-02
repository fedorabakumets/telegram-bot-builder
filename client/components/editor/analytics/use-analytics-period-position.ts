/** @fileoverview Сохранение высоты и прокрутки аналитики при переключении периода без показа старых чисел. */
import { useLayoutEffect, useRef, type RefObject } from 'react';
/** Удерживает высоту содержимого до получения нового снимка и затем возвращает позицию прокрутки. */
export function useAnalyticsPeriodPosition(root: RefObject<HTMLDivElement>, snapshot: unknown, failed: boolean) {
  const content = useRef<HTMLDivElement>(null);
  const position = useRef<number | null>(null);
  /** Снимает геометрию до скрытия отчётов предыдущего периода. */
  function preserve() {
    const viewport=root.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport || !content.current) return;
    position.current=viewport.scrollTop;
    content.current.style.minHeight=`${content.current.getBoundingClientRect().height}px`;
  }
  useLayoutEffect(()=>{
    if(position.current===null || !content.current || (!snapshot && !failed)) return;
    const viewport=root.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    content.current.style.minHeight='';
    if(viewport) viewport.scrollTop=position.current;
    position.current=null;
  },[snapshot,failed,root]);
  return {content,preserve};
}
