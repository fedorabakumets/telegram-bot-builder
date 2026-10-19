/**
 * @fileoverview Блок активных сессий аккаунта в админской карточке
 * @module components/admin/users/platform-user-sessions-card
 */

import { Clock3, Globe2, Monitor, Smartphone } from 'lucide-react';
import type { PlatformUserSession } from '@shared/admin/platform-users.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/queryClient';
import { useMutation } from '@tanstack/react-query';

/** Свойства блока активных сессий */
interface PlatformUserSessionsCardProps {
  /** Идентификатор аккаунта */
  userId: number;
  /** Сессии аккаунта */
  sessions: PlatformUserSession[];
}

/** Форматирует время активности сессии */
function formatSessionDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

/** Показывает активные сессии выбранного аккаунта */
export function PlatformUserSessionsCard({ userId, sessions }: PlatformUserSessionsCardProps) {
  const revokeMutation = useMutation({
    mutationFn: (sessionId?: string) => apiRequest('DELETE', sessionId ? `/admin/api/users/${userId}/sessions/${sessionId}` : `/admin/api/users/${userId}/sessions`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/admin/api/users', userId] }),
  });
  const revokeAll = () => {
    if (window.confirm('Завершить все сессии этого аккаунта?')) revokeMutation.mutate();
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Активные сессии</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Активных сессий нет.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {sessions.map((session) => {
              const DeviceIcon = session.kind === 'mobile' ? Smartphone : Monitor;
              return (
                <li key={session.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <DeviceIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{session.device}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" />{session.ip || 'IP неизвестен'}</span>
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatSessionDate(session.lastActive)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" disabled={revokeMutation.isPending} onClick={() => { if (window.confirm('Завершить эту сессию?')) revokeMutation.mutate(session.id); }}>Завершить</Button>
                </li>
              );
            })}
          </ul>
        )}
        {sessions.length > 0 && <Button variant="outline" className="mt-5 w-full" disabled={revokeMutation.isPending} onClick={revokeAll}>Завершить все сессии</Button>}
      </CardContent>
    </Card>
  );
}
