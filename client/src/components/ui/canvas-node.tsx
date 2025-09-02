import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

// Function to parse and render formatted text
function parseFormattedText(text: string, formatMode?: string, markdown?: boolean): JSX.Element {
  if (!text) return <span>{text}</span>;
  
  // Debug logging
  console.log('parseFormattedText called with:', { text: text.substring(0, 100), formatMode, markdown });
  
  // Remove HTML tags and replace with styled spans
  const parseHTML = (htmlText: string): JSX.Element[] => {
    const parts: JSX.Element[] = [];
    let remaining = htmlText;
    let key = 0;
    
    while (remaining.length > 0) {
      // Bold text (both <b> and <strong> tags)
      const boldMatch = remaining.match(/^(.*?)<(?:b|strong)>(.*?)<\/(?:b|strong)>(.*)/);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
        parts.push(<strong key={key++} className="font-bold">{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
        continue;
      }
      
      // Italic text (both <i> and <em> tags)
      const italicMatch = remaining.match(/^(.*?)<(?:i|em)>(.*?)<\/(?:i|em)>(.*)/);
      if (italicMatch) {
        if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
        parts.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
        remaining = italicMatch[3];
        continue;
      }
      
      // Underline text
      const underlineMatch = remaining.match(/^(.*?)<u>(.*?)<\/u>(.*)/);
      if (underlineMatch) {
        if (underlineMatch[1]) parts.push(<span key={key++}>{underlineMatch[1]}</span>);
        parts.push(<span key={key++} className="underline">{underlineMatch[2]}</span>);
        remaining = underlineMatch[3];
        continue;
      }
      
      // Strikethrough text
      const strikeMatch = remaining.match(/^(.*?)<s>(.*?)<\/s>(.*)/);
      if (strikeMatch) {
        if (strikeMatch[1]) parts.push(<span key={key++}>{strikeMatch[1]}</span>);
        parts.push(<span key={key++} className="line-through">{strikeMatch[2]}</span>);
        remaining = strikeMatch[3];
        continue;
      }
      
      // Code text
      const codeMatch = remaining.match(/^(.*?)<code>(.*?)<\/code>(.*)/);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
        parts.push(<code key={key++} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{codeMatch[2]}</code>);
        remaining = codeMatch[3];
        continue;
      }
      
      // No more matches, add remaining text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    
    return parts;
  };
  
  // Parse Markdown format
  const parseMarkdown = (mdText: string): JSX.Element[] => {
    const parts: JSX.Element[] = [];
    let remaining = mdText;
    let key = 0;
    
    while (remaining.length > 0) {
      // Bold text
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
        parts.push(<strong key={key++} className="font-bold">{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
        continue;
      }
      
      // Italic text
      const italicMatch = remaining.match(/^(.*?)\*(.*?)\*(.*)/);
      if (italicMatch) {
        if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
        parts.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
        remaining = italicMatch[3];
        continue;
      }
      
      // Underline text
      const underlineMatch = remaining.match(/^(.*?)__(.*?)__(.*)/);
      if (underlineMatch) {
        if (underlineMatch[1]) parts.push(<span key={key++}>{underlineMatch[1]}</span>);
        parts.push(<span key={key++} className="underline">{underlineMatch[2]}</span>);
        remaining = underlineMatch[3];
        continue;
      }
      
      // Strikethrough text
      const strikeMatch = remaining.match(/^(.*?)~~(.*?)~~(.*)/);
      if (strikeMatch) {
        if (strikeMatch[1]) parts.push(<span key={key++}>{strikeMatch[1]}</span>);
        parts.push(<span key={key++} className="line-through">{strikeMatch[2]}</span>);
        remaining = strikeMatch[3];
        continue;
      }
      
      // Code text
      const codeMatch = remaining.match(/^(.*?)`(.*?)`(.*)/);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
        parts.push(<code key={key++} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{codeMatch[2]}</code>);
        remaining = codeMatch[3];
        continue;
      }
      
      // No more matches, add remaining text
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    
    return parts;
  };
  
  // Determine formatting mode based on node properties
  let shouldUseHTML = false;
  
  if (formatMode === 'html') {
    shouldUseHTML = true;
  } else if (formatMode === 'markdown') {
    shouldUseHTML = false;
  } else if (formatMode === 'none') {
    // For 'none' mode, check if text contains HTML tags and parse them
    // Look for common HTML tags used in formatting
    const hasHTMLTags = text.includes('<b>') || text.includes('<i>') || text.includes('<u>') || 
                       text.includes('<s>') || text.includes('<code>') || text.includes('<strong>') || 
                       text.includes('<em>') || text.includes('<a href');
    shouldUseHTML = hasHTMLTags;
  } else if (markdown === true) {
    // Legacy support for 'markdown' property
    shouldUseHTML = false;
  } else {
    // Auto-detect: if text contains HTML formatting tags, use HTML parser
    const hasHTMLTags = text.includes('<b>') || text.includes('<i>') || text.includes('<u>') || 
                       text.includes('<s>') || text.includes('<code>') || text.includes('<strong>') || 
                       text.includes('<em>') || text.includes('<a href');
    shouldUseHTML = hasHTMLTags;
  }
  
  
  const parsedParts = shouldUseHTML ? parseHTML(text) : parseMarkdown(text);
  
  return <span>{parsedParts}</span>;
}

interface CanvasNodeProps {
  node: Node;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
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
  video: 'fas fa-video',
  audio: 'fas fa-music',
  document: 'fas fa-file-alt',
  keyboard: 'fas fa-keyboard',
  command: 'fas fa-terminal',
  sticker: 'fas fa-laugh',
  voice: 'fas fa-microphone',
  animation: 'fas fa-film',
  location: 'fas fa-map-marker-alt',
  contact: 'fas fa-address-book',
  pin_message: 'fas fa-thumbtack',
  unpin_message: 'fas fa-times',
  delete_message: 'fas fa-trash',
  ban_user: 'fas fa-ban',
  unban_user: 'fas fa-user-check',
  mute_user: 'fas fa-volume-mute',
  unmute_user: 'fas fa-volume-up',
  kick_user: 'fas fa-user-times',
  promote_user: 'fas fa-crown',
  demote_user: 'fas fa-user-minus'
};

const nodeColors = {
  start: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  message: 'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  photo: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  video: 'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  audio: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  document: 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
  keyboard: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  command: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
  sticker: 'bg-gradient-to-br from-pink-50 to-fuchsia-100 dark:from-pink-900/30 dark:to-fuchsia-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800',
  voice: 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  animation: 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  location: 'bg-gradient-to-br from-green-50 to-lime-100 dark:from-green-900/30 dark:to-lime-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800',
  contact: 'bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
  pin_message: 'bg-gradient-to-br from-cyan-100 to-blue-200 dark:from-cyan-900/40 dark:to-blue-800/40 text-cyan-700 dark:text-cyan-300 border-2 border-cyan-300 dark:border-cyan-700/50 shadow-lg shadow-cyan-500/20',
  unpin_message: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900/40 dark:to-gray-800/40 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700/50 shadow-lg shadow-slate-500/20',
  delete_message: 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/40 dark:to-rose-800/40 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700/50 shadow-lg shadow-red-500/20',
  ban_user: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700/50 shadow-lg shadow-red-500/20',
  unban_user: 'bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-800/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700/50 shadow-lg shadow-emerald-500/20',
  mute_user: 'bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/40 dark:to-amber-800/40 text-orange-700 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700/50 shadow-lg shadow-orange-500/20',
  unmute_user: 'bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/40 dark:to-blue-800/40 text-sky-700 dark:text-sky-300 border-2 border-sky-300 dark:border-sky-700/50 shadow-lg shadow-sky-500/20',
  kick_user: 'bg-gradient-to-br from-rose-100 to-pink-200 dark:from-rose-900/40 dark:to-pink-800/40 text-rose-700 dark:text-rose-300 border-2 border-rose-300 dark:border-rose-700/50 shadow-lg shadow-rose-500/20',
  promote_user: 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/40 dark:to-amber-800/40 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-300 dark:border-yellow-700/50 shadow-lg shadow-yellow-500/20',
  demote_user: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900/40 dark:to-gray-800/40 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700/50 shadow-lg shadow-slate-500/20'
};

export function CanvasNode({ node, isSelected, onClick, onDelete, onDuplicate, onMove, onConnectionStart, connectionStart, zoom = 100, pan = { x: 0, y: 0 } }: CanvasNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

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
      
      // Отладочный вывод для диагностики
      console.log('Mouse move debug:', {
        screenX, screenY, canvasX, canvasY, snappedX, snappedY, boundedX, boundedY,
        dragOffset, zoomFactor, pan
      });
      
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
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 p-6 w-80 transition-all duration-300 relative select-none group",
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
      {/* Action buttons */}
      {/* Copy button - left top */}
      {onDuplicate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="absolute -top-2 -left-2 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 hover:text-blue-700 dark:hover:text-blue-300 focus:bg-gradient-to-br focus:from-blue-100 focus:to-indigo-100 dark:focus:from-blue-800/50 dark:focus:to-indigo-800/50 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl border border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 focus:border-blue-400 dark:focus:border-blue-500 hover:scale-110 focus:scale-105 group opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Копировать элемент"
        >
          <i className="fas fa-copy text-xs transition-transform duration-200 group-hover:scale-110"></i>
        </button>
      )}
      
      {/* Delete button - right top */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/40 dark:hover:to-rose-900/40 hover:text-red-700 dark:hover:text-red-300 focus:bg-gradient-to-br focus:from-red-100 focus:to-rose-100 dark:focus:from-red-800/50 dark:focus:to-rose-800/50 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl border border-red-200/50 dark:border-red-700/50 hover:border-red-300 dark:hover:border-red-600 focus:border-red-400 dark:focus:border-red-500 hover:scale-110 focus:scale-105 group opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Удалить элемент"
        >
          <i className="fas fa-times text-xs transition-transform duration-200 group-hover:scale-110"></i>
        </button>
      )}
      

      
      {/* Node header */}
      <div className="flex items-start mb-6 relative">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm relative", nodeColors[node.type])}>
          <i className={cn(nodeIcons[node.type], "text-lg")}></i>
          {/* Status indicators */}
          <div className="absolute -top-1 -right-1 flex items-center space-x-1">
            {/* Conditional messages indicator */}
            {node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0 && (
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900" title={`Условные сообщения: ${node.data.conditionalMessages.length}`}>
                <i className="fas fa-code-branch text-white text-xs"></i>
              </div>
            )}
            
            {/* Main status indicator */}
            {(() => {
              const hasRequiredFields = (() => {
                switch (node.type) {
                  case 'photo': return !!node.data.imageUrl;
                  case 'video': return !!node.data.videoUrl;
                  case 'audio': return !!node.data.audioUrl;
                  case 'document': return !!node.data.documentUrl;
                  case 'sticker': return !!(node.data.stickerUrl || node.data.stickerFileId);
                  case 'voice': return !!node.data.voiceUrl;
                  case 'animation': return !!node.data.animationUrl;
                  case 'location': return !!(node.data.latitude && node.data.longitude);
                  case 'contact': return !!(node.data.phoneNumber && node.data.firstName);
                  case 'poll': return !!(node.data.question && node.data.options?.length);
                  case 'command': return !!node.data.command;
                  default: return !!node.data.messageText;
                }
              })();
              
              return hasRequiredFields ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  <i className="fas fa-check text-white text-xs"></i>
                </div>
              ) : (
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  <i className="fas fa-exclamation text-white text-xs"></i>
                </div>
              );
            })()}
          </div>
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
              {node.type === 'video' && 'Видео с текстом'}
              {node.type === 'audio' && 'Аудио сообщение'}
              {node.type === 'document' && 'Документ'}
              {node.type === 'keyboard' && 'Клавиатура'}
              {node.type === 'sticker' && 'Стикер'}
              {node.type === 'voice' && 'Голосовое сообщение'}
              {node.type === 'animation' && 'GIF анимация'}
              {node.type === 'location' && 'Геолокация'}
              {node.type === 'contact' && 'Контакт'}
              {(node.type === 'pin_message' || node.type === 'unpin_message' || node.type === 'delete_message') && (
                <span className="inline-flex items-center">
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 mr-2">
                    {node.data.command || `/${node.type}`}
                  </span>
                  <span>Управление контентом</span>
                </span>
              )}
              {(node.type === 'ban_user' || node.type === 'unban_user' || node.type === 'mute_user' || 
                node.type === 'unmute_user' || node.type === 'kick_user' || node.type === 'promote_user' || 
                node.type === 'demote_user') && (
                <span className="inline-flex items-center">
                  <span className="text-rose-600 dark:text-rose-400 font-mono text-sm bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 mr-2">
                    {node.data.command || `/${node.type}`}
                  </span>
                  <span>Действие с пользователем</span>
                </span>
              )}
            </h3>
            {onMove && (
              <div className="ml-2 opacity-40 hover:opacity-70 transition-all duration-200 cursor-grab">
                <i className="fas fa-grip-vertical text-xs text-gray-400 dark:text-gray-500"></i>
              </div>
            )}
          </div>
          {node.data.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {parseFormattedText(node.data.description, node.data.formatMode, node.data.markdown)}
            </p>
          )}
          
          {/* Синонимы */}
          {node.data.synonyms && node.data.synonyms.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {node.data.synonyms.slice(0, 3).map((synonym, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-700/50"
                    title={`Синоним: ${synonym}`}
                  >
                    <i className="fas fa-quote-left text-indigo-400 dark:text-indigo-500 mr-1" style={{ fontSize: '8px' }}></i>
                    {synonym}
                  </span>
                ))}
                {node.data.synonyms.length > 3 && (
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 text-gray-600 dark:text-gray-400 text-xs font-medium border border-gray-200 dark:border-gray-700/50"
                    title={`Ещё синонимов: ${node.data.synonyms.slice(3).join(', ')}`}
                  >
                    +{node.data.synonyms.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Message preview */}
      {node.data.messageText && (
        <div className="rounded-xl p-4 mb-4 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
            <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed line-clamp-3 font-medium">
              {parseFormattedText(node.data.messageText, node.data.formatMode, node.data.markdown)}
            </div>
          </div>
        </div>
      )}
      {/* Media previews */}
      {node.type === 'photo' && (
        <div className="bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center border-2 border-dashed border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group">
          {node.data.imageUrl ? (
            <div className="relative w-full h-full">
              <img src={node.data.imageUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-md shadow-sm" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-md flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                  <i className="fas fa-edit text-purple-600 dark:text-purple-400 text-xs"></i>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <i className="fas fa-cloud-upload-alt text-purple-400 dark:text-purple-300 text-3xl group-hover:scale-110 transition-transform"></i>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Нажмите для загрузки</div>
            </div>
          )}
        </div>
      )}
      
      {/* Video preview */}
      {node.type === 'video' && (
        <div className="bg-gradient-to-br from-rose-100/50 to-pink-100/50 dark:from-rose-900/30 dark:to-pink-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center border-2 border-dashed border-rose-200 dark:border-rose-700 hover:border-rose-300 dark:hover:border-rose-600 transition-colors group">
          <div className="text-center space-y-2">
            <i className="fas fa-video text-rose-400 dark:text-rose-300 text-3xl group-hover:scale-110 transition-transform"></i>
            {node.data.videoUrl ? (
              <div className="text-xs text-rose-600 dark:text-rose-400 space-y-1">
                <div className="font-medium flex items-center justify-center space-x-1">
                  <i className="fas fa-check-circle text-green-500 text-xs"></i>
                  <span>Видео загружено</span>
                </div>
                {node.data.duration && (
                  <div className="flex items-center justify-center space-x-1">
                    <i className="fas fa-clock text-xs"></i>
                    <span>{node.data.duration}с</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">Нажмите для загрузки</div>
            )}
          </div>
        </div>
      )}
      
      {/* Audio preview */}
      {node.type === 'audio' && (
        <div className="bg-gradient-to-br from-orange-100/50 to-amber-100/50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center border-2 border-dashed border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors group">
          <div className="text-center space-y-2">
            <i className="fas fa-music text-orange-400 dark:text-orange-300 text-3xl group-hover:scale-110 transition-transform"></i>
            {node.data.audioUrl ? (
              <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                <div className="font-medium flex items-center justify-center space-x-1">
                  <i className="fas fa-check-circle text-green-500 text-xs"></i>
                  <span>{node.data.title || 'Аудио трек'}</span>
                </div>
                {node.data.performer && (
                  <div className="flex items-center justify-center space-x-1">
                    <i className="fas fa-user text-xs"></i>
                    <span>{node.data.performer}</span>
                  </div>
                )}
                {node.data.duration && (
                  <div className="flex items-center justify-center space-x-1">
                    <i className="fas fa-clock text-xs"></i>
                    <span>{node.data.duration}с</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Нажмите для загрузки</div>
            )}
          </div>
        </div>
      )}
      
      {/* Document preview */}
      {node.type === 'document' && (
        <div className="bg-gradient-to-br from-teal-100/50 to-cyan-100/50 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center border-2 border-dashed border-teal-200 dark:border-teal-700 hover:border-teal-300 dark:hover:border-teal-600 transition-colors group">
          <div className="text-center space-y-2">
            <i className="fas fa-file-alt text-teal-400 dark:text-teal-300 text-3xl group-hover:scale-110 transition-transform"></i>
            {node.data.documentUrl ? (
              <div className="text-xs text-teal-600 dark:text-teal-400 space-y-1">
                <div className="font-medium flex items-center justify-center space-x-1">
                  <i className="fas fa-check-circle text-green-500 text-xs"></i>
                  <span>{node.data.filename || 'Документ'}</span>
                </div>
                {node.data.fileSize && (
                  <div className="flex items-center justify-center space-x-1">
                    <i className="fas fa-hdd text-xs"></i>
                    <span>{node.data.fileSize} МБ</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">Нажмите для загрузки</div>
            )}
          </div>
        </div>
      )}
      
      {/* Sticker preview */}
      {node.type === 'sticker' && (
        <div className="bg-gradient-to-br from-pink-100/50 to-fuchsia-100/50 dark:from-pink-900/30 dark:to-fuchsia-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          <div className="text-center space-y-2">
            <i className="fas fa-laugh text-pink-400 dark:text-pink-300 text-3xl"></i>
            {node.data.stickerUrl || node.data.stickerFileId ? (
              <div className="text-xs text-pink-600 dark:text-pink-400 space-y-1">
                <div className="font-medium">Стикер загружен</div>
                <div className="flex items-center justify-center space-x-1">
                  <i className="fas fa-images text-xs"></i>
                  <span>Анимированный</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-pink-500 dark:text-pink-400">Добавьте URL стикера</div>
            )}
          </div>
        </div>
      )}
      
      {/* Voice message preview */}
      {node.type === 'voice' && (
        <div className="bg-gradient-to-br from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          <div className="text-center space-y-2">
            <i className="fas fa-microphone text-emerald-400 dark:text-emerald-300 text-3xl"></i>
            {node.data.voiceUrl ? (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                <div className="font-medium">Голосовое сообщение</div>
                {node.data.duration && (
                  <div className="flex items-center justify-center space-x-1">
                    <i className="fas fa-clock text-xs"></i>
                    <span>{node.data.duration}с</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-emerald-500 dark:text-emerald-400">Добавьте URL голосового сообщения</div>
            )}
          </div>
        </div>
      )}
      
      {/* Animation preview */}
      {node.type === 'animation' && (
        <div className="bg-gradient-to-br from-yellow-100/50 to-orange-100/50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          <div className="text-center space-y-2">
            <i className="fas fa-film text-yellow-400 dark:text-yellow-300 text-3xl"></i>
            {node.data.animationUrl ? (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                <div className="font-medium">GIF анимация</div>
                {node.data.duration && (
                  <div className="flex items-center justify-center space-x-1">
                    <i className="fas fa-clock text-xs"></i>
                    <span>{node.data.duration}с</span>
                  </div>
                )}
                {node.data.width && node.data.height && (
                  <div className="flex items-center justify-center space-x-1">
                    <i className="fas fa-expand text-xs"></i>
                    <span>{node.data.width}x{node.data.height}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-yellow-500 dark:text-yellow-400">Добавьте URL GIF анимации</div>
            )}
          </div>
        </div>
      )}
      
      {/* Location preview */}
      {node.type === 'location' && (
        <div className="bg-gradient-to-br from-green-100/50 to-lime-100/50 dark:from-green-900/30 dark:to-lime-900/30 rounded-lg p-3 mb-4 flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <i className="fas fa-map-marker-alt text-green-400 dark:text-green-300 text-2xl"></i>
            {node.data.mapService && node.data.mapService !== 'custom' && (
              <div className="flex items-center space-x-1">
                {node.data.mapService === 'yandex' && (
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-medium border border-yellow-200 dark:border-yellow-800">
                    Яндекс
                  </span>
                )}
                {node.data.mapService === 'google' && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                    Google
                  </span>
                )}
                {node.data.mapService === '2gis' && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium border border-green-200 dark:border-green-800">
                    2ГИС
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="text-xs text-green-600 dark:text-green-400 space-y-1 text-center">
            <div className="font-medium text-sm">{node.data.title || 'Геолокация'}</div>
            
            {/* Показываем координаты если они есть */}
            {node.data.latitude && node.data.longitude && (
              <div className="flex items-center justify-center space-x-1">
                <i className="fas fa-crosshairs text-xs"></i>
                <span className="font-mono text-xs">
                  {parseFloat(node.data.latitude as string).toFixed(4)}, {parseFloat(node.data.longitude as string).toFixed(4)}
                </span>
              </div>
            )}
            
            {/* Показываем адрес если он есть */}
            {node.data.address && (
              <div className="flex items-center justify-center space-x-1">
                <i className="fas fa-map text-xs"></i>
                <span className="truncate max-w-32 text-xs">{node.data.address}</span>
              </div>
            )}
            
            {/* Индикатор что URL загружен */}
            {(node.data.yandexMapUrl || node.data.googleMapUrl || node.data.gisMapUrl) && (
              <div className="flex items-center justify-center space-x-1">
                <i className="fas fa-link text-xs text-green-500"></i>
                <span className="text-xs opacity-75">URL загружен</span>
              </div>
            )}
            
            {/* Показываем дополнительные опции */}
            {node.data.generateMapPreview && (
              <div className="flex items-center justify-center space-x-1">
                <i className="fas fa-external-link-alt text-xs text-blue-500"></i>
                <span className="text-xs opacity-75">Кнопки карт</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Contact preview */}
      {node.type === 'contact' && (
        <div className="bg-gradient-to-br from-sky-100/50 to-blue-100/50 dark:from-sky-900/30 dark:to-blue-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          <div className="text-center space-y-2">
            <i className="fas fa-address-book text-sky-400 dark:text-sky-300 text-3xl"></i>
            <div className="text-xs text-sky-600 dark:text-sky-400 space-y-1">
              <div className="font-medium">{node.data.firstName} {node.data.lastName}</div>
              {node.data.phoneNumber && (
                <div className="flex items-center justify-center space-x-1">
                  <i className="fas fa-phone text-xs"></i>
                  <span>{node.data.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Poll preview */}
      {node.type === 'poll' && (
        <div className="bg-gradient-to-br from-violet-100/50 to-purple-100/50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          <div className="text-center space-y-2">
            <i className="fas fa-poll text-violet-400 dark:text-violet-300 text-3xl"></i>
            <div className="text-xs text-violet-600 dark:text-violet-400 space-y-1">
              <div className="font-medium">{node.data.question || 'Опрос'}</div>
              {node.data.options && node.data.options.length > 0 && (
                <div className="flex items-center justify-center space-x-1">
                  <i className="fas fa-list text-xs"></i>
                  <span>{node.data.options.length} вариантов</span>
                </div>
              )}
              {node.data.allowsMultipleAnswers && (
                <div className="text-xs text-violet-500 dark:text-violet-400">Множественный выбор</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Dice preview */}
      {node.type === 'dice' && (
        <div className="bg-gradient-to-br from-slate-100/50 to-gray-100/50 dark:from-slate-900/30 dark:to-gray-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
          <div className="text-center space-y-2">
            <i className="fas fa-dice text-slate-400 dark:text-slate-300 text-3xl"></i>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-medium">Игральный кубик</div>
              <div className="flex items-center justify-center space-x-1">
                <i className="fas fa-gamepad text-xs"></i>
                <span>{node.data.emoji || '🎲'} Развлечение</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* User Input preview */}
      {false && (
        <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/70 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-800/30">
          <div className="space-y-3">
            {/* Input type and variable display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <i className="fas fa-edit text-purple-600 dark:text-purple-400 text-xs"></i>
                </div>
                <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  {node.data.inputType ? (
                    <span className="capitalize">
                      {node.data.inputType === 'text' && 'Текст'}
                      {node.data.inputType === 'number' && 'Число'}
                      {node.data.inputType === 'email' && 'Email'}
                      {node.data.inputType === 'phone' && 'Телефон'}
                      {node.data.inputType === 'photo' && 'Фото'}
                      {node.data.inputType === 'video' && 'Видео'}
                      {node.data.inputType === 'audio' && 'Аудио'}
                      {node.data.inputType === 'document' && 'Документ'}
                      {node.data.inputType === 'location' && 'Местоположение'}
                      {node.data.inputType === 'contact' && 'Контакт'}
                      {node.data.inputType === 'any' && 'Любой тип'}
                    </span>
                  ) : (
                    'Тип ввода'
                  )}
                </div>
              </div>
              {(node.data as any).variableName && (
                <div className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">
                  ${(node.data as any).variableName}
                </div>
              )}
            </div>

            {/* Response type indicator */}
            {node.data.responseType && (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                  <i className={cn(
                    "text-indigo-600 dark:text-indigo-400 text-xs",
                    node.data.responseType === 'text' ? 'fas fa-keyboard' : 'fas fa-mouse-pointer'
                  )}></i>
                </div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300">
                  {node.data.responseType === 'text' ? 'Текстовый ввод' : 'Кнопочный ответ'}
                </div>
              </div>
            )}

            {/* Button options preview */}
            {node.data.responseType === 'buttons' && node.data.responseOptions && node.data.responseOptions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Варианты ответов:</div>
                <div className="flex flex-wrap gap-1">
                  {node.data.responseOptions.slice(0, 3).map((option, index) => (
                    <div key={index} className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                      {option.text}
                    </div>
                  ))}
                  {node.data.responseOptions.length > 3 && (
                    <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      +{node.data.responseOptions.length - 3} еще
                    </div>
                  )}
                </div>
                {node.data.allowMultipleSelection && (
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                    <i className="fas fa-check-double text-xs"></i>
                    <span>Множественный выбор</span>
                  </div>
                )}
              </div>
            )}

            {/* Validation info */}
            {((node.data as any).minLength || (node.data as any).maxLength || (node.data as any).timeout) && (
              <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
                {(node.data as any).minLength && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span>Мин: {(node.data as any).minLength}</span>
                  </div>
                )}
                {(node.data as any).maxLength && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-arrow-down text-xs"></i>
                    <span>Макс: {(node.data as any).maxLength}</span>
                  </div>
                )}
                {(node.data as any).timeout && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-clock text-xs"></i>
                    <span>{(node.data as any).timeout}с</span>
                  </div>
                )}
              </div>
            )}

            {/* Save to database indicator */}
            {(node.data as any).saveToDatabase && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <i className="fas fa-database text-green-600 dark:text-green-400 text-xs"></i>
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Сохранение в БД</div>
              </div>
            )}

            {/* Configuration status */}
            {!((node.data as any).inputType && (node.data as any).variableName) && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <i className="fas fa-exclamation-triangle text-xs"></i>
                <div className="text-xs">Требуется настройка</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Conditional Messages Indicator */}
      {node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 dark:from-purple-900/25 dark:to-indigo-900/25 border border-purple-200/50 dark:border-purple-800/40 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center">
                <i className="fas fa-code-branch text-purple-600 dark:text-purple-400 text-sm"></i>
              </div>
              <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                Условные сообщения
              </div>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full font-medium">
              {node.data.conditionalMessages.length} правил{node.data.conditionalMessages.length === 1 ? 'о' : node.data.conditionalMessages.length < 5 ? 'а' : ''}
            </div>
          </div>
          
          <div className="space-y-2">
            {node.data.conditionalMessages
              .sort((a, b) => (b.priority || 0) - (a.priority || 0))
              .slice(0, 3)
              .map((condition, index) => {
                const getConditionIcon = (conditionType: string) => {
                  switch(conditionType) {
                    case 'user_data_equals': return 'fas fa-equals';
                    case 'user_data_contains': return 'fas fa-search';
                    case 'user_data_exists': return 'fas fa-check-circle';
                    case 'user_data_not_exists': return 'fas fa-times-circle';
                    case 'first_time': return 'fas fa-user-plus';
                    case 'returning_user': return 'fas fa-user-check';
                    default: return 'fas fa-filter';
                  }
                };

                const getConditionColor = (conditionType: string) => {
                  switch(conditionType) {
                    case 'user_data_equals': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
                    case 'user_data_contains': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
                    case 'user_data_exists': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30';
                    case 'user_data_not_exists': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
                    case 'first_time': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30';
                    case 'returning_user': return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30';
                    default: return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30';
                  }
                };

                const conditionName = {
                  'user_data_equals': 'Точное совпадение',
                  'user_data_contains': 'Содержит текст',
                  'user_data_exists': 'Имя введено ранее',
                  'user_data_not_exists': 'Имя не введено',
                  'first_time': 'Первое посещение',
                  'returning_user': 'Возвращающийся пользователь'
                }[condition.condition] || 'Условие';

                return (
                  <div key={condition.id || index} className="bg-white/60 dark:bg-slate-900/40 rounded-lg border border-purple-100 dark:border-purple-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs", getConditionColor(condition.condition))}>
                          <i className={getConditionIcon(condition.condition)}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {conditionName}
                          </div>
                          {(condition as any).variableName && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                              <i className="fas fa-tag text-xs"></i>
                              <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs">{(condition as any).variableName}</code>
                              {(condition as any).value && (
                                <>
                                  <span>=</span>
                                  <span className="truncate max-w-[60px]">"{(condition as any).value}"</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">
                          #{condition.priority || 0}
                        </div>
                      </div>
                    </div>
                    
                    {condition.messageText && (
                      <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded p-2 border border-slate-200/50 dark:border-slate-700/50">
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center space-x-1">
                          <i className="fas fa-comment text-xs"></i>
                          <span className="font-medium">Сообщение:</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {condition.messageText}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            
            {node.data.conditionalMessages.length > 3 && (
              <div className="text-center py-2">
                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100/70 dark:bg-purple-900/30 px-3 py-2 rounded-lg border border-purple-200/30 dark:border-purple-800/30 inline-flex items-center space-x-1">
                  <i className="fas fa-ellipsis-h text-xs"></i>
                  <span>Еще {node.data.conditionalMessages.length - 3} условий</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content Management Action Preview */}
      {(node.type === 'pin_message' || node.type === 'unpin_message' || node.type === 'delete_message') && (
        <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-700/50 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", nodeColors[node.type])}>
              <i className={cn(nodeIcons[node.type], "text-lg")}></i>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {node.type === 'pin_message' && 'Закрепить сообщение'}
                  {node.type === 'unpin_message' && 'Открепить сообщение'}
                  {node.type === 'delete_message' && 'Удалить сообщение'}
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-current opacity-30"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Контент
                </span>
              </div>
              
              {/* Target Info */}
              <div className="space-y-2">
                {node.data.targetGroupId && (
                  <div className="flex items-center space-x-2 text-xs">
                    <i className="fas fa-users text-blue-500 dark:text-blue-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">Группа:</span>
                    <code className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-mono">
                      {node.data.targetGroupId}
                    </code>
                  </div>
                )}
                {node.data.targetMessageId && (
                  <div className="flex items-center space-x-2 text-xs">
                    <i className="fas fa-comment text-purple-500 dark:text-purple-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">Сообщение:</span>
                    <code className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-mono">
                      {node.data.targetMessageId}
                    </code>
                  </div>
                )}
                {node.data.messageIdSource && node.data.messageIdSource !== 'manual' && (
                  <div className="flex items-center space-x-2 text-xs">
                    <i className="fas fa-magic text-orange-500 dark:text-orange-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">Источник ID:</span>
                    <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs">
                      {node.data.messageIdSource === 'variable' ? 'Переменная' : 
                       node.data.messageIdSource === 'last_message' ? 'Последнее сообщение' : node.data.messageIdSource}
                    </span>
                  </div>
                )}
                {node.data.variableName && node.data.messageIdSource === 'variable' && (
                  <div className="flex items-center space-x-2 text-xs">
                    <i className="fas fa-tag text-green-500 dark:text-green-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">Переменная:</span>
                    <code className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded font-mono">
                      {node.data.variableName}
                    </code>
                  </div>
                )}
              </div>
              
              {/* Action Status */}
              <div className="flex items-center space-x-2 pt-2 border-t border-blue-200/50 dark:border-blue-700/50">
                {(() => {
                  const hasTargetGroup = node.data.targetGroupId && node.data.targetGroupId.trim() !== '';
                  const needsMessageId = node.type !== 'unpin_message'; // unpin не требует ID сообщения
                  const hasMessageId = node.data.targetMessageId && node.data.targetMessageId.trim() !== '';
                  const hasVariableSource = node.data.messageIdSource === 'variable' && node.data.variableName;
                  const hasLastMessageSource = node.data.messageIdSource === 'last_message';
                  const messageIdOk = !needsMessageId || hasMessageId || hasVariableSource || hasLastMessageSource;
                  const isReady = hasTargetGroup && messageIdOk;
                  
                  return (
                    <>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isReady ? "bg-green-500" : "bg-orange-500"
                      )}></div>
                      <span className="text-xs font-medium">
                        {isReady ? (
                          <span className="text-green-600 dark:text-green-400">Готово к выполнению</span>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400">
                            {!hasTargetGroup ? 'Укажите ID группы' :
                             needsMessageId && !messageIdOk ? 'Укажите ID сообщения или источник' :
                             'Требуется настройка'}
                          </span>
                        )}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Action Preview */}
      {(node.type === 'ban_user' || node.type === 'unban_user' || node.type === 'kick_user' || node.type === 'mute_user' || node.type === 'unmute_user' || node.type === 'promote_user' || node.type === 'demote_user') && (
        <div className="bg-gradient-to-br from-gray-50/80 to-slate-50/80 dark:from-gray-900/30 dark:to-slate-900/30 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", nodeColors[node.type])}>
              <i className={cn(nodeIcons[node.type], "text-lg")}></i>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {node.type === 'ban_user' && 'Заблокировать пользователя'}
                  {node.type === 'unban_user' && 'Разблокировать пользователя'}
                  {node.type === 'kick_user' && 'Исключить пользователя'}
                  {node.type === 'mute_user' && 'Заглушить пользователя'}
                  {node.type === 'unmute_user' && 'Разрешить говорить'}
                  {node.type === 'promote_user' && 'Назначить администратором'}
                  {node.type === 'demote_user' && 'Снять с администратора'}
                </span>
                <div className="h-1.5 w-1.5 rounded-full bg-current opacity-30"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Действие
                </span>
              </div>
              
              {/* Target Info */}
              <div className="space-y-2">
                {node.data.targetGroupId && (
                  <div className="flex items-center space-x-2 text-xs">
                    <i className="fas fa-users text-blue-500 dark:text-blue-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">Группа:</span>
                    <code className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-mono">
                      {node.data.targetGroupId}
                    </code>
                  </div>
                )}
                {node.data.targetUserId && (
                  <div className="flex items-center space-x-2 text-xs">
                    <i className="fas fa-user text-purple-500 dark:text-purple-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">Пользователь:</span>
                    <code className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-mono">
                      {node.data.targetUserId}
                    </code>
                  </div>
                )}
                {node.data.reason && (
                  <div className="flex items-start space-x-2 text-xs">
                    <i className="fas fa-comment-dots text-orange-500 dark:text-orange-400 mt-0.5"></i>
                    <div className="flex-1">
                      <span className="text-gray-600 dark:text-gray-400">Причина:</span>
                      <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded mt-1 text-xs leading-relaxed">
                        {node.data.reason}
                      </div>
                    </div>
                  </div>
                )}
                {(node.type === 'ban_user' || node.type === 'mute_user') && node.data.untilDate && (
                  <div className="flex items-center space-x-2 text-xs">
                    <i className="fas fa-clock text-red-500 dark:text-red-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">До:</span>
                    <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                      {new Date(node.data.untilDate * 1000).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Action Status */}
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                {(() => {
                  const hasTargetGroup = node.data.targetGroupId && node.data.targetGroupId.trim() !== '';
                  const hasTargetUser = node.data.targetUserId && node.data.targetUserId.trim() !== '';
                  const isReady = hasTargetGroup && hasTargetUser;
                  
                  return (
                    <>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isReady ? "bg-green-500" : "bg-orange-500"
                      )}></div>
                      <span className="text-xs font-medium">
                        {isReady ? (
                          <span className="text-green-600 dark:text-green-400">Готово к выполнению</span>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400">
                            {!hasTargetGroup && !hasTargetUser ? 'Укажите группу и пользователя' :
                             !hasTargetGroup ? 'Укажите ID группы' :
                             'Укажите ID пользователя'}
                          </span>
                        )}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Text Input Indicator for keyboard type 'none' */}
      {node.type === 'keyboard' && node.data.keyboardType === 'none' && (node.data as any).enableTextInput && (
        <div className="bg-gradient-to-br from-cyan-50/70 to-blue-50/70 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-xl p-4 mb-4 border border-cyan-200 dark:border-cyan-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
              <i className="fas fa-keyboard text-cyan-600 dark:text-cyan-400 text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-cyan-800 dark:text-cyan-200 mb-1">
                Текстовый ввод
              </div>
              <div className="text-xs text-cyan-600 dark:text-cyan-400 space-y-1">
                {(node.data as any).inputVariable && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-tag text-xs"></i>
                    <span>Сохранить в: <code className="bg-cyan-100 dark:bg-cyan-900/50 px-1 py-0.5 rounded text-xs">{(node.data as any).inputVariable}</code></span>
                  </div>
                )}
                {(node.data as any).inputTargetNodeId && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-arrow-right text-xs"></i>
                    <span>Следующий узел: {(node.data as any).inputTargetNodeId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Buttons preview */}
      {node.data.buttons && node.data.buttons.length > 0 && node.data.keyboardType !== 'none' && (
        <div className="space-y-3">
          {(() => {
            // Check if this is a multi-select node (has buttons with buttonType: "option")
            const hasOptionButtons = node.data.buttons.some((button: any) => button.buttonType === 'option');
            const isMultiSelect = hasOptionButtons && (node.data as any).allowMultipleSelection;
            
            return (
              <>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-1 h-4 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {isMultiSelect ? 'Множественный выбор' : 
                     node.data.keyboardType === 'inline' ? 'Inline кнопки' : 'Reply кнопки'}
                  </span>
                  {isMultiSelect && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
                      <i className="fas fa-check-double text-xs mr-1"></i>
                      Мульти-выбор
                    </div>
                  )}
                </div>
                
                {node.data.keyboardType === 'inline' ? (
                  <div className="space-y-3">
                    {/* Option buttons for multi-select */}
                    {isMultiSelect ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {node.data.buttons.filter((button: any) => button.buttonType === 'option').slice(0, 6).map((button: any) => (
                            <div key={button.id} className="group relative">
                              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg text-xs font-medium text-green-700 dark:text-green-300 text-center border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200 shadow-sm relative">
                              <div className="flex items-center justify-center space-x-1">
                                <i className="fas fa-square text-green-600 dark:text-green-400 text-xs opacity-50" title="Невыбрано"></i>
                                <span className="truncate">{button.text}</span>
                              </div>
                              {/* Simulated selected state */}
                              <div className="absolute inset-0 bg-green-500/10 dark:bg-green-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                            </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Show "Done" button for multi-select */}
                        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 text-center border border-blue-200 dark:border-blue-800 shadow-sm">
                            <div className="flex items-center justify-center space-x-1">
                              <i className="fas fa-check text-blue-600 dark:text-blue-400 text-xs"></i>
                              <span>Готово</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Show count of remaining option buttons */}
                        {node.data.buttons.filter((button: any) => button.buttonType === 'option').length > 6 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1 font-medium">
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-800 rounded-full">
                              +{node.data.buttons.filter((button: any) => button.buttonType === 'option').length - 6} опций
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Regular inline buttons */
                      <div className="grid grid-cols-2 gap-2">
                        {node.data.buttons.slice(0, 4).map((button: any) => (
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
                                {button.action === 'selection' && (
                                  <i className="fas fa-mouse-pointer text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Выбор"></i>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Reply keyboard buttons */
                  <div className="space-y-2">
                    {node.data.buttons.slice(0, 2).map((button: any) => (
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
                          {button.action === 'selection' && (
                            <i className="fas fa-mouse-pointer text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Выбор"></i>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Show remaining buttons count for non-multi-select */}
                {!isMultiSelect && node.data.buttons && node.data.buttons.length > (node.data.keyboardType === 'inline' ? 4 : 2) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2 font-medium">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      +{node.data.buttons.length - (node.data.keyboardType === 'inline' ? 4 : 2)} еще
                    </span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      {/* Connection points */}
      <button
        className={cn(
          "absolute -left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-lg hover:scale-125 transition-all duration-300 opacity-0 group-hover:opacity-100 z-10",
          connectionStart?.nodeId === node.id && connectionStart?.handle === 'target'
            ? "bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 animate-pulse shadow-2xl shadow-emerald-500/50 opacity-100"
            : connectionStart && connectionStart.nodeId !== node.id && connectionStart.handle === 'source'
            ? "bg-gradient-to-br from-emerald-300 to-green-400 hover:from-emerald-400 hover:to-green-500 animate-bounce shadow-xl shadow-emerald-400/40 opacity-100"
            : "bg-gradient-to-br from-gray-400 to-gray-500 hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-500/30"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onConnectionStart?.(node.id, 'target');
        }}
        title="Входящее соединение"
      >
        <div className="absolute inset-1 rounded-full bg-white/30 dark:bg-slate-800/30 opacity-0 hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute inset-0 rounded-full bg-current opacity-0 hover:opacity-10 transition-opacity duration-300 animate-ping" />
      </button>
      <button
        className={cn(
          "absolute -right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-lg hover:scale-125 transition-all duration-300 opacity-0 group-hover:opacity-100 z-10",
          connectionStart?.nodeId === node.id && connectionStart?.handle === 'source'
            ? "bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 animate-pulse shadow-2xl shadow-emerald-500/50 opacity-100"
            : connectionStart && connectionStart.nodeId !== node.id && connectionStart.handle === 'target'
            ? "bg-gradient-to-br from-emerald-300 to-green-400 hover:from-emerald-400 hover:to-green-500 animate-bounce shadow-xl shadow-emerald-400/40 opacity-100"
            : "bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onConnectionStart?.(node.id, 'source');
        }}
        title="Исходящее соединение"
      >
        <div className="absolute inset-1 rounded-full bg-white/30 dark:bg-slate-800/30 opacity-0 hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute inset-0 rounded-full bg-current opacity-0 hover:opacity-10 transition-opacity duration-300 animate-ping" />
      </button>
    </div>
  );
}
