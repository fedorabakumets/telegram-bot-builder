/** @fileoverview Выбор получателей с ошибками прошлой рассылки. */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveRetryAudience } from '../utils/resolve-retry-audience';
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
        if (items.length >= data.total) return items.filter((item) => item.tokenId === tokenId && item.status !== 'running');
        if (!data.broadcasts.length) throw new Error('Не удалось загрузить все рассылки');
      }
    },
  });
  const detail = useQuery({
    queryKey: ['retry-broadcast-results', projectId, tokenId, broadcastId],
    enabled: !!tokenId && !!broadcastId && !!history.data?.some((item) => item.id === broadcastId),
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/projects/${projectId}/broadcasts/${broadcastId}`, { credentials: 'include', signal });
      if (!response.ok) throw new Error('Не удалось загрузить ошибки');
      const data: { broadcast: Broadcast; results: BroadcastResult[] } = await response.json();
      if (data.broadcast.tokenId !== tokenId) throw new Error('Рассылка другого бота');
      const groupsResponse = await fetch(`/api/projects/${projectId}/groups?tokenId=${tokenId}`, { credentials: 'include', signal });
      if (!groupsResponse.ok) throw new Error('Не удалось проверить группы бота');
      const groups: {
        /** Telegram ID группы выбранного бота. */
        groupId: string;
        /** Признак доступности группы. */
        isActive?: number | boolean;
      }[] = await groupsResponse.json();
      return { tokenId: tokenId!, broadcastId: broadcastId!, ...resolveRetryAudience(data.results, groups.filter((g) => g.isActive !== 0 && g.isActive !== false).map((g) => g.groupId)) };
    },
  });
  /** Синхронизирует ошибки с обычным фильтром получателей рассылки. */
  useEffect(() => {
    const source = detail.data;
    if (!source || detail.isError || source.tokenId !== tokenId || source.broadcastId !== broadcastId || source.userIds.length + source.groupIds.length > 10000) return;
    if (JSON.stringify(formData.retryAudience) !== JSON.stringify(source)) {
      onChange({ retryAudience: source, filters: { ...formData.filters, userIds: source.userIds, groupIds: undefined }, groupsByTokenId: { [source.tokenId]: source.groupIds } });
    }
  }, [detail.data, detail.isError, tokenId, broadcastId, formData.retryAudience, formData.filters, onChange]);

  if (!tokenId) return <p className="text-sm text-muted-foreground">Выберите одного бота, чтобы увидеть его рассылки.</p>;
  if (history.isLoading) return <p className="text-sm text-muted-foreground">Загружаем рассылки…</p>;
  if (history.isError) return <p role="alert" className="text-sm text-destructive">Не удалось загрузить рассылки. Попробуйте открыть мастер снова.</p>;
  if (!history.data?.length) return <p className="text-sm text-muted-foreground">У этого бота пока нет завершённых рассылок.</p>;
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <label htmlFor="retry-broadcast" className="text-sm font-medium">Рассылка с ошибками</label>
      <select id="retry-broadcast" value={broadcastId ?? ''} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChange({ retryAudience: undefined, groupsByTokenId: {}, filters: { ...formData.filters, retryBroadcastId: Number(event.target.value) || undefined, userIds: [], groupIds: undefined } })}>
        <option value="">Выберите рассылку</option>
        {history.data.map((item) => <option key={item.id} value={item.id}>{item.name || `Рассылка №${item.id}`} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ru-RU') : 'Дата неизвестна'}</option>)}
      </select>
      <p className="text-xs leading-relaxed text-muted-foreground">Повторим отправку только пользователям и группам с прочими ошибками. Заблокированные и удалённые аккаунты, а также недоступные группы исключаются.</p>
      {detail.data && <p className="text-sm text-muted-foreground">Пользователей: {detail.data.userIds.length} · групп: {detail.data.groupIds.length}</p>}
      {detail.isFetching && <p className="text-sm text-muted-foreground">Загружаем ошибки…</p>}
      {detail.isError && <p role="alert" className="text-sm text-destructive">Не удалось загрузить ошибки рассылки.</p>}
      {detail.data && detail.data.userIds.length + detail.data.groupIds.length > 10000 && <p role="alert" className="text-sm text-destructive">В этой рассылке больше 10 000 ошибок. Повторная отправка пока недоступна.</p>}
      {detail.data && detail.data.userIds.length + detail.data.groupIds.length === 0 && <p className="text-sm text-muted-foreground">Нет получателей с подходящими ошибками.</p>}
    </div>
  );
}
