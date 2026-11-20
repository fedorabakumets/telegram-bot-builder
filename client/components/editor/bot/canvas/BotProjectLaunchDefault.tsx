/** @fileoverview Форма выбора режима получения обновлений для ботов проекта. */
import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { BotLaunchModePicker } from '../card/BotLaunchModePicker';
import { SettingCard } from '../card/SettingCard';
import { Button } from '@/components/ui/button';
import { useBotProjectLaunchDefault, useSaveBotProjectLaunchDefault } from './use-bot-project-launch-default';
import type { LaunchMode } from '../card/bot-launch-helpers';

/** Свойства формы режима по умолчанию. */
interface BotProjectLaunchDefaultProps {
  /** Идентификатор проекта, для которого редактируется режим. */
  projectId: number;
}

/**
 * Показывает значение проекта и сохраняет изменения по явному действию.
 * @param props - Свойства формы режима по умолчанию.
 * @returns Блок выбора режима со счётчиками и состоянием сохранения.
 */
export function BotProjectLaunchDefault({ projectId }: BotProjectLaunchDefaultProps) {
  const query = useBotProjectLaunchDefault(projectId);
  const save = useSaveBotProjectLaunchDefault(projectId);
  const [draft, setDraft] = useState<LaunchMode | null>(null);
  const saved = query.data;

  if (!saved) {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Получение обновлений</h3>
        <p className="text-sm text-muted-foreground" role={query.isError ? 'alert' : 'status'}>
          {query.isError ? 'Не удалось загрузить режим проекта.' : 'Загрузка режима…'}
        </p>
        {query.isError && (
          <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
            Повторить
          </Button>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <SettingCard icon={Rocket} title="Режим запуска" description="По умолчанию для ботов проекта" className="@container px-0">
        {/* Общие карточки режимов; настройка проекта доступна только для Polling и Webhook. */}
        <BotLaunchModePicker value={draft ?? saved.launchMode} disabled={save.isPending}
          onChange={(value) => {
            if (value === 'inherit') return;
            save.reset();
            setDraft(value);
          }} />
      </SettingCard>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <dt>Наследуют режим проекта</dt>
        <dd className="tabular-nums">{saved.inheritedCount}</dd>
        <dt>Используют свой режим</dt>
        <dd className="tabular-nums">{saved.overrideCount}</dd>
      </dl>
      <p className="text-xs text-muted-foreground">Изменение применяется при следующем запуске бота.</p>
      {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
      <Button
        type="button"
        size="sm"
        disabled={!draft || draft === saved.launchMode || save.isPending}
        onClick={() => {
          if (draft) save.mutate(draft, { onSuccess: () => setDraft(null) });
        }}
      >
        {save.isPending ? 'Сохранение…' : 'Сохранить режим'}
      </Button>
    </section>
  );
}
