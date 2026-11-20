/** @fileoverview Вертикальный список листов у боковой границы холста. */
import { useEffect, useRef, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { CanvasSheet } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CanvasSheetMenu } from './canvas-sheet-menu';

/** Данные и действия вертикального списка. */
interface CanvasSheetsVerticalProps {
  /** Листы проекта. */
  sheets: CanvasSheet[];
  /** Открытый лист. */
  activeSheetId: string | null;
  /** Открывает лист. */
  onSheetSelect: (id: string) => void;
  /** Создаёт лист с автоматически выбранным именем. */
  onAdd: () => void;
  /** Меняет имя листа. */
  onSheetRename: (id: string, name: string) => void;
  /** Создаёт копию листа. */
  onSheetDuplicate: (id: string) => void;
  /** Удаляет лист. */
  onSheetDelete: (id: string) => void;
}

/**
 * Показывает прокручиваемый список с переносом длинных названий и действия открытого листа.
 * @param props - Листы проекта и обработчики действий.
 * @returns Вертикальная навигация по листам.
 */
export function CanvasSheetsVertical({
  sheets, activeSheetId, onSheetSelect, onAdd, onSheetRename, onSheetDuplicate, onSheetDelete,
}: CanvasSheetsVerticalProps) {
  const [draft, setDraft] = useState<{ id: string; name: string } | null>(null);
  const activeRow = useRef<HTMLDivElement>(null);
  const active = sheets.find(sheet => sheet.id === activeSheetId);

  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeSheetId]);

  /** Сохраняет введённое имя и завершает редактирование. */
  const confirmRename = () => {
    if (draft?.name.trim()) onSheetRename(draft.id, draft.name.trim());
    setDraft(null);
  };

  return (
    <nav aria-label="Листы редактора" className="flex h-full min-h-0 flex-col gap-2 bg-background p-2">
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {sheets.map(sheet => {
          const selected = sheet.id === activeSheetId;
          return (
            <div key={sheet.id} ref={selected ? activeRow : null} className="flex min-w-0 items-center">
              {draft?.id === sheet.id ? (
                <Input autoFocus aria-label="Название листа" value={draft.name}
                  onChange={event => setDraft({ id: sheet.id, name: event.target.value })}
                  onBlur={confirmRename}
                  onKeyDown={event => {
                    if (event.key === 'Enter') confirmRename();
                    if (event.key === 'Escape') setDraft(null);
                  }}
                  className="h-9 min-w-0" />
              ) : (
                <Button variant={selected ? 'secondary' : 'ghost'} type="button" aria-current={selected || undefined}
                  onClick={() => onSheetSelect(sheet.id)} title={sheet.name}
                  className="h-auto min-h-9 min-w-0 flex-1 items-start justify-start gap-1.5 whitespace-normal px-2 py-2 text-left leading-5">
                  <FileText className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{sheet.name}</span>
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1 border-t border-border pt-2">
        <Button variant="outline" type="button" onClick={onAdd}
          className="h-9 min-w-0 flex-1 px-1" aria-label="Добавить новый лист" title="Добавить новый лист">
          <Plus className="size-4" aria-hidden="true" />
        </Button>
        {active && (
          <CanvasSheetMenu canDelete={sheets.length > 1}
            onRename={() => setDraft({ id: active.id, name: active.name })}
            onDuplicate={() => onSheetDuplicate(active.id)}
            onDelete={() => onSheetDelete(active.id)} />
        )}
      </div>
    </nav>
  );
}
