/** @fileoverview Настройка прокси подключаемого Telegram-аккаунта. */
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/queryClient';
import type { ProjectTelegramAccount } from '@shared/project-telegram-accounts';

/** Свойства формы прокси. */
interface AccountLiveProxyProps {
  /** Открытая карточка с несекретными параметрами. */
  account: ProjectTelegramAccount;
  /** Путь API конкретной карточки. */
  url: string;
  /** Перечитывает сохранённые параметры. */
  onSaved: () => void;
}

/**
 * Редактирует параметры прокси и проверяет допустимость его адреса.
 * @param props - Карточка и её путь API.
 * @returns Поля прокси с действиями.
 */
export function AccountLiveProxy({ account, url, onSaved }: AccountLiveProxyProps) {
  const [enabled, setEnabled] = useState(!!account.proxy);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ /** Сообщение операции. */ message: string; /** Признак ошибки. */ error: boolean }>();

  /**
   * Сохраняет прокси или проверяет его адрес в зависимости от кнопки.
   * @param event - Событие отправки формы.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const test = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'test';
    const proxy = enabled ? {
      type: values.get('type'), host: values.get('host'), port: Number(values.get('port')),
      username: values.get('username') || undefined, password: values.get('password') || undefined,
    } : null;
    setPending(true);
    try {
      let message = 'Настройки сохранены';
      if (test) {
        const checked = await apiRequest('POST', `${url}/proxy/test`, proxy);
        message = checked.message ?? 'Публичный адрес прокси проверен';
      } else {
        await apiRequest('PUT', `${url}/proxy`, { proxy });
        onSaved();
      }
      const password = form.elements.namedItem('password');
      if (!test && password instanceof HTMLInputElement) password.value = '';
      setResult({ message, error: false });
    } catch (error) {
      setResult({ message: error instanceof Error ? error.message : 'Не удалось обработать прокси', error: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Прокси Telegram" className="space-y-2">
      <h3 className="text-sm font-semibold">Прокси</h3>
      <form onSubmit={submit} autoComplete="off" className="space-y-3 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} disabled={pending} onChange={event => setEnabled(event.target.checked)} />
          Использовать прокси
        </label>
        {enabled && <>
          <label className="block space-y-1 text-xs">Протокол
            <select name="type" defaultValue={account.proxy?.type ?? 'socks5'} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
              <option value="socks5">SOCKS5</option><option value="http">HTTP</option>
            </select>
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
            <label className="min-w-0 space-y-1 text-xs">Сервер<Input name="host" defaultValue={account.proxy?.host} required /></label>
            <label className="space-y-1 text-xs">Порт<Input name="port" type="number" min="1" max="65535" defaultValue={account.proxy?.port} required /></label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="min-w-0 space-y-1 text-xs">Логин<Input name="username" /></label>
            <label className="min-w-0 space-y-1 text-xs">Пароль<Input name="password" type="password" placeholder={account.proxy?.hasPassword ? 'Введите для сохранения' : undefined} /></label>
          </div>
        </>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending}>Сохранить</Button>
          <Button type="submit" value="test" variant="outline" size="sm" disabled={pending || !enabled}>Проверить адрес</Button>
        </div>
        {result && <p role={result.error ? 'alert' : 'status'} className={result.error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{result.message}</p>}
      </form>
    </section>
  );
}
