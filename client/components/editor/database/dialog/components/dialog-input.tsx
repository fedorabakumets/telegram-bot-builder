/**
 * @fileoverview Компонент ввода сообщения с поддержкой медиафайлов
 * @module editor/database/dialog/components/dialog-input
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, FilePlus2, FileKey2, MousePointerClick } from 'lucide-react';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';
import { FileIdInput } from '@/components/editor/properties/media/file-id-input';
import { DialogButtonsEditor } from './dialog-buttons-editor';
import type { Button as MessageButton } from '@shared/schema';
import type { NodeWithSheet } from '../utils/node-utils';

/**
 * Свойства компонента ввода сообщения
 */
interface DialogInputProps {
  /** Состояние отправки */
  isPending: boolean;
  /** Идентификатор проекта для медиаселектора */
  projectId: number;
  /** Узлы проекта для выбора цели действия goto в кнопках */
  availableNodes?: NodeWithSheet[];
  /**
   * Функция отправки сообщения
   * @param text - Текст сообщения
   * @param mediaUrls - Массив URL медиафайлов
   * @param buttons - Массив инлайн-кнопок сообщения
   * @param buttonsPerRow - Кол-во кнопок в ряду (0 = все в один ряд)
   */
  onSend: (text: string, mediaUrls: string[], buttons: MessageButton[], buttonsPerRow: number) => void;
}

/**
 * Компонент ввода и отправки сообщения с поддержкой форматирования и медиафайлов.
 * Содержит кнопку-скрепку для медиаселектора и кнопку Telegram file_id.
 * @param props - Свойства компонента
 * @returns JSX элемент поля ввода
 */
export function DialogInput({ isPending, projectId, availableNodes, onSend }: DialogInputProps) {
  const [messageText, setMessageText] = useState('');
  /** Список URL выбранных медиафайлов */
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  /** Флаг видимости медиаселектора */
  const [showMedia, setShowMedia] = useState(false);
  /** Флаг видимости блока ввода Telegram file_id */
  const [showFileId, setShowFileId] = useState(false);
  /** Тип медиа для file_id */
  const [fileIdMediaType, setFileIdMediaType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');
  /** Список инлайн-кнопок сообщения */
  const [buttons, setButtons] = useState<MessageButton[]>([]);
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  const [buttonsPerRow, setButtonsPerRow] = useState(0);
  /** Флаг видимости редактора инлайн-кнопок */
  const [showButtons, setShowButtons] = useState(false);

  /** Отправляет подготовленное сообщение и очищает редактор. */
  const handleSend = () => {
    // Разрешаем отправку, если есть текст ИЛИ хотя бы один прикреплённый файл.
    // Кнопки сами по себе отправлять нельзя — они лишь дополнение к тексту/медиа.
    if ((messageText.trim() || mediaUrls.length > 0) && !isPending) {
      onSend(messageText.trim(), mediaUrls, buttons, buttonsPerRow);
      setMessageText('');
      setMediaUrls([]);
      setShowMedia(false);
      setShowFileId(false);
      setButtons([]);
      setButtonsPerRow(0);
      setShowButtons(false);
    }
  };

  return (
    <div className="space-y-2 p-2">
      {/* Компактный редактор сохраняет место для переписки. */}
      <div className="[&_[contenteditable=true]]:!min-h-[64px] [&>div>div:first-child]:flex-nowrap [&>div>div:first-child]:overflow-x-auto">
        <CompactInlineEditor
          value={messageText}
          onChange={setMessageText}
          placeholder="Введите сообщение..."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1" role="group" aria-label="Дополнения к сообщению">
          {/* Кнопка прикрепления медиафайлов */}
          <Button
            variant={showMedia ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setShowMedia((v) => !v); setShowFileId(false); setShowButtons(false); }}
            title="Прикрепить медиафайл"
            aria-label="Прикрепить медиафайл"
            aria-expanded={showMedia}
            className="h-9 gap-2 px-2 aria-expanded:bg-blue-100 aria-expanded:text-blue-700 dark:aria-expanded:bg-blue-500/20 dark:aria-expanded:text-blue-300"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Файл</span>
            {mediaUrls.length > 0 && (
              <span className="ml-1 text-xs font-semibold">{mediaUrls.length}</span>
            )}
          </Button>

          {/* Кнопка Telegram file_id */}
          <Button
            variant={showFileId ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setShowFileId((v) => !v); setShowMedia(false); setShowButtons(false); }}
            title="Добавить Telegram file_id"
            aria-label="Добавить Telegram file_id"
            aria-expanded={showFileId}
            className="h-9 gap-2 px-2 aria-expanded:bg-blue-100 aria-expanded:text-blue-700 dark:aria-expanded:bg-blue-500/20 dark:aria-expanded:text-blue-300"
          >
            <FileKey2 className="w-4 h-4" />
            <span>file_id</span>
          </Button>

          {/* Кнопка редактора инлайн-кнопок */}
          <Button
            variant={showButtons ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setShowButtons((v) => !v); setShowMedia(false); setShowFileId(false); }}
            title="Инлайн-кнопки сообщения"
            aria-label="Инлайн-кнопки сообщения"
            aria-expanded={showButtons}
            className="h-9 gap-2 px-2 aria-expanded:bg-blue-100 aria-expanded:text-blue-700 dark:aria-expanded:bg-blue-500/20 dark:aria-expanded:text-blue-300"
          >
            <MousePointerClick className="w-4 h-4" />
            <span>Кнопки</span>
            {buttons.length > 0 && (
              <span className="ml-1 text-xs font-semibold">{buttons.length}</span>
            )}
          </Button>

        </div>

        <Button
          data-testid="dialog-panel-button-send"
          onClick={handleSend}
          disabled={(!messageText.trim() && mediaUrls.length === 0) || isPending}
          size="sm"
          className="h-9 shrink-0 gap-2 px-3"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Отправить
            </>
          )}
        </Button>
      </div>

      {/* Медиаселектор расположен под кнопкой прикрепления файла. */}
      {showMedia && (
        <div className="border rounded-md p-2 bg-muted/30 max-h-48 overflow-y-auto">
          <MultiMediaSelector
            projectId={projectId}
            value={mediaUrls}
            onChange={setMediaUrls}
            label=""
          />
        </div>
      )}

      {/* Блок ввода Telegram file_id расположен под рядом инструментов. */}
      {showFileId && (
        <div className="border rounded-md p-3 bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-700/60">
          <FileIdInput
            projectId={projectId}
            mediaType={fileIdMediaType}
            onMediaTypeChange={setFileIdMediaType}
            onAdd={(entry) => {
              setMediaUrls((prev) => [...prev, entry]);
              setShowFileId(false);
            }}
          />
        </div>
      )}

      {/* Редактор инлайн-кнопок расположен под рядом инструментов. */}
      {showButtons && (
        <div className="border rounded-md p-3 bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-700/60 max-h-64 overflow-y-auto">
          <DialogButtonsEditor
            buttons={buttons}
            onChange={setButtons}
            availableNodes={availableNodes}
            buttonsPerRow={buttonsPerRow}
            onButtonsPerRowChange={setButtonsPerRow}
          />
        </div>
      )}
    </div>
  );
}
