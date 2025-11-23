import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

// Function to parse and render formatted text
function parseFormattedText(text: string, formatMode?: string, markdown?: boolean): JSX.Element {
  if (!text) return <span>{text}</span>;
  
  // Убрали debug логи для улучшения производительности
  
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
  setIsNodeBeingDragged?: (isDragging: boolean) => void;
  onSizeChange?: (nodeId: string, size: { width: number; height: number }) => void;
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
  demote_user: 'fas fa-user-minus',
  admin_rights: 'fas fa-user-shield'
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
  demote_user: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900/40 dark:to-gray-800/40 text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-700/50 shadow-lg shadow-slate-500/20',
  admin_rights: 'bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900/40 dark:to-purple-800/40 text-violet-800 dark:text-violet-200 border-2 border-violet-300 dark:border-violet-700/50 shadow-xl shadow-violet-500/25 ring-1 ring-violet-400/30 dark:ring-violet-600/30'
};

export function CanvasNode({ node, isSelected, onClick, onDelete, onDuplicate, onMove, onConnectionStart, connectionStart, zoom = 100, pan = { x: 0, y: 0 }, setIsNodeBeingDragged, onSizeChange }: CanvasNodeProps) {
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
    
    // Вычисляем расстояние от начальной точки касания
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = touch.clientY - touchStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Начинаем перетаскивание только если движение больше 10 пикселей
    if (distance > 10 && !isTouchDragging) {
      setIsTouchDragging(true);
      setTouchMoved(true);
      // Уведомляем глобальное состояние о начале перетаскивания
      if (setIsNodeBeingDragged) {
        setIsNodeBeingDragged(true);
      }
    }
    
    // Всегда предотвращаем всплытие при движении по узлу, даже если еще не началось перетаскивание
    e.preventDefault();
    e.stopPropagation(); // Останавливаем всплытие, чтобы не конфликтовать с панорамированием холста
    
    if (!isTouchDragging) return;
    
    // Находим канвас (родительский элемент трансформируемого контейнера)
    const transformedContainer = nodeRef.current?.parentElement;
    const canvas = transformedContainer?.parentElement;
    
    if (canvas && transformedContainer) {
      const canvasRect = canvas.getBoundingClientRect();
      
      // Получаем экранные координаты touch относительно канваса
      const screenX = touch.clientX - canvasRect.left;
      const screenY = touch.clientY - canvasRect.top;
      
      // Преобразуем экранные координаты в координаты канваса с учетом зума и панорамирования
      const zoomFactor = zoom / 100;
      const canvasX = (screenX - pan.x) / zoomFactor - touchOffset.x;
      const canvasY = (screenY - pan.y) / zoomFactor - touchOffset.y;
      
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

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Останавливаем всплытие
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;
    
    // Если это было короткое касание (менее 300ms) и не было движения, обрабатываем как клик
    if (touchDuration < 300 && !touchMoved && onClick) {
      onClick();
    }
    
    setIsTouchDragging(false);
    setTouchMoved(false);
    // Уведомляем глобальное состояние об окончании перетаскивания
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

  return (
    <div
      ref={nodeRef}
      data-canvas-node="true"
      className={cn(
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 p-6 w-80 transition-all duration-300 relative select-none group",
        isSelected ? "border-blue-500 ring-4 ring-blue-500/20 shadow-2xl shadow-blue-500/10" : "border-gray-200 dark:border-slate-700",
        (isDragging || isTouchDragging) ? "shadow-3xl scale-105 cursor-grabbing z-50 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : "hover:shadow-2xl hover:border-gray-300 dark:hover:border-slate-600",
        onMove ? "cursor-grab hover:cursor-grab" : "cursor-pointer"
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
        transform: (isDragging || isTouchDragging) ? 'rotate(2deg) scale(1.05)' : 'rotate(0deg) scale(1)',
        zIndex: (isDragging || isTouchDragging) ? 1000 : isSelected ? 100 : 10,
        transition: (isDragging || isTouchDragging) ? 'none' : 'all 0.2s ease'
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
                  case 'sticker': return !!(node.data.stickerUrl || node.data.stickerFileId);
                  case 'voice': return !!node.data.voiceUrl;
                  case 'location': return !!(node.data.latitude && node.data.longitude);
                  case 'contact': return !!(node.data.phoneNumber && node.data.firstName);
                  case 'poll': return !!(node.data.question && node.data.options?.length);
                  case 'command': return !!node.data.command;
                  case 'admin_rights': return true;
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
                <span className="flex flex-col gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono text-sm bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 inline-block w-fit">
                    {node.data.command || `/${node.type}`}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">Управление контентом</span>
                </span>
              )}
              {(node.type === 'ban_user' || node.type === 'unban_user' || node.type === 'mute_user' || 
                node.type === 'unmute_user' || node.type === 'kick_user' || node.type === 'promote_user' || 
                node.type === 'demote_user') && (
                <span className="flex flex-col gap-2">
                  <span className="text-rose-600 dark:text-rose-400 font-mono text-sm bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 inline-block w-fit">
                    {node.data.command || `/${node.type}`}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                    {node.type === 'ban_user' && 'Заблокировать пользователя'}
                    {node.type === 'unban_user' && 'Разблокировать пользователя'}
                    {node.type === 'kick_user' && 'Исключить пользователя'}
                    {node.type === 'mute_user' && 'Заглушить пользователя'}
                    {node.type === 'unmute_user' && 'Разрешить говорить'}
                    {node.type === 'promote_user' && 'Назначить администратором'}
                    {node.type === 'demote_user' && 'Снять с администратора'}
                  </span>
                </span>
              )}
              {node.type === 'admin_rights' && (
                <span className="inline-flex items-center">
                  <span className="text-violet-600 dark:text-violet-400 font-mono text-sm bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded-lg border border-violet-200 dark:border-violet-800 mr-2">
                    {node.data.command || '/admin_rights'}
                  </span>
                  <span>Права админа</span>
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
                {node.data.synonyms.map((synonym, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-700/50"
                    title={`Синоним: ${synonym}`}
                  >
                    <i className="fas fa-quote-left text-indigo-400 dark:text-indigo-500 mr-1" style={{ fontSize: '8px' }}></i>
                    {synonym}
                  </span>
                ))}
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
            <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed line-clamp-8 font-medium">
              {parseFormattedText(node.data.messageText, node.data.formatMode, node.data.markdown)}
            </div>
          </div>
        </div>
      )}
      
      {/* Media attachment indicator for message nodes */}
      {node.type === 'message' && (node.data.imageUrl || node.data.videoUrl || node.data.audioUrl || node.data.documentUrl) && (
        <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <i className={`fas fa-${
              node.data.imageUrl ? 'image' :
              node.data.videoUrl ? 'video' :
              node.data.audioUrl ? 'music' :
              'file'
            } text-sm`}></i>
            <span>
              {node.data.imageUrl ? 'Изображение прикреплено' :
               node.data.videoUrl ? 'Видео прикреплено' :
               node.data.audioUrl ? 'Аудио прикреплено' :
               'Документ прикреплен'}
            </span>
          </div>
        </div>
      )}
      
      {/* Media previews */}
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
      
      {/* Admin Rights preview */}
      {node.type === 'admin_rights' && (
        <div className="bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/25 dark:to-purple-900/25 border border-violet-200/50 dark:border-violet-800/40 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/60 flex items-center justify-center">
                <i className="fas fa-user-shield text-violet-600 dark:text-violet-400 text-sm"></i>
              </div>
              <div className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                Права администратора
              </div>
            </div>
            <div className="text-xs text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-2 py-1 rounded-full font-medium">
              11 кнопок
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-1 h-4 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Inline кнопки
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'can_change_info', name: '🏷️ Профиль' },
                { key: 'can_delete_messages', name: '🗑️ Удаление' },
                { key: 'can_restrict_members', name: '🚫 Блокировка' },
                { key: 'can_invite_users', name: '📨 Приглашения' },
                { key: 'can_pin_messages', name: '📌 Закрепление' },
                { key: 'can_manage_video_chats', name: '🎥 Видеочаты' }
              ].map((right, index) => (
                <div key={right.key} className="group relative">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 text-center border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 shadow-sm">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="truncate">{right.name}</span>
                      <i className="fas fa-chevron-right text-blue-500 dark:text-blue-400 text-xs opacity-70"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Показать что есть еще кнопки */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1 font-medium">
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                +5 еще
              </span>
            </div>
          </div>
          
          {/* Additional info */}
          <div className="mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-700/30">
            <div className="flex items-center justify-center space-x-3 text-xs text-violet-600 dark:text-violet-400">
              <div className="flex items-center space-x-1">
                <i className="fas fa-toggle-on"></i>
                <span>Интерактивные переключатели</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-sync-alt"></i>
                <span>Обновление в реальном времени</span>
              </div>
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
      
      {/* Auto Transition Indicator - для autoTransitionTo */}
      {node.data.autoTransitionTo && !node.data.buttons?.length && (
        <div className="bg-gradient-to-br from-emerald-50/70 to-green-50/70 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl p-3 mb-4 border border-emerald-200 dark:border-emerald-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <i className="fas fa-arrow-right text-emerald-600 dark:text-emerald-400 text-sm"></i>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">
                Автопереход
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">
                Автоматически переходит к следующему узлу
              </div>
            </div>
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
                    default: return 'fas fa-filter';
                  }
                };

                const getConditionColor = (conditionType: string) => {
                  switch(conditionType) {
                    case 'user_data_equals': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30';
                    case 'user_data_contains': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
                    case 'user_data_exists': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30';
                    case 'user_data_not_exists': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
                    default: return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30';
                  }
                };

                const conditionNames: Record<string, string> = {
                  'user_data_equals': 'Точное совпадение',
                  'user_data_contains': 'Содержит текст',
                  'user_data_exists': 'Имя введено ранее',
                  'user_data_not_exists': 'Имя не введено'
                };
                const conditionName = conditionNames[condition.condition] || 'Условие';

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
                    
                    <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded p-2 border border-slate-200/50 dark:border-slate-700/50">
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center space-x-1">
                        <i className="fas fa-comment text-xs"></i>
                        <span className="font-medium">Сообщение:</span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {condition.messageText || (
                          <span className="italic text-slate-500 dark:text-slate-400">
                            Основной текст узла: {node.data.messageText?.slice(0, 50) || '(не указан)'}...
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Кнопки условного сообщения */}
                    {(condition as any).buttons && (condition as any).buttons.length > 0 && (condition as any).keyboardType !== 'none' && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-1 mb-1.5">
                          <i className="fas fa-keyboard text-xs text-amber-600 dark:text-amber-400"></i>
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                            {(condition as any).keyboardType === 'inline' ? 'Inline' : 'Reply'} кнопки
                          </span>
                        </div>
                        
                        {(condition as any).keyboardType === 'inline' ? (
                          <div className="grid grid-cols-2 gap-1">
                            {(condition as any).buttons.slice(0, 4).map((button: any, btnIndex: number) => (
                              <div key={button.id || btnIndex} className="p-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded text-xs font-medium text-blue-700 dark:text-blue-300 text-center border border-blue-200/50 dark:border-blue-800/30 truncate">
                                {button.text}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {(condition as any).buttons.slice(0, 3).map((button: any, btnIndex: number) => (
                              <div key={button.id || btnIndex} className="flex items-center justify-between p-1.5 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 rounded border border-gray-200/50 dark:border-gray-700/30">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{button.text}</span>
                                {button.action === 'goto' && <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400 text-xs opacity-70 ml-1" title="Переход"></i>}
                                {button.action === 'command' && <i className="fas fa-terminal text-emerald-600 dark:text-emerald-400 text-xs opacity-70 ml-1" title="Команда"></i>}
                                {button.action === 'url' && <i className="fas fa-external-link-alt text-purple-600 dark:text-purple-400 text-xs opacity-70 ml-1" title="Ссылка"></i>}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {(condition as any).buttons.length > ((condition as any).keyboardType === 'inline' ? 4 : 3) && (
                          <div className="text-center">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              +{(condition as any).buttons.length - ((condition as any).keyboardType === 'inline' ? 4 : 3)} еще
                            </span>
                          </div>
                        )}
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
      
      {/* Response Collection Indicator for Keyboard with Button Responses */}
      {node.type === 'keyboard' && (node.data as any).collectUserInput && node.data.buttons && node.data.buttons.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50/90 to-yellow-50/90 dark:from-amber-900/25 dark:to-yellow-900/25 border border-amber-200/50 dark:border-amber-800/40 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center">
                <i className="fas fa-star text-amber-600 dark:text-amber-400 text-sm"></i>
              </div>
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Кнопки как ответы
              </div>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-full font-medium">
              <i className="fas fa-check-circle text-xs mr-1"></i>
              {(node.data as any).inputVariable && `Сохранить в: ${(node.data as any).inputVariable}`}
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            <i className="fas fa-info-circle mr-1"></i>
            Выбор кнопки будет сохранен как ответ пользователя
          </div>
        </div>
      )}
      
      {/* Response Collection Indicator */}
      {(() => {
        const collectUserInput = (node.data as any).collectUserInput;
        const inputVariable = (node.data as any).inputVariable;
        const photoInputVariable = (node.data as any).photoInputVariable;
        const videoInputVariable = (node.data as any).videoInputVariable;
        const audioInputVariable = (node.data as any).audioInputVariable;
        const documentInputVariable = (node.data as any).documentInputVariable;
        const multiSelectVariable = (node.data as any).multiSelectVariable;
        const allowMultipleSelection = (node.data as any).allowMultipleSelection;
        
        // Если это keyboard с collectUserInput и кнопками, это уже показано выше - пропускаем основной блок
        if (node.type === 'keyboard' && collectUserInput && node.data.buttons && node.data.buttons.length > 0) {
          return null;
        }
        
        // Показываем блок если включен collectUserInput или есть переменные для сохранения
        const hasResponseCollection = collectUserInput || inputVariable || photoInputVariable || videoInputVariable || audioInputVariable || documentInputVariable || multiSelectVariable;
        
        if (!hasResponseCollection) return null;
        
        // Проверяем если это узел с кнопками как ответами
        const hasButtonResponses = node.data.buttons && node.data.buttons.length > 0 && collectUserInput;
        
        return (
          <div className="bg-gradient-to-br from-orange-50/90 to-amber-50/90 dark:from-orange-900/25 dark:to-amber-900/25 border border-orange-200/50 dark:border-orange-800/40 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/60 flex items-center justify-center">
                  <i className="fas fa-inbox text-orange-600 dark:text-orange-400 text-sm"></i>
                </div>
                <div className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  Сбор ответов
                </div>
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full font-medium">
                <i className="fas fa-check-circle text-xs mr-1"></i>
                {hasButtonResponses && inputVariable ? `Сохранить в: ${inputVariable}` : 'Включено'}
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Button Responses Info */}
              {hasButtonResponses && (
                <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs">
                    <i className="fas fa-mouse text-amber-600 dark:text-amber-400 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Кнопки как варианты ответа
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                      {inputVariable ? (
                        <>
                          <i className="fas fa-database text-xs"></i>
                          <code className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-amber-700 dark:text-amber-300">{inputVariable}</code>
                        </>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 italic">Переменная не задана</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Text Input */}
              {!hasButtonResponses && inputVariable && (
                <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs">
                    <i className="fas fa-keyboard text-blue-600 dark:text-blue-400 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Текстовый ввод
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                      <i className="fas fa-database text-xs"></i>
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-blue-700 dark:text-blue-300">{inputVariable}</code>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Photo Input */}
              {!hasButtonResponses && photoInputVariable && (
                <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs">
                    <i className="fas fa-image text-purple-600 dark:text-purple-400 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Фото
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                      <i className="fas fa-database text-xs"></i>
                      <code className="bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-purple-700 dark:text-purple-300">{photoInputVariable}</code>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Video Input */}
              {!hasButtonResponses && videoInputVariable && (
                <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs">
                    <i className="fas fa-video text-red-600 dark:text-red-400 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Видео
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                      <i className="fas fa-database text-xs"></i>
                      <code className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-red-700 dark:text-red-300">{videoInputVariable}</code>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Audio Input */}
              {!hasButtonResponses && audioInputVariable && (
                <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs">
                    <i className="fas fa-microphone text-green-600 dark:text-green-400 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Аудио
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                      <i className="fas fa-database text-xs"></i>
                      <code className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-green-700 dark:text-green-300">{audioInputVariable}</code>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Document Input */}
              {!hasButtonResponses && documentInputVariable && (
                <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs">
                    <i className="fas fa-file text-amber-600 dark:text-amber-400 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Документ
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                      <i className="fas fa-database text-xs"></i>
                      <code className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-amber-700 dark:text-amber-300">{documentInputVariable}</code>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Multi-Select Variable */}
              {!hasButtonResponses && multiSelectVariable && allowMultipleSelection && (
                <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs">
                    <i className="fas fa-check-double text-indigo-600 dark:text-indigo-400 text-xs"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Множественный выбор
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
                      <i className="fas fa-database text-xs"></i>
                      <code className="bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-700 dark:text-indigo-300">{multiSelectVariable}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-orange-200/50 dark:border-orange-700/30">
              <div className="flex items-center justify-center space-x-2 text-xs text-orange-600 dark:text-orange-400">
                <i className="fas fa-info-circle"></i>
                <span>Ответы сохраняются в переменных для дальнейшего использования</span>
              </div>
            </div>
          </div>
        );
      })()}
      
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
                          {node.data.buttons.filter((button: any) => button.buttonType === 'option').map((button: any) => (
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
                      </>
                    ) : (
                      /* Regular inline buttons */
                      <div className="grid grid-cols-2 gap-2">
                        {node.data.buttons.map((button: any) => (
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
                    {node.data.buttons.map((button: any) => (
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
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
