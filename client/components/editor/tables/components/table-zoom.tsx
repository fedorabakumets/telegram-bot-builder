/** @fileoverview Масштабирование сетки таблицы с доступными кнопками управления. */
import { useEffect, useRef, type ReactNode } from 'react';
import { TableViewportContext } from '../hooks/table-viewport-context';
import { useTablePreference } from '../hooks/use-table-preference';
import { Minus, Plus } from 'lucide-react';

/** Свойства масштабируемой области таблицы. */
interface TableZoomProps {
  /** История и дополнительные кнопки перед масштабом. */
  controls?: ReactNode;
  /** Ключ сохранения масштаба текущей таблицы. */
  storageKey: string;
  /** Сетка таблицы со всеми обработчиками редактирования. */
  children: ReactNode;
}
/**
 * Масштабирует только сетку, сохраняя размер фильтров и управляющих кнопок.
 * @param props - Содержимое таблицы.
 * @returns Сетка с управлением масштабом от 10 до 150 процентов.
 */
export function TableZoom({ children, storageKey, controls }: TableZoomProps) {
  const [scale, setScale] = useTablePreference(storageKey, 100);
  /** Область перехвата жеста масштабирования тачпада. */
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    /**
     * Обрабатывает жест сведения пальцев как масштаб таблицы вместо масштаба страницы.
     * @param event - Событие колеса с признаком жеста масштабирования.
     * @returns Завершение обработки; обычная прокрутка остаётся браузеру.
     */
    const handlePinch = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
      setScale((value) => Math.min(150, Math.max(10, value * Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.005))));
    };
    viewport.addEventListener('wheel', handlePinch, { passive: false });
    return () => viewport.removeEventListener('wheel', handlePinch);
  }, []);
  /** Единое оформление кнопок масштаба и их состояний. */
  const buttonClass = 'tables-control rounded-md border border-border p-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div role="group" aria-label="Масштаб таблицы" className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-4 py-2">
        {controls}<span className="ml-auto text-xs text-muted-foreground" title="Сведите или разведите пальцы на тачпаде над таблицей">Масштаб таблицы</span>
        <button type="button" className={buttonClass} aria-label="Уменьшить масштаб таблицы" title="Уменьшить масштаб"
          disabled={scale <= 10} onClick={() => setScale((value) => Math.max(10, value - 10))}>
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className={`${buttonClass} min-w-16 tabular-nums`} aria-label="Сбросить масштаб таблицы до 100%"
          title="Сбросить до 100%" onClick={() => setScale(100)}><span aria-live="polite">{Math.round(scale)}%</span></button>
        <button type="button" className={buttonClass} aria-label="Увеличить масштаб таблицы" title="Увеличить масштаб"
          disabled={scale >= 150} onClick={() => setScale((value) => Math.min(150, value + 10))}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div ref={viewportRef} className="min-h-0 min-w-0 flex-1 overflow-auto">
        <TableViewportContext.Provider value={{ element: viewportRef, scale: scale / 100 }}><div style={{ zoom: scale / 100 }}>{children}</div></TableViewportContext.Provider>
      </div>
    </div>
  );
}
