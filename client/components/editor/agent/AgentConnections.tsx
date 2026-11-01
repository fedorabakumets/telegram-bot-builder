/**
 * @fileoverview Подключение Telegram Agent и управление доступом к профилю.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { WorkspaceActionButton } from '@/components/ui/workspace-action-button';
import { apiRequest } from '@/queryClient';

/** Публичная ссылка на официальный Telegram Agent. */
const TELEGRAM_AGENT_URL = 'https://t.me/botcraftstudiobot';

/** Метаданные подключения без персональных токенов. */
interface Connection {
  /** Идентификатор подключения. */
  id: number;
  /** Имя доверенного агента. */
  agentId: string;
  /** Разрешён ли доступ. */
  enabled: boolean;
}

/** Шаги подключения существующего профиля к агенту. */
const CONNECTION_STEPS = [
  { title: 'Откройте агента', text: 'Перейдите в личный чат в Telegram.' },
  { title: 'Напишите сообщение', text: 'Ваш профиль подключится автоматически.' },
  { title: 'Работайте с ботами', text: 'Опишите агенту, что нужно сделать.' },
];

/**
 * Показывает инструкцию подключения и позволяет управлять доступом агента.
 * @returns Раздел подключения Telegram Agent.
 */
export function AgentConnections() {
  const queryClient = useQueryClient();
  const key = '/api/agent-connections';
  const query = useQuery<Connection[]>({ queryKey: [key] });
  const mutation = useMutation({
    /**
     * Переключает доступ выбранного подключения.
     * @param item - Подключение агента.
     */
    mutationFn: async (item: Connection) => {
      await apiRequest('PATCH', `${key}/${item.id}`, { enabled: !item.enabled });
    },
    /** Обновляет сведения о подключениях и связанных токенах. */
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [key] });
      void queryClient.invalidateQueries({ queryKey: ['/api/agent-tokens'] });
    },
  });
  return (
    <section aria-labelledby="telegram-agent-heading" className="agent-surface space-y-6 rounded-2xl border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Быстрый старт</p>
          <h3 id="telegram-agent-heading" className="text-xl font-semibold">Telegram Agent</h3>
          <p className="text-pretty text-sm text-muted-foreground">Без ручной настройки токена.</p>
        </div>
        <WorkspaceActionButton asChild className="agent-action h-auto px-3 py-2 text-base font-semibold">
          <a href={TELEGRAM_AGENT_URL} target="_blank" rel="noopener noreferrer">
            Открыть в Telegram <span aria-hidden="true">↗</span>
          </a>
        </WorkspaceActionButton>
      </div>
      <ol className="agent-steps grid gap-6">
        {CONNECTION_STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span aria-hidden="true" className="agent-step flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">{index + 1}</span>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-pretty text-sm text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="agent-inset space-y-3 rounded-xl p-4">
        {query.isLoading && <div role="status" className="agent-skeleton h-12 rounded-lg bg-muted"><span className="sr-only">Загрузка подключений…</span></div>}
        {query.isError && <p role="alert" className="text-sm text-destructive">Не удалось загрузить подключения. <button className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2" onClick={() => void query.refetch()}>Повторить</button></p>}
        {query.data?.length === 0 && <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium"><span className="h-2 w-2 rounded-full bg-muted-foreground" aria-hidden="true" />Ожидает подключения</p>
          <p className="text-pretty text-sm text-muted-foreground">После первого сообщения агент появится здесь.</p>
        </div>}
        {query.data?.map(item => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="break-all text-sm font-semibold">{item.agentId}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />{item.enabled ? 'Доступ разрешён' : 'Доступ отключён'}</p>
            </div>
            <Button variant="outline" className="agent-action px-3" disabled={mutation.isPending} onClick={() => mutation.mutate(item)}>
              {mutation.isPending && mutation.variables?.id === item.id ? 'Сохранение…' : item.enabled ? 'Отключить' : 'Подключить снова'}
            </Button>
          </div>
        ))}
        {mutation.isError && <p role="alert" className="text-sm text-destructive">Не удалось изменить доступ. Попробуйте ещё раз.</p>}
      </div>
      <p className="text-pretty text-xs text-muted-foreground">Вы управляете доступом. После отключения восстановить его можно только на этой странице.</p>
    </section>
  );
}
