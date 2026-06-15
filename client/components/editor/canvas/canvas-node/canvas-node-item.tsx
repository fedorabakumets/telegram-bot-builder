/**
 * @fileoverview Мемоизированная обёртка одной ноды холста.
 *
 * Назначение — отвязать рендер ноды от каждого кадра зума/пана. Раньше
 * `CanvasContent` на каждый кадр создавал инлайн-колбэки и прокидывал
 * меняющиеся `zoom`/`pan` в каждую `CanvasNode`, из-за чего все ноды
 * (с `box-shadow`/`ring`/превью) ре-рендерились и ре-растеризовались
 * 60 раз в секунду. На масштабе 75%+ площадь растеризации больше, поэтому
 * кадры не укладывались в бюджет и холст мигал.
 *
 * Здесь все пропсы стабильны во время зума (рефы и стабильные колбэки из
 * родителя, плюс булевы-примитивы), а `node.id` биндится в нуль-арные
 * замыкания внутри. `React.memo` пропускает ре-рендер, пока пропсы не
 * изменились по значению — значит во время чистого зума нода не трогается.
 */

import { memo } from 'react';
import { Node } from '@/types/bot';
import { CanvasNode } from './canvas-node';
import { PortType } from './port-colors';

/**
 * Свойства мемоизированной обёртки ноды.
 *
 * Колбэки принимают `nodeId`/`sheetId` — это позволяет родителю передавать
 * стабильные ссылки (без инлайн-замыканий на каждый рендер), а биндинг
 * `node.id` выполняется здесь.
 */
interface CanvasNodeItemProps {
  /** Узел для отображения */
  node: Node;
  /** Все узлы со всех листов (стабильная ссылка, мемоизируется в родителе) */
  allNodes: Node[];
  /** Выделен ли узел */
  isSelected: boolean;
  /** Узел является целью активного drag-соединения */
  isConnectionTarget: boolean;
  /** Узел является источником активного drag-соединения */
  isConnectionSource: boolean;
  /** Узел связан с перетаскиваемым узлом */
  isConnectedToDragging: boolean;
  /** Узел подсвечивается из-за hover по линии/узлу */
  isHoveredByConnection: boolean;
  /** Принудительная подсветка (имитация hover из сайдбара) */
  forceHover: boolean;
  /** Ref-зеркало масштаба */
  zoomRef: React.MutableRefObject<number>;
  /** Ref-зеркало смещения холста */
  panRef: React.MutableRefObject<{ x: number; y: number }>;
  /** Список листов для перемещения узла */
  sheets?: Array<{ id: string; name: string }>;
  /** ID проекта */
  projectId?: number;
  /** Выбор узла (id-aware, стабильный) */
  onNodeSelect: (nodeId: string) => void;
  /** Удаление узла (id-aware, стабильный) */
  onNodeDelete: (nodeId: string) => void;
  /** Дублирование узла (id-aware, стабильный) */
  onNodeDuplicate?: (nodeId: string, targetPosition?: { x: number; y: number }) => void;
  /** Дублирование через контекстное меню (id-aware, стабильный) */
  onNodeDuplicateAtPosition?: (nodeId: string) => void;
  /** Перемещение узла (id-aware, стабильный) */
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  /** Начало перемещения (id-aware, стабильный) */
  onNodeMoveStart?: (nodeId: string) => void;
  /** Конец перемещения (id-aware, стабильный) */
  onNodeMoveEnd?: (nodeId: string) => void;
  /** Перемещение узла в другой лист (id-aware, стабильный) */
  onMoveNodeToSheet?: (nodeId: string, sheetId: string) => void;
  /** Установка флага перетаскивания (стабильный) */
  setIsNodeBeingDragged?: (isDragging: boolean) => void;
  /** Изменение размера узла (стабильный) */
  onSizeChange: (nodeId: string, size: { width: number; height: number }) => void;
  /** Начало drag-to-connect от порта (стабильный) */
  onPortMouseDown?: (e: React.MouseEvent, nodeId: string, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => void;
  /** Hover по узлу (стабильный) */
  onHover?: (nodeId: string | null) => void;
  /** Монтирование порта кнопки (стабильный) */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * Мемоизированная обёртка ноды холста.
 *
 * @param props - Свойства обёртки
 * @returns JSX элемент ноды
 */
function CanvasNodeItemComponent({
  node,
  allNodes,
  isSelected,
  isConnectionTarget,
  isConnectionSource,
  isConnectedToDragging,
  isHoveredByConnection,
  forceHover,
  zoomRef,
  panRef,
  sheets,
  projectId,
  onNodeSelect,
  onNodeDelete,
  onNodeDuplicate,
  onNodeDuplicateAtPosition,
  onNodeMove,
  onNodeMoveStart,
  onNodeMoveEnd,
  onMoveNodeToSheet,
  setIsNodeBeingDragged,
  onSizeChange,
  onPortMouseDown,
  onHover,
  onButtonPortMount,
}: CanvasNodeItemProps) {
  return (
    <CanvasNode
      node={node}
      allNodes={allNodes}
      isSelected={isSelected}
      onClick={() => onNodeSelect(node.id)}
      onDelete={() => onNodeDelete(node.id)}
      onDuplicate={onNodeDuplicate ? (targetPosition) => onNodeDuplicate(node.id, targetPosition) : undefined}
      onDuplicateAtPosition={onNodeDuplicateAtPosition ? () => onNodeDuplicateAtPosition(node.id) : undefined}
      onMove={(position) => onNodeMove(node.id, position)}
      onMoveStart={() => onNodeMoveStart?.(node.id)}
      onMoveEnd={() => onNodeMoveEnd?.(node.id)}
      zoomRef={zoomRef}
      panRef={panRef}
      setIsNodeBeingDragged={setIsNodeBeingDragged}
      onSizeChange={onSizeChange}
      onPortMouseDown={onPortMouseDown}
      isConnectionTarget={isConnectionTarget}
      isConnectionSource={isConnectionSource}
      isConnectedToDragging={isConnectedToDragging}
      isHoveredByConnection={isHoveredByConnection}
      forceHover={forceHover}
      onHover={onHover}
      onButtonPortMount={onButtonPortMount}
      sheets={sheets}
      onMoveToSheet={onMoveNodeToSheet ? (sheetId) => onMoveNodeToSheet(node.id, sheetId) : undefined}
      projectId={projectId}
    />
  );
}

/**
 * Мемоизированная нода. Ре-рендерится только при изменении собственных пропсов
 * (по значению для примитивов и по ссылке для объектов/колбэков). Во время зума
 * все пропсы стабильны, поэтому ре-рендер не происходит.
 */
export const CanvasNodeItem = memo(CanvasNodeItemComponent);
