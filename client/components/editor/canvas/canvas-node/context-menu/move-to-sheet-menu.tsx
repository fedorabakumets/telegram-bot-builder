/**
 * @fileoverview Подменю перемещения узла в другой лист
 */

import { useState } from 'react';
import { Share2 } from 'lucide-react';

/**
 * Описание листа для отображения в подменю
 */
interface SheetOption {
  /** Уникальный идентификатор листа */
  id: string;
  /** Отображаемое название листа */
  name: string;
}

/**
 * Пропсы компонента подменю перемещения в лист
 */
interface MoveToSheetMenuProps {
  /** Список листов для перемещения (без текущего) */
  sheets: SheetOption[];
  /** Обработчик выбора листа */
  onSelect: (sheetId: string) => void;
}

/**
 * Подменю выбора листа для перемещения узла
 *
 * @param props - Свойства компонента
 * @returns JSX элемент подменю
 */
export function MoveToSheetMenu({ sheets, onSelect }: MoveToSheetMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (sheets.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors text-left text-slate-200 hover:bg-white/10 hover:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <Share2 className="w-4 h-4 opacity-70 shrink-0" />
        <span className="flex-1">В лист</span>
        <i className="fas fa-chevron-right text-xs opacity-50" />
      </button>

      {isOpen && (
        <div
          className="absolute left-full top-0 ml-1 min-w-[160px] rounded-xl border border-white/10 bg-slate-800/95 backdrop-blur-md shadow-2xl p-1.5 z-[1000]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {sheets.map((sheet) => (
            <button
              key={sheet.id}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left text-slate-200 hover:bg-white/10 hover:text-white truncate"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(sheet.id);
              }}
            >
              <i className="fas fa-file-alt w-4 text-center opacity-70 shrink-0" />
              <span className="truncate">{sheet.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
