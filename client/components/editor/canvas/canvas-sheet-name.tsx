/**
 * @fileoverview Имя листа на узкой панели: бегущая строка, если текст не помещается
 */

import { useEffect, useRef, useState } from 'react';

/** Свойства бегущей строки имени листа */
interface CanvasSheetNameProps {
  /** Полное имя листа */
  name: string;
}

/**
 * Показывает имя листа. Если оно шире слота, прокручивает его туда-обратно.
 * @param props - Свойства строки
 * @returns Имя листа
 */
export function CanvasSheetName({ name }: CanvasSheetNameProps) {
  const viewRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const view = viewRef.current;
    const text = textRef.current;
    if (!view || !text) return;

    /** Считает, насколько имя вылезает за слот */
    const measure = () => {
      const overflow = text.scrollWidth - view.clientWidth;
      setShift(overflow > 4 ? overflow : 0);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    return () => observer.disconnect();
  }, [name]);

  return (
    <span ref={viewRef} className="relative min-w-0 flex-1 overflow-hidden">
      <span
        key={name}
        ref={textRef}
        title={name}
        className="inline-block whitespace-nowrap text-sm font-medium sheet-name-marquee"
        style={shift > 0 ? {
          ['--sheet-name-shift' as string]: `-${shift}px`,
          animationDuration: `${Math.max(4, shift / 24)}s`,
        } : { animation: 'none' }}
      >
        {name}
      </span>
    </span>
  );
}
