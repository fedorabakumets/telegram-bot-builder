/**
 * @fileoverview ������ ����� ������ ��������� � �� ������ �����.
 */

import { Node } from '@/types/bot';
import { cn } from '@/utils/utils';
import { useState, useRef, useEffect } from 'react';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';
import { getCanvasViewportMetrics, screenPointToCanvasPoint } from '../canvas/utils/canvas-coordinate-utils';
import { NodeContextMenu } from './context-menu/node-context-menu';
import { useNodeContextMenu } from './context-menu/use-node-context-menu';
import { DicePreview } from './dice-preview';
import { StickerPreview } from './sticker-preview';
import { VoicePreview } from './voice-preview';
import { ContactPreview } from './contact-preview';
import { PollPreview } from './poll-preview';
import { LocationPreview } from './location-preview';import { MediaAttachmentIndicator } from './media-attachment-indicator';
import { TextInputIndicator } from './text-input-indicator';
import { SaveAnswerIndicator } from './save-answer-indicator';
import { MessageLinkedInputIndicator } from './message-linked-input-indicator';
import { MessagePreview } from './message-preview';
import { MessageRecipientsPreview } from './message-recipients-preview';
import { ForumTopicPreview } from './forum-topic-preview';
import { ImageAttachment } from './image-attachment';
import { MediaAttachmentsPreview } from './media-attachments-preview';
import { NodeActions } from './node-actions';
import { AdminRightsPreview } from './admin-rights-preview';
import { NodeHeader } from './node-header';
import { ButtonsPreview } from './buttons-preview';
import { ClientAuthCard } from './client-auth-card';
import { CommandTriggerPreview } from './command-trigger-preview';
import { TextTriggerPreview } from './text-trigger-preview';
import { AnyMessageTriggerPreview } from './any-message-trigger-preview';
import { GroupMessageTriggerPreview } from './group-message-trigger-preview';
import { CallbackTriggerPreview } from './callback-trigger-preview';
import { IncomingCallbackTriggerPreview } from './incoming-callback-trigger-preview';
import { OutgoingMessageTriggerPreview } from './outgoing-message-trigger-preview';
import { ManagedBotUpdatedTriggerPreview } from './managed-bot-updated-trigger-preview';
import { ConditionNodePreview } from './condition-node-preview';
import { MediaNodePreview } from './media-node-preview';
import { HttpRequestPreview } from './http-request-preview';
import { GetManagedBotTokenPreview } from './get-managed-bot-token-preview';
import { AnswerCallbackQueryPreview } from './answer-callback-query-preview';
import { EditMessagePreview } from './edit-message-preview';
import { MoveToSheetMenu } from './context-menu/move-to-sheet-menu';

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
  /** Обработчик дублирования узла с опциональной целевой позицией */
  onDuplicate?: ((targetPosition?: { x: number; y: number }) => void) | undefined;
  /**
   * Обработчик дублирования узла через контекстное меню.
   * Позиция вычисляется в canvas.tsx через getPastePosition() — ту же функцию,
   * что использует Ctrl+V — поэтому дубль всегда попадает в точку последнего клика.
   * Если передан этот проп, контекстное меню использует его вместо собственной
   * формулы конвертации координат.
   */
  onDuplicateAtPosition?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  zoom?: number;
  pan?: { x: number; y: number };
  setIsNodeBeingDragged?: ((isDragging: boolean) => void) | undefined;
  onSizeChange?: (nodeId: string, size: { width: number; height: number }) => void;
  /** Обработчик начала перетаскивания от порта выхода */
  onPortMouseDown?: (
    e: React.MouseEvent,
    nodeId: string,
    portType: PortType,
    buttonId?: string,
    portCenter?: { x: number; y: number }
  ) => void;
  /** Узел является источником активного drag-соединения (держит порты видимыми) */
  isConnectionSource?: boolean;
  /** ��������� ���� ��� ���������� ���� ��� drag-to-connect */
  isConnectionTarget?: boolean;
  /** ���� ������ � ��������������� ����� */
  isConnectedToDragging?: boolean;
  /** ���� ��������� ��� ��������� �� ����� ���������� */
  isHoveredByConnection?: boolean;
  /** �������������� ��������� ���� ��� ��� ��������� ����� (�� ��������) */
  forceHover?: boolean;
  /** ������ ��� ���������/����� ���� � ���� */
  onHover?: (nodeId: string | null) => void;
  /** ������ ������ ��� ����������� ���� (��� ��������) */
  sheets?: Array<{ id: string; name: string }>;
  /** ������ ����������� ���� � ������ ���� */
  onMoveToSheet?: (sheetId: string) => void;
  /**
   * Колбэк, вызываемый при монтировании порта кнопки.
   * Передаёт buttonId и позицию центра порта относительно wrapper-div узла.
   */
  onButtonPortMount?: (buttonId: string, offset: { x: number; y: number }) => void;
}

