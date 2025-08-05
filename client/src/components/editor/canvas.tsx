import { useRef, useCallback, useState, useEffect } from 'react';
import { CanvasNode } from '@/components/ui/canvas-node';
import { ConnectionsLayer } from '@/components/ui/connections-layer';
import { TemporaryConnection } from '@/components/ui/temporary-connection';
import { ConnectionSuggestions } from '@/components/ui/connection-suggestions';
import { AutoConnectionPanel } from '@/components/ui/auto-connection-panel';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Node, ComponentDefinition, Connection } from '@/types/bot';
import { generateAutoConnections } from '@/utils/auto-connection';
import { ConnectionManager } from '@/utils/connection-manager';
import { nanoid } from 'nanoid';

interface CanvasProps {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId: string | null;
  selectedConnectionId?: string;
  onNodeSelect: (nodeId: string) => void;
  onNodeAdd: (node: Node) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onConnectionSelect?: (connectionId: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
  onConnectionAdd?: (connection: Connection) => void;
  onNodesUpdate?: (nodes: Node[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  onFullscreen?: () => void;
}

export function Canvas({ 
  nodes, 
  connections,
  selectedNodeId,
  selectedConnectionId,
  onNodeSelect, 
  onNodeAdd, 
  onNodeDelete,
  onNodeMove,
  onConnectionSelect,
  onConnectionDelete,
  onConnectionAdd,
  onNodesUpdate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  isSaving,
  onFullscreen
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    handle: 'source' | 'target';
  } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoButtonCreation, setAutoButtonCreation] = useState(true);
  const [showAutoPanel, setShowAutoPanel] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  // Zoom utility functions
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  const setZoomLevel = useCallback((level: number) => {
    setZoom(Math.max(Math.min(level, 200), 25));
  }, []);

  const fitToContent = useCallback(() => {
    if (nodes.length === 0) return;
    
    const nodeBounds = nodes.reduce((bounds, node) => {
      const left = node.position.x;
      const right = node.position.x + 320; // Approximate node width
      const top = node.position.y;
      const bottom = node.position.y + 100; // Approximate node height
      
      return {
        left: Math.min(bounds.left, left),
        right: Math.max(bounds.right, right),
        top: Math.min(bounds.top, top),
        bottom: Math.max(bounds.bottom, bottom)
      };
    }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
    
    const contentWidth = nodeBounds.right - nodeBounds.left;
    const contentHeight = nodeBounds.bottom - nodeBounds.top;
    
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.clientWidth;
      const containerHeight = canvasRef.current.clientHeight;
      
      const scaleX = (containerWidth * 0.8) / contentWidth;
      const scaleY = (containerHeight * 0.8) / contentHeight;
      const scale = Math.min(scaleX, scaleY, 2); // Max 200% zoom
      
      const newZoom = Math.max(Math.min(scale * 100, 200), 25);
      setZoom(newZoom);
      
      // Center the content
      const centerX = (nodeBounds.left + nodeBounds.right) / 2;
      const centerY = (nodeBounds.top + nodeBounds.bottom) / 2;
      const containerCenterX = containerWidth / 2;
      const containerCenterY = containerHeight / 2;
      
      setPan({
        x: containerCenterX - centerX * (newZoom / 100),
        y: containerCenterY - centerY * (newZoom / 100)
      });
    }
  }, [nodes]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY;
      const zoomFactor = delta > 0 ? 0.9 : 1.1;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const newZoom = Math.max(Math.min(zoom * zoomFactor, 200), 25);
        const zoomRatio = newZoom / zoom;
        
        setPan(prev => ({
          x: mouseX - (mouseX - prev.x) * zoomRatio,
          y: mouseY - (mouseY - prev.y) * zoomRatio
        }));
        
        setZoom(newZoom);
      }
    }
  }, [zoom]);

  // Handle panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if click is on empty canvas (not on a node)
    const target = e.target as HTMLElement;
    const isEmptyCanvas = target.classList.contains('canvas-grid-modern') || 
                          target.closest('.canvas-grid-modern') === target;
    
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey) || 
        (e.button === 0 && isEmptyCanvas)) { // Middle mouse, right mouse, Alt+click, or left-click on empty canvas
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setLastPanPosition(pan);
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      setPan({
        x: lastPanPosition.x + deltaX,
        y: lastPanPosition.y + deltaY
      });
    }
  }, [isPanning, panStart, lastPanPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Prevent context menu on right-click when using for panning
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
          case '1':
            e.preventDefault();
            fitToContent();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey && onRedo && canRedo) {
              onRedo();
            } else if (onUndo && canUndo) {
              onUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            if (onRedo && canRedo) {
              onRedo();
            }
            break;
          case 's':
            e.preventDefault();
            if (onSave && !isSaving) {
              onSave();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom, fitToContent, onUndo, onRedo, canUndo, canRedo, onSave, isSaving]);



  // Handle mouse events for panning
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        
        setPan({
          x: lastPanPosition.x + deltaX,
          y: lastPanPosition.y + deltaY
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, panStart, lastPanPosition]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const componentData = e.dataTransfer.getData('application/json');
    if (!componentData) return;
    
    const component: ComponentDefinition = JSON.parse(componentData);
    const rect = canvasRef.current?.getBoundingClientRect();
    
    if (rect) {
      // Transform screen coordinates to canvas coordinates
      const screenX = e.clientX - rect.left - 160; // Adjust for node width
      const screenY = e.clientY - rect.top - 50;   // Adjust for node height
      
      // Apply inverse transformation to get canvas coordinates
      const canvasX = (screenX - pan.x) / (zoom / 100);
      const canvasY = (screenY - pan.y) / (zoom / 100);
      
      const newNode: Node = {
        id: nanoid(),
        type: component.type,
        position: { x: Math.max(0, canvasX), y: Math.max(0, canvasY) },
        data: {
          keyboardType: 'none',
          buttons: [],
          oneTimeKeyboard: false,
          resizeKeyboard: true,
          markdown: false,
          ...component.defaultData
        }
      };
      
      onNodeAdd(newNode);
    }
  }, [onNodeAdd, pan, zoom]);

  // Обработчик canvas-drop события для touch устройств  
  const handleCanvasDrop = useCallback((e: CustomEvent) => {
    const { component, position } = e.detail;
    
    // Transform screen coordinates to canvas coordinates
    const canvasX = (position.x - pan.x) / (zoom / 100);
    const canvasY = (position.y - pan.y) / (zoom / 100);
    
    const newNode: Node = {
      id: nanoid(),
      type: component.type,
      position: { x: Math.max(0, canvasX - 80), y: Math.max(0, canvasY - 25) }, // Center the node
      data: {
        keyboardType: 'none',
        buttons: [],
        oneTimeKeyboard: false,
        resizeKeyboard: true,
        markdown: false,
        ...component.defaultData
      }
    };
    
    onNodeAdd(newNode);
  }, [onNodeAdd, pan, zoom]);

  // Handle canvas-drop событие для touch устройств
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('canvas-drop', handleCanvasDrop as EventListener);
      return () => canvasElement.removeEventListener('canvas-drop', handleCanvasDrop as EventListener);
    }
  }, [handleCanvasDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect('');
      onConnectionSelect?.('');
      setConnectionStart(null);
    }
  }, [onNodeSelect, onConnectionSelect]);

  // Отслеживание движения мыши для предварительного просмотра соединения
  useEffect(() => {
    if (!connectionStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectionStart(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectionStart]);

  const handleConnectionStart = useCallback((nodeId: string, handle: 'source' | 'target') => {
    if (connectionStart) {
      // Если уже есть начало соединения, пытаемся завершить его
      if (connectionStart.nodeId !== nodeId) {
        const sourceId = connectionStart.handle === 'source' ? connectionStart.nodeId : nodeId;
        const targetId = connectionStart.handle === 'source' ? nodeId : connectionStart.nodeId;
        
        // Используем ConnectionManager для создания соединения
        const connectionManager = new ConnectionManager({
          nodes,
          connections,
          autoButtonCreation
        });
        
        try {
          const { connection, updatedNodes } = connectionManager.createConnection(sourceId, targetId, {
            autoCreateButton: autoButtonCreation
          });
          
          onConnectionAdd?.(connection);
          if (onNodesUpdate) {
            onNodesUpdate(updatedNodes);
          }
        } catch (error) {
          console.error('Ошибка при создании соединения:', error);
        }
      }
      setConnectionStart(null);
    } else {
      // Начинаем новое соединение
      setConnectionStart({ nodeId, handle });
    }
  }, [connectionStart, onConnectionAdd, onNodesUpdate, nodes, connections, autoButtonCreation]);

  const handleCreateSuggestedConnection = useCallback((source: string, target: string) => {
    const newConnection: Connection = {
      id: nanoid(),
      source,
      target,
    };
    onConnectionAdd?.(newConnection);
    setShowSuggestions(false);
  }, [onConnectionAdd]);

  const handleAutoConnect = useCallback(() => {
    const suggestions = generateAutoConnections(nodes, connections);
    const bestSuggestion = suggestions.find(s => s.confidence > 0.8);
    
    if (bestSuggestion) {
      handleCreateSuggestedConnection(bestSuggestion.source, bestSuggestion.target);
    } else {
      setShowSuggestions(true);
    }
  }, [nodes, connections, handleCreateSuggestedConnection]);

  return (
    <main className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      <div className="absolute inset-0 overflow-auto p-8">
        {/* Enhanced Canvas Controls */}
        <div className="absolute top-6 left-6 flex items-center space-x-3 z-10 canvas-controls">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 dark:border-slate-700/50 flex items-center overflow-hidden zoom-controls">
            <button 
              onClick={zoomOut}
              disabled={zoom <= 25}
              className="px-3 py-2 zoom-button disabled:opacity-50 disabled:cursor-not-allowed"
              title="Уменьшить масштаб (Ctrl + -)"
            >
              <i className="fas fa-search-minus text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-x border-gray-200 dark:border-slate-700 font-mono min-w-[4rem] text-center bg-gray-50 dark:bg-slate-800/50 zoom-indicator group"
                  title="Выбрать масштаб"
                >
                  <span className="flex items-center space-x-1">
                    <span>{Math.round(zoom)}%</span>
                    <i className="fas fa-chevron-down text-xs opacity-50 group-hover:opacity-100 transition-opacity"></i>
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" className="w-40 p-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2 py-1">Быстрый масштаб</div>
                  {[25, 50, 75, 100, 125, 150, 200].map((level) => (
                    <button
                      key={level}
                      onClick={() => setZoomLevel(level)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                        Math.abs(zoom - level) < 1 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{level}%</span>
                        {level === 100 && <span className="text-xs opacity-60">По умолчанию</span>}
                        {level === 200 && <span className="text-xs opacity-60">Максимум</span>}
                        {level === 25 && <span className="text-xs opacity-60">Минимум</span>}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 dark:border-slate-600 my-1"></div>
                  <button
                    onClick={resetZoom}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
                  >
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-home text-xs"></i>
                      <span>Сбросить вид</span>
                    </div>
                  </button>
                  <button
                    onClick={fitToContent}
                    disabled={nodes.length === 0}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-green-600 dark:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-expand-arrows-alt text-xs"></i>
                      <span>Уместить всё</span>
                    </div>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <button 
              onClick={zoomIn}
              disabled={zoom >= 200}
              className="px-3 py-2 zoom-button disabled:opacity-50 disabled:cursor-not-allowed"
              title="Увеличить масштаб (Ctrl + +)"
            >
              <i className="fas fa-search-plus text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={fitToContent}
              disabled={nodes.length === 0}
              className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Уместить в экран (Ctrl + 1)"
            >
              <i className="fas fa-expand-arrows-alt text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>

            {onFullscreen && (
              <button 
                onClick={onFullscreen}
                className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group"
                title="Полноэкранный режим (F11)"
              >
                <i className="fas fa-expand text-gray-600 dark:text-gray-400 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"></i>
              </button>
            )}

            <button 
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Отменить действие (Ctrl + Z)"
            >
              <i className="fas fa-undo text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>

            <button 
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Повторить действие (Ctrl + Y)"
            >
              <i className="fas fa-redo text-gray-600 dark:text-gray-400 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"></i>
            </button>

            {onSave && (
              <button 
                onClick={onSave}
                disabled={isSaving}
                className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Сохранить проект (Ctrl + S)"
              >
                {isSaving ? (
                  <i className="fas fa-spinner fa-spin text-gray-600 dark:text-gray-400 text-sm"></i>
                ) : (
                  <i className="fas fa-save text-gray-600 dark:text-gray-400 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"></i>
                )}
              </button>
            )}
          </div>
          
          {/* Zoom Info and Help */}
          <div className="flex items-center space-x-2">
            {zoom !== 100 && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-info-circle text-blue-500"></i>
                  <span>
                    {zoom > 100 ? 'Увеличено' : 'Уменьшено'} до {Math.round(zoom)}%
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span>Ctrl+0 для сброса</span>
                </div>
              </div>
            )}
            
            {/* Zoom Help */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 group">
                  <i className="fas fa-question-circle text-gray-500 dark:text-gray-400 text-sm group-hover:text-blue-500 transition-colors"></i>
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" className="w-64 p-3">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Управление масштабом</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Увеличить:</span>
                      <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + +</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Уменьшить:</span>
                      <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + -</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Сбросить:</span>
                      <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + 0</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Уместить всё:</span>
                      <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + 1</code>
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-600 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Масштабирование:</span>
                        <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + колесо</code>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600 dark:text-gray-400">Панорамирование:</span>
                        <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Alt + ЛКМ</code>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Enhanced Canvas Grid */}
        <div 
          ref={canvasRef}
          className="min-h-full relative canvas-grid-modern"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0),
              linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${24 * zoom / 100}px ${24 * zoom / 100}px, ${24 * zoom / 100}px ${24 * zoom / 100}px, ${24 * zoom / 100}px ${24 * zoom / 100}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            minHeight: '100vh',
            minWidth: '100%',
            cursor: isPanning ? 'grabbing' : 'grab'
          }}
          data-drag-over={isDragOver}
          data-canvas-drop-zone
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          {/* Transformable Canvas Content */}
          <div 
            className="relative origin-top-left transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Connections Layer */}
            <ConnectionsLayer
              connections={connections}
              nodes={nodes}
              selectedConnectionId={selectedConnectionId}
              onConnectionSelect={onConnectionSelect}
              onConnectionDelete={onConnectionDelete}
            />

            {/* Temporary connection preview */}
            {connectionStart && (
              <TemporaryConnection
                startNode={nodes.find(n => n.id === connectionStart.nodeId)!}
                endPosition={{
                  x: (mousePosition.x - pan.x) / (zoom / 100),
                  y: (mousePosition.y - pan.y) / (zoom / 100)
                }}
                handle={connectionStart.handle}
              />
            )}
            
            {/* Nodes */}
            {nodes.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => onNodeSelect(node.id)}
                onDelete={() => onNodeDelete(node.id)}
                onMove={(position) => onNodeMove(node.id, position)}
                onConnectionStart={handleConnectionStart}
                connectionStart={connectionStart}
                zoom={zoom}
                pan={pan}
              />
            ))}
          </div>
          
          {/* Drop Zone Hint */}
          {nodes.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 p-10 w-96 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-200 dark:border-blue-800">
                <i className="fas fa-plus text-blue-600 dark:text-blue-400 text-2xl"></i>
              </div>
              <h3 className="text-gray-800 dark:text-gray-200 mb-3 font-semibold text-lg">Перетащите элемент сюда</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Выберите компонент из левой панели и перетащите на холст для создания бота</p>
            </div>
          )}

          {/* Smart Connection Tools */}
          {nodes.length > 1 && (
            <div className="absolute bottom-6 right-6 flex flex-col space-y-3 z-10">
              {/* Auto Connection Panel */}
              <Popover open={showAutoPanel} onOpenChange={setShowAutoPanel}>
                <PopoverTrigger asChild>
                  <Button
                    className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    title="Управление автосоединениями"
                  >
                    <i className="fas fa-magic text-white" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-auto p-0">
                  <AutoConnectionPanel
                    nodes={nodes}
                    connections={connections}
                    onConnectionAdd={(connection) => onConnectionAdd?.(connection)}
                    onNodesUpdate={(updatedNodes) => onNodesUpdate?.(updatedNodes)}
                    autoButtonCreation={autoButtonCreation}
                    onAutoButtonCreationChange={setAutoButtonCreation}
                  />
                </PopoverContent>
              </Popover>

              {/* Auto-connect button */}
              <Button
                onClick={handleAutoConnect}
                className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                title="Быстрое автосоединение"
              >
                <i className="fas fa-bolt text-white" />
              </Button>

              {/* Connection suggestions */}
              <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
                    title="Рекомендации соединений"
                  >
                    <i className="fas fa-lightbulb text-yellow-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="w-80 p-0">
                  <ConnectionSuggestions
                    nodes={nodes}
                    connections={connections}
                    onCreateConnection={handleCreateSuggestedConnection}
                  />
                </PopoverContent>
              </Popover>

              {/* Clear connections button */}
              {connections.length > 0 && (
                <Button
                  onClick={() => {
                    connections.forEach(conn => onConnectionDelete?.(conn.id));
                  }}
                  variant="outline"
                  className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Очистить все соединения"
                >
                  <i className="fas fa-eraser text-red-500" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
