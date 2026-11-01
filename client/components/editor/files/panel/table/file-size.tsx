/** @fileoverview Ленивое получение размера старого медиа только для видимых карточек и строк. */
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ProjectFile } from '../../hooks/use-project-files';
import { formatSize } from './files-table-utils';

/** Свойства размера медиа. */
interface FileSizeProps {
  /** Файл текущего проекта. */
  file: ProjectFile;
  /** Проект с проверяемым доступом. */
  projectId: number;
}
/**
 * Показывает размер и однократно уточняет его через Telegram при отсутствии в истории.
 * @param props - Файл и проект
 * @returns Размер или понятное состояние уточнения
 */
export function FileSize({ file, projectId }: FileSizeProps) {
  const root = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const missing = !file.fileSize && file.source !== 'uploaded' && !!file.fileId;
  useEffect(() => {
    if (!missing || !root.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '100px' });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [missing]);
  const { data, isFetching } = useQuery<{ fileSize: number | null }>({
    queryKey: ['message-file-size', projectId, file.id, file.fileId],
    enabled: visible && missing, staleTime: Infinity, retry: false,
    queryFn: async () => {
      const result = await fetch(`/api/projects/${projectId}/messages/${file.id}/file-size`, { credentials: 'include' });
      if (!result.ok) throw new Error('Размер временно недоступен');
      return result.json();
    },
  });
  const size = file.fileSize || data?.fileSize;
  return <span ref={root} title={!size ? 'Размер не сохранён; уточняется через Telegram' : undefined}>
    {size ? formatSize(size) : isFetching ? 'Уточняем размер…' : 'Размер неизвестен'}
  </span>;
}
