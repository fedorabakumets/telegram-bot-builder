/**
 * @fileoverview Компонент порта выхода соединения на узле холста
 *
 * Отображается как кружок на правом краю узла.
 * Появляется при наведении на узел (через CSS-класс group-hover родителя).
 * От порта пользователь начинает тянуть соединение к другому узлу.
 *
 * @module output-port
 */

import React from 'react';
import { PORT_COLORS, PortType } from './port-colors';

/**
 * Пропсы компонента OutputPort
 */
interface OutputPortProps {
  /** Тип порта: "trigger-next", "auto-transition", "button-goto" */
  portType: PortType;
  /** ID кнопки — только для portType="button-goto" */
  buttonId?: string;
  /** Обработчик начала перетаскивания соединения от порта */
  onPortMouseDown?: (e: React.MouseEvent, portType: PortType, buttonId?: string) => void;
}

/**
 * Компонент порта выхода соединения
 *
 * Рендерит кружок 16×16px, абсолютно позиционированный
 * на правом краю родительского узла. Скрыт по умолчанию,
 * появляется при hover узла через `group-hover:opacity-100`.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент порта
 */
export function OutputPort({ portType, buttonId, onPortMouseDown }: OutputPortProps) {
  const color = PORT_COLORS[portType];

  const handleMouseDown = (e: React.MouseEvent) => {
    // Останавливаем всплытие чтобы не запустить drag узла
    e.stopPropagation();
    e.preventDefault();
    onPortMouseDown?.(e, portType, buttonId);
  };

  return (
    <div
      data-port-type={portType}
      data-button-id={buttonId}
      onMouseDown={handleMouseDown}
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-crosshair z-20 hover:scale-125 transition-transform"
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
