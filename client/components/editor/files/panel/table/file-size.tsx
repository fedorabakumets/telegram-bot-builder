/** @fileoverview Ленивое получение размера старого медиа только для видимых карточек и строк. */
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectFile } from '../../hooks/use-project-files';
import { formatSize } from './files-table-utils';
import { updateFileSizeCache } from './file-size-cache';

/** Свойства размера медиа. */
interface FileSizeProps {
  /** Файл текущего проекта. */
  file: ProjectFile;
  /** Проект с проверяемым доступом. */
  projectId: number;
}
/**
 * Уточняет размер видимого файла и повторяет неудачный запрос без перезагрузки страницы.
 * @param props - Файл и проект
 * @returns Размер или понятное состояние уточнения
 */
export function FileSize({ file, projectId }: FileSizeProps) {
  const client = useQueryClient();
  const root = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const missing = !file.fileSize && file.source !== 'uploaded' && !!file.fileId;
  useEffect(() => {
    if (!missing || !root.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { rootMargin: '100px' });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [missing]);
  const { data, isFetching } = useQuery<{ fileSize: number | null }>({
    queryKey: ['message-file-size', projectId, file.id, file.fileId],
    enabled: visible && missing,
    staleTime: query => query.state.data?.fileSize ? Infinity : 15000,
    retry: 1,
    refetchInterval: query => visible && missing && !query.state.data?.fileSize ? 15000 : false,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const result = await fetch(`/api/projects/${projectId}/messages/${file.id}/file-size`, { credentials: 'include' });
      if (!result.ok) throw new Error('Размер временно недоступен');
      const value: { fileSize: number | null } = await result.json();
      if (value.fileSize) updateFileSizeCache(client, projectId, file, value.fileSize);
      return value;
    },
  });
  const size = file.fileSize || data?.fileSize;
  return <span ref={root} title={!size ? 'Размер не сохранён; уточняется через Telegram' : undefined}>
    {size ? formatSize(size) : isFetching ? 'Уточняем размер…' : 'Размер неизвестен'}
  </span>;
}
