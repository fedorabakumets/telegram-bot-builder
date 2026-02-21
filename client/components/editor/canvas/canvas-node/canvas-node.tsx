import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { DicePreview } from './dice-preview';
import { StickerPreview } from './sticker-preview';
import { VoicePreview } from './voice-preview';
import { ContactPreview } from './contact-preview';
import { PollPreview } from './poll-preview';
import { AutoTransitionIndicator } from './auto-transition-indicator';
import { LocationPreview } from './location-preview';
import { MediaAttachmentIndicator } from './media-attachment-indicator';
import { TextInputIndicator } from './text-input-indicator';
import { MessagePreview } from './message-preview';
import { ImageAttachment } from './image-attachment';
import { NodeActions } from './node-actions';
import { AdminRightsPreview } from './admin-rights-preview';
import { NodeHeader } from './node-header';
import { ConditionalMessagesIndicator } from './conditional-messages-indicator';
import { ButtonsPreview } from './buttons-preview';

/**
 * Интерфейс свойств компонента CanvasNode
 *
 * @interface CanvasNodeProps
 * @property {Node} node - Узел, который будет отображен
 * @property {Node[]} [allNodes] - Все узлы на холсте (опционально)
 * @property {boolean} [isSelected] - Выделен ли узел (опционально)
 * @property {Function} [onClick] - Обработчик клика по узлу (опционально)
 * @property {Function} [onDelete] - Обработчик удаления узла (опционально)
 * @property {Function} [onDuplicate] - Обработчик дублирования узла (опционально)
 * @property {Function} [onMove] - Обработчик перемещения узла (опционально)
 * @property {Function} [onMoveEnd] - Обработчик завершения перемещения узла (опционально)
 * @property {number} [zoom] - Уровень масштабирования (по умолчанию 100)
 * @property {{x: number, y: number}} [pan] - Позиция панорамирования (по умолчанию {x: 0, y: 0})
 * @property {Function} [setIsNodeBeingDragged] - Обработчик установки состояния перетаскивания (опционально)
 * @property {Function} [onSizeChange] - Обработчик изменения размера узла (опционально)
 */
interface CanvasNodeProps {
  node: Node;
  allNodes?: Node[];
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onDuplicate?: (() => void) | undefined;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveEnd?: () => void;
  zoom?: number;
  pan?: { x: number; y: number };
  setIsNodeBeingDragged?: ((isDragging: boolean) => void) | undefined;
  onSizeChange?: (nodeId: string, size: { width: number; height: number }) => void;
}

/**
 * Компонент узла на холсте
 *
 * @component
 * @description Отображает узел на холсте с возможностью перемещения, выделения и взаимодействия
 *
 * @param {CanvasNodeProps} props - Свойства компонента
 * @param {Node} props.node - Узел, который будет отображен
 * @param {Node[]} [props.allNodes] - Все узлы на холсте (опционально)
 * @param {boolean} [props.isSelected=false] - Выделен ли узел (опционально)
 * @param {Function} [props.onClick] - Обработчик клика по узлу (опционально)
 * @param {Function} [props.onDelete] - Обработчик удаления узла (опционально)
 * @param {Function} [props.onDuplicate] - Обработчик дублирования узла (опционально)
 * @param {Function} [props.onMove] - Обработчик перемещения узла (опционально)
 * @param {Function} [props.onMoveEnd] - Обработчик завершения перемещения узла (опционально)
 * @param {number} [props.zoom=100] - Уровень масштабирования
 * @param {{x: number, y: number}} [props.pan={x: 0, y: 0}] - Позиция панорамирования
 * @param {Function} [props.setIsNodeBeingDragged] - Обработчик установки состояния перетаскивания (опционально)
 * @param {Function} [props.onSizeChange] - Обработчик изменения размера узла (опционально)
 *
 * @example
 * // Пример использования компонента CanvasNode
 * <CanvasNode
 *   node={nodeData}
 *   isSelected={isSelected}
 *   onClick={handleClick}
 *   onDelete={handleDelete}
 *   onDuplicate={handleDuplicate}
 *   onMove={handleMove}
 *   onMoveEnd={handleMoveEnd}
 *   zoom={zoomLevel}
 *   pan={panPosition}
 * />
 *
 * @returns {JSX.Element} Компонент узла на холсте
 */
