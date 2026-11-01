/** @fileoverview Контекст прокручиваемой области и масштаба для оконного отображения строк. */
import { createContext, type RefObject } from 'react';
/** Данные прокручиваемого окна таблицы. */
export interface TableViewport {
  /** Прокручиваемый контейнер сетки. */
  element: RefObject<HTMLDivElement>;
  /** Текущий коэффициент масштаба. */
  scale: number;
}
/** Окно таблицы передаётся без привязки к размеру всего браузера. */
export const TableViewportContext = createContext<TableViewport | null>(null);
