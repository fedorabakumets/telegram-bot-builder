/** @fileoverview Редактор проектных настроек данных, поведения, логов и webhook. */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectBotDefaultFields } from './ProjectBotDefaultFields';
import { useProjectBotSettingDefaults, type ProjectBotSettingDefaults } from './use-project-bot-setting-defaults';

/** Свойства формы общих настроек проекта. */
interface BotProjectSettingDefaultsProps {
  /** Проект, чьи общие значения редактируются. */
  projectId: number;
}

/**
 * Хранит черновик отдельно от сохранённых значений и применяет изменённые поля.
 * @param props - Свойства формы.
 * @returns Форма с общим сохранением расширенных настроек проекта.
 */
export function BotProjectSettingDefaults({ projectId }: BotProjectSettingDefaultsProps) {
  const { query, save } = useProjectBotSettingDefaults(projectId);
  const [draft, setDraft] = useState<Partial<ProjectBotSettingDefaults>>({});
  const [confirmedRetention, setConfirmedRetention] = useState<number>();
  const saved = query.data;

  if (!saved) {
    return (
      <div className="space-y-2 border-t pt-4">
        <p role={query.isError ? 'alert' : 'status'} className="text-sm text-muted-foreground">
          {query.isError ? 'Не удалось загрузить настройки данных, логов и webhook.' : 'Загрузка настроек данных, логов и webhook…'}
        </p>
        {query.isError && (
          <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
            Повторить
          </Button>
        )}
      </div>
    );
  }

  const patch = Object.fromEntries(
    Object.entries({
      ...draft,
      ...('webhookBaseUrl' in draft ? { webhookBaseUrl: draft.webhookBaseUrl?.trim() || null } : {}),
    }).filter(([key, value]) => value !== saved[key as keyof ProjectBotSettingDefaults]),
  );
  const hasChanges = Object.keys(patch).length > 0;
  const nextRetention = draft.messagesRetentionDays;
  const needsConfirmation = nextRetention !== undefined && nextRetention > 0
    && (saved.messagesRetentionDays === 0 || nextRetention < saved.messagesRetentionDays);
  const canSave = hasChanges && !save.isPending && (!needsConfirmation || confirmedRetention === nextRetention);

  return (
    <form className="space-y-3 border-t pt-4" onSubmit={(event) => {
      event.preventDefault();
      if (canSave) save.mutate(patch, { onSuccess: () => setDraft({}) });
    }}>
      <fieldset disabled={save.isPending} className="min-w-0 space-y-4">
        <ProjectBotDefaultFields values={{ ...saved, ...draft }} disabled={save.isPending}
          onChange={(change) => {
            save.reset();
            setDraft((prev) => ({ ...prev, ...change }));
            if ('messagesRetentionDays' in change) setConfirmedRetention(undefined);
          }} />
      </fieldset>
      {needsConfirmation && (
        <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
          <Checkbox checked={confirmedRetention === nextRetention} disabled={save.isPending}
            onCheckedChange={(checked) => setConfirmedRetention(checked === true ? nextRetention : undefined)} />
          <span>Понимаю, что при очистке у ботов, наследующих срок проекта, могут быть удалены сообщения старше {nextRetention} дн.</span>
        </label>
      )}
      {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
      <Button type="submit" size="sm" disabled={!canSave}>
        {save.isPending ? 'Сохранение…' : 'Сохранить настройки'}
      </Button>
    </form>
  );
}
