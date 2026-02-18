import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Убираем DropdownMenu и Dialog - теперь всё просто
import { 
  Plus, 
  X, 
  Copy, 
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
    <div className="flex items-center gap-3 relative z-50 w-full px-4 py-3 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-600/50 shadow-lg shadow-slate-300/10 dark:shadow-black/20">
      {/* Кнопка прокрутки влево - для мобильных переключает листы */}
      {(canScrollLeft || (isMobile && sheets.length > 1)) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={isMobile ? switchToPrevSheet : scrollLeft}
          className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 disabled:opacity-30"
          disabled={isMobile ? (activeSheetId ? sheets.findIndex(s => s.id === activeSheetId) === 0 : true) : false}
        >
          <ChevronLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </Button>
      )}
      {/* Контейнер вкладок */}
      <div 
        ref={tabsContainerRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden scroll-smooth relative z-10 items-center scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`flex gap-2 w-full`}>
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              data-sheet-id={sheet.id}
              className={cn(
                "group flex items-center cursor-pointer select-none transition-all duration-200",
                "px-3 h-9 rounded-lg gap-2",
                "min-w-max",
                activeSheetId === sheet.id
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50 scale-100"
                  : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/90 border border-slate-300/50 hover:border-slate-400/70 hover:shadow-md dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/90 dark:border-slate-600/50 dark:hover:border-slate-500/70"
              )}
              style={{
                backgroundColor: activeSheetId === sheet.id ? undefined : undefined,
                color: activeSheetId === sheet.id ? 'white' : undefined
              }}
              onClick={() => onSheetSelect(sheet.id)}
            >
              <FileText className={cn(
                "h-4 w-4 flex-shrink-0 transition-all duration-200",
                activeSheetId === sheet.id
                  ? "text-white drop-shadow-sm"
                  : "text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400"
              )} />
              
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
                    "cursor-text transition-all duration-200 whitespace-nowrap",
                    "text-xs font-medium",
                    activeSheetId === sheet.id
                      ? "text-white font-semibold drop-shadow-sm"
                      : "text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white"
                  )}
                  onDoubleClick={() => handleRename(sheet.id)}
                  title={sheet.name}
                >
                  {sheet.name}
                </span>
              )}

              {/* Отдельные кнопки действий */}
              <div className={`flex items-center transition-all duration-200 gap-1 ${
                isMobile 
                  ? 'ml-1 opacity-100' 
                  : 'ml-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-0 rounded-md transition-colors duration-200",
                    "h-5 w-5",
                    activeSheetId === sheet.id
                      ? "hover:bg-white/20 active:bg-white/20 text-white/80 hover:text-white"
                      : "hover:bg-blue-500/20 active:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSheetDuplicate(sheet.id);
                  }}
                  title="Дублировать лист"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                {sheets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "p-0 rounded-md transition-colors duration-200",
                      "h-5 w-5",
                      activeSheetId === sheet.id
                        ? "hover:bg-red-500/20 active:bg-red-500/20 text-red-200 hover:text-white"
                        : "hover:bg-red-500/20 active:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSheetDelete(sheet.id);
                    }}
                    title="Удалить лист"
                  >
                    <X className="h-3 w-3" />
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
          className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-slate-200/60 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/70 border border-slate-300/50 hover:border-slate-400/70 dark:border-slate-600/50 dark:hover:border-slate-500/70 transition-colors duration-200 disabled:opacity-30"
          disabled={isMobile ? (activeSheetId ? sheets.findIndex(s => s.id === activeSheetId) === sheets.length - 1 : true) : false}
        >
          <ChevronRight className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        </Button>
      )}
      {/* Кнопка добавления нового листа */}
      <Button
        variant="ghost"
        size="sm"
        onClick={addNewSheet}
        className="flex-shrink-0 p-0 h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-600/20 hover:from-emerald-500/30 hover:to-green-600/30 active:from-emerald-500/40 active:to-green-600/40 transition-colors duration-200 hover:shadow-lg hover:shadow-emerald-500/30 border border-emerald-500/30 hover:border-emerald-400/50"
        title="Добавить новый лист"
      >
        <Plus className="h-4 w-4 text-emerald-400 drop-shadow-sm" />
      </Button>
      {/* Диалог убран - создание листа теперь происходит одним кликом */}
    </div>
  );
}