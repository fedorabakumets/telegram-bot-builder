/**
 * @fileoverview Типы для контекстного меню узла канваса
 */

/**
 * Один пункт контекстного меню
 */
export interface ContextMenuItem {
  /** Уникальный идентификатор пункта */
  id: string;
  /** Отображаемый текст */
  label: string;
  /** CSS-класс иконки FontAwesome */
  icon: string;
  /** Обработчик клика */
  onClick: () => void;
  /** Признак опасного действия (красный цвет) */
  danger?: boolean;
}

/**
 * Позиция контекстного меню на экране
 */
export interface ContextMenuPosition {
  /** Координата X в пикселях */
  x: number;
  /** Координата Y в пикселях */
  y: number;
}

/**
 * Состояние контекстного меню
 */
export interface ContextMenuState {
  /** Видимость меню */
  visible: boolean;
  /** Позиция меню */
  position: ContextMenuPosition;
}
