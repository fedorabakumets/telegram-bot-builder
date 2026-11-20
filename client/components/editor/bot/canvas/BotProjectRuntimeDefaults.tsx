/** @fileoverview Общие настройки обработчика и перезапуска ботов проекта. */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Cpu, RefreshCw } from 'lucide-react';
import { SettingCard } from '../card/SettingCard';
import { SettingsSection } from '../card/SettingsSection';
import { BotRuntimeSelect, RESTART_ATTEMPT_OPTIONS, SLEEP_OPTIONS } from '../card/BotRuntimeSelect';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/queryClient';
import { toast } from '@/hooks/use-toast';
import type { ProjectSleepMode } from '@shared/bot-execution-settings';

/** Значения, которые боты могут наследовать по отдельности. */
interface RuntimeDefaults {
  /** Режим обработчика; пустое значение включает сон по умолчанию. */
  sleepMode: ProjectSleepMode | null;
  /** Автоперезапуск при сбое: 0 или 1. */
  autoRestart: number;
  /** Максимальное число попыток перезапуска. */
  maxRestartAttempts: number;
}

/** Свойства формы общих настроек запуска. */
interface BotProjectRuntimeDefaultsProps {
  /** Идентификатор редактируемого проекта. */
  projectId: number;
}

/**
 * Редактирует значения проекта и отправляет только изменённые поля.
 * @param props - Свойства формы.
 * @returns Секция настроек запуска и кнопка подтверждения.
 */
export function BotProjectRuntimeDefaults({ projectId }: BotProjectRuntimeDefaultsProps) {
  const projectUrl = `/api/projects/${projectId}`;
  const url = `${projectUrl}/bot/runtime-defaults`;
  const queryClient = useQueryClient();
  const query = useQuery<RuntimeDefaults>({ queryKey: [url], queryFn: () => apiRequest('GET', url) });
  const [draft, setDraft] = useState<Partial<RuntimeDefaults>>({});
  const save = useMutation({
    mutationFn: (patch: Partial<RuntimeDefaults>): Promise<RuntimeDefaults> => apiRequest('PUT', url, patch),
    onSuccess: (data, changes) => {
      /** Только режим сна требует нового запуска для применения. */
      toast({ title: 'Настройки сохранены', description: changes.sleepMode !== undefined
        ? 'Режим сна применится при следующем запуске.' : undefined });
      queryClient.setQueryData([url], data);
      setDraft({});
      void queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      void queryClient.invalidateQueries({ queryKey: [projectUrl] });
      void queryClient.invalidateQueries({ queryKey: [`${projectUrl}/tokens`] });
      void queryClient.invalidateQueries({
        predicate: ({ queryKey: [key] }) => typeof key === 'string'
          && key.startsWith(`${projectUrl}/tokens/`) && key.endsWith('/runtime-settings'),
      });
    },
  });
  /** Сохраняет выбранный вид формы при ответе старой версии API. */
  const saved = query.data && { ...query.data, sleepMode: query.data.sleepMode ?? 'process' };
  const current = saved && { ...saved, ...draft };
  const patch = current && saved && Object.fromEntries(
    Object.entries(current).filter(([key, value]) => value !== saved[key as keyof RuntimeDefaults]),
  ) as Partial<RuntimeDefaults> | undefined;

  return (
    <section className="space-y-3 border-t pt-4">
      {current && patch ? (
        <>
          <SettingsSection title="Сон и перезапуск">
            <SettingCard icon={Cpu} title="Режим сна" description="Освобождает память при простое">
              <BotRuntimeSelect label="Режим сна" value={current.sleepMode ?? 'process'} disabled={save.isPending}
                options={SLEEP_OPTIONS}
                onChange={(value) => setDraft((prev) => ({ ...prev,
                  sleepMode: value === 'direct' ? 'direct' : 'process',
                }))} />
            </SettingCard>
            <SettingCard icon={RefreshCw} title="Перезапуск при сбое" active={current.autoRestart === 1}
              description={current.autoRestart === 1 ? 'Боты перезапустятся после сбоя' : 'Боты останутся выключенными после сбоя'}>
              <div className="space-y-2">
                <BotRuntimeSelect label="Перезапуск при сбое" value={String(current.autoRestart)} disabled={save.isPending}
                  options={[{ value: '1', label: 'Включено' }, { value: '0', label: 'Выключено' }]}
                  onChange={(value) => setDraft((prev) => ({ ...prev, autoRestart: Number(value) }))} />
                <BotRuntimeSelect label="Максимум попыток перезапуска" value={String(current.maxRestartAttempts)}
                  options={RESTART_ATTEMPT_OPTIONS} disabled={save.isPending}
                  onChange={(value) => setDraft((prev) => ({ ...prev, maxRestartAttempts: Number(value) }))} />
                {current.autoRestart === 0 && <p className="text-xs text-muted-foreground">Лимит действует при включённом перезапуске.</p>}
              </div>
            </SettingCard>
          </SettingsSection>
          <p className="text-xs text-muted-foreground">Каждое поле наследуется отдельно. Изменения действуют при следующем запуске.</p>
          {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
          <Button type="button" size="sm" disabled={save.isPending || Object.keys(patch).length === 0}
            onClick={() => save.mutate(patch)}>
            {save.isPending ? 'Сохранение…' : 'Сохранить настройки запуска'}
          </Button>
        </>
      ) : (
        <p role={query.isError ? 'alert' : 'status'} className="text-sm text-muted-foreground">
          {query.isError ? 'Не удалось загрузить настройки запуска.' : 'Загрузка настроек запуска…'}
        </p>
      )}
    </section>
  );
}
