import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Edit2, 
  Copy, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
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

  const addNewSheet = () => {
    if (newSheetName.trim()) {
      onSheetAdd(newSheetName.trim());
      setNewSheetName('');
      setShowAddDialog(false);
    }
  };

  return (
    <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-1">
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
                "group flex items-center min-w-[150px] max-w-[200px] h-8 px-3 rounded-b-md transition-colors cursor-pointer border-t-2",
                activeSheetId === sheet.id
                  ? "bg-white dark:bg-gray-900 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-700 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600"
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
                <span className="flex-1 text-xs font-medium truncate">
                  {sheet.name}
                </span>
              )}

              {/* Контекстное меню */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleRename(sheet.id)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Переименовать
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSheetDuplicate(sheet.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Дублировать
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onSheetDelete(sheet.id)}
                    className="text-red-600 dark:text-red-400"
                    disabled={sheets.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        onClick={() => setShowAddDialog(true)}
        className="h-8 w-8 p-0 ml-2"
        title="Добавить новый лист"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Диалог создания нового листа */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать новый лист</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название листа"
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addNewSheet();
                if (e.key === 'Escape') setShowAddDialog(false);
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Отмена
            </Button>
            <Button onClick={addNewSheet} disabled={!newSheetName.trim()}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}