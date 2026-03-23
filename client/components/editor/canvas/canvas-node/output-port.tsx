/**
 * @fileoverview Компонент порта выхода соединения на узле холста
 *
 * Отображается как кружок на правом краю узла.
 * Появляется при наведении на узел (через CSS-класс group-hover родителя).
 * От порта пользователь начинает тянуть соединение к другому узлу.
 *
 * @module output-port
 */

import React, { useLayoutEffect, useRef } from 'react';
import { PORT_COLORS, PortType } from './port-colors';

/**
 * Пропсы компонента OutputPort
 */
interface OutputPortProps {
  /** Тип порта: "trigger-next", "auto-transition", "button-goto" */
  portType: PortType;
  /** ID кнопки — только для portType="button-goto" */
  buttonId?: string;
  /**
   * Обработчик начала перетаскивания соединения от порта.
   * portCenter — экранные координаты центра кружка-порта.
   */
  onPortMouseDown?: (e: React.MouseEvent, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => void;
  /** Принудительно показывать порт (например во время drag) */
  isActive?: boolean;
  /**
   * Колбэк, вызываемый после монтирования порта.
   * Передаёт buttonId и позицию центра порта относительно wrapper-div узла.
   * Используется для точного позиционирования линий соединений button-goto.
   */
  onMount?: (buttonId: string, offset: { x: number; y: number }) => void;
  /**
   * Ключ для принудительного пересчёта позиции порта.
   * Меняется когда структура родительского узла изменилась (например добавлена ветка).
   */
  layoutKey?: string | number;
}

/**
 * Компонент порта выхода соединения
 *
 * Рендерит кружок 16×16px, абсолютно позиционированный
 * на правом краю родительского узла. Скрыт по умолчанию,
 * появляется при hover узла через `group-hover:opacity-100`.
 *
 * Если передан `onMount` и `buttonId`, после монтирования вычисляет
 * Y-смещение центра порта относительно wrapper-div узла ([data-canvas-node])
 * и вызывает колбэк — это позволяет точно позиционировать линии соединений.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент порта
 */
export function OutputPort({ portType, buttonId, onPortMouseDown, onMount, layoutKey }: OutputPortProps) {
  const color = PORT_COLORS[portType];
  const portRef = useRef<HTMLDivElement>(null);

  /**
   * После монтирования вычисляем позицию центра порта относительно wrapper-div узла.
   * Используем offsetLeft/offsetTop — не зависят от CSS transform (zoom/pan).
   */
  useLayoutEffect(() => {
    if (!onMount || !buttonId || !portRef.current) return;

    const portEl = portRef.current;

    const nodeInnerEl = portEl.closest<HTMLElement>('[data-canvas-node]');
    if (!nodeInnerEl) return;

    // Суммируем offsetLeft/offsetTop по цепочке от порта до nodeInnerEl
    let xOffset = portEl.offsetLeft + portEl.offsetWidth; // правый край порта
    let yOffset = portEl.offsetTop + portEl.offsetHeight / 2; // центр порта по Y
    let el: HTMLElement | null = portEl.offsetParent as HTMLElement | null;

    while (el && el !== nodeInnerEl) {
      xOffset += el.offsetLeft;
      yOffset += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }

    // Добавляем смещение самого nodeInnerEl относительно wrapperEl
    xOffset += nodeInnerEl.offsetLeft;
    yOffset += nodeInnerEl.offsetTop;

    onMount(buttonId, { x: xOffset, y: yOffset });
  }, [buttonId, onMount, layoutKey]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const portCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    onPortMouseDown?.(e, portType, buttonId, portCenter);
  };

  return (
    <div
      ref={portRef}
      data-port-type={portType}
      data-button-id={buttonId}
      onMouseDown={handleMouseDown}
      className={`transition-all duration-150 cursor-crosshair z-20 hover:scale-125 opacity-100`}
      style={{
        position: 'absolute',
        right: -8,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 16,
        height: 16,
        borderRadius: '50%',
        backgroundColor: color,
        border: '2px solid white',
        boxShadow: `0 0 0 1px ${color}`,
      }}
      title={`Соединение: ${portType}`}
    />
  );
}
