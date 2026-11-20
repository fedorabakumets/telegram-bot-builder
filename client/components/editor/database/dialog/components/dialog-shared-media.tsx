/** @fileoverview Общие сохранённые фотографии и ссылки в профиле пользователя или группы. */
import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Image, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from './image-lightbox';
import type { DialogProfileContentPage } from '@shared/dialog-profile-content';

/** Область сохранённых материалов профиля. */
interface DialogSharedMediaProps {
  /** Проект. */ projectId: number;
  /** Пользователь либо групповой чат. */ userId: string;
  /** Конкретный бот или общая история проекта. */ tokenId?: number | null;
  /** Профиль группы. */ isGroup?: boolean;
}

/** Показывает сохранённые фото с просмотром и обычные ссылки из сообщений. @param props - Область профиля. @returns Секция материалов. */
export function DialogSharedMedia({ projectId, userId, tokenId, isGroup = false }: DialogSharedMediaProps) {
  const [tab, setTab] = useState<'photos' | 'links'>('photos');
  const [preview, setPreview] = useState<string | null>(null);
  const base = `/api/projects/${projectId}/dialog-profiles/${encodeURIComponent(userId)}/content`;
  const scope = new URLSearchParams({ ...(tokenId ? { tokenId: String(tokenId) } : {}), ...(isGroup ? { isGroup: 'true' } : {}) });
  const query = useInfiniteQuery({
    queryKey: ['dialog-profile-content', projectId, userId, tokenId ?? null, isGroup],
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam, signal }): Promise<DialogProfileContentPage> => {
      const params = new URLSearchParams(scope);
      if (pageParam) params.set('beforeId', String(pageParam));
      const response = await fetch(`${base}?${params}`, { credentials: 'include', signal });
      if (!response.ok) throw new Error('Не удалось загрузить материалы');
      return response.json();
    },
    getNextPageParam: page => page.beforeId ?? undefined,
    enabled: projectId > 0 && /^-?[1-9]\d*$/.test(userId), staleTime: 30000,
  });
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  /** Дочитывает историю последовательно, чтобы повторы последних сообщений не скрывали старые ссылки. */
  useEffect(() => {
    if (query.hasNextPage && !query.isFetching && !query.isError) void query.fetchNextPage();
  }, [query.hasNextPage, query.isFetching, query.isError, query.fetchNextPage]);
  const photos = [...new Map(items.flatMap(item => item.photos).map(photo => [photo.id, photo])).values()];
  const links = [...new Set(items.flatMap(item => item.links))];
  return <section className="space-y-3 border-t px-5 py-4" aria-label="Общие материалы">
    <div role="tablist" aria-label="Материалы профиля" className="flex gap-4 border-b">
      {([{ id: 'photos', label: 'Фото', icon: Image }, { id: 'links', label: 'Ссылки', icon: LinkIcon }] as const).map(({ id, label, icon: Icon }) =>
        <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
          className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm ${tab === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />{label} · {id === 'photos' ? photos.length : links.length}{query.hasNextPage ? '+' : ''}
        </button>)}
    </div>
    {query.isLoading ? <p className="text-xs text-muted-foreground">Загрузка материалов…</p> : query.isError ?
      <div role="alert" className="space-y-2 text-sm"><p>Не удалось загрузить материалы.</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Повторить</Button></div> :
      tab === 'photos' ? (photos.length ? <div className="grid grid-cols-3 gap-1.5">{photos.map(photo => {
        const url = `${base}/media/${photo.id}?${scope}`;
        return <button type="button" key={photo.id} onClick={() => setPreview(url)} aria-label={`Открыть фото ${photo.name}`} className="aspect-square overflow-hidden rounded-md border bg-muted">
          <img src={url} alt={photo.name} loading="lazy" className="h-full w-full object-cover" />
        </button>;
      })}</div> : <p className="text-xs text-muted-foreground">Сохранённых фото пока нет.</p>) :
      (links.length ? <ul className="space-y-2">{links.map(link => <li key={link}><a href={link} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-primary underline underline-offset-2">{link}</a></li>)}</ul> : <p className="text-xs text-muted-foreground">Сохранённых ссылок пока нет.</p>)}
    {query.hasNextPage && !query.isError && <p role="status" className="text-xs text-muted-foreground">Загрузка остальных материалов…</p>}
    <p className="text-xs text-muted-foreground">Из сохранённых сообщений{tokenId ? ' выбранного бота' : ' всех ботов проекта'}.</p>
    {preview && <ImageLightbox src={preview} onClose={() => setPreview(null)} />}
  </section>;
}
