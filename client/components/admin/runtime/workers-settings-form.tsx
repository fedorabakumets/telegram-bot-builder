/** @fileoverview Настройка группировки и сна ботов отдельно от живых показателей. */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { RuntimeFormShape } from './runtime-field-control';
import type { RuntimeGroupView } from './runtime-types';
import { useSaveRuntimeSettings } from './use-runtime-settings';
import { showRuntimeField } from './worker-field-visibility';
import { WorkerRuntimeStatus } from './worker-runtime-status';
import { WorkerBotsPanel } from './worker-bots-panel';
import { WorkersSettingsField } from './workers-settings-field';
import { workersSettingsPayload, workersSettingsValues } from './workers-settings-values';

/** Ключи основных настроек размещены в порядке принятия решений. */
const placement = ['USE_WORKER_POOL', 'WORKER_GROUPING', 'WORKER_RUNTIME'];
/** Режим по умолчанию не заменяет собственные настройки отдельных ботов. */
const sleep = ['BOT_POLLING_MODE', 'BOT_ON_DEMAND_IDLE_SECONDS'];

/** Свойства отдельной формы воркеров. */
interface Props {
  /** Загруженные значения и каталог доступных параметров. */
  data: RuntimeGroupView;
}

/** Сохраняет черновик при обновлении данных; применение к работающим ботам отдельно. */
export function WorkersSettingsForm({ data }: Props) {
  const { toast } = useToast();
  const save = useSaveRuntimeSettings(data.id);
  const form = useForm<RuntimeFormShape>({ defaultValues: { values: workersSettingsValues(data) }, mode: 'onChange' });
  const { isDirty, dirtyFields, errors } = form.formState;
  const hasErrors = Boolean(errors.values && Object.keys(errors.values).length);
  // Подписка на изменённые поля нужна react-hook-form для keepDirtyValues.
  void dirtyFields;
  useEffect(() => { form.reset({ values: workersSettingsValues(data) }, { keepDirtyValues: true }); }, [data, form]);
  const runtimeField = data.fields.find((field) => field.env === 'WORKER_RUNTIME');
  const selectedRuntime = form.watch('values.WORKER_RUNTIME') || runtimeField?.effectiveValue || runtimeField?.value || 'process';
  const advanced = data.fields.filter((field) => !placement.includes(field.env) && !sleep.includes(field.env)
    && showRuntimeField(data.id, field, selectedRuntime));
  /** Рисует только поля, поддерживаемые текущей версией API. */
  const fields = (keys: string[]) => keys.flatMap((key) => {
    const field = data.fields.find((item) => item.env === key);
    return field ? [<WorkersSettingsField key={key} field={field} form={form} />] : [];
  });
  /** Сохраняет текущий снимок, сохраняя новый ввод во время сетевого запроса. */
  const submit = (shape: RuntimeFormShape) => {
    const submitted = { ...shape.values };
    save.mutate(workersSettingsPayload(data, submitted), {
      onSuccess: (result: { warnings?: string[] }) => {
        const current = form.getValues('values');
        form.reset({ values: submitted });
        for (const [key, value] of Object.entries(current)) {
          if (submitted[key] !== value) form.setValue(`values.${key}`, value, { shouldDirty: true });
        }
        toast({ title: 'Настройки воркеров сохранены', description: result.warnings?.join(' ') || 'Будут использованы при следующем запуске ботов.' });
      },
    });
  };
  return <div className="space-y-6">
    <WorkerRuntimeStatus />
    <WorkerBotsPanel />
    <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-6 text-neutral-100">
      <section aria-labelledby="worker-placement" className="space-y-4 rounded-lg border border-neutral-800 bg-[#09090b] p-4 sm:p-6">
        <div className="space-y-2"><h2 id="worker-placement" className="text-lg font-semibold">Где и как запускать</h2>
          <p className="text-sm leading-relaxed text-neutral-400">Группировка определяет, какие боты разделяют общий обработчик и его базовую память.</p></div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">{fields(placement)}</div>
      </section>
      <section aria-labelledby="worker-sleep" className="space-y-4 rounded-lg border border-neutral-800 bg-[#09090b] p-4 sm:p-6">
        <div className="space-y-2"><h2 id="worker-sleep" className="text-lg font-semibold">Сон и скорость ответа</h2>
          <p className="text-sm leading-relaxed text-neutral-400">Значения по умолчанию для ботов без собственных настроек. После полного освобождения памяти первый ответ требует запуска Python. Общий обработчик новой версии не ограничивает количество загруженных сценариев: другие боты не ждут их засыпания.</p></div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">{fields(sleep)}</div>
      </section>
      <details className="rounded-lg border border-neutral-800 bg-[#09090b] p-4 sm:p-6">
        <summary className="cursor-pointer rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400">Дополнительные параметры</summary>
        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">{advanced.map((field) => <WorkersSettingsField key={field.env} field={field} form={form} />)}</div>
      </details>
      <div className="space-y-4 rounded-lg border border-neutral-800 bg-[#09090b] p-4 sm:p-6">
        <p className="text-sm leading-relaxed text-neutral-400">Сохранение не перезапускает ботов. Их текущая группировка и необходимость перезапуска показаны выше. Лимит отдельных обработчиков действует для прежнего режима сна и изолированных процессов; для его изменения существующую группу нужно полностью пересоздать. Окружение удалённого исполнителя меняется отдельно.</p>
        {save.isError ? <p role="alert" className="text-sm text-red-400">Не удалось сохранить: {save.error instanceof Error ? save.error.message : 'повторите попытку.'}</p> : null}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variant="outline" disabled={!isDirty || hasErrors || save.isPending} className="border-neutral-700 bg-transparent text-neutral-100 hover:bg-neutral-900">
            {save.isPending ? 'Сохраняем…' : 'Сохранить настройки'}
          </Button>
          <Button type="button" variant="ghost" disabled={!isDirty || save.isPending} onClick={() => form.reset({ values: workersSettingsValues(data) })} className="text-neutral-300 hover:bg-neutral-900">Отменить изменения</Button>
          <span aria-live="polite" className="text-xs text-neutral-400">{save.isPending ? 'Дождитесь завершения запроса' : hasErrors ? 'Исправьте значения в отмеченных полях' : isDirty ? 'Есть несохранённые изменения' : 'Нет несохранённых изменений'}</span>
        </div>
      </div>
    </form>
  </div>;
}
