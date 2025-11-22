import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Убираем DropdownMenu и Dialog - теперь всё просто
import { 
  Plus, 
  X, 
  Copy, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  FileText
} from 'lucide-react';
import { CanvasSheet } from '@shared/schema';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CanvasSheetsProps {
  sheets: CanvasSheet[];
  activeSheetId: string | null;
  onSheetSelect: (sheetId: string) => void;
  onSheetAdd: (name: string) => void;
  onSheetDelete: (sheetId: string) => void;
  onSheetRename: (sheetId: string, newName: string) => void;
  onSheetDuplicate: (sheetId: string) => void;
  maxVisibleTabs?: number;
}

export function CanvasSheets({
  sheets,
  activeSheetId,
  onSheetSelect,
  onSheetAdd,
  onSheetDelete,
  onSheetRename,
  onSheetDuplicate,
  maxVisibleTabs = 8
}: CanvasSheetsProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  // Состояния для обработки свайп-жестов
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Убираем состояние диалога - теперь создаём листы сразу
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Автофокус при начале переименования
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Прокрутка к активной вкладке
  useEffect(() => {
    if (activeSheetId && tabsContainerRef.current) {
      const activeTab = tabsContainerRef.current.querySelector(`[data-sheet-id="${activeSheetId}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSheetId]);

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = sheets.length > maxVisibleTabs;

  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      const newPosition = Math.max(0, scrollPosition - 1);
      setScrollPosition(newPosition);
      tabsContainerRef.current.scrollTo({
        left: newPosition * 150, // 150px per tab
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (tabsContainerRef.current) {
      const maxScroll = Math.max(0, sheets.length - maxVisibleTabs);
      const newPosition = Math.min(maxScroll, scrollPosition + 1);
      setScrollPosition(newPosition);
      tabsContainerRef.current.scrollTo({
        left: newPosition * 150,
        behavior: 'smooth'
      });
    }
  };

  const handleRename = (sheetId: string) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet) {
      setNewName(sheet.name);
      setIsRenaming(sheetId);
    }
  };

  const confirmRename = () => {
    if (isRenaming && newName.trim()) {
      onSheetRename(isRenaming, newName.trim());
      setIsRenaming(null);
      setNewName('');
    }
  };

  const cancelRename = () => {
    setIsRenaming(null);
    setNewName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmRename();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  // Минимальное расстояние свайпа для активации
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      if (!activeSheetId) return;
      
      const currentIndex = sheets.findIndex(sheet => sheet.id === activeSheetId);
      if (currentIndex === -1) return;

      if (isLeftSwipe && currentIndex < sheets.length - 1) {
        // Свайп влево - следующий лист
        onSheetSelect(sheets[currentIndex + 1].id);
      } else if (isRightSwipe && currentIndex > 0) {
        // Свайп вправо - предыдущий лист  
        onSheetSelect(sheets[currentIndex - 1].id);
      }
    }
  };

  // Быстрое переключение между листами для мобильных
  const switchToNextSheet = () => {
    if (!activeSheetId) return;
    const currentIndex = sheets.findIndex(sheet => sheet.id === activeSheetId);
    if (currentIndex < sheets.length - 1) {
      onSheetSelect(sheets[currentIndex + 1].id);
    }
  };

  const switchToPrevSheet = () => {
    if (!activeSheetId) return;
    const currentIndex = sheets.findIndex(sheet => sheet.id === activeSheetId);
    if (currentIndex > 0) {
      onSheetSelect(sheets[currentIndex - 1].id);
    }
  };

  // Создание листа одним кликом с автоматическим именем
  const addNewSheet = () => {
    // Генерируем имя нового листа
    const existingNumbers = sheets
      .map(sheet => {
        const match = sheet.name.match(/^Лист (\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : sheets.length + 1;
    const newSheetName = `Лист ${nextNumber}`;
    
    onSheetAdd(newSheetName);
  };

  return (
    <div className={`flex items-center justify-start gap-2 relative transition-all duration-300 z-50 ${isMobile ? 'px-3 py-3' : 'px-3 py-3'}`}>
      {/* Кнопка прокрутки влево - для мобильных переключает листы */}
      {(canScrollLeft || (isMobile && sheets.length > 1)) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={isMobile ? switchToPrevSheet : scrollLeft}
          className={`flex-shrink-0 p-0 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 active:from-blue-500/30 active:to-blue-600/30 dark:from-blue-400/10 dark:to-blue-500/10 dark:hover:from-blue-400/20 dark:hover:to-blue-500/20 dark:active:from-blue-400/30 dark:active:to-blue-500/30 transition-all duration-200 hover:scale-110 active:scale-95 relative z-10 touch-manipulation ${isMobile ? 'h-11 w-11' : 'h-10 w-10'}`}
          disabled={isMobile ? (activeSheetId ? sheets.findIndex(s => s.id === activeSheetId) === 0 : true) : false}
        >
          <ChevronLeft className={`text-blue-600 dark:text-blue-400 ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
        </Button>
      )}

      {/* Контейнер вкладок */}
      <div 
        ref={tabsContainerRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden scroll-smooth relative z-10 justify-start items-center min-w-0"
        style={{ 
          minWidth: '0'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`flex flex-shrink-0 ${isMobile ? 'gap-1.5' : 'gap-1.5'}`}>
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              data-sheet-id={sheet.id}
              className={cn(
                "group flex items-center cursor-pointer transition-all duration-300 relative backdrop-blur-sm select-none touch-manipulation",
                isMobile 
                  ? "min-w-[90px] max-w-none min-h-[40px] h-10 px-3 active:scale-[0.98] rounded-lg" 
                  : "min-w-[100px] max-w-none h-10 px-3 transform hover:scale-[1.02] rounded-lg",
                activeSheetId === sheet.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 z-20 ring-2 ring-blue-300/50 dark:ring-blue-600/50"
                  : "bg-white/70 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-slate-700/90 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-slate-600/50"
              )}
              onClick={() => onSheetSelect(sheet.id)}
            >
              {!isMobile && (
                <FileText className={cn(
                  "h-3 w-3 mr-1.5 transition-all duration-200",
                  activeSheetId === sheet.id
                    ? "text-white/90 drop-shadow-sm"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                )} />
              )}
              
              {isRenaming === sheet.id ? (
                <Input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={confirmRename}
                  className={`bg-transparent border-none focus:ring-1 focus:ring-blue-500 ${
                    isMobile ? 'h-7 text-sm px-2 py-1' : 'h-6 text-xs px-1 py-0'
                  }`}
                />
              ) : (
                <span 
                  className={cn(
                    "flex-1 cursor-text transition-all duration-200 whitespace-nowrap",
                    isMobile 
                      ? "text-xs font-semibold" 
                      : "text-xs font-semibold",
                    activeSheetId === sheet.id
                      ? "text-white drop-shadow-sm"
                      : "text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  )}
                  onDoubleClick={() => handleRename(sheet.id)}
                  title={isMobile ? sheet.name : "Двойной клик для переименования"}
                >
                  {sheet.name}
                </span>
              )}

              {/* Отдельные кнопки действий */}
              <div className={`flex items-center transition-all duration-200 gap-0.5 ${
                isMobile 
                  ? 'ml-1 opacity-90' 
                  : 'ml-1 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0'
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-0 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation",
                    isMobile ? "h-7 w-7" : "h-5 w-5",
                    activeSheetId === sheet.id
                      ? "hover:bg-white/20 active:bg-white/30 text-white/90 hover:text-white"
                      : "hover:bg-blue-100 active:bg-blue-200 dark:hover:bg-blue-900/50 dark:active:bg-blue-800/50 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSheetDuplicate(sheet.id);
                  }}
                  title="Дублировать лист"
                >
                  <Copy className={isMobile ? "h-3.5 w-3.5" : "h-3 w-3"} />
                </Button>
                
                {sheets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "p-0 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation",
                      isMobile ? "h-7 w-7" : "h-5 w-5",
                      activeSheetId === sheet.id
                        ? "hover:bg-red-500/20 active:bg-red-500/30 text-red-200 hover:text-white"
                        : "hover:bg-red-100 active:bg-red-200 dark:hover:bg-red-900/50 dark:active:bg-red-800/50 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSheetDelete(sheet.id);
                    }}
                    title="Удалить лист"
                  >
                    <X className={isMobile ? "h-3.5 w-3.5" : "h-3 w-3"} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка прокрутки вправо - для мобильных переключает листы */}
      {(canScrollRight || (isMobile && sheets.length > 1)) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={isMobile ? switchToNextSheet : scrollRight}
          className={`flex-shrink-0 p-0 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 active:from-blue-500/30 active:to-blue-600/30 dark:from-blue-400/10 dark:to-blue-500/10 dark:hover:from-blue-400/20 dark:hover:to-blue-500/20 dark:active:from-blue-400/30 dark:active:to-blue-500/30 transition-all duration-200 hover:scale-110 active:scale-95 relative z-10 touch-manipulation ${isMobile ? 'h-11 w-11' : 'h-10 w-10'}`}
          disabled={isMobile ? (activeSheetId ? sheets.findIndex(s => s.id === activeSheetId) === sheets.length - 1 : true) : false}
        >
          <ChevronRight className={`text-blue-600 dark:text-blue-400 ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
        </Button>
      )}

      {/* Кнопка добавления нового листа */}
      <Button
        variant="ghost"
        size="sm"
        onClick={addNewSheet}
        className={`flex-shrink-0 p-0 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-600/10 hover:from-green-500/20 hover:to-emerald-600/20 active:from-green-500/30 active:to-emerald-600/30 dark:from-green-400/10 dark:to-emerald-500/10 dark:hover:from-green-400/20 dark:hover:to-emerald-500/20 dark:active:from-green-400/30 dark:active:to-emerald-500/30 transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-green-500/20 active:shadow-green-500/30 relative z-10 ring-2 ring-transparent hover:ring-green-300/30 dark:hover:ring-green-600/30 touch-manipulation ${isMobile ? 'h-11 w-11' : 'h-10 w-10'}`}
        title="Добавить новый лист"
      >
        <Plus className={`text-green-600 dark:text-green-400 drop-shadow-sm ${isMobile ? 'h-5 w-5' : 'h-5 w-5'}`} />
      </Button>

      {/* Диалог убран - создание листа теперь происходит одним кликом */}
    </div>
  );
}