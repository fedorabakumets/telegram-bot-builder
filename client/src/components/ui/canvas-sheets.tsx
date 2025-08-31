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
        left: newPosition * 160, // 160px per tab
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
        left: newPosition * 160,
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
    <div className="flex items-center bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-600 px-2 py-0 shadow-lg">
      {/* Кнопка прокрутки влево */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollLeft}
          className="h-8 w-8 p-0 mr-1"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Контейнер вкладок */}
      <div 
        ref={tabsContainerRef}
        className="flex-1 flex overflow-x-hidden scroll-smooth"
        style={{ maxWidth: `${maxVisibleTabs * 160}px` }}
      >
        <div className="flex gap-1">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              data-sheet-id={sheet.id}
              className={cn(
                "group flex items-center min-w-[150px] max-w-[200px] h-8 px-3 cursor-pointer border border-gray-300 dark:border-gray-600 transition-all duration-200",
                activeSheetId === sheet.id
                  ? "bg-white dark:bg-gray-900 border-blue-500 text-blue-600 dark:text-blue-400 border-t-2 border-b-0 rounded-t-md -mb-px z-10 shadow-sm"
                  : "bg-gray-50 dark:bg-gray-800 border-b-gray-300 dark:border-b-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md"
              )}
              onClick={() => onSheetSelect(sheet.id)}
            >
              <FileText className="h-3 w-3 mr-2 opacity-60" />
              
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
                  className="flex-1 text-xs font-medium truncate cursor-text"
                  onDoubleClick={() => handleRename(sheet.id)}
                  title="Двойной клик для переименования"
                >
                  {sheet.name}
                </span>
              )}

              {/* Отдельные кнопки действий */}
              <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSheetDuplicate(sheet.id);
                  }}
                  title="Дублировать лист"
                >
                  <Copy className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </Button>
                
                {sheets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-red-100 dark:hover:bg-red-900/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSheetDelete(sheet.id);
                    }}
                    title="Удалить лист"
                  >
                    <X className="h-3 w-3 text-red-600 dark:text-red-400" />
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
          className="h-8 w-8 p-0 ml-1"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Кнопка добавления нового листа */}
      <Button
        variant="ghost"
        size="sm"
        onClick={addNewSheet}
        className="h-8 w-8 p-0 ml-2"
        title="Добавить новый лист"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Диалог убран - создание листа теперь происходит одним кликом */}
    </div>
  );
}