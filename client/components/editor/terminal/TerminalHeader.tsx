/**
 * @fileoverview Заголовок терминала
 *
 * Компонент отображает заголовок терминала с кнопками управления:
 * - Изменение масштаба
 * - Очистка терминала
 * - Копирование/сохранение в форматах: текст, JSON, CSV
 * - Скрытие терминала
 *
 * @module TerminalHeader
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, ZoomIn, ZoomOut, Trash2, Copy, Download, EyeOff } from 'lucide-react';
import type { ExportFormat } from './terminalUtils';

/** Пропсы заголовка терминала */
interface TerminalHeaderProps {
  /** Увеличить масштаб */
  onZoomIn: () => void;
  /** Уменьшить масштаб */
  onZoomOut: () => void;
  /** Очистить терминал */
  onClear: () => void;
  /** Копировать в формате */
  onCopy: (format: ExportFormat) => void;
  /** Сохранить в формате */
  onSave: (format: ExportFormat) => void;
  /** Скрыть терминал */
  onHide?: () => void;
  /** CSS-класс фона заголовка */
  headerBgClass: string;
  /** CSS-класс цвета текста кнопок */
  buttonTextColorClass: string;
  /** CSS-класс hover кнопок */
  buttonHoverClass: string;
  /** Показывать ли кнопки управления */
  showControls?: boolean;
}

/**
 * Заголовок терминала с кнопками управления и экспортом
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalHeader({
  onZoomIn, onZoomOut, onClear, onCopy, onSave, onHide,
  headerBgClass, buttonTextColorClass, buttonHoverClass,
  showControls = true,
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
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Копировать</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onCopy('text')}>Текст</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy('json')}>JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy('csv')}>CSV</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Скачать</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onSave('text')}>Текст</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSave('json')}>JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSave('csv')}>CSV</DropdownMenuItem>
                {onHide && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onHide}>
                      <EyeOff className="mr-2 h-4 w-4" />Скрыть
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Десктоп: кнопки в строку */}
          <div className="hidden sm:flex items-center space-x-1 flex-wrap justify-end">
            <Button variant="ghost" size="sm" onClick={onZoomIn} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onZoomOut} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClear} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {/* Копировать — dropdown с форматами */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`${buttonTextColorClass} ${buttonHoverClass}`}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">Копировать в формате</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onCopy('text')}>Обычный текст</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy('json')}>JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy('csv')}>CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Скачать — dropdown с форматами */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`${buttonTextColorClass} ${buttonHoverClass}`}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">Загрузить в формате</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onSave('text')}>Обычный текст</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSave('json')}>JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSave('csv')}>CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onHide && (
              <Button variant="ghost" size="sm" onClick={onHide} className={`${buttonTextColorClass} ${buttonHoverClass}`}>
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
