/**
 * @fileoverview Подключение S3-хранилища для резервных копий.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createStorageConfig, testStorageConfig } from '@/components/editor/files/hooks/storage-configs-api';
import type { RuntimeStorageOption } from './runtime-types';

/** Свойства диалога подключения хранилища. */
interface Props {
  /** Передаёт проверенное хранилище в форму настроек. */
  onConnected: (storage: RuntimeStorageOption) => void;
}

/**
 * Подключает отдельный S3 без изменения хранилища загрузок и расписания.
 * @param props - Обработчик выбора проверенного хранилища
 * @returns Кнопка и диалог подключения
 */
export function BackupS3Dialog({ onConnected }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<RuntimeStorageOption | null>(null);
  const [fields, setFields] = useState({ name: '', endpoint: '', region: '', bucket: '', access: '', secret: '' });

  /** Сохраняет новое хранилище и проверяет доступ к нему. */
  const connect = async () => {
    setError('');
    if (!created && Object.values(fields).some((value) => !value.trim())) {
      setError('Заполните все поля подключения.');
      return;
    }
    setPending(true);
    try {
      let storage = created;
      if (!storage) {
        const dto = await createStorageConfig({
          name: fields.name.trim(), backend: 's3', readOnly: false,
          config: { endpointUrl: fields.endpoint.trim(), region: fields.region.trim(), bucket: fields.bucket.trim(), forcePathStyle: true },
          s3AccessKeyId: fields.access.trim(), s3SecretAccessKey: fields.secret,
        });
        storage = { id: dto.id, name: dto.name, backend: dto.backend, public: false };
        setCreated(storage);
        setFields((current) => ({ ...current, access: '', secret: '' }));
      }
      const result = await testStorageConfig(storage.id);
      if (!result.ok) throw new Error(result.message || 'Не удалось проверить доступ к хранилищу');
      onConnected(storage);
      setOpen(false);
      setCreated(null);
      setFields({ name: '', endpoint: '', region: '', bucket: '', access: '', secret: '' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключить хранилище');
    } finally {
      setPending(false);
    }
  };

  return <>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Подключить S3</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Хранилище для бэкапов</DialogTitle>
          <DialogDescription>Используйте приватный бакет. Проверьте, что он не доступен по публичной ссылке.</DialogDescription>
        </DialogHeader>
        {!created ? <div className="grid max-h-[55vh] gap-3 overflow-auto">
          {([['name', 'Название', 'text'], ['endpoint', 'Адрес S3 (endpoint)', 'url'], ['region', 'Регион', 'text'], ['bucket', 'Имя бакета', 'text'], ['access', 'Access Key ID', 'text'], ['secret', 'Secret Access Key', 'password']] as const).map(([key, label, type]) =>
            <div className="space-y-1" key={key}><Label htmlFor={`backup-s3-${key}`}>{label}</Label>
              <Input id={`backup-s3-${key}`} type={type} autoComplete={key === 'secret' ? 'new-password' : 'off'} value={fields[key]} onChange={(event) => setFields({ ...fields, [key]: event.target.value })} />
            </div>)}
        </div> : <p className="text-sm text-muted-foreground">Хранилище создано. Повторите проверку доступа или настройте его в разделе хранилищ.</p>}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Закрыть</Button>
          <Button type="button" disabled={pending} onClick={connect}>{pending ? 'Проверка…' : created ? 'Повторить проверку' : 'Подключить и проверить'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
