import { Node } from '@/types/bot';
import { cn } from '@/utils/utils';
import { useState, useRef, useEffect } from 'react';
import { OutputPort } from './output-port';
import { PortType } from './port-colors';
import { NodeContextMenu } from './context-menu/node-context-menu';
import { useNodeContextMenu } from './context-menu/use-node-context-menu';
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
import { MediaAttachmentsPreview } from './media-attachments-preview';
import { NodeActions } from './node-actions';
import { AdminRightsPreview } from './admin-rights-preview';
import { NodeHeader } from './node-header';
import { ConditionalMessagesIndicator } from './conditional-messages-indicator';
import { ButtonsPreview } from './buttons-preview';
import { ClientAuthCard } from './client-auth-card';
import { CommandTriggerPreview } from './command-trigger-preview';
import { TextTriggerPreview } from './text-trigger-preview';

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
  /** Подсветка узла как допустимой цели при drag-to-connect */
  isConnectionTarget?: boolean;
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
export function CanvasNode({ node, allNodes, isSelected, onClick, onDelete, onDuplicate, onDuplicateAtPosition, onMove, onMoveStart, onMoveEnd, zoom = 100, pan = { x: 0, y: 0 }, setIsNodeBeingDragged, onSizeChange, onPortMouseDown, isConnectionTarget, isConnectionSource }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Ref для dragOffset — позволяет читать актуальное значение в handleMouseMove
  // без добавления dragOffset в зависимости useEffect (иначе обработчики
  // пересоздавались бы при каждом mousemove, вызывая пропуск событий).
  const dragOffsetRef = useRef(dragOffset);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { menu, open: openContextMenu, close: closeContextMenu } = useNodeContextMenu();

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

      // Ограничиваем позицию в пределах canvas с отступами (в канвасных координатах)
      const minX = 20;
      const minY = 20;
      const maxX = Math.max(minX, (canvas.clientWidth / zoomFactor) - 340);
      const maxY = Math.max(minY, Math.min(snappedY, (canvas.clientHeight / zoomFactor) - 220));

      const boundedX = Math.max(minX, Math.min(snappedX, maxX));
      const boundedY = Math.max(minY, Math.min(snappedY, maxY));

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
    >
      {/* Кнопки действий — снаружи основного div, позиционируются относительно wrapper */}
      <NodeActions onDuplicate={onDuplicate} onDelete={onDelete} isSelected={isSelected} />

      {/* Порт выхода — снаружи основного div, позиционируется относительно wrapper */}
      {(node.type === 'command_trigger' || node.type === 'text_trigger') ? (
        <OutputPort portType="trigger-next" onPortMouseDown={handlePortMouseDown} isActive={isConnectionSource} />
      ) : (
        <OutputPort portType="auto-transition" onPortMouseDown={handlePortMouseDown} isActive={isConnectionSource} />
      )}

      {/* Основной div узла — только визуальное содержимое */}
      <div
        ref={nodeRef}
        data-canvas-node="true"
        className={cn(
          "bg-white/90 dark:bg-slate-900/90 rounded-2xl border-2 relative select-none",
          // Компактный размер для триггеров
          node.type === 'command_trigger' || node.type === 'text_trigger'
            ? "p-3 w-52"
            : node.type === 'message'
            ? "p-4 pb-10 w-80"
            : "p-6 pb-10 w-80",
          isDragActive ? "shadow-lg cursor-grabbing z-50 border-blue-500" : "shadow-xl hover:shadow-2xl border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-shadow duration-300",
          isSelected && !isDragActive ? "ring-4 ring-blue-500/20 shadow-2xl shadow-blue-500/10 border-blue-500" : "",
          isConnectionTarget ? "ring-4 ring-green-400/60 border-green-400 shadow-green-400/20" : "",
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
          transform: isDragActive ? 'translate3d(0, 0, 0)' : undefined,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden' as any,
        }}
      >
        {/* Заголовок узла — скрыт для триггеров и узла сообщения */}
        {node.type !== 'command_trigger' && node.type !== 'text_trigger' && node.type !== 'message' && (
          <NodeHeader node={node} onMove={!!onMove} />
        )}

        {/* Image attachment (старый формат - одиночное изображение) */}
        <ImageAttachment node={node} />

        {/* Media attachments (новый формат - несколько файлов) */}
        <MediaAttachmentsPreview node={node} />

        {/* Message preview */}
        <MessagePreview node={node} />

        {/* Media attachment indicator for non-image files */}
        {(node.type === 'message' || node.type === 'command' || node.type === 'start') && !node.data.imageUrl && !node.data.attachedMedia?.length && (node.data.videoUrl || node.data.audioUrl || node.data.documentUrl) && (
          <MediaAttachmentIndicator node={node} />
        )}

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

        {/* Client Auth Card */}
        {node.type === 'client_auth' && <ClientAuthCard node={node} />}

        {/* Command Trigger Preview */}
        {node.type === 'command_trigger' && <CommandTriggerPreview node={node} />}

        {/* Text Trigger Preview */}
        {node.type === 'text_trigger' && <TextTriggerPreview node={node} />}

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
        <ButtonsPreview node={node} allNodes={allNodes} onPortMouseDown={handlePortMouseDown} isConnectionSource={isConnectionSource} />

        {/* Футер с полным ID узла — скрыт для триггеров */}
        {node.type !== 'command_trigger' && node.type !== 'text_trigger' && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 rounded-b-2xl bg-slate-700/60 dark:bg-slate-800/90 border-t border-slate-600/40 dark:border-slate-600/60">
            <span
              className="font-mono text-[10px] text-slate-300 dark:text-slate-300 select-all tracking-tight"
              title="ID узла"
            >
              #{node.id}
            </span>
          </div>
        )}

        {/* Контекстное меню по правому клику */}
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
          />
        )}
      </div>
    </div>
  );
}
