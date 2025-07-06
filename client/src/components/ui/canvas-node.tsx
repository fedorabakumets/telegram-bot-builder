import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface CanvasNodeProps {
  node: Node;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onMove?: (position: { x: number; y: number }) => void;
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

export function CanvasNode({ node, isSelected, onClick, onDelete, onMove }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onMove) return;
    
    // Не запускать драг если кликнули по кнопке удаления
    if ((e.target as HTMLElement).closest('button')) return;
    
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
    
    // Предотвращаем выделение текста при перетаскивании
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !onMove) return;
    
    const canvas = nodeRef.current?.parentElement;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;
      
      // Привязка к сетке (20px grid)
      const gridSize = 20;
      const snappedX = Math.round(newX / gridSize) * gridSize;
      const snappedY = Math.round(newY / gridSize) * gridSize;
      
      // Ограничиваем позицию в пределах canvas с отступами
      const minX = 20;
      const minY = 20;
      const maxX = Math.max(minX, canvas.clientWidth - 340);
      const maxY = Math.max(minY, canvas.clientHeight - 220);
      
      const boundedX = Math.max(minX, Math.min(snappedX, maxX));
      const boundedY = Math.max(minY, Math.min(snappedY, maxY));
      
      onMove({ x: boundedX, y: boundedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
      };
    }
  }, [isDragging, dragOffset, onMove]);

  return (
    <div
      ref={nodeRef}
      className={cn(
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 p-6 w-80 transition-all duration-300 relative select-none",
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
      <div className="flex items-center mb-4 relative">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-3", nodeColors[node.type])}>
          <i className={nodeIcons[node.type]}></i>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground flex items-center">
            {node.type === 'start' && node.data.command}
            {node.type === 'command' && node.data.command}
            {node.type === 'message' && 'Сообщение'}
            {node.type === 'photo' && 'Фото с текстом'}
            {node.type === 'keyboard' && 'Клавиатура'}
            {node.type === 'condition' && 'Условие'}
            {node.type === 'input' && 'Ввод данных'}
            {onMove && (
              <div className="ml-2 opacity-30 hover:opacity-60 transition-opacity">
                <i className="fas fa-arrows-alt text-xs"></i>
              </div>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            {node.data.description || 'Элемент бота'}
          </p>
        </div>
      </div>
      {/* Message preview */}
      {node.data.messageText && (
        <div className="rounded-lg p-3 mb-4 bg-[transparent]">
          <p className="text-sm line-clamp-3 text-[#3da2f5]">
            {node.data.messageText}
          </p>
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
        <div className="space-y-2">
          {node.data.keyboardType === 'inline' ? (
            <div className="grid grid-cols-2 gap-2">
              {node.data.buttons.slice(0, 4).map((button) => (
                <div key={button.id} className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-xs font-medium text-primary text-center border border-primary/30 relative">
                  <div className="flex items-center justify-center space-x-1">
                    <span>{button.text}</span>
                    {button.action === 'command' && (
                      <i className="fas fa-terminal text-green-600 text-xs" title="Команда"></i>
                    )}
                    {button.action === 'url' && (
                      <i className="fas fa-external-link-alt text-purple-600 text-xs" title="Ссылка"></i>
                    )}
                    {button.action === 'goto' && (
                      <i className="fas fa-arrow-right text-primary text-xs" title="Переход"></i>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            node.data.buttons.slice(0, 2).map((button) => (
              <div key={button.id} className="flex items-center justify-between p-2 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary/30">
                <span className="text-sm font-medium text-primary">{button.text}</span>
                <div className="flex items-center space-x-1">
                  {button.action === 'command' && (
                    <i className="fas fa-terminal text-green-600 text-xs" title="Команда"></i>
                  )}
                  {button.action === 'url' && (
                    <i className="fas fa-external-link-alt text-purple-600 text-xs" title="Ссылка"></i>
                  )}
                  {button.action === 'goto' && (
                    <i className="fas fa-arrow-right text-primary text-xs" title="Переход"></i>
                  )}
                </div>
              </div>
            ))
          )}
          {node.data.buttons.length > (node.data.keyboardType === 'inline' ? 4 : 2) && (
            <div className="text-xs text-muted-foreground text-center">
              +{node.data.buttons.length - (node.data.keyboardType === 'inline' ? 4 : 2)} еще
            </div>
          )}
        </div>
      )}
      {/* Connection points */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-muted-foreground rounded-full border-2 border-background shadow-md"></div>
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-md"></div>
    </div>
  );
}
