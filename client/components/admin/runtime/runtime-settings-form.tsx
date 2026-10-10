/**
 * @fileoverview Форма раздела настроек рантайма
 * @module components/admin/runtime/runtime-settings-form
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RuntimeFieldControl, type RuntimeFormShape } from './runtime-field-control';
import { runtimeFormValue, type RuntimeGroupView } from './runtime-types';
import { useRunRuntimeBackup, useSaveRuntimeSettings } from './use-runtime-settings';
import { BackupTelegramTestButton } from './backup-telegram-test-button';

/** Схема словаря строк */
const schema = z.object({ values: z.record(z.string(), z.string()) });

/**
 * Собирает тело сохранения: пустой секрет не отправляется
 * @param data - Раздел
 * @param values - Значения формы
 * @returns Поля для PUT
 */
function payloadOf(data: RuntimeGroupView, values: Record<string, string>): Record<string, string> {
  const payload: Record<string, string> = {};
  for (const field of data.fields) {
    const raw = values[field.env] ?? '';
    if (field.kind === 'secret' && !raw.trim()) continue;
    payload[field.env] = raw;
  }
  return payload;
}

/**
 * Форма по метаданным раздела
 * @param props - Загруженный раздел
 * @returns JSX элемент формы
 */
export function RuntimeSettingsForm({ data }: { data: RuntimeGroupView }) {
  const { toast } = useToast();
  const save = useSaveRuntimeSettings(data.id);
  const backup = useRunRuntimeBackup();
  const form = useForm<RuntimeFormShape>({
    resolver: zodResolver(schema),
    defaultValues: { values: {} },
  });

  useEffect(() => {
    const values: Record<string, string> = {};
    for (const field of data.fields) values[field.env] = runtimeFormValue(field);
    form.reset({ values });
  }, [data, form]);

  const onSubmit = (shape: RuntimeFormShape) => {
    save.mutate(payloadOf(data, shape.values), {
      onSuccess: (result: { warnings?: string[] }) => {
        toast({
          title: 'Настройки сохранены',
          description: result.warnings?.filter(Boolean).join(' ') || undefined,
        });
      },
      onError: (error: Error & { message?: string }) => {
        toast({ title: 'Ошибка сохранения', description: error.message, variant: 'destructive' });
      },
    });
  };

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
          {data.fields.map((field) => (
            <RuntimeFieldControl key={field.env} field={field} storages={data.storages} register={form.register} />
          ))}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Сохранить
          </Button>
          {data.id === 'backups' ? (
            <Button
              type="button"
              variant="outline"
              disabled={backup.isPending}
              onClick={() => backup.mutate(undefined, {
                onSuccess: (result: { warnings?: string[] }) => toast({
                  title: 'Бэкап снят', description: result.warnings?.join(' ') || undefined,
                }),
                onError: (error: Error) => toast({ title: 'Бэкап не снят', description: error.message, variant: 'destructive' }),
              })}
            >
              {backup.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Снять сейчас
            </Button>
          ) : null}
          {data.id === 'backups' ? <BackupTelegramTestButton disabled={form.formState.isDirty || save.isPending} /> : null}
        </CardFooter>
      </form>
    </Card>
  );
}
