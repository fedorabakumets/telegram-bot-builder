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
 * @module TerminalHeader
 */

import { Button } from '@/components/ui/button';

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
  buttonHoverClass
}: TerminalHeaderProps) {
  return (
    <div className={`${headerBgClass} px-4 py-2 flex justify-between items-center`}>
      <h3 className="font-semibold">Терминал</h3>
      <div className="flex space-x-2 flex-wrap justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
        >
          Увеличить
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
        >
          Уменьшить
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
        >
          Очистить
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
        >
          Копировать
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
        >
          Сохранить
        </Button>
        {onHide && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHide}
            className={`${buttonTextColorClass} ${buttonHoverClass} mb-1`}
          >
            Скрыть
          </Button>
        )}
      </div>
    </div>
  );
}
