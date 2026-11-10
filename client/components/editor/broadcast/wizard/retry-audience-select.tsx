/** @fileoverview Выбор получателей с ошибками прошлой рассылки. */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Broadcast, BroadcastResult, NewBroadcastFormData } from '../types';

/** Свойства выбора повторной аудитории. */
interface RetryAudienceSelectProps {
  /** Проект рассылки. */
  projectId: number;
  /** Данные формы мастера. */
  formData: NewBroadcastFormData;
  /** Изменение формы. */
  onChange: (data: Partial<NewBroadcastFormData>) => void;
}

/**
 * Показывает прошлые рассылки выбранного бота и загружает ошибки доставки.
 * @param props - Данные формы и проекта
 * @returns Выбор рассылки и описание аудитории
 */
export function RetryAudienceSelect({ projectId, formData, onChange }: RetryAudienceSelectProps) {
  const tokenIds = formData.tokenIds ?? [];
  const tokenId = tokenIds.length === 1 ? tokenIds[0] : null;
  const broadcastId = formData.filters.retryBroadcastId;
  const history = useQuery({
    queryKey: ['retry-broadcast-history', projectId, tokenId],
    enabled: !!tokenId,
    queryFn: async ({ signal }) => {
      const items: Broadcast[] = [];
      for (let page = 1; ; page++) {
        const response = await fetch(`/api/projects/${projectId}/broadcasts?tokenId=${tokenId}&page=${page}&limit=100`, { credentials: 'include', signal });
        if (!response.ok) throw new Error('Не удалось загрузить рассылки');
        const data: { broadcasts: Broadcast[]; total: number } = await response.json();
        items.push(...data.broadcasts);
        if (items.length >= data.total) return items.filter((item) => item.tokenId === tokenId && item.status !== 'running' && (item.failedCount ?? 0) > 0);
        if (!data.broadcasts.length) throw new Error('Не удалось загрузить все рассылки');
      }
    },
  });
  const detail = useQuery({
    queryKey: ['retry-broadcast-results', projectId, broadcastId],
    enabled: !!tokenId && !!broadcastId && !!history.data?.some((item) => item.id === broadcastId),
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/projects/${projectId}/broadcasts/${broadcastId}`, { credentials: 'include', signal });
      if (!response.ok) throw new Error('Не удалось загрузить ошибки');
      const data: { broadcast: Broadcast; results: BroadcastResult[] } = await response.json();
      if (data.broadcast.tokenId !== tokenId) throw new Error('Рассылка другого бота');
      return [...new Set(data.results.filter((r) => r.status === 'failed' && /^\d+$/.test(r.userId)).map((r) => r.userId))];
    },
  });
  /** Синхронизирует ошибки с обычным фильтром получателей рассылки. */
  useEffect(() => {
    if (!detail.data || detail.data.length > 10000) return;
    if (JSON.stringify(formData.filters.userIds ?? []) !== JSON.stringify(detail.data)) {
      onChange({ filters: { ...formData.filters, userIds: detail.data } });
    }
  }, [detail.data, formData.filters, onChange]);

  if (!tokenId) return <p className="text-sm text-muted-foreground">Выберите одного бота, чтобы увидеть его рассылки.</p>;
  if (history.isLoading) return <p className="text-sm text-muted-foreground">Загружаем рассылки…</p>;
  if (history.isError) return <p role="alert" className="text-sm text-destructive">Не удалось загрузить рассылки. Попробуйте открыть мастер снова.</p>;
  if (!history.data?.length) return <p className="text-sm text-muted-foreground">У этого бота пока нет завершённых рассылок с прочими ошибками.</p>;
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <label htmlFor="retry-broadcast" className="text-sm font-medium">Рассылка с ошибками</label>
      <select id="retry-broadcast" value={broadcastId ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChange({ filters: { ...formData.filters, retryBroadcastId: Number(event.target.value) || undefined, userIds: [] } })}>
        <option value="">Выберите рассылку</option>
        {history.data.map((item) => <option key={item.id} value={item.id}>{item.name || `Рассылка №${item.id}`} · {new Date(item.createdAt).toLocaleDateString('ru-RU')} · ошибок: {item.failedCount}</option>)}
      </select>
      <p className="text-xs leading-relaxed text-muted-foreground">Повторим отправку только получателям с прочими ошибками. Заблокированные и удалённые аккаунты исключаются.</p>
      {detail.isFetching && <p className="text-sm text-muted-foreground">Загружаем ошибки…</p>}
      {detail.isError && <p role="alert" className="text-sm text-destructive">Не удалось загрузить ошибки рассылки.</p>}
      {detail.data && detail.data.length > 10000 && <p role="alert" className="text-sm text-destructive">В этой рассылке больше 10 000 ошибок. Повторная отправка пока недоступна.</p>}
      {detail.data && detail.data.length === 0 && <p className="text-sm text-muted-foreground">Нет получателей с подходящими ошибками.</p>}
    </div>
  );
}
