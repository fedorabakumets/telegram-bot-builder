/**
 * @fileoverview Карточка активных сессий пользователя с данными API
 * @module components/profile/active-sessions-card
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock3, Globe2, LogOut, MapPin, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest, queryClient } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';

/** Описание активной сессии из API */
export interface ActiveSession {
  /** Публичный идентификатор сессии */
  id: string;
  /** Название браузера и операционной системы */
  device: string;
  /** Город последней активности */
  location?: string | null;
  /** IP-адрес последнего запроса */
  ip?: string | null;
  /** Время последней активности в ISO-формате */
  lastActive: string;
  /** Время создания сессии в ISO-формате */
  createdAt: string;
  /** Является ли сессия текущей */
  isCurrent: boolean;
  /** Тип устройства */
  kind: 'desktop' | 'mobile';
}

/** Ключ запроса списка сессий */
const SESSIONS_QUERY_KEY = ['/api/profile/sessions'];

/** Форматирует время последней активности сессии */
function formatLastActive(value: string): string {
  const date = new Date(value);
  if (Date.now() - date.getTime() < 120000) return 'Сейчас';
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/**
 * Показывает активные сессии пользователя в стиле блока админки
 * @returns JSX элемент карточки сессий
 */
export function ActiveSessionsCard() {
  const { toast } = useToast();
  const { data, isLoading, isError } = useQuery<{ sessions: ActiveSession[] }>({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => apiRequest('GET', '/api/profile/sessions'),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
  const revokeMutation = useMutation({
    mutationFn: (id?: string) => apiRequest('DELETE', id ? `/api/profile/sessions/${id}` : '/api/profile/sessions'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
    onError: (error: Error) => toast({ title: 'Не удалось завершить сессию', description: error.message, variant: 'destructive' }),
  });
  const sessions = data?.sessions ?? [];

  /** Завершает все сессии кроме текущей после подтверждения */
  const revokeOthers = () => {
    if (window.confirm('Завершить все остальные сессии?')) revokeMutation.mutate();
  };

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Активные сессии</CardTitle>
        <span className="text-xs text-muted-foreground">{sessions.length} активных</span>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && <p className="py-2 text-sm text-muted-foreground">Загрузка сессий...</p>}
        {isError && <p className="py-2 text-sm text-destructive">Не удалось загрузить активные сессии.</p>}
        {!isLoading && !isError && sessions.length === 0 && <p className="py-2 text-sm text-muted-foreground">Активных сессий нет.</p>}
        <div className="divide-y divide-border/60">
          {!isLoading && !isError && sessions.map((session) => {
            const DeviceIcon = session.kind === 'mobile' ? Smartphone : Monitor;
            return (
              <div key={session.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <DeviceIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.isCurrent && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">Текущее устройство</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {session.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{session.location}</span>}
                    {session.ip && <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" />{session.ip}</span>}
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatLastActive(session.lastActive)}</span>
                  </div>
                </div>
                {!session.isCurrent && <Button variant="ghost" size="sm" disabled={revokeMutation.isPending} onClick={() => revokeMutation.mutate(session.id)}><LogOut className="mr-2 h-4 w-4" />Завершить</Button>}
              </div>
            );
          })}
        </div>
        {sessions.some((session) => !session.isCurrent) && <Button variant="outline" className="mt-5 w-full" disabled={revokeMutation.isPending} onClick={revokeOthers}>Завершить все остальные</Button>}
      </CardContent>
    </Card>
  );
}
