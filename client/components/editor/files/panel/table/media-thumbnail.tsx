/** @fileoverview Общая миниатюра изображения и видео с обложкой Telegram и безопасным запасным значком. */
import { useEffect, useRef, useState } from 'react';
import { FileText, Play } from 'lucide-react';
import type { ProjectFile } from '../../hooks/use-project-files';
import { getPreviewUrl, MEDIA_ICONS, shouldShowPreview } from './files-table-utils';

/** Свойства миниатюры. */
interface MediaThumbnailProps {
  /** Файл проекта. */
  file: ProjectFile;
  /** Проект для защищённого чтения. */
  projectId: number;
}

/**
 * Определяет видео одинаково для миниатюры и полноэкранного плеера.
 * @param file - Медиафайл
 * @returns Является ли содержимое видео
 */
export function isVideoFile(file: ProjectFile): boolean {
  return ['video', 'animation', 'video_note'].includes(file.mediaType ?? '') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.fileName ?? '');
}

/**
 * Показывает обложку, первый кадр видимого видео или значок при ошибке.
 * @param props - Файл и проект
 * @returns Содержимое кнопки предпросмотра
 */
export function MediaThumbnail({ file, projectId }: MediaThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const video = isVideoFile(file);
  const source = getPreviewUrl(file, projectId);
  const thumbnail = file.thumbnailFileId ? getPreviewUrl({ ...file, url: null, fileId: file.thumbnailFileId }, projectId) : null;
  const Icon = MEDIA_ICONS[file.mediaType ?? ''] ?? FileText;
  useEffect(() => {
    if (!root.current || !video || thumbnail) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '100px' });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [video, thumbnail]);
  return <span ref={root} className="relative flex h-full w-full items-center justify-center">
    {!failed && source && shouldShowPreview(file) ? (
      video && !thumbnail ? <video src={visible ? `${source}#t=0.1` : undefined} muted playsInline preload="metadata" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : <img src={thumbnail ?? source} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} />
    ) : <Icon className="h-5 w-5 text-muted-foreground" />}
    {video && <span className="absolute inset-0 flex items-center justify-center bg-black/20"><Play className="h-5 w-5 fill-white text-white" aria-hidden="true" /></span>}
  </span>;
}
