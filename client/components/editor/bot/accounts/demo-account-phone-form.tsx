/** @fileoverview Два локальных шага демонстрационного входа в Telegram по номеру. */
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { demoTelegramApp } from './mock-account-profile';

const demoCode = '12345';

/** Действия формы демонстрационного входа. */
interface DemoAccountPhoneFormProps {
  /** Закрывает форму и оставляет текущую привязку. */
  onCancel: () => void;
  /** Создаёт аккаунт с подтверждённым в демо номером. */
  onConnect: (phone: string) => void;
}

/**
 * Имитирует запрос и подтверждение кода без сетевых запросов.
 * @param props - Действия подтверждения и отмены.
 * @returns Форма демонстрационного подключения.
 */
export function DemoAccountPhoneForm({ onCancel, onConnect }: DemoAccountPhoneFormProps) {
  const id = useId();
  /** Реквизиты для локальной проверки формы. */
  const [apiId, setApiId] = useState<string>(String(demoTelegramApp.id));
  const [apiHash, setApiHash] = useState<string>(demoTelegramApp.hash);
  const [phone, setPhone] = useState('+1 202 555 0142');
  const [code, setCode] = useState('');
  const [confirmedPhone, setConfirmedPhone] = useState('');
  const [error, setError] = useState('');

  /** Проверяет формат номера и переходит к демонстрационному коду. */
  const requestCode = () => {
    const value = phone.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{6,14}$/.test(value)) {
      setError('Введите номер в международном формате.');
      return;
    }
    setError('');
    setConfirmedPhone(value);
    setPhone('');
  };

  /** Проверяет демонстрационный код и завершает подключение. */
  const confirmCode = () => {
    if (code.trim() === demoCode) onConnect(confirmedPhone);
    else setError('Введите демонстрационный код 12345.');
  };

  return (
    <div className="mt-3 space-y-2 rounded-md border border-border p-3">
      {!confirmedPhone && (
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 space-y-1">
            <Label htmlFor={`${id}-api-id`} className="text-xs">API ID</Label>
            <Input id={`${id}-api-id`} value={apiId} inputMode="numeric" onChange={event => setApiId(event.target.value)} className="h-8 text-xs" />
          </div>
          <div className="min-w-0 space-y-1">
            <Label htmlFor={`${id}-api-hash`} className="text-xs">API Hash</Label>
            <Input id={`${id}-api-hash`} type="password" value={apiHash} onChange={event => setApiHash(event.target.value)} className="h-8 text-xs" />
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">Тестовые реквизиты подставлены автоматически.</p>
        </div>
      )}
      <Label htmlFor={id} className="text-xs">{confirmedPhone ? 'Код подтверждения' : 'Номер телефона'}</Label>
      {confirmedPhone ? (
        <Input key="code" id={id} value={code} onChange={event => setCode(event.target.value)}
          className="h-8 text-xs" inputMode="numeric" autoComplete="off" />
      ) : (
        <Input key="phone" id={id} value={phone} onChange={event => setPhone(event.target.value)}
          className="h-8 text-xs" type="tel" autoComplete="off" />
      )}
      {confirmedPhone && <p className="text-xs text-muted-foreground">Демо-код {demoCode}. Сообщение не отправляется.</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={confirmedPhone ? confirmCode : requestCode}>
          {confirmedPhone ? 'Подключить аккаунт' : 'Получить демо-код'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Отмена</Button>
      </div>
    </div>
  );
}