export function CanvasNode({ node, allNodes, isSelected, onClick, onDelete, onDuplicate, onMove, onMoveEnd, zoom = 100, pan = { x: 0, y: 0 }, setIsNodeBeingDragged, onSizeChange }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Touch состояние для мобильного перемещения элементов
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [touchMoved, setTouchMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onMove) return;
    
    // Не запускать драг если кликнули по кнопке удаления
    if ((e.target as HTMLElement).closest('button')) return;
    
    // Находим канвас (родительский элемент трансформируемого контейнера)
    const transformedContainer = nodeRef.current?.parentElement;
    const canvas = transformedContainer?.parentElement;
    
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const zoomFactor = zoom / 100;
      
      // Рассчитываем смещение в канвасных координатах
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;
      
      const canvasX = (screenX - pan.x) / zoomFactor;
      const canvasY = (screenY - pan.y) / zoomFactor;
      
      setDragOffset({
        x: canvasX - node.position.x,
        y: canvasY - node.position.y
      });
      setIsDragging(true);
      // Уведомляем глобальное состояние о начале перетаскивания
      if (setIsNodeBeingDragged) {
        setIsNodeBeingDragged(true);
      }
    }
    
    // Предотвращаем выделение текста при перетаскивании
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onMove) return;
    
    // Находим канвас (родительский элемент трансформируемого контейнера)
    const transformedContainer = nodeRef.current?.parentElement;
    const canvas = transformedContainer?.parentElement;
    
    if (canvas && transformedContainer) {
      const canvasRect = canvas.getBoundingClientRect();
      
      // Получаем экранные координаты мыши относительно канваса
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;
      
      // Преобразуем экранные координаты в координаты канваса с учетом зума и панорамирования
      const zoomFactor = zoom / 100;
      const canvasX = (screenX - pan.x) / zoomFactor - dragOffset.x;
      const canvasY = (screenY - pan.y) / zoomFactor - dragOffset.y;
      
      // Привязка к сетке (20px grid в канвасных координатах)
      const gridSize = 20;
      const snappedX = Math.round(canvasX / gridSize) * gridSize;
      const snappedY = Math.round(canvasY / gridSize) * gridSize;
      
      // Ограничиваем позицию в пределах canvas с отступами (в канвасных координатах)
      const minX = 20;
      const minY = 20;
      const maxX = Math.max(minX, (canvas.clientWidth / zoomFactor) - 340);
      const maxY = Math.max(minY, Math.min(snappedY, (canvas.clientHeight / zoomFactor) - 220));
      
      const boundedX = Math.max(minX, Math.min(snappedX, maxX));
      const boundedY = Math.max(minY, Math.min(snappedY, maxY));
      
      // Отладочный вывод убран для улучшения производительности
      
      onMove({ x: boundedX, y: boundedY });
    }
  };

  const handleMouseUp = () => {
    // Логируем перемещение только если узел реально перемещался
    if (isDragging && onMoveEnd) {
      onMoveEnd();
    }
    setIsDragging(false);
    // Уведомляем глобальное состояние об окончании перетаскивания
    if (setIsNodeBeingDragged) {
      setIsNodeBeingDragged(false);
    }
  };

  // Touch обработчики для мобильного перемещения элементов
  const handleTouchStart = (e: React.TouchEvent) => {
    // Не запускать события если кликнули по кнопке
    if ((e.target as HTMLElement).closest('button')) return;
    
    // Предотвращаем стандартное поведение браузера
    e.preventDefault();
    e.stopPropagation(); // Останавливаем всплытие, чтобы не конфликтовать с панорамированием холста
    
    const touch = e.touches[0];
    if (!touch) return;
    
    // Записываем информацию о начале касания
    setTouchStartTime(Date.now());
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setTouchMoved(false);
    
    // Подготавливаем для потенциального перетаскивания только если onMove доступен
    if (onMove) {
      // Находим канвас (родительский элемент трансформируемого контейнера)
      const transformedContainer = nodeRef.current?.parentElement;
      const canvas = transformedContainer?.parentElement;
      
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const zoomFactor = zoom / 100;
        
        // Рассчитываем смещение в канвасных координатах
        const screenX = touch.clientX - canvasRect.left;
        const screenY = touch.clientY - canvasRect.top;
        
        const canvasX = (screenX - pan.x) / zoomFactor;
        const canvasY = (screenY - pan.y) / zoomFactor;
        
        setTouchOffset({
          x: canvasX - node.position.x,
          y: canvasY - node.position.y
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || !onMove) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Вычисляем расстояние от начальной точки касания
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = touch.clientY - touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Начинаем перетаскивание только если движение больше 10 пикселей
    if (distance > 10 && !isTouchDragging) {
      setIsTouchDragging(true);
      setTouchMoved(true);
      if (setIsNodeBeingDragged) {
        setIsNodeBeingDragged(true);
      }
    }
    
    if (!isTouchDragging) return;
    
    // Быстрая перерисовка только позиции - без обновления других стилей
    const transformedContainer = nodeRef.current?.parentElement;
    const canvas = transformedContainer?.parentElement;
    
    if (!canvas || !transformedContainer) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const screenX = touch.clientX - canvasRect.left;
    const screenY = touch.clientY - canvasRect.top;
    
    const zoomFactor = zoom / 100;
    const canvasX = (screenX - pan.x) / zoomFactor - touchOffset.x;
    const canvasY = (screenY - pan.y) / zoomFactor - touchOffset.y;
    
    const gridSize = 20;
    const snappedX = Math.round(canvasX / gridSize) * gridSize;
    const snappedY = Math.round(canvasY / gridSize) * gridSize;
    
    const minX = 20;
    const minY = 20;
    const maxX = Math.max(minX, (canvas.clientWidth / zoomFactor) - 340);
    const maxY = Math.max(minY, (canvas.clientHeight / zoomFactor) - 220);
    
    const boundedX = Math.max(minX, Math.min(snappedX, maxX));
    const boundedY = Math.max(minY, Math.min(snappedY, maxY));
    
    onMove({ x: boundedX, y: boundedY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    if (touchDuration < 300 && !touchMoved && onClick) {
      onClick();
    }
    
    if (isTouchDragging && touchMoved && onMoveEnd) {
      onMoveEnd();
    }
    
    setIsTouchDragging(false);
    setTouchMoved(false);
    if (setIsNodeBeingDragged) {
      setIsNodeBeingDragged(false);
    }
  };

  // Добавляем и удаляем обработчики событий для mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return () => {};
  }, [isDragging, dragOffset, onMove]);

  // Touch события уже обрабатываются в handleTouchMove, не нужно добавлять глобальные слушатели
  useEffect(() => {
    if (isTouchDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none'; // Предотвращаем прокрутку при перетаскивании

      return () => {
        document.body.style.userSelect = '';
        document.body.style.touchAction = '';
      };
    }
    return () => {};
  }, [isTouchDragging]);

  // ResizeObserver для измерения реальных размеров узла
  useEffect(() => {
    if (!onSizeChange || !nodeRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        onSizeChange(node.id, { width, height });
      }
    });

    resizeObserver.observe(nodeRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [node.id, onSizeChange]);

  const isDragActive = isDragging || isTouchDragging;

  return (
    <div
      ref={nodeRef}
      data-canvas-node="true"
      className={cn(
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border-2 p-6 w-80 relative select-none group",
        isDragActive ? "shadow-lg cursor-grabbing z-50 border-blue-500" : "shadow-xl hover:shadow-2xl border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-shadow duration-300",
        isSelected && !isDragActive ? "ring-4 ring-blue-500/20 shadow-2xl shadow-blue-500/10 border-blue-500" : "",
        onMove ? "cursor-grab" : "cursor-pointer"
      )}
      onClick={!isDragging ? onClick : undefined}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        transform: isDragActive ? 'translate3d(0, 0, 0)' : 'translate3d(0, 0, 0)',
        willChange: isDragActive ? 'transform' : 'auto',
        zIndex: isDragActive ? 1000 : isSelected ? 100 : 10,
        transition: isDragActive ? 'none' : 'box-shadow 0.2s ease',
        contain: isDragActive ? 'layout style paint' : 'auto',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden' as any
      }}
    >
      {/* Action buttons */}
      <NodeActions onDuplicate={onDuplicate} onDelete={onDelete} />

      {/* Node header */}
      <NodeHeader node={node} onMove={!!onMove} />
      {/* Message preview */}
      <MessagePreview node={node} />

      {/* Image attachment */}
      <ImageAttachment node={node} />
      
      {/* Media attachment indicator for non-image files */}
      {(node.type === 'message' || node.type === 'command' || node.type === 'start') && !node.data.imageUrl && (node.data.videoUrl || node.data.audioUrl || node.data.documentUrl) && (
        <MediaAttachmentIndicator node={node} />
      )}
      
      {/* Media previews */}
      {/* Sticker preview */}
      {node.type === 'sticker' && <StickerPreview node={node} />}

      {/* Voice message preview */}
      {node.type === 'voice' && <VoicePreview node={node} />}
      
      
      {/* Location preview */}
      {node.type === 'location' && <LocationPreview node={node} />}
      
      {/* Contact preview */}
      {node.type === 'contact' && <ContactPreview node={node} />}

      {/* Admin Rights preview */}
      {node.type === 'admin_rights' && <AdminRightsPreview />}
      
      {/* Poll preview */}
      {(node.type as any) === 'poll' && <PollPreview node={node} />}
      
      {/* Dice preview */}
      {(node.type as any) === 'dice' && <DicePreview node={node} />}

      {/* Auto Transition Indicator */}
      {node.data.enableAutoTransition && node.data.autoTransitionTo && !node.data.buttons?.length && (
        <AutoTransitionIndicator node={node} allNodes={allNodes} />
      )}
      
      {/* Conditional Messages Indicator */}
      <ConditionalMessagesIndicator node={node} allNodes={allNodes} />

      {/* Text Input Indicator */}
      {node.data.keyboardType === 'none' && (node.data as any).enableTextInput && (
        <TextInputIndicator node={node} />
      )}

      {/* Buttons preview */}
      <ButtonsPreview node={node} allNodes={allNodes} />
    </div>
  );
}
