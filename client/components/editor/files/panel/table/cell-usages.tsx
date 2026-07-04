/**
 * @fileoverview Ячейка «используется в нодах» таблицы файлов (`CellUsages`).
 * Показывает поповер со списком нод, использующих файл, — имя ноды и имя листа
 * (Req 15.1). Использования вычисляются клиентским `useFileNodeUsages` по
 * `file.url` и `allSheets`. Клик по элементу вызывает `onGoToNode(nodeId,
 * sheetId)` для перехода к ноде на холсте. Поповер скрыт, если переход или
 * листы недоступны (например, режим модалки).
 * @module components/editor/files/panel/table/cell-usages
 */

import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/utils/utils';
import { useFileNodeUsages } from '../../hooks/use-file-node-usages';
import type { ProjectFile } from '../../hooks/use-project-files';
import type { SheetInfo } from '../panel-types';

/** Пропсы ячейки использований в нодах */
export interface CellUsagesProps {
  /** Данные файла */
  file: ProjectFile;
  /** Все листы проекта (для поиска использований) */
  allSheets?: SheetInfo[];
  /** Переход к ноде на холсте (только mode='page') */
  onGoToNode?: (nodeId: string, sheetId: string) => void;
  /** Дополнительные классы для `td` */
  className?: string;
}

/**
 * Ячейка-поповер «где используется файл» с переходом к ноде.
 * @param props - Свойства ячейки
 * @returns JSX элемент `<td>` со столбцом использований
 */
export function CellUsages({ file, allSheets, onGoToNode, className }: CellUsagesProps) {
  const usages = useFileNodeUsages(file.url ?? '', allSheets ?? []);

  // Без перехода или листов столбец не интерактивен (Req 15.3 — только страница)
  if (!allSheets || !onGoToNode) {
    return <td className={cn('p-2 text-center text-muted-foreground text-[10px]', className)}>—</td>;
  }

  return (
    <td className={cn('p-2 text-center', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-6 w-6" title="Где используется">
            <ArrowUpRight className="h-3 w-3" />
            {usages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3 min-w-3 rounded-full bg-primary px-0.5 text-[8px] leading-3 text-primary-foreground">
                {usages.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 text-xs" align="end">
          {usages.length === 0 ? (
            <p className="text-muted-foreground text-center py-1">Не используется в нодах</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-auto">
              {usages.map((u) => (
                <button
                  key={u.nodeId + u.sheetId}
                  type="button"
                  className="w-full text-left px-2 py-1 rounded hover:bg-muted flex items-center gap-1"
                  onClick={() => onGoToNode(u.nodeId, u.sheetId)}
                >
                  <span className="truncate flex-1">{u.nodeLabel}</span>
                  <span className="text-muted-foreground shrink-0">({u.sheetName})</span>
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </td>
  );
}
