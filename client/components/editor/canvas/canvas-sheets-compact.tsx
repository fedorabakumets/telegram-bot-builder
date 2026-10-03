/**
 * @fileoverview Узкая панель листов: один активный лист, стрелки и меню действий
 */

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
    <div className="flex @[28rem]:hidden items-center gap-2 w-full px-3 py-2 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-600/50">
      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0 p-0 h-9 w-9 rounded-xl"
        disabled={index <= 0}
        onClick={() => selectRelative(-1)}
        title="Предыдущий лист"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div
        className="flex-1 min-w-0 flex items-center gap-2 h-9 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white"
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
        <FileText className="h-4 w-4 flex-shrink-0" />
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
            className="h-7 bg-transparent border-none text-white text-sm px-1"
          />
        ) : (
          <CanvasSheetName name={active?.name ?? 'Нет листов'} />
        )}
        {active && (
          <span className="flex-shrink-0 text-[11px] text-white/80">{index + 1}/{sheets.length}</span>
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
        className="flex-shrink-0 p-0 h-9 w-9 rounded-lg border border-emerald-500/30"
        title="Добавить новый лист"
      >
        <Plus className="h-4 w-4 text-emerald-400" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex-shrink-0 p-0 h-9 w-9 rounded-xl"
        disabled={index < 0 || index >= sheets.length - 1}
        onClick={() => selectRelative(1)}
        title="Следующий лист"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
