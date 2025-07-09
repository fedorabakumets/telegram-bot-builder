import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

// Function to parse and render formatted text
function parseFormattedText(text: string, formatMode?: string, markdown?: boolean): JSX.Element {
  if (!text) return <span>{text}</span>;
  
  // Remove HTML tags and replace with styled spans
  const parseHTML = (htmlText: string): JSX.Element[] => {
    const parts: JSX.Element[] = [];
    let remaining = htmlText;
    let key = 0;
    
    while (remaining.length > 0) {
      // Bold text
      const boldMatch = remaining.match(/^(.*?)<b>(.*?)<\/b>(.*)/);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
        parts.push(<strong key={key++} className="font-bold">{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
        continue;
      }
      
      // Italic text
      const italicMatch = remaining.match(/^(.*?)<i>(.*?)<\/i>(.*)/);
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
    shouldUseHTML = text.includes('<') && text.includes('>');
  } else if (markdown === true) {
    // Legacy support for 'markdown' property
    shouldUseHTML = false;
  } else {
    // Auto-detect: if text contains HTML tags, use HTML parser
    shouldUseHTML = text.includes('<') && text.includes('>');
  }
  

  
  const parsedParts = shouldUseHTML ? parseHTML(text) : parseMarkdown(text);
  
  return <span>{parsedParts}</span>;
}

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
  video: 'fas fa-video',
  audio: 'fas fa-music',
  document: 'fas fa-file-alt',
  keyboard: 'fas fa-keyboard',
  condition: 'fas fa-code-branch',
  input: 'fas fa-edit',
  'user-input': 'fas fa-comments',
  command: 'fas fa-terminal',
  sticker: 'fas fa-laugh',
  voice: 'fas fa-microphone',
  animation: 'fas fa-film',
  location: 'fas fa-map-marker-alt',
  contact: 'fas fa-address-book',
  poll: 'fas fa-poll',
  dice: 'fas fa-dice'
};

const nodeColors = {
  start: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  message: 'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  photo: 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  video: 'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  audio: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  document: 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800',
  keyboard: 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  condition: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
  input: 'bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
  'user-input': 'bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  command: 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
  sticker: 'bg-gradient-to-br from-pink-50 to-fuchsia-100 dark:from-pink-900/30 dark:to-fuchsia-900/30 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800',
  voice: 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  animation: 'bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  location: 'bg-gradient-to-br from-green-50 to-lime-100 dark:from-green-900/30 dark:to-lime-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800',
  contact: 'bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
  poll: 'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800',
  dice: 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
};

export function CanvasNode({ node, isSelected, onClick, onDelete, onMove, onConnectionStart, connectionStart, zoom = 100, pan = { x: 0, y: 0 } }: CanvasNodeProps) {
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
      const maxY = Math.max(minY, (canvas.clientHeight / zoomFactor) - 220);
      
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
      <div className="flex items-start mb-6 relative">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm relative", nodeColors[node.type])}>
          <i className={cn(nodeIcons[node.type], "text-lg")}></i>
          {/* Status indicator */}
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
                case 'user-input': return !!(node.data.inputType && node.data.variableName);
                default: return !!node.data.messageText;
              }
            })();
            
            return hasRequiredFields ? (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
            ) : (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                <i className="fas fa-exclamation text-white text-xs"></i>
              </div>
            );
          })()}
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
              {node.type === 'condition' && 'Условие'}
              {node.type === 'input' && 'Ввод данных'}
              {node.type === 'user-input' && 'Сбор ввода'}
              {node.type === 'sticker' && 'Стикер'}
              {node.type === 'voice' && 'Голосовое сообщение'}
              {node.type === 'animation' && 'GIF анимация'}
              {node.type === 'location' && 'Геолокация'}
              {node.type === 'contact' && 'Контакт'}
              {node.type === 'poll' && 'Опрос'}
              {node.type === 'dice' && 'Кубик'}
            </h3>
            {onMove && (
              <div className="ml-2 opacity-40 hover:opacity-70 transition-all duration-200 cursor-grab">
                <i className="fas fa-grip-vertical text-xs text-gray-400 dark:text-gray-500"></i>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {node.data.description ? parseFormattedText(node.data.description, node.data.formatMode, node.data.markdown) : 'Элемент бота'}
          </p>
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
                  {parseFloat(node.data.latitude).toFixed(4)}, {parseFloat(node.data.longitude).toFixed(4)}
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
      {node.type === 'user-input' && (
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
              {node.data.variableName && (
                <div className="text-xs font-mono text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">
                  ${node.data.variableName}
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
            {(node.data.minLength || node.data.maxLength || node.data.timeout) && (
              <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
                {node.data.minLength && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-arrow-up text-xs"></i>
                    <span>Мин: {node.data.minLength}</span>
                  </div>
                )}
                {node.data.maxLength && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-arrow-down text-xs"></i>
                    <span>Макс: {node.data.maxLength}</span>
                  </div>
                )}
                {node.data.timeout && (
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-clock text-xs"></i>
                    <span>{node.data.timeout}с</span>
                  </div>
                )}
              </div>
            )}

            {/* Save to database indicator */}
            {node.data.saveToDatabase && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <i className="fas fa-database text-green-600 dark:text-green-400 text-xs"></i>
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Сохранение в БД</div>
              </div>
            )}

            {/* Configuration status */}
            {!(node.data.inputType && node.data.variableName) && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <i className="fas fa-exclamation-triangle text-xs"></i>
                <div className="text-xs">Требуется настройка</div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Buttons preview */}
      {node.data.buttons && node.data.buttons.length > 0 && (
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
          {node.data.buttons && node.data.buttons.length > (node.data.keyboardType === 'inline' ? 4 : 2) && (
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
