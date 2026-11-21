/** @fileoverview Подтверждение переноса и восстановление операции из журнала. */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/queryClient';
import type { LegacyTelegramMigrationGroup } from '@shared/project-telegram-account-migration';

/** Сохранённая операция переноса без данных сессии. */
interface Operation {
  /** Идентификатор для повторения той же операции. */
  migrationId: string;
  /** Группа ботов из предварительного просмотра. */
  groupId: number;
  /** Актуальная фаза журнала. */
  phase: string;
}

/** Ответ о доступности переноса и текущих операциях. */
interface MigrationStatus {
  /** Среда способна подтвердить остановку воркера и брокера. */
  canApply: boolean;
  /** Причина, по которой сервер не может безопасно выполнить перенос. */
  availabilityReason?: keyof typeof availabilityMessages;
  /** Операции проекта, доступные для продолжения. */
  operations: Operation[];
}

/** Пояснения к безопасным кодам диагностики, которые возвращает сервер. */
const availabilityMessages = {
  disabled: 'Перенос старых сессий выключен в настройках сервера. Предварительный просмотр доступен.',
  'unsupported-runtime': 'В этой среде сервер не может подтвердить остановку старых подключений. Для переноса нужен локальный воркер проекта.',
  'broker-unconfigured': 'Для переноса сначала подключите сервис общих Telegram-аккаунтов.',
  'worker-unavailable': 'Сервер сейчас не видит локальный воркер проекта. Проверьте, что он запущен, и повторите проверку.',
};

/** Действие, ожидающее явного подтверждения. */
interface Decision {
  /** Выполнить перенос либо восстановить старую привязку. */
  action: 'apply' | 'rollback';
  /** Идентификатор операции или ключ нового запроса. */
  operation: Operation;
}

/** Свойства управления переносом. */
interface AccountMigrationActionsProps {
  /** Адрес API переноса в текущем проекте. */
  path: string;
  /** Владелец проекта для разделения кеша пользователей. */
  actorId: number;
  /** Группы из актуального предварительного просмотра. */
  groups: readonly LegacyTelegramMigrationGroup[];
  /** Обновляет список карточек и предварительный просмотр. */
  onChanged: () => void;
}

/**
 * Показывает совместимые группы и операции, требующие продолжения или отката.
 * @param props - Адрес API, группы и действие обновления.
 * @returns Блок управления переносом.
 */
export function AccountMigrationActions({ path, actorId, groups, onChanged }: AccountMigrationActionsProps) {
  const [decision, setDecision] = useState<Decision>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const status = useQuery({
    queryKey: ['/api/projects', 'telegram-migration', `${path}/operations`, actorId], staleTime: 0, retry: false,
    queryFn: (): Promise<MigrationStatus> => apiRequest('GET', `${path}/operations`),
  });

  /** Выполняет явно подтверждённое действие с одним идентификатором при повторе. */
  async function confirm() {
    if (!decision || pending) return;
    const { action, operation } = decision;
    setPending(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('POST', `${path}/${action}`, {
        migrationId: operation.migrationId,
        ...(action === 'apply' ? { groupId: operation.groupId } : {}),
      });
      setNotice(action === 'apply' ? 'Перенос завершён' : 'Откат завершён');
      setDecision(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось завершить операцию');
    } finally {
      await status.refetch();
      onChanged();
      setPending(false);
    }
  }

  if (status.isPending) return <p role="status" className="text-sm text-muted-foreground">Проверяем возможность переноса…</p>;
  if (status.isError) return <Button variant="outline" size="sm" onClick={() => void status.refetch()}>Повторить проверку переноса</Button>;
  const { operations, canApply, availabilityReason } = status.data;
  const unsettled = operations.some(operation => !['shared-ready', 'rolled-back'].includes(operation.phase));

  return (
    <div className="space-y-3">
      {!canApply && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p role="status" className="text-sm font-medium">Перенос недоступен в текущей среде запуска.</p>
          {availabilityReason && <p className="text-xs text-muted-foreground">{availabilityMessages[availabilityReason]}</p>}
          <Button type="button" variant="outline" size="sm" disabled={status.isFetching}
            onClick={() => void status.refetch()}>Проверить снова</Button>
        </div>
      )}
      {canApply && !unsettled && !decision && groups.filter(group => group.disposition === 'create').map(group => (
        <Button key={group.id} variant="outline" size="sm" onClick={() => {
          setDecision({ action: 'apply', operation: { migrationId: crypto.randomUUID(), groupId: group.id, phase: 'prepared' } });
        }}>Перенести группу #{group.id}</Button>
      ))}
      {operations.some(operation => operation.phase !== 'rolled-back') && (
        <ul className="space-y-2">
          {operations.filter(operation => operation.phase !== 'rolled-back').map(operation => {
            const complete = operation.phase === 'shared-ready';
            const rollingBack = ['rollback-started', 'shared-stopped', 'legacy-restored'].includes(operation.phase);
            return (
              <li key={operation.migrationId} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
                <span className="text-xs text-muted-foreground">Группа #{operation.groupId} · {complete ? 'Перенесена' : 'Операция не завершена'}</span>
                <div className="flex gap-2">
                  {!complete && !rollingBack && <Button size="sm" variant="outline" disabled={pending || !canApply}
                    onClick={() => setDecision({ action: 'apply', operation })}>Продолжить</Button>}
                  <Button size="sm" variant="outline" disabled={pending || !canApply}
                    onClick={() => setDecision({ action: 'rollback', operation })}>Откатить</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {decision && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-sm">{decision.action === 'apply' ? 'Подтвердите перенос' : 'Подтвердите откат'} группы #{decision.operation.groupId}.</p>
          <p className="text-xs text-muted-foreground">Во время операции работа затронутых ботов может прерваться.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending || !canApply} onClick={() => void confirm()}>
              {pending ? 'Выполняется…' : decision.action === 'apply' ? 'Подтвердить перенос' : 'Подтвердить откат'}
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => { setDecision(undefined); setError(''); }}>Отмена</Button>
          </div>
        </div>
      )}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
