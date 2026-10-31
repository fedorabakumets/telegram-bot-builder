/** @fileoverview Управление автоматическим подключением Telegram-агента. */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/queryClient';
import { ExternalLink } from 'lucide-react';

/** Публичная ссылка на официальный Telegram-бот агента без данных доступа. */
const TELEGRAM_AGENT_URL = 'https://t.me/botcraftstudiobot';

/** Метаданные подключения без персональных токенов. */
interface Connection {
  /** Идентификатор подключения */
  id: number;
  /** Имя доверенного агента */
  agentId: string;
  /** Разрешён ли доступ */
  enabled: boolean;
}

/** Показывает состояние и позволяет явно восстановить отозванное подключение. */
export function AgentConnections() {
  const queryClient = useQueryClient();
  const key = '/api/agent-connections';
  const query = useQuery<Connection[]>({ queryKey: [key] });
  const mutation = useMutation({
    mutationFn: async (item: Connection) => {
      await apiRequest('PATCH', `${key}/${item.id}`, { enabled: !item.enabled });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [key] });
      void queryClient.invalidateQueries({ queryKey: ['/api/agent-tokens'] });
    },
  });
  return <section className="space-y-4 border rounded-lg p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-base font-semibold">Telegram Agent</h3>
      <Button asChild className="w-full sm:w-auto">
        <a href={TELEGRAM_AGENT_URL} target="_blank" rel="noopener noreferrer">
          Открыть в Telegram <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </Button>
    </div>
    <p className="text-sm text-muted-foreground">
      Напишите агенту в личные сообщения. Он подключит ваш профиль автоматически.
      Для нового пользователя создаётся пустой профиль конструктора.
    </p>
    {query.isLoading && <p role="status">Загрузка подключений…</p>}
    {query.isError && <p role="alert">Не удалось загрузить подключения.</p>}
    {query.data?.length === 0 && <p className="text-sm">Автоматических подключений пока нет.</p>}
    {query.data?.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4">
      <span>{item.agentId}: {item.enabled ? 'Подключён' : 'Отключён'}</span>
      <Button variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate(item)}>
        {item.enabled ? 'Отключить' : 'Подключить снова'}
      </Button>
    </div>)}
    {mutation.isError && <p role="alert">Не удалось изменить подключение. Повторите позже.</p>}
    <p className="text-sm text-muted-foreground">После отключения доступ можно восстановить только здесь.</p>
  </section>;
}
