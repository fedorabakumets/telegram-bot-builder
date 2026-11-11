/**
 * @fileoverview Подключение приватного S3-бакета со страницы истории версий.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createStorageConfig, testStorageConfig } from '@/components/editor/files/hooks/storage-configs-api';

/** Поля подключения к приватному бакету. */
interface Fields {
  /** Название конфигурации. */
  name: string;
  /** Адрес S3 API. */
  endpoint: string;
  /** Регион бакета. */
  region: string;
  /** Имя бакета. */
  bucket: string;
  /** Идентификатор ключа доступа. */
  access: string;
  /** Секретный ключ доступа. */
  secret: string;
}

/** Свойства диалога подключения. */
interface Props {
  /** Сообщает странице об успешно проверенном хранилище. */
  onConnected: (storage: { id: string; name: string }) => void;
}

/** Создаёт пустую форму без сохранения секретов после закрытия. */
function emptyFields(): Fields {
  return { name: '', endpoint: '', region: '', bucket: '', access: '', secret: '' };
}

/**
 * Создаёт и проверяет отдельное приватное S3-хранилище версий.
 * @param props - Обработчик подтверждённого подключения
 * @returns Кнопка и форма подключения
 */
export function VersionS3Dialog({ onConnected }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const [fields, setFields] = useState<Fields>(emptyFields);

  /** Сохраняет конфигурацию и проверяет доступ к бакету. */
  const connect = async () => {
    setError('');
    if (!created && Object.values(fields).some(value => !value.trim())) {
      setError('Заполните все поля подключения.'); return;
    }
    setPending(true);
    try {
      let storage = created;
      if (!storage) {
        const dto = await createStorageConfig({
          name: fields.name.trim(), backend: 's3', readOnly: false,
          config: { endpointUrl: fields.endpoint.trim(), region: fields.region.trim(),
            bucket: fields.bucket.trim(), forcePathStyle: true },
          s3AccessKeyId: fields.access.trim(), s3SecretAccessKey: fields.secret,
        });
        storage = { id: dto.id, name: dto.name };
        setCreated(storage);
        setFields(current => ({ ...current, access: '', secret: '' }));
      }
      const result = await testStorageConfig(storage.id);
      if (!result.ok) throw new Error(result.message || 'Не удалось проверить доступ к бакету');
      onConnected(storage);
      setOpen(false);
      setCreated(null);
      setFields(emptyFields());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось подключить бакет');
    } finally { setPending(false); }
  };

  return <>
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Добавить S3-хранилище</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent>
      <DialogHeader><DialogTitle>Бакет истории версий</DialogTitle>
        <DialogDescription>Укажите отдельный приватный бакет. После проверки выберите его для новых версий.</DialogDescription>
      </DialogHeader>
      {!created ? <div className="grid max-h-[55vh] gap-3 overflow-auto">
        {([['name', 'Название', 'text'], ['endpoint', 'Адрес S3', 'url'], ['region', 'Регион', 'text'],
          ['bucket', 'Имя бакета', 'text'], ['access', 'Access Key ID', 'text'],
          ['secret', 'Secret Access Key', 'password']] as const).map(([key, label, type]) =>
          <div className="space-y-1" key={key}><Label htmlFor={`version-s3-${key}`}>{label}</Label>
            <Input id={`version-s3-${key}`} type={type} autoComplete={type === 'password' ? 'new-password' : 'off'}
              value={fields[key]} onChange={event => setFields({ ...fields, [key]: event.target.value })} />
          </div>)}</div> : <p className="text-sm text-muted-foreground">Конфигурация создана. Повторите проверку доступа.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>Закрыть</Button>
        <Button type="button" disabled={pending} onClick={connect}>{pending ? 'Проверка…' : created ? 'Повторить проверку' : 'Добавить и проверить'}</Button>
      </DialogFooter>
    </DialogContent></Dialog>
  </>;
}
