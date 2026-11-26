/**
 * @fileoverview Панель листов холста: лента вкладок на широкой колонке и один лист на узкой
 */

import { useSheetAppearance } from '../shared/use-editor-appearance';
import { useState, useRef, useEffect } from 'react';
import { CanvasSheetsCompact } from './canvas-sheets-compact';
import { CanvasSheetsVertical } from './canvas-sheets-vertical';
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
import { cn } from '@/utils/utils';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { generateNextSheetName } from '@/utils/sheets/generate-next-sheet-name';

interface CanvasSheetsProps {
  /** Показывать листы вертикальным списком сбоку. */
  vertical?: boolean;
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
  vertical = false,
  sheets,
  activeSheetId,
  onSheetSelect,
  onSheetAdd,
  onSheetDelete,
  onSheetRename,
  onSheetDuplicate,
  maxVisibleTabs = 8
}: CanvasSheetsProps) {
  const appearance = useSheetAppearance();
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
  }, [activeSheetId, vertical]);

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
    // Генерируем имя нового листа через общую утилиту
    const newSheetName = generateNextSheetName(sheets);
    onSheetAdd(newSheetName);
  };

  if (vertical) {
    return <CanvasSheetsVertical sheets={sheets} activeSheetId={activeSheetId}
      onSheetSelect={onSheetSelect} onAdd={addNewSheet} onSheetDelete={onSheetDelete}
      onSheetRename={onSheetRename} onSheetDuplicate={onSheetDuplicate} />;
  }

  return (
    <div className="@container w-full">
    <CanvasSheetsCompact
      sheets={sheets}
      activeSheetId={activeSheetId}
      onSheetSelect={onSheetSelect}
      onAdd={addNewSheet}
      onSheetDelete={onSheetDelete}
      onSheetRename={onSheetRename}
      onSheetDuplicate={onSheetDuplicate}
    />
    <div className="hidden @[28rem]:flex items-center gap-1 w-full px-2 py-1 bg-background border-t border-border">
      {/* Кнопка прокрутки влево - для мобильных переключает листы */}
      {(canScrollLeft || (isMobile && sheets.length > 1)) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={isMobile ? switchToPrevSheet : scrollLeft}
          className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          disabled={isMobile ? (activeSheetId ? sheets.findIndex(s => s.id === activeSheetId) === 0 : true) : false}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {/* Контейнер вкладок */}
      <div 
        ref={tabsContainerRef}
        className="flex-1 min-w-0 flex overflow-x-auto overflow-y-hidden scroll-smooth relative z-10 items-center scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex gap-2 w-max">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              data-sheet-id={sheet.id}
              className={cn("group flex min-w-0 max-w-72 items-center gap-1 rounded px-1", activeSheetId === sheet.id ? appearance.active : "text-muted-foreground hover:text-foreground")}
            >
              {isRenaming !== sheet.id && (
                <button type="button" aria-current={activeSheetId === sheet.id || undefined}
                  title={sheet.name} onClick={() => onSheetSelect(sheet.id)} onDoubleClick={() => handleRename(sheet.id)}
                  className="flex h-8 min-w-0 items-center gap-1.5 rounded px-1 focus-visible:ring-2 focus-visible:ring-ring">
                  <FileText className={cn("size-4 shrink-0", appearance.icon)} />
                  <span className={cn("truncate text-xs font-medium", activeSheetId === sheet.id && appearance.name)}>{sheet.name}</span>
                </button>
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
              ) : null}

              {/* Отдельные кнопки действий */}
              <div className={`flex items-center transition-all duration-200 gap-1 ${
                isMobile 
                  ? 'ml-1 opacity-100' 
                  : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
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
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
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
          className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          disabled={isMobile ? (activeSheetId ? sheets.findIndex(s => s.id === activeSheetId) === sheets.length - 1 : true) : false}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      {/* Кнопка добавления нового листа */}
      <Button
        variant="ghost"
        size="sm"
        onClick={addNewSheet}
        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
        title="Добавить новый лист"
      >
        <Plus className="h-4 w-4 " />
      </Button>
      {/* Диалог убран - создание листа теперь происходит одним кликом */}
    </div>
    </div>
  );
}
