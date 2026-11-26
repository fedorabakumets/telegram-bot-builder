/**
 * @fileoverview Узкая панель листов: один активный лист, стрелки и меню действий
 */

import { useSheetAppearance } from '../shared/use-editor-appearance';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CanvasSheet } from '@shared/schema';
import { CanvasSheetMenu } from './canvas-sheet-menu';
import { CanvasSheetName } from './canvas-sheet-name';

/** Свойства узкой панели листов */
interface CanvasSheetsCompactProps {
  /** Листы текущего проекта */
  sheets: CanvasSheet[];
  /** Идентификатор активного листа */
  activeSheetId: string | null;
  /** Переключить активный лист */
  onSheetSelect: (sheetId: string) => void;
  /** Создать лист со следующим именем */
  onAdd: () => void;
  /** Удалить лист */
  onSheetDelete: (sheetId: string) => void;
  /** Переименовать лист */
  onSheetRename: (sheetId: string, newName: string) => void;
  /** Дублировать лист */
  onSheetDuplicate: (sheetId: string) => void;
}

/**
 * Панель листов для узкой колонки: видно только текущее имя.
 * @param props - Свойства панели
 * @returns Разметка узкой панели
 */
export function CanvasSheetsCompact({
  sheets,
  activeSheetId,
  onSheetSelect,
  onAdd,
  onSheetDelete,
  onSheetRename,
  onSheetDuplicate,
}: CanvasSheetsCompactProps) {
  const appearance = useSheetAppearance();
  const [draft, setDraft] = useState<string | null>(null);
  const swipeStart = useRef<number | null>(null);
  const active = sheets.find((sheet) => sheet.id === activeSheetId) ?? sheets[0];
  const index = active ? sheets.findIndex((sheet) => sheet.id === active.id) : -1;

  /**
   * Переключает лист на соседний
   * @param delta - -1 предыдущий, 1 следующий
   */
  const selectRelative = (delta: number) => {
    const next = sheets[index + delta];
    if (next) onSheetSelect(next.id);
  };

  /**
   * Сохраняет новое имя и закрывает поле
   */
  const confirmRename = () => {
    if (active && draft?.trim()) onSheetRename(active.id, draft.trim());
    setDraft(null);
  };

  return (
    <div className="flex @[28rem]:hidden items-center gap-1 w-full px-2 py-1 bg-background border-t border-border">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
        disabled={index <= 0}
        onClick={() => selectRelative(-1)}
        title="Предыдущий лист"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div
        className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 h-8 ${appearance.active} [&_.sheet-name-marquee]:decoration-2 [&_.sheet-name-marquee]:underline-offset-4 ${appearance.name ? "[&_.sheet-name-marquee]:underline" : ""}`}
        onDoubleClick={() => active && setDraft(active.name)}
        onTouchStart={(event) => { swipeStart.current = event.targetTouches[0].clientX; }}
        onTouchEnd={(event) => {
          if (swipeStart.current == null) return;
          const dx = event.changedTouches[0].clientX - swipeStart.current;
          swipeStart.current = null;
          if (dx > 50) selectRelative(-1);
          else if (dx < -50) selectRelative(1);
        }}
      >
        <FileText className={`size-4 shrink-0 ${appearance.icon}`} />
        {draft != null && active ? (
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={confirmRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') confirmRename();
              if (event.key === 'Escape') setDraft(null);
            }}
            className="h-7 bg-transparent border-none text-current text-sm px-1"
          />
        ) : (
          <CanvasSheetName name={active?.name ?? 'Нет листов'} />
        )}
        {active && (
          <span className="flex-shrink-0 text-[11px] opacity-75">{index + 1}/{sheets.length}</span>
        )}
      </div>

      {active && (
        <CanvasSheetMenu
          canDelete={sheets.length > 1}
          onRename={() => setDraft(active.name)}
          onDuplicate={() => onSheetDuplicate(active.id)}
          onDelete={() => onSheetDelete(active.id)}
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
        title="Добавить новый лист"
      >
        <Plus className="h-4 w-4 " />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-foreground"
        disabled={index < 0 || index >= sheets.length - 1}
        onClick={() => selectRelative(1)}
        title="Следующий лист"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
