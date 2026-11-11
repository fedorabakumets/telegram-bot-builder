/**
 * @fileoverview Отдельное вложение ответа с независимым состоянием ошибки.
 */
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { FileNotFound } from './file-not-found';

/** Свойства вложения ответа. */
interface ResponseMediaItemProps {
  /** Адрес вложения. */
  url: string;
  /** Явно заданный тип вложения. */
  type?: string;
}
/**
 * Отображает вложение, ограничивая размеры и изолируя ошибки соседних файлов.
 * @param props - Адрес и тип вложения.
 * @returns Медиа, ссылка на документ или сообщение о недоступности.
 */
export function ResponseMediaItem({ url, type }: ResponseMediaItemProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <FileNotFound />;
  const path = url.split(/[?#]/)[0].toLowerCase();
  const audio = type === 'audio' || /\.(mp3|ogg|wav)$/.test(path);
  const video = type === 'video' || /\.(mp4|webm|mov)$/.test(path);
  const document = type === 'document' || /\.(pdf|docx?|xlsx?|pptx?|txt|zip)$/.test(path);
  const image = type === 'photo' || type === 'image' || /\.(png|jpe?g|gif|webp|avif|svg)$/.test(path);
  if (audio) return <audio aria-label="Аудиоответ пользователя" src={url} controls preload="none" className="w-full max-w-sm" onError={() => setFailed(true)} />;
  if (video) return <video aria-label="Видеоответ пользователя" src={url} controls preload="none" className="max-h-48 w-full max-w-sm rounded-md" onError={() => setFailed(true)} />;
  if (image && !audio && !video && !document) return <img src={url} alt="Изображение из ответа пользователя" loading="lazy" className="max-h-48 max-w-full rounded-md object-contain" onError={() => setFailed(true)} />;
  const name = url.split('/').pop()?.split('?')[0] || 'Открыть вложение';
  return <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    {document && <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
    <span className="break-all">{document ? name : url}</span>
    <span className="sr-only"> (откроется в новой вкладке)</span>
  </a>;
}
