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
   * Передаёт buttonId и Y-смещение центра порта от верха ближайшего [data-canvas-node] wrapper-div.
   * Используется для точного позиционирования линий соединений button-goto.
   */
  onMount?: (buttonId: string, yOffset: number) => void;
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
export function OutputPort({ portType, buttonId, onPortMouseDown, onMount }: OutputPortProps) {
  const color = PORT_COLORS[portType];
  const portRef = useRef<HTMLDivElement>(null);

  /**
   * После монтирования вычисляем Y-смещение центра порта от верха wrapper-div узла.
   * Используем offsetTop вместо getBoundingClientRect — offsetTop не зависит от
   * CSS transform (zoom/pan) и возвращает позицию в layout-координатах.
   */
  useLayoutEffect(() => {
    if (!onMount || !buttonId || !portRef.current) return;

    const portEl = portRef.current;

    // Ищем ближайший [data-canvas-node] — внутренний div узла
    const nodeInnerEl = portEl.closest<HTMLElement>('[data-canvas-node]');
    if (!nodeInnerEl) return;

    // wrapper-div — родитель nodeInnerEl (именно его top = node.position.y)
    const wrapperEl = nodeInnerEl.parentElement;
    if (!wrapperEl) return;

    // Суммируем offsetTop по цепочке от порта до nodeInnerEl
    // (nodeInnerEl — первый positioned ancestor, он же offsetParent для порта)
    let yOffset = portEl.offsetHeight / 2; // центр порта
    let el: HTMLElement | null = portEl;
    while (el && el !== nodeInnerEl) {
      yOffset += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }

    // Добавляем offsetTop самого nodeInnerEl относительно wrapperEl
    // (nodeInnerEl имеет position: relative, wrapperEl — position: absolute)
    yOffset += nodeInnerEl.offsetTop;

    onMount(buttonId, yOffset);
  }, [buttonId, onMount]);

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
