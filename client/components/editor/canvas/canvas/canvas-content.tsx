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

  return (
    <div
      className="relative origin-top-left transition-transform duration-200 ease-out"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
        transformOrigin: '0 0',
      }}
    >
      {/* SVG-слой соединений — рисуется под нодами */}
      <ConnectionsLayer nodes={nodes} nodeSizes={nodeSizes} />

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
        />
      ))}
    </div>
  );
}
