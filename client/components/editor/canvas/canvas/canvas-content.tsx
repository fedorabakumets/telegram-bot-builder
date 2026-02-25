/**
 * @fileoverview Компонент содержимого холста
 *
 * Содержит узлы на холсте редактора.
 */

import { CanvasNode } from '@/components/editor/canvas/canvas-node/canvas-node';
import { Node } from '@/types/bot';
import { BotDataWithSheets } from '@shared/schema';

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
  onNodeDuplicate?: (nodeId: string) => void;
  /** Колбэк при перемещении узла */
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  /** Колбэк в конце перемещения узла */
  onNodeMoveEnd?: (nodeId: string) => void;
  /** Колбэк для логирования действий */
  onActionLog?: (type: 'move', description: string) => void;
  /** Установка флага перетаскивания узла */
  setIsNodeBeingDragged?: (isDragging: boolean) => void;
  /** Колбэк при изменении размера узла */
  onSizeChange: (nodeId: string, size: { width: number; height: number }) => void;
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
  onNodeMove,
  onNodeMoveEnd,
  onActionLog,
  setIsNodeBeingDragged,
  onSizeChange
}: CanvasContentProps) {
  /**
   * Получение всех узлов со всех листов для отображения связей
   */
  const getAllNodesFromAllSheets = () => {
    if (!botData?.sheets) return [];
    const allNodes: Node[] = [];
    botData.sheets.forEach(sheet => {
      if (sheet.nodes) {
        allNodes.push(...sheet.nodes);
      }
    });
    return allNodes;
  };

  return (
    <div
      className="relative origin-top-left transition-transform duration-200 ease-out"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
        transformOrigin: '0 0'
      }}
    >
      {/* Nodes */}
      {nodes.map((node) => (
        <CanvasNode
          key={node.id}
          node={node}
          allNodes={botData ? getAllNodesFromAllSheets() : nodes}
          isSelected={selectedNodeId === node.id}
          onClick={() => onNodeSelect(node.id)}
          onDelete={() => onNodeDelete(node.id)}
          onDuplicate={onNodeDuplicate ? () => onNodeDuplicate(node.id) : undefined}
          onMove={(position) => {
            onNodeMove(node.id, position);
          }}
          onMoveEnd={() => {
            onNodeMoveEnd?.(node.id);
            onActionLog?.('move', `Перемещен узел "${node.type}"`);
          }}
          zoom={zoom}
          pan={pan}
          setIsNodeBeingDragged={setIsNodeBeingDragged}
          onSizeChange={onSizeChange}
        />
      ))}
    </div>
  );
}
