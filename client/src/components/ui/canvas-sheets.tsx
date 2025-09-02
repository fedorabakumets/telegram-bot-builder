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
  // Убираем состояние диалога - теперь создаём листы сразу
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-xl relative transition-all duration-300 hover:shadow-2xl">
      {/* Градиентная подложка */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 rounded-lg pointer-events-none"></div>
      {/* Кнопка прокрутки влево */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollLeft}
          className="h-8 w-8 p-0 mr-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 dark:from-blue-400/10 dark:to-blue-500/10 dark:hover:from-blue-400/20 dark:hover:to-blue-500/20 transition-all duration-200 hover:scale-110 relative z-10"
        >
          <ChevronLeft className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </Button>
      )}

      {/* Контейнер вкладок */}
      <div 
        ref={tabsContainerRef}
        className="flex-1 flex overflow-x-hidden scroll-smooth relative z-10"
        style={{ maxWidth: `min(${maxVisibleTabs * 170}px, calc(100vw - 320px))` }}
      >
        <div className="flex gap-2">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              data-sheet-id={sheet.id}
              className={cn(
                "group flex items-center min-w-[140px] max-w-[200px] h-10 px-3 cursor-pointer transition-all duration-300 relative backdrop-blur-sm transform hover:scale-[1.02] select-none",
                activeSheetId === sheet.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 rounded-lg z-20 ring-2 ring-blue-300/50 dark:ring-blue-600/50"
                  : "bg-white/70 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-slate-700/90 rounded-lg shadow-sm hover:shadow-md border border-gray-200/50 dark:border-slate-600/50"
              )}
              onClick={() => onSheetSelect(sheet.id)}
            >
              <FileText className={cn(
                "h-4 w-4 mr-3 transition-all duration-200",
                activeSheetId === sheet.id
                  ? "text-white/90 drop-shadow-sm"
                  : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
              )} />
              
              {isRenaming === sheet.id ? (
                <Input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={confirmRename}
                  className="h-6 text-xs px-1 py-0 bg-transparent border-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span 
                  className={cn(
                    "flex-1 text-sm font-semibold cursor-text transition-all duration-200",
                    activeSheetId === sheet.id
                      ? "text-white drop-shadow-sm"
                      : "text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  )}
                  onDoubleClick={() => handleRename(sheet.id)}
                  title="Двойной клик для переименования"
                >
                  {sheet.name}
                </span>
              )}

              {/* Отдельные кнопки действий */}
              <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-6 w-6 p-0 rounded-full transition-all duration-200 hover:scale-110",
                    activeSheetId === sheet.id
                      ? "hover:bg-white/20 text-white/80 hover:text-white"
                      : "hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
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
                      "h-6 w-6 p-0 ml-1 rounded-full transition-all duration-200 hover:scale-110",
                      activeSheetId === sheet.id
                        ? "hover:bg-red-500/20 text-red-200 hover:text-white"
                        : "hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
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

      {/* Кнопка прокрутки вправо */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollRight}
          className="h-8 w-8 p-0 ml-2 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 dark:from-blue-400/10 dark:to-blue-500/10 dark:hover:from-blue-400/20 dark:hover:to-blue-500/20 transition-all duration-200 hover:scale-110 relative z-10"
        >
          <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </Button>
      )}

      {/* Кнопка добавления нового листа */}
      <Button
        variant="ghost"
        size="sm"
        onClick={addNewSheet}
        className="h-9 w-9 p-0 ml-3 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-600/10 hover:from-green-500/20 hover:to-emerald-600/20 dark:from-green-400/10 dark:to-emerald-500/10 dark:hover:from-green-400/20 dark:hover:to-emerald-500/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/20 relative z-10 ring-2 ring-transparent hover:ring-green-300/30 dark:hover:ring-green-600/30"
        title="Добавить новый лист"
      >
        <Plus className="h-5 w-5 text-green-600 dark:text-green-400 drop-shadow-sm" />
      </Button>

      {/* Диалог убран - создание листа теперь происходит одним кликом */}
    </div>
  );
}