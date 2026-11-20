/** @fileoverview Групповой перевод выбранных ботов на общие настройки проекта. */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/queryClient';
import { toast } from '@/hooks/use-toast';
import type { BotToken } from '@shared/schema';
import { BOT_INHERITED_SETTING_KEYS, resolveProjectBotSettings } from '@shared/bot-inherited-settings';
import { getBotProfileLabels } from './bot-profile-labels';

/** Данные для выбора ботов проекта. */
interface ProjectBotInheritancePickerProps {
  /** Идентификатор текущего проекта. */
  projectId: number;
  /** Боты текущего проекта. */
  tokens: BotToken[];
  /** Сохранённые настройки проекта для предпросмотра массового изменения. */
  projectDefaults?: Record<string, unknown>;
}

/** Число независимых настроек, участвующих в массовом наследовании. */
const SETTING_COUNT = 4 + BOT_INHERITED_SETTING_KEYS.length;

/**
 * Подсчитывает настройки, для которых бот использует собственное значение.
 * @param token - Настройки подключённого бота.
 * @returns Число индивидуальных настроек запуска.
 */
function countOverrides(token: BotToken): number {
  return [token.inheritLaunchMode, token.inheritSleepMode, token.inheritAutoRestart, token.inheritMaxRestartAttempts]
    .filter((inherited) => inherited !== true).length
    + BOT_INHERITED_SETTING_KEYS.filter((key) => !token.inheritBotSettings?.includes(key)).length;
}

/**
 * Создаёт независимую форму выбора для каждого проекта.
 * @param props - Данные текущего проекта.
 * @returns Кнопка открытия и форма выбора.
 */
export function ProjectBotInheritancePicker(props: ProjectBotInheritancePickerProps) {
  return <ProjectBotInheritanceForm key={props.projectId} {...props} />;
}

/**
 * Фильтрует список и переводит выбранных ботов на все общие настройки одним запросом.
 * @param props - Данные текущего проекта.
 * @returns Форма группового перехода.
 */
function ProjectBotInheritanceForm({ projectId, tokens, projectDefaults }: ProjectBotInheritancePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [confirmedRetention, setConfirmedRetention] = useState<number>();
  const queryClient = useQueryClient();
  const mutation = useMutation<{ inheritedCount: number }, Error, number[]>({
    mutationFn: (tokenIds) => apiRequest('PUT', `/api/projects/${projectId}/bot/launch-inheritance`,
      { tokenIds, setting: 'all' }),
    onSuccess: async ({ inheritedCount }, tokenIds) => {
      /** Сообщает результат массовой записи после подтверждения сервера. */
      toast({ title: 'Наследование обновлено', description: `Переведено ботов: ${inheritedCount}.` });
      setSelected(new Set());
      setConfirmedRetention(undefined);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tokens`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/bot/launch-default`] }),
        ...tokenIds.map((id) => queryClient.invalidateQueries({
          queryKey: [`/api/projects/${projectId}/tokens/${id}/runtime-settings`],
        })),
      ]);
    },
  });

  const candidates = tokens.flatMap((token) => {
    const overrideCount = countOverrides(token);
    return overrideCount ? [{ token, overrideCount, ...getBotProfileLabels(token) }] : [];
  });
  const term = search.trim().toLowerCase().replace(/^[@#]/, '');
  const visible = candidates.filter(({ token, title, username }) =>
    [title, username ?? '', String(token.id)].some((value) => value.toLowerCase().includes(term)),
  );
  const selectedIds = candidates.filter(({ token }) => selected.has(token.id)).map(({ token }) => token.id);
  /** Сокращение срока затрагивает историю только у выбранных ботов с личным значением. */
  const retention = resolveProjectBotSettings(projectDefaults).messagesRetentionDays;
  const shorterRetention = retention > 0 && candidates.some(({ token }) =>
    selected.has(token.id) && !token.inheritBotSettings?.includes('messagesRetentionDays')
      && (token.messagesRetentionDays === 0 || token.messagesRetentionDays > retention));

  /**
   * Обновляет выбор, сохраняя отметки у ботов вне текущего поиска.
   * @param ids - Идентификаторы ботов, чьи отметки меняются.
   * @param checked - Новое состояние отметок.
   */
  function setChecked(ids: number[], checked: boolean) {
    mutation.reset();
    setConfirmedRetention(undefined);
    setSelected((previous) => {
      const next = new Set(previous);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  if (tokens.length === 0) return null;
  /** Явно показывает итог наследования там же, где обычно доступен выбор. */
  if (candidates.length === 0) {
    return (
      <div className="space-y-1 rounded-lg border p-3">
        <h3 className="text-sm font-medium">Массовое наследование</h3>
        <p role="status" className="text-sm text-muted-foreground">
          Все боты наследуют общие настройки проекта.
          {mutation.data && ` Переведено: ${mutation.data.inheritedCount}.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <h3 className="text-sm font-medium">Массовое наследование</h3>
      <Button type="button" variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
        Выбрать ботов для наследования
      </Button>
      {open && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Выбранные боты получат сохранённые настройки проекта: запуск, перезапуск, данные, логи, поведение и базовый адрес webhook.
          </p>
          <p className="text-xs text-muted-foreground">
            Сохраните изменения проекта перед применением. Polling/Webhook и режим сна вступят в силу при следующем запуске ботов.
          </p>
          <Input aria-label="Поиск ботов" placeholder="Имя, @username или ID" type="search"
            value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span aria-live="polite">Выбрано {selectedIds.length} из {candidates.length}</span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={visible.length === 0 || mutation.isPending}
                onClick={() => setChecked(visible.map(({ token }) => token.id), true)}>
                {term ? 'Выбрать найденных' : 'Выбрать всех'}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={selectedIds.length === 0 || mutation.isPending}
                onClick={() => setChecked(selectedIds, false)}>
                Снять выбор
              </Button>
            </div>
          </div>
          {visible.length > 0 ? (
            <ul className="max-h-56 divide-y overflow-auto rounded-md border">
              {visible.map(({ token, title, username, overrideCount }) => (
                <li key={token.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-muted/40">
                    <Checkbox checked={selected.has(token.id)} disabled={mutation.isPending}
                      onCheckedChange={(checked) => setChecked([token.id], checked === true)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium" title={title}>{title}</span>
                      {username && <span className="block truncate text-xs text-muted-foreground">@{username}</span>}
                    </span>
                    <span className="shrink-0 text-right text-xs text-muted-foreground">
                      <span className="block">Свои настройки: {overrideCount} из {SETTING_COUNT}</span>
                      <span>#{token.id}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Боты не найдены.</p>}
          {shorterRetention && (
            <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
              <Checkbox checked={confirmedRetention === retention} disabled={mutation.isPending}
                onCheckedChange={(checked) => setConfirmedRetention(checked === true ? retention : undefined)} />
              <span>Понимаю, что сообщения старше {retention} дн. могут быть удалены при очередной очистке.</span>
            </label>
          )}
          <Button type="button" size="sm" className="w-full"
            disabled={selectedIds.length === 0 || mutation.isPending || (shorterRetention && confirmedRetention !== retention)}
            onClick={() => mutation.mutate(selectedIds)}>
            {mutation.isPending ? 'Сохранение…' : `Использовать настройки проекта (${selectedIds.length})`}
          </Button>
          {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
          {mutation.data && <p role="status" className="text-sm">
            Переведено на настройки проекта: {mutation.data.inheritedCount}.
          </p>}
        </div>
      )}
    </div>
  );
}