/**
 * Компонент узла на холсте
 *
 * @component
 * @description Отображает узел на холсте с возможностью перемещения, выделения и взаимодействия.
 *
 * Структура рендера:
 * - Внешний wrapper-div: только position/left/top/zIndex — без overflow, без backdrop-filter.
 *   Это гарантирует, что абсолютно позиционированные дочерние элементы с отрицательными
 *   отступами (кнопки, порты) не обрезаются при добавлении ring/box-shadow на внутренний div.
 * - NodeActions и OutputPort рендерятся внутри wrapper, но снаружи основного div узла.
 * - Основной div узла: только визуальное содержимое + ring/shadow при выделении.
 *
 * @param {CanvasNodeProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент узла на холсте
 */
export function CanvasNode({ node, allNodes, isSelected, onClick, onDelete, onDuplicate, onDuplicateAtPosition, onMove, onMoveStart, onMoveEnd, zoom = 100, pan = { x: 0, y: 0 }, setIsNodeBeingDragged, onSizeChange, onPortMouseDown, isConnectionTarget, isConnectionSource, isConnectedToDragging, isHoveredByConnection, forceHover, onHover, onButtonPortMount, sheets, onMoveToSheet }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Ref для dragOffset — позволяет читать актуальное значение в handleMouseMove
  // без добавления dragOffset в зависимости useEffect (иначе обработчики
  // пересоздавались бы при каждом mousemove, вызывая пропуск событий).
  const dragOffsetRef = useRef(dragOffset);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { menu, open: openContextMenu, close: closeContextMenu } = useNodeContextMenu();

  /**
   * Переводит экранную точку в координаты canvas с учетом scroll контейнера.
   *
   * @param screenX - X в экранных координатах
   * @param screenY - Y в экранных координатах
   * @returns Точка в координатах canvas
   */
  const getCanvasPoint = (screenX: number, screenY: number) => {
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
    const canvas = transformedContainer?.parentElement;
    const viewport = getCanvasViewportMetrics(canvas);
    if (!viewport) return { x: screenX, y: screenY };
    return screenPointToCanvasPoint(screenX, screenY, viewport, pan, zoom);
  };
  void getCanvasPoint;

  /**
   * Обработчик начала перетаскивания от порта выхода.
   * Пробрасывает nodeId в колбэк родителя.
   */
  const handlePortMouseDown = (e: React.MouseEvent, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => {
    onPortMouseDown?.(e, node.id, portType, buttonId, portCenter);
  };

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
    // nodeRef указывает на внутренний div: innerDiv -> wrapper -> transformedContainer -> canvas
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
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
      dragOffsetRef.current = {
        x: canvasX - node.position.x,
        y: canvasY - node.position.y
      };
      setIsDragging(true);
      // Сохраняем состояние ДО начала перемещения
      onMoveStart?.();
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
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
    const canvas = transformedContainer?.parentElement;

    if (canvas && transformedContainer) {
      const canvasRect = canvas.getBoundingClientRect();

      // Получаем экранные координаты мыши относительно канваса
      const screenX = e.clientX - canvasRect.left;
      const screenY = e.clientY - canvasRect.top;

      // Преобразуем экранные координаты в координаты канваса с учетом зума и панорамирования
      const zoomFactor = zoom / 100;
      const canvasX = (screenX - pan.x) / zoomFactor - dragOffsetRef.current.x;
      const canvasY = (screenY - pan.y) / zoomFactor - dragOffsetRef.current.y;

      // Привязка к сетке (20px grid в канвасных координатах)
      const gridSize = 20;
      const snappedX = Math.round(canvasX / gridSize) * gridSize;
      const snappedY = Math.round(canvasY / gridSize) * gridSize;

      onMove({ x: snappedX, y: snappedY });
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
      const wrapperDiv = nodeRef.current?.parentElement;
      const transformedContainer = wrapperDiv?.parentElement;
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
      onMoveStart?.();
      if (setIsNodeBeingDragged) {
        setIsNodeBeingDragged(true);
      }
    }

    if (!isTouchDragging) return;

    // Быстрая перерисовка только позиции - без обновления других стилей
    const wrapperDiv = nodeRef.current?.parentElement;
    const transformedContainer = wrapperDiv?.parentElement;
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

    onMove({ x: snappedX, y: snappedY });
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
  }, [isDragging, onMove]);

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

  /**
   * ResizeObserver для измерения border-box размеров wrapper-div узла.
   *
   * Наблюдаем за wrapper-div (родитель nodeRef), а не за внутренним div,
   * чтобы получить полную border-box высоту включая padding и border.
   * Это позволяет вычислять центр OutputPort как node.position.y + height / 2
   * без каких-либо дополнительных смещений.
   */
  useEffect(() => {
    if (!onSizeChange || !nodeRef.current) return;

    // wrapper-div — родитель внутреннего div (nodeRef)
    const wrapperEl = nodeRef.current.parentElement;
    if (!wrapperEl) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let width: number;
        let height: number;
        // Используем borderBoxSize если доступен (современные браузеры)
        if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
          width = entry.borderBoxSize[0].inlineSize;
          height = entry.borderBoxSize[0].blockSize;
        } else {
          // Фолбэк через getBoundingClientRect для старых браузеров
          const rect = (entry.target as HTMLElement).getBoundingClientRect();
          width = rect.width;
          height = rect.height;
        }
        onSizeChange(node.id, { width, height });
      }
    });

    resizeObserver.observe(wrapperEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [node.id, onSizeChange]);

  const isDragActive = isDragging || isTouchDragging;
  const [isHovered, setIsHovered] = useState(false);
  /** ����������� hover: ��������� ��� �������������� �� �������� */
  const effectiveHover = isHovered || !!forceHover;

  return (
    /**
     * Внешний wrapper-div: только позиционирование.
     * Не содержит overflow, backdrop-filter или transform с perspective —
     * это предотвращает создание нового stacking context, который обрезал бы
     * абсолютно позиционированные дочерние элементы с отрицательными отступами
     * (кнопки NodeActions и кружок OutputPort).
     */
    <div
      className="group"
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        zIndex: isDragActive ? 1000 : isSelected ? 100 : 10,
        overflow: 'visible',
      }}
      onMouseEnter={() => { setIsHovered(true); onHover?.(node.id); }}
      onMouseLeave={() => { setIsHovered(false); onHover?.(null); }}
    >
      {/* Кнопки действий — снаружи основного div, позиционируются относительно wrapper */}
      <NodeActions onDuplicate={onDuplicateAtPosition ?? onDuplicate} onDelete={onDelete} isSelected={isSelected} />

      {/* Порт выхода — снаружи основного div, позиционируется относительно wrapper */}
      {/* Узел condition имеет порты на каждой ветке — общий порт не нужен */}
      {(node.type === 'command_trigger' || node.type === 'text_trigger' || node.type === 'incoming_message_trigger' || node.type === 'group_message_trigger' || (node.type as any) === 'callback_trigger' || (node.type as any) === 'incoming_callback_trigger' || (node.type as any) === 'outgoing_message_trigger' || (node.type as any) === 'managed_bot_updated_trigger') ? (
        <OutputPort portType="trigger-next" onPortMouseDown={handlePortMouseDown} isActive={isConnectionSource} />
      ) : node.type !== 'condition' && node.type !== 'keyboard' ? (
        <OutputPort portType={node.type === 'input' ? 'input-target' : 'auto-transition'} onPortMouseDown={handlePortMouseDown} isActive={isConnectionSource} />
      ) : null}

      {/* Основной div узла — только визуальное содержимое */}
      <div
        ref={nodeRef}
        data-canvas-node="true"
        className={cn(
          "bg-white/90 dark:bg-slate-900/90 rounded-2xl border-2 relative select-none",
          // Компактный размер для триггеров
          node.type === 'command_trigger' || node.type === 'text_trigger' || node.type === 'incoming_message_trigger' || (node.type as any) === 'incoming_callback_trigger' || (node.type as any) === 'outgoing_message_trigger' || (node.type as any) === 'managed_bot_updated_trigger'
            ? "p-3 w-52"
            : (node.type as any) === 'callback_trigger' || (node.type as any) === 'answer_callback_query'
            ? "p-3 w-52"            : node.type === 'condition'
            ? "p-4 w-64"
            : node.type === 'message'
            ? "p-4 w-80"
            : node.type === 'keyboard'
            ? "p-4 w-80"
            : node.type === 'input'
            ? "p-4 w-80"
            : "p-6 w-80",
          isDragActive ? "shadow-lg cursor-grabbing z-50 border-blue-500" : "shadow-xl hover:shadow-2xl border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200",
          isSelected && !isDragActive ? "ring-4 ring-blue-500/20 shadow-2xl shadow-blue-500/10 border-blue-500" : "",
          isConnectionTarget ? "ring-4 ring-green-400/60 border-green-400 shadow-green-400/20" : "",
          isConnectedToDragging && !isDragActive ? "ring-2 ring-violet-400 border-violet-500 scale-[1.02]" : "",
          effectiveHover && !isDragActive && !isSelected && !isConnectionSource ? "ring-2 ring-sky-400 border-sky-400 scale-[1.02]" : "",
          isHoveredByConnection && !effectiveHover && !isDragActive && !isConnectedToDragging ? "ring-2 ring-violet-400 border-violet-500" : "",
          onMove ? "cursor-grab" : "cursor-pointer"
        )}
        onClick={!isDragging ? onClick : undefined}
        onMouseDown={handleMouseDown}
        onContextMenu={openContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          overflow: 'visible',
          transform: isDragActive ? 'translate3d(0, 0, 0)' : isConnectedToDragging && !isDragActive ? 'scale(1.02)' : undefined,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden' as any,
          boxShadow: isDragActive
            ? undefined
            : isConnectedToDragging
            ? '0 0 0 2px #8b5cf6, 0 0 20px 4px rgba(139, 92, 246, 0.5), 0 0 40px 8px rgba(139, 92, 246, 0.2)'
            : effectiveHover && !isSelected && !isConnectionSource
            ? '0 0 0 2px #38bdf8, 0 0 16px 4px rgba(56, 189, 248, 0.45), 0 0 32px 6px rgba(56, 189, 248, 0.2)'
            : isHoveredByConnection
            ? '0 0 0 2px #8b5cf6, 0 0 20px 4px rgba(139, 92, 246, 0.5), 0 0 40px 8px rgba(139, 92, 246, 0.2)'
            : undefined,
        }}
      >
        {/* Заголовок узла — скрыт для триггеров, узла сообщения и узла условия */}
        {node.type !== 'command_trigger' && node.type !== 'text_trigger' && node.type !== 'incoming_message_trigger' && node.type !== 'group_message_trigger' && (node.type as any) !== 'callback_trigger' && (node.type as any) !== 'incoming_callback_trigger' && (node.type as any) !== 'outgoing_message_trigger' && (node.type as any) !== 'managed_bot_updated_trigger' && (node.type as any) !== 'get_managed_bot_token' && (node.type as any) !== 'answer_callback_query' && node.type !== 'message' && node.type !== 'condition' && node.type !== 'keyboard' && node.type !== 'input' && (
          <NodeHeader node={node} onMove={!!onMove} />
        )}

        {/* Image attachment (старый формат - одиночное изображение) */}
        <ImageAttachment node={node} />

        {/* Media attachments (новый формат - несколько файлов) */}
        <MediaAttachmentsPreview node={node} />

        {/* Message preview */}
        <MessagePreview node={node} />
        <MessageRecipientsPreview node={node} />

        {/* Media attachment indicator for non-image files */}
        {node.type === 'message' && !node.data.imageUrl && !node.data.attachedMedia?.length && (node.data.videoUrl || node.data.audioUrl || node.data.documentUrl) && (
          <MediaAttachmentIndicator node={node} />
        )}

        {/* Sticker preview */}
        {node.type === 'sticker' && <StickerPreview node={node} />}

        {/* Voice message preview */}
        {node.type === 'voice' && <VoicePreview node={node} />}

        {/* Media node preview */}
        {node.type === 'media' && <MediaNodePreview attachedMedia={node.data.attachedMedia || []} />}

        {/* HTTP Request preview */}
        {(node.type as any) === 'http_request' && <HttpRequestPreview node={node} />}

        {/* Get Managed Bot Token preview */}
        {(node.type as any) === 'get_managed_bot_token' && <GetManagedBotTokenPreview node={node} />}

        {/* Location preview */}
        {node.type === 'location' && <LocationPreview node={node} />}

        {/* Contact preview */}
        {node.type === 'contact' && <ContactPreview node={node} />}

        {/* Admin Rights preview */}
        {node.type === 'admin_rights' && <AdminRightsPreview />}

        {/* Forum Topic preview */}
        {node.type === 'create_forum_topic' && <ForumTopicPreview node={node} />}

        {/* Client Auth Card */}
        {node.type === 'client_auth' && <ClientAuthCard node={node} />}

        {/* Command Trigger Preview */}
        {node.type === 'command_trigger' && <CommandTriggerPreview node={node} />}

        {/* Text Trigger Preview */}
        {node.type === 'text_trigger' && <TextTriggerPreview node={node} />}

        {/* Any Message Trigger Preview */}
        {node.type === 'incoming_message_trigger' && <AnyMessageTriggerPreview node={node} />}

        {/* Group Message Trigger Preview */}
        {node.type === 'group_message_trigger' && <GroupMessageTriggerPreview node={node} />}

        {/* Callback Trigger Preview */}
        {(node.type as any) === 'callback_trigger' && <CallbackTriggerPreview node={node} />}

        {/* Incoming Callback Trigger Preview */}
        {(node.type as any) === 'incoming_callback_trigger' && <IncomingCallbackTriggerPreview node={node} />}

        {/* Outgoing Message Trigger Preview */}
        {(node.type as any) === 'outgoing_message_trigger' && <OutgoingMessageTriggerPreview node={node} />}

        {/* Managed Bot Updated Trigger Preview */}
        {(node.type as any) === 'managed_bot_updated_trigger' && <ManagedBotUpdatedTriggerPreview node={node} />}

        {/* Answer Callback Query Preview */}
        {(node.type as any) === 'answer_callback_query' && <AnswerCallbackQueryPreview node={node} />}

        {/* Edit Message Preview */}
        {(node.type as any) === 'edit_message' && <EditMessagePreview node={node} />}

        {/* Condition Node Preview */}
        {node.type === 'condition' && (
          <ConditionNodePreview
            node={node}
            onPortMouseDown={handlePortMouseDown}
            isConnectionSource={isConnectionSource}
            onButtonPortMount={onButtonPortMount}
          />
        )}

        {/* Poll preview */}
        {(node.type as any) === 'poll' && <PollPreview node={node} />}

        {/* Dice preview */}
        {(node.type as any) === 'dice' && <DicePreview node={node} />}

        {/* Text Input Indicator — показываем если включён текстовый ввод, независимо от клавиатуры */}
        {(node.data as any).enableTextInput && (
          <TextInputIndicator node={node} />
        )}

        {/* Save Answer Indicator — отдельный preview для новой input-ноды */}
        {/**
         * Индикатор связанного узла сохранения ответа для сообщения.
         * Нужен только как компактная подсказка, источник истины остаётся в `input`.
         */}
        {node.type === 'message' && (
          <MessageLinkedInputIndicator node={node} allNodes={allNodes} />
        )}

        {node.type === 'input' && (
          <SaveAnswerIndicator node={node} />
        )}

        {/* Buttons preview */}
        {node.type !== 'input' && (
          <ButtonsPreview node={node} allNodes={allNodes} onPortMouseDown={handlePortMouseDown} isConnectionSource={isConnectionSource} onButtonPortMount={onButtonPortMount} />
        )}

        {menu.visible && (
          <NodeContextMenu
            position={menu.position}
            onClose={closeContextMenu}
            items={[
              {
                id: 'duplicate',
                label: 'Дублировать',
                icon: 'fas fa-copy',
                onClick: () => {
                  /**
                   * Используем onDuplicateAtPosition если он передан — позиция
                   * вычисляется в canvas.tsx через getPastePosition(), ту же функцию
                   * что использует Ctrl+V. Это гарантирует идентичное поведение.
                   * Fallback на onDuplicate без позиции (дубль появится на месте оригинала).
                   */
                  if (onDuplicateAtPosition) {
                    onDuplicateAtPosition();
                  } else {
                    onDuplicate?.();
                  }
                }
              }
            ]}
            extraContent={sheets && sheets.length > 0 && onMoveToSheet ? (
              <MoveToSheetMenu
                sheets={sheets}
                onSelect={(sheetId) => {
                  onMoveToSheet(sheetId);
                  closeContextMenu();
                }}
              />
            ) : undefined}
          />
        )}
      </div>
    </div>
  );
}


