/**
 * @fileoverview Строка быстрого добавления медиа: URL, загрузка, вставка, хранилище.
 * @module components/editor/properties/media/media-quick-add-row
 */

import { useRef, useState } from 'react';
import { Plus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { uploadImageFromUrl } from '@lib/bot-generator/media/uploadImageFromUrl';
import { FileClipboardButton } from '../../files/panel/file-clipboard-button';
import { filesFromClipboardEvent } from '../../files/panel/read-clipboard-files';
import { MediaDropZone } from './media-drop-zone';
import { MediaFieldButton } from './media-field-button';
import { useQuickAttachUpload } from './use-quick-attach-upload';

/** Пропсы строки быстрого добавления медиа */
export interface MediaQuickAddRowProps {
  /** ID проекта */
  projectId: number;
  /** ID ноды для модалки хранилища */
  nodeId: string;
  /** Имя ноды */
  nodeName: string;
  /** Плейсхолдер поля URL */
  placeholder?: string;
  /** Несколько файлов за раз */
  multiple?: boolean;
  /** Прикрепить URL (загрузка с диска/буфера или добавление ссылки) */
  onAttached: (urls: string[]) => void;
}

/**
 * Поле URL, плюс (URL или загрузка), буфер и кнопка «Из хранилища».
 * @param props - Проект, нода и колбэк прикрепления
 * @returns JSX строки добавления
 */
export function MediaQuickAddRow({
  projectId,
  nodeId,
  nodeName,
  placeholder = 'Перетащи файл или вставь ссылку',
  multiple = true,
  onAttached,
}: MediaQuickAddRowProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlUploading, setIsUrlUploading] = useState(false);
  const { uploadAndAttach, isUploading } = useQuickAttachUpload(projectId, onAttached);
  const busy = isUploading || isUrlUploading;
  const takeFiles = (files: File[]): File[] => (multiple ? files : files.slice(0, 1));

  /**
   * Добавляет URL: http(s) скачивается на сервер, остальное пишется как есть.
   * @param rawUrl - Текст поля или ссылка из drag-and-drop
   * @returns Promise<void>
   */
  const addUrl = async (rawUrl?: string): Promise<void> => {
    const raw = (rawUrl ?? urlInput).trim();
    if (!raw) return;
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      onAttached([raw]);
      setUrlInput('');
      return;
    }
    setIsUrlUploading(true);
    try {
      const result = await uploadImageFromUrl(raw, projectId, nodeName);
      onAttached([result.success ? (result.localPath || result.imageUrl || raw) : raw]);
      if (result.success) toast({ title: 'Файл прикреплён к ноде', description: result.message });
    } catch {
      onAttached([raw]);
    } finally {
      setIsUrlUploading(false);
      setUrlInput('');
    }
  };

  /**
   * Вставка картинки из буфера прямо в поле URL.
   * @param event - Событие paste
   * @returns void
   */
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>): void => {
    const files = filesFromClipboardEvent(event.nativeEvent);
    if (files.length === 0) return;
    event.preventDefault();
    void uploadAndAttach(takeFiles(files));
  };

  /**
   * Выбор файлов с диска.
   * @param event - Смена input[type=file]
   * @returns void
   */
  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const picked = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    void uploadAndAttach(takeFiles(picked));
  };

  return (
    <MediaDropZone
      disabled={busy}
      onFiles={(files) => void uploadAndAttach(takeFiles(files))}
      onHttpUrl={(url) => void addUrl(url)}
      onEmpty={() =>
        toast({
          title: 'Не получилось прочитать файл',
          description: 'Перетащи из Проводника или вставь через Ctrl+V',
          variant: 'destructive',
        })
      }
    >
      <div className="grid min-w-0 gap-2">
        <Button type="button" className="w-full gap-2" disabled={busy}
          onClick={() => fileRef.current?.click()} data-testid="media-quick-add-plus">
          <Upload className="size-4" /> {isUploading ? 'Загрузка…' : 'Загрузить файл'}
        </Button>
        <input ref={fileRef} type="file" multiple={multiple} className="hidden"
          data-testid="media-quick-add-file" onChange={handleFiles} />
        <MediaFieldButton projectId={projectId} nodeId={nodeId} nodeName={nodeName}
          field="attachedMedia" multi={multiple} onAttach={onAttached}
          label="Из хранилища" className="w-full gap-2" />
        <div className="flex items-center gap-1">
          <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            placeholder={placeholder} aria-label="Ссылка на файл" disabled={busy}
            className="h-9 min-w-0 flex-1 text-sm" onPaste={handlePaste}
            onKeyDown={(e) => e.key === 'Enter' && void addUrl()} />
          {urlInput.trim() && (
            <Button type="button" variant="outline" size="icon" disabled={busy}
              title="Добавить по ссылке" onClick={() => void addUrl()}>
              <Plus className="size-4" />
            </Button>
          )}
          <FileClipboardButton compact disabled={busy} onFiles={(files) => void uploadAndAttach(takeFiles(files))} />
        </div>
      </div>
    </MediaDropZone>
  );
}
