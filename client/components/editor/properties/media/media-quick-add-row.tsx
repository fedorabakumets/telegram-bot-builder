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
  placeholder = 'URL или вставь картинку (Ctrl+V)',
  multiple = true,
  onAttached,
}: MediaQuickAddRowProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlUploading, setIsUrlUploading] = useState(false);
  const { uploadAndAttach, isUploading } = useQuickAttachUpload(projectId, onAttached);
  const busy = isUploading || isUrlUploading;

  /**
   * Добавляет URL: http(s) скачивается на сервер, остальное пишется как есть.
   * @returns Promise<void>
   */
  const addUrl = async (): Promise<void> => {
    const raw = urlInput.trim();
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
   * Плюс: если в поле есть текст — добавить URL, иначе открыть выбор файла.
   * @returns void
   */
  const handlePlus = (): void => {
    if (busy) return;
    if (urlInput.trim()) void addUrl();
    else fileRef.current?.click();
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
    void uploadAndAttach(multiple ? files : files.slice(0, 1));
  };

  /**
   * Выбор файлов с диска.
   * @param event - Смена input[type=file]
   * @returns void
   */
  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const picked = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    void uploadAndAttach(multiple ? picked : picked.slice(0, 1));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <Input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          className="h-10 flex-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && void addUrl()}
          onPaste={handlePaste}
        />
        <FileClipboardButton compact disabled={busy} onFiles={(files) => void uploadAndAttach(multiple ? files : files.slice(0, 1))} />
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={busy}
          onClick={handlePlus}
          title={urlInput.trim() ? 'Добавить URL' : 'Загрузить файл с устройства'}
          data-testid="media-quick-add-plus"
        >
          {urlInput.trim() ? <Plus className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple={multiple}
          className="hidden"
          data-testid="media-quick-add-file"
          onChange={handleFiles}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-300/30" />
        <span className="text-xs text-slate-500">или выбрать уже лежащий</span>
        <div className="h-px flex-1 bg-slate-300/30" />
      </div>
      <MediaFieldButton
        projectId={projectId}
        nodeId={nodeId}
        nodeName={nodeName}
        field="attachedMedia"
        multi={multiple}
        onAttach={onAttached}
        label="Из хранилища"
        className="h-10 w-full gap-1.5"
      />
    </div>
  );
}
