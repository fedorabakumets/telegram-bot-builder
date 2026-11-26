/** @fileoverview Быстрые действия Mini рядом с перетаскиваемым питомцем. */
import { useRef, useState, type ReactElement } from 'react';
import { EyeOff, MoreHorizontal, Settings, SquarePen } from 'lucide-react';
import { useLocation } from 'wouter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MiniComposer } from './MiniComposer';

interface MiniControlsProps {
  /** Кнопка питомца, к которой привязаны действия. */
  children: ReactElement;
  /** Скрывает питомца с сохранением настройки. */
  onHide: () => void;
  /** Отключает Mini во всём приложении, сохраняя настройки отдельных вкладок. */
  onHideEverywhere: () => void;
}

/** Общий размер кнопок панели для касания и управления с клавиатуры. */
const actionClass = 'grid size-10 place-items-center rounded-full hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500';

/**
 * Открывает действия по нажатию на питомца и удерживает панель в пределах окна.
 * @param props - Кнопка питомца и обработчик его скрытия.
 * @returns Питомец со всплывающей панелью сообщения и настроек.
 */
export function MiniControls({ children, onHide, onHideEverywhere }: MiniControlsProps) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const goingToSettings = useRef(false);

  /**
   * При повторном открытии показывает компактную панель.
   * @param next - Желаемая видимость панели.
   */
  function changeOpen(next: boolean) {
    if (next) goingToSettings.current = false;
    if (!next) setComposing(false);
    setOpen(next);
  }

  /** Переводит к настройкам Mini в профиле. */
  function openSettings() {
    goingToSettings.current = true;
    changeOpen(false);
    navigate('/profile?section=interface#mini-settings');
  }

  /**
   * Оставляет фокус у настройки профиля после перехода из меню.
   * @param event - Событие возврата фокуса Radix при закрытии.
   */
  function restoreFocus(event: Event) {
    if (goingToSettings.current) event.preventDefault();
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent aria-label="Действия Mini" sideOffset={6} collisionPadding={8}
        updatePositionStrategy="always" onCloseAutoFocus={restoreFocus}
        className={composing
          ? 'w-auto max-w-[calc(100vw-1rem)] border-0 bg-transparent p-0 shadow-none'
          : 'w-auto rounded-full border-0 bg-popover p-1 shadow-lg'}>
        {composing ? <MiniComposer onClose={() => changeOpen(false)} /> : (
          <div className="flex items-center">
            <button type="button" aria-label="Написать в поддержку" title="Написать в поддержку"
              className={actionClass} onClick={() => setComposing(true)}>
              <SquarePen aria-hidden="true" className="size-4" />
            </button>
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Меню Mini" title="Меню Mini" className={actionClass}>
                  <MoreHorizontal aria-hidden="true" className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" collisionPadding={8} onCloseAutoFocus={restoreFocus}>
                <DropdownMenuItem onSelect={openSettings}><Settings />Настройки</DropdownMenuItem>
                <DropdownMenuItem onSelect={onHide}><EyeOff />Скрыть на этой вкладке</DropdownMenuItem>
                <DropdownMenuItem onSelect={onHideEverywhere}><EyeOff />Скрыть во всех вкладках</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
