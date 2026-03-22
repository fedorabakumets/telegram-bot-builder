/**
 * @fileoverview Компонент содержимого холста
 *
 * Содержит узлы на холсте редактора и SVG-слой соединений между ними.
 */

import { CanvasNode } from '@/components/editor/canvas/canvas-node/canvas-node';
import { ConnectionsLayer } from '@/components/editor/canvas/canvas-node/connections-layer';
import { DraftConnectionLayer } from '@/components/editor/canvas/canvas-node/draft-connection-layer';
import { Node } from '@/types/bot';
import { BotDataWithSheets } from '@shared/schema';
import { PortType } from '../canvas-node/port-colors';
import { DraftConnection } from './use-connection-drag';
import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Свойства компонента содержимого холста
 */
interface CanvasContentProps {
  /** Данные бота с поддержкой листов */
  botData?: BotDataWithSheets;
  /** Массив узлов на холсте */
  nodes: Node[];
  /** Смещение холста */
  pan: { x: number; y: number };
  /** Масштаб холста (в процентах) */
  zoom: number;
  /** Идентификатор выбранного узла */
  selectedNodeId: string | null;
  /** Колбэк при выборе узла */
  onNodeSelect: (nodeId: string) => void;
  /** Колбэк при удалении узла */
  onNodeDelete: (nodeId: string) => void;
  /** Колбэк при дублировании узла */
  onNodeDuplicate?: (nodeId: string, targetPosition?: { x: number; y: number }) => void;
  /**
   * Колбэк для дублирования узла через контекстное меню.
   * Позиция вычисляется в canvas.tsx через getPastePosition() — ту же функцию,
   * что использует Ctrl+V — поэтому дубль всегда попадает в точку последнего клика.
   */
  onNodeDuplicateAtPosition?: (nodeId: string) => void;
  /** Колбэк при перемещении узла */
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  /** Колбэк в начале перемещения узла */
  onNodeMoveStart?: (nodeId: string) => void;
  /** Колбэк в конце перемещения узла */
  onNodeMoveEnd?: (nodeId: string) => void;
  /** Установка флага перетаскивания узла */
  setIsNodeBeingDragged?: (isDragging: boolean) => void;
  /** Колбэк при изменении размера узла */
  onSizeChange: (nodeId: string, size: { width: number; height: number }) => void;
  /** Карта реальных размеров узлов (из ResizeObserver) */
  nodeSizes: Map<string, { width: number; height: number }>;
  /** Обработчик начала перетаскивания от порта выхода */
  onPortMouseDown?: (e: React.MouseEvent, nodeId: string, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => void;
  /** Текущее временное соединение при drag-to-connect */
  draftConnection?: DraftConnection | null;
  /** ID узла под курсором при drag-to-connect (для подсветки цели) */
  hoveredTargetNodeId?: string | null;
  /** Колбэк удаления соединения */
  onConnectionDelete?: (fromId: string, toId: string, type: string) => void;
}

/**
 * Компонент содержимого холста
 *
 * @param props - Свойства компонента
 * @returns JSX элемент содержимого холста
 */
export function CanvasContent({
  botData,
  nodes,
  pan,
  zoom,
  selectedNodeId,
  onNodeSelect,
  onNodeDelete,
  onNodeDuplicate,
  onNodeDuplicateAtPosition,
  onNodeMove,
  onNodeMoveStart,
  onNodeMoveEnd,
  setIsNodeBeingDragged,
  onSizeChange,
  nodeSizes,
  onPortMouseDown,
  draftConnection,
  hoveredTargetNodeId,
  onConnectionDelete,
}: CanvasContentProps) {
  /**
   * Получение всех узлов со всех листов для отображения связей
   */
  const getAllNodesFromAllSheets = (): Node[] => {
    if (!botData?.sheets) return [];
    const allNodes: Node[] = [];
    botData.sheets.forEach(sheet => {
      if (sheet.nodes) allNodes.push(...sheet.nodes);
    });
    return allNodes;
  };

  const allNodes = botData ? getAllNodesFromAllSheets() : nodes;

  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Карта Y-смещений портов кнопок относительно верха узла.
   * buttonId → yOffset (в canvas-координатах, без учёта zoom)
   */
  const [buttonPortYOffsets, setButtonPortYOffsets] = useState<Map<string, number>>(new Map());

  /**
   * Пересчитывает Y-смещения всех портов кнопок.
   * Ищет элементы [data-button-id] внутри контейнера и вычисляет
   * их Y-позицию относительно ближайшего wrapper-div узла ([data-canvas-node]).
   */
  const recalcButtonPortOffsets = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const portEls = container.querySelectorAll<HTMLElement>('[data-button-id]');
    const newMap = new Map<string, number>();

    portEls.forEach(portEl => {
      const buttonId = portEl.getAttribute('data-button-id');
      if (!buttonId) return;

      // Ищем ближайший [data-canvas-node] — внутренний div узла
      const nodeInnerEl = portEl.closest<HTMLElement>('[data-canvas-node]');
      if (!nodeInnerEl) return;

      // wrapper-div — родитель nodeInnerEl (именно его top используется как node.position.y)
      const wrapperEl = nodeInnerEl.parentElement;
      if (!wrapperEl) return;

      const portRect = portEl.getBoundingClientRect();
      const wrapperRect = wrapperEl.getBoundingClientRect();

      // Y-смещение центра порта от верха wrapper-div (в экранных пикселях)
      const screenYOffset = (portRect.top + portRect.height / 2) - wrapperRect.top;

      // Переводим в canvas-координаты (делим на zoom)
      const canvasYOffset = screenYOffset / (zoom / 100);

      newMap.set(buttonId, canvasYOffset);
    });

    setButtonPortYOffsets(newMap);
  }, [zoom]);

  // Пересчитываем при изменении узлов или размеров
  useEffect(() => {
    // requestAnimationFrame гарантирует что DOM уже обновился после рендера
    const raf = requestAnimationFrame(recalcButtonPortOffsets);
    return () => cancelAnimationFrame(raf);
  }, [nodes, nodeSizes, recalcButtonPortOffsets]);

  return (
    <div
      ref={containerRef}
      className="relative origin-top-left transition-transform duration-200 ease-out"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
        transformOrigin: '0 0',
      }}
    >
      {/* SVG-слой соединений — рисуется под нодами */}
      <ConnectionsLayer nodes={nodes} nodeSizes={nodeSizes} onConnectionDelete={onConnectionDelete} buttonPortYOffsets={buttonPortYOffsets} />

      {/* SVG-слой временного соединения при drag-to-connect */}
      <DraftConnectionLayer draftConnection={draftConnection ?? null} />

      {/* Узлы */}
      {nodes.map((node) => (
        <CanvasNode
          key={node.id}
          node={node}
          allNodes={allNodes}
          isSelected={selectedNodeId === node.id}
          onClick={() => onNodeSelect(node.id)}
          onDelete={() => onNodeDelete(node.id)}
          onDuplicate={onNodeDuplicate ? (targetPosition) => onNodeDuplicate(node.id, targetPosition) : undefined}
          onDuplicateAtPosition={onNodeDuplicateAtPosition ? () => onNodeDuplicateAtPosition(node.id) : undefined}
          onMove={(position) => onNodeMove(node.id, position)}
          onMoveStart={() => onNodeMoveStart?.(node.id)}
          onMoveEnd={() => onNodeMoveEnd?.(node.id)}
          zoom={zoom}
          pan={pan}
          setIsNodeBeingDragged={setIsNodeBeingDragged}
          onSizeChange={onSizeChange}
          onPortMouseDown={onPortMouseDown}
          isConnectionTarget={hoveredTargetNodeId === node.id}
          isConnectionSource={draftConnection?.fromNodeId === node.id}
        />
      ))}
    </div>
  );
}
