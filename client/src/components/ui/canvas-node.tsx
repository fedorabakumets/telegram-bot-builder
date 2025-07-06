import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface CanvasNodeProps {
  node: Node;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
  onConnectionStart?: (nodeId: string, handle: 'source' | 'target') => void;
  connectionStart?: {
    nodeId: string;
    handle: 'source' | 'target';
  } | null;
  zoom?: number;
  pan?: { x: number; y: number };
}

const nodeIcons = {
  start: 'fas fa-play',
  message: 'fas fa-comment',
  photo: 'fas fa-image',
  keyboard: 'fas fa-keyboard',
  condition: 'fas fa-code-branch',
  input: 'fas fa-edit',
  command: 'fas fa-terminal'
};

const nodeColors = {
  start: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  message: 'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  photo: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  keyboard: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  condition: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
  input: 'bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
  command: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
};

export function CanvasNode({ node, isSelected, onClick, onDelete, onMove, onConnectionStart, connectionStart, zoom = 100, pan = { x: 0, y: 0 } }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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
    }
    
    // Предотвращаем выделение текста при перетаскивании
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onMove) return;
    
    // Отменяем предыдущий кадр анимации
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Используем requestAnimationFrame для плавного обновления
    rafRef.current = requestAnimationFrame(() => {
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
        const maxY = Math.max(minY, (canvas.clientHeight / zoomFactor) - 220);
        
        const boundedX = Math.max(minX, Math.min(snappedX, maxX));
        const boundedY = Math.max(minY, Math.min(snappedY, maxY));
        
        onMove({ x: boundedX, y: boundedY });
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Отменяем анимацию при окончании перетаскивания
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Добавляем и удаляем обработчики событий
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
        // Очищаем запланированную анимацию
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }
  }, [isDragging, dragOffset, onMove]);

  return (
    <div
      ref={nodeRef}
      className={cn(
        "canvas-node bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 p-6 w-80 relative select-none",
        isDragging ? "dragging" : "",
        isSelected ? "border-blue-500 ring-4 ring-blue-500/20 shadow-2xl shadow-blue-500/10" : "border-gray-200 dark:border-slate-700",
        isDragging ? "shadow-3xl scale-105 cursor-grabbing z-50 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "hover:shadow-2xl hover:border-gray-300 dark:hover:border-slate-600",
        onMove ? "cursor-grab hover:cursor-grab" : "cursor-pointer"
      )}
      onClick={!isDragging ? onClick : undefined}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        transform: isDragging ? 'rotate(2deg) scale(1.05)' : 'rotate(0deg) scale(1)',
        zIndex: isDragging ? 1000 : isSelected ? 10 : 1,
        transition: isDragging ? 'none' : 'all 0.2s ease'
      }}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white dark:border-slate-900"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      )}
      {/* Node header */}
      <div className="flex items-start mb-6 relative">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm", nodeColors[node.type])}>
          <i className={cn(nodeIcons[node.type], "text-lg")}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base flex items-center truncate">
              {node.type === 'start' && (
                <span className="inline-flex items-center">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {node.data.command || '/start'}
                  </span>
                </span>
              )}
              {node.type === 'command' && (
                <span className="inline-flex items-center">
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {node.data.command}
                  </span>
                </span>
              )}
              {node.type === 'message' && 'Сообщение'}
              {node.type === 'photo' && 'Фото с текстом'}
              {node.type === 'keyboard' && 'Клавиатура'}
              {node.type === 'condition' && 'Условие'}
              {node.type === 'input' && 'Ввод данных'}
            </h3>
            {onMove && (
              <div className="ml-2 opacity-40 hover:opacity-70 transition-all duration-200 cursor-grab">
                <i className="fas fa-grip-vertical text-xs text-gray-400 dark:text-gray-500"></i>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {node.data.description || 'Элемент бота'}
          </p>
        </div>
      </div>
      {/* Message preview */}
      {node.data.messageText && (
        <div className="rounded-xl p-4 mb-4 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed line-clamp-3 font-medium">
              {node.data.messageText}
            </p>
          </div>
        </div>
      )}
      {/* Image preview */}
      {node.type === 'photo' && (
        <div className="bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          {node.data.imageUrl ? (
            <img src={node.data.imageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
          ) : (
            <i className="fas fa-image text-purple-400 dark:text-purple-300 text-3xl"></i>
          )}
        </div>
      )}
      {/* Buttons preview */}
      {node.data.buttons.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-1 h-4 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {node.data.keyboardType === 'inline' ? 'Inline кнопки' : 'Reply кнопки'}
            </span>
          </div>
          {node.data.keyboardType === 'inline' ? (
            <div className="grid grid-cols-2 gap-2">
              {node.data.buttons.slice(0, 4).map((button) => (
                <div key={button.id} className="group relative">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 text-center border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 shadow-sm">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="truncate">{button.text}</span>
                      {button.action === 'command' && (
                        <i className="fas fa-terminal text-emerald-600 dark:text-emerald-400 text-xs opacity-70" title="Команда"></i>
                      )}
                      {button.action === 'url' && (
                        <i className="fas fa-external-link-alt text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Ссылка"></i>
                      )}
                      {button.action === 'goto' && (
                        <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400 text-xs opacity-70" title="Переход"></i>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {node.data.buttons.slice(0, 2).map((button) => (
                <div key={button.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{button.text}</span>
                  <div className="flex items-center space-x-1 ml-2">
                    {button.action === 'command' && (
                      <i className="fas fa-terminal text-emerald-600 dark:text-emerald-400 text-xs opacity-70" title="Команда"></i>
                    )}
                    {button.action === 'url' && (
                      <i className="fas fa-external-link-alt text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Ссылка"></i>
                    )}
                    {button.action === 'goto' && (
                      <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400 text-xs opacity-70" title="Переход"></i>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {node.data.buttons.length > (node.data.keyboardType === 'inline' ? 4 : 2) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2 font-medium">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                +{node.data.buttons.length - (node.data.keyboardType === 'inline' ? 4 : 2)} еще
              </span>
            </div>
          )}
        </div>
      )}
      {/* Connection points */}
      <button
        className={cn(
          "absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background shadow-md hover:scale-125 transition-all duration-300 group",
          connectionStart?.nodeId === node.id && connectionStart?.handle === 'target'
            ? "bg-green-500 hover:bg-green-600 animate-pulse shadow-lg shadow-green-500/50"
            : connectionStart && connectionStart.nodeId !== node.id && connectionStart.handle === 'source'
            ? "bg-green-400 hover:bg-green-500 animate-bounce shadow-lg shadow-green-400/50"
            : "bg-muted-foreground hover:bg-muted-foreground/80"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onConnectionStart?.(node.id, 'target');
        }}
        title="Входящее соединение"
      >
        <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-ping" />
      </button>
      <button
        className={cn(
          "absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background shadow-md hover:scale-125 transition-all duration-300 group",
          connectionStart?.nodeId === node.id && connectionStart?.handle === 'source'
            ? "bg-green-500 hover:bg-green-600 animate-pulse shadow-lg shadow-green-500/50"
            : connectionStart && connectionStart.nodeId !== node.id && connectionStart.handle === 'target'
            ? "bg-green-400 hover:bg-green-500 animate-bounce shadow-lg shadow-green-400/50"
            : "bg-primary hover:bg-primary/80"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onConnectionStart?.(node.id, 'source');
        }}
        title="Исходящее соединение"
      >
        <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-ping" />
      </button>
    </div>
  );
}
