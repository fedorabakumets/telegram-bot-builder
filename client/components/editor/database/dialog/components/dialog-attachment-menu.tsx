/**
 * @fileoverview Единое меню вложений и инлайн-кнопок редактора сообщения.
 */
import { useState } from 'react';
import { FileKey2, FilePlus2, MousePointerClick, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Свойства меню дополнений к сообщению. */
interface DialogAttachmentMenuProps {
  /** Открыть выбор медиафайлов. */
  onSelectMedia: () => void;
  /** Открыть ввод идентификатора файла Telegram. */
  onSelectFileId: () => void;
  /** Открыть редактор инлайн-кнопок. */
  onSelectButtons: () => void;
  /** Количество выбранных вложений. */
  mediaCount?: number;
  /** Количество добавленных инлайн-кнопок. */
  buttonsCount?: number;
  /** Открытая панель дополнения. */
  activePanel?: 'media' | 'fileId' | 'buttons' | null;
  /** Временно запретить изменение дополнений. */
  disabled?: boolean;
  /** Скрыть открытую панель при повторном нажатии скрепки. */
  onClosePanel?: () => void;
}

/**
 * Показывает скрепку высотой с поле сообщения и меню доступных дополнений.
 * @param props - Обработчики выбора и состояние дополнений.
 * @returns Кнопка с доступным с клавиатуры выпадающим меню.
 */
export function DialogAttachmentMenu({
  onSelectMedia, onSelectFileId, onSelectButtons, mediaCount = 0,
  buttonsCount = 0, activePanel, disabled, onClosePanel,
}: DialogAttachmentMenuProps) {
  const [open, setOpen] = useState(false);
  const count = mediaCount + buttonsCount;
  return (
    <DropdownMenu open={open} onOpenChange={(next) => {
      if (next && activePanel && onClosePanel) { onClosePanel(); setOpen(false); }
      else setOpen(next);
    }}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={activePanel ? 'secondary' : 'ghost'}
          size="icon"
          className="relative col-start-1 row-start-3 h-[46px] w-9 shrink-0"
          disabled={disabled}
          aria-label={count ? `Прикрепить: добавлено ${count}` : 'Прикрепить'}
          title="Прикрепить"
        >
          <Paperclip className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground" aria-hidden="true">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8}>
        <DropdownMenuItem onSelect={onSelectMedia}>
          <FilePlus2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Файл{mediaCount > 0 ? ` · ${mediaCount}` : ''}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSelectFileId}>
          <FileKey2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Telegram file_id
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onSelectButtons}>
          <MousePointerClick className="mr-2 h-4 w-4" aria-hidden="true" />
          Кнопки сообщения{buttonsCount > 0 ? ` · ${buttonsCount}` : ''}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
