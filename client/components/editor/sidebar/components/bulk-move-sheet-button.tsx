/**
 * @fileoverview Кнопка массового перемещения узлов в другой лист
 * @module components/editor/sidebar/components/bulk-move-sheet-button
 */

import React, { useState, useRef, useEffect } from 'react';
import { Share2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Пропсы компонента BulkMoveSheetButton
 */
export interface BulkMoveSheetButtonProps {
  /** Количество выбранных узлов */
  count: number;
  /** Доступные листы для перемещения */
  sheets: Array<{ id: string; name: string }>;
  /** Обработчик выбора целевого листа */
  onSelect: (sheetId: string) => void;
}

/**
 * Кнопка массового перемещения выбранных узлов в другой лист
 * Показывает dropdown со списком доступных листов при клике
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки перемещения
 */
export function BulkMoveSheetButton({ count, sheets, onSelect }: BulkMoveSheetButtonProps) {
  if (sheets.length === 0) return null;

  return (
    <div className="mt-1 px-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs px-2 flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border border-blue-400/30 rounded justify-start"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-3 w-3 flex-shrink-0" />
            <span>Переместить ({count}) в лист</span>
            <ChevronDown className="h-3 w-3 ml-auto flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={4}
          className="w-48"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Переместить в
          </div>
          {sheets.map((sheet) => (
            <DropdownMenuItem
              key={sheet.id}
              className="text-xs cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(sheet.id);
              }}
            >
              {sheet.name || 'Без названия'}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
