/**
 * @fileoverview SVG-компонент соединительной линии между основной карточкой ноды
 * и прикреплённым блоком клавиатуры
 *
 * Рисует короткую вертикальную линию серого цвета без стрелки.
 * Не перехватывает события мыши.
 *
 * @module canvas-node/keyboard-connector
 */

/**
 * Свойства компонента KeyboardConnector
 */
interface KeyboardConnectorProps {
  /** Центр X линии (горизонтальная середина карточки) */
  x: number;
  /** Y-координата нижней границы основной карточки */
  y1: number;
  /** Y-координата верхней границы блока клавиатуры */
  y2: number;
}

/** Цвет соединительной линии */
const LINE_COLOR = '#94a3b8';

/** Параметры пунктира — идентичны стилю линий автоперехода */
const DASH_ARRAY = '8 5';
const STROKE_WIDTH = 2;
const OPACITY = 0.8;

/**
 * Компонент короткой вертикальной линии между карточкой ноды и блоком клавиатуры
 *
 * @param props - Свойства компонента
 * @returns SVG-элемент с вертикальной линией и точками на концах
 */
export function KeyboardConnector({ x, y1, y2 }: KeyboardConnectorProps) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 9,
      }}
    >
      {/* Тень для глубины — как в connections-layer */}
      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke={LINE_COLOR}
        strokeWidth={STROKE_WIDTH + 2}
        strokeOpacity={0.1}
        strokeDasharray={DASH_ARRAY}
      />
      {/* Основная пунктирная линия */}
      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2}
        stroke={LINE_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeOpacity={OPACITY}
        strokeDasharray={DASH_ARRAY}
      />
    </svg>
  );
}
