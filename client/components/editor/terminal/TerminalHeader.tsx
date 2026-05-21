/**
 * @fileoverview Заголовок терминала
 *
 * Компонент отображает заголовок терминала с кнопками управления:
 * - Изменение масштаба
 * - Очистка терминала
 * - Копирование вывода
 * - Сохранение вывода
 * - Скрытие терминала
 *
 * На мобильных кнопки скрыты в dropdown-меню для экономии места.
 *
 * @module TerminalHeader
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, ZoomIn, ZoomOut, Trash2, Copy, Save, EyeOff } from 'lucide-react';

interface TerminalHeaderProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClear: () => void;
  onCopy: () => void;
  onSave: () => void;
  onHide?: () => void;
  headerBgClass: string;
  buttonTextColorClass: string;
  buttonHoverClass: string;
  showControls?: boolean;
}

/**
 * Заголовок терминала
 */
export function TerminalHeader({
  onZoomIn,
  onZoomOut,
  onClear,
  onCopy,
  onSave,
  onHide,
  headerBgClass,
  buttonTextColorClass,
  buttonHoverClass,
  showControls = true
}: TerminalHeaderProps) {
  return (
    <div className={`${headerBgClass} px-3 sm:px-4 py-2 flex justify-between items-center`}>
      <h3 className="font-semibold text-sm sm:text-base">Терминал</h3>
      {showControls && (
        <>
          {/* Мобильный: dropdown-меню */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-7 w-7 ${buttonTextColorClass}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onZoomIn}>
                  <ZoomIn className="mr-2 h-4 w-4" />Увеличить
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onZoomOut}>
                  <ZoomOut className="mr-2 h-4 w-4" />Уменьшить
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClear}>
                  <Trash2 className="mr-2 h-4 w-4" />Очистить
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopy}>
                  <Copy className="mr-2 h-4 w-4" />Копировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSave}>
                  <Save className="mr-2 h-4 w-4" />Сохранить
                </DropdownMenuItem>
                {onHide && (
                  <DropdownMenuItem onClick={onHide}>
                    <EyeOff className="mr-2 h-4 w-4" />Скрыть
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Десктоп: кнопки в строку */}
          <div className="hidden sm:flex space-x-2 flex-wrap justify-end">
            <Button variant="ghost" size="sm" onClick={onZoomIn} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              Увеличить
            </Button>
            <Button variant="ghost" size="sm" onClick={onZoomOut} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              Уменьшить
            </Button>
            <Button variant="ghost" size="sm" onClick={onClear} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              Очистить
            </Button>
            <Button variant="ghost" size="sm" onClick={onCopy} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              Копировать
            </Button>
            <Button variant="ghost" size="sm" onClick={onSave} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              Сохранить
            </Button>
            {onHide && (
              <Button variant="ghost" size="sm" onClick={onHide} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
                Скрыть
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
