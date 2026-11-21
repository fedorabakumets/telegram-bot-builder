/** @fileoverview Авторизация и импорт сессии Telegram-аккаунта проекта. */
import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/queryClient';
import { readTelegramSessionUpload, readTelegramSessionMetadata } from './telegram-session-upload';

/** Этап формы авторизации. */
type Stage = 'start' | 'code' | 'password';

/** Свойства формы подключения. */
interface AccountLiveSessionProps {
  /** Путь API конкретного аккаунта. */
  url: string;
  /** Успех изменил открытые сведения об аккаунте. */
  onSaved: (verified: boolean) => void;
  /** В хранилище уже есть сессия, ожидающая проверки. */
  pendingVerification?: boolean;
}

/**
 * Подключает аккаунт по номеру или импортирует подготовленный файл сессии.
 * @param props - Путь аккаунта и обновление состояния холста.
 * @returns Панель подключения.
 */
export function AccountLiveSession({ url, onSaved, pendingVerification }: AccountLiveSessionProps) {
  const id = useId();
  const [kind, setKind] = useState('phone');
  /** Восстанавливает шаг входа в этой вкладке без записи кода и пароля. */
  const stageKey = 'telegram-login-stage:' + url;
  const [stage, updateStage] = useState<Stage>(() => {
    const saved = sessionStorage.getItem(stageKey);
    return saved === 'password' || saved === 'code' ? saved : 'start';
  });
  /** Запоминает следующий шаг после ответа Telegram. */
  function setStage(next: Stage) {
    if (next === 'start') sessionStorage.removeItem(stageKey);
    else sessionStorage.setItem(stageKey, next);
    updateStage(next);
  }
  /** Номер текущей попытки входа для шагов кода и пароля. */
  const [loginPhone, setLoginPhone] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState(false);
  const files = kind === 'session' || kind === 'session-json';
  const phone = kind === 'phone';

  /**
   * Передаёт введённые данные только на выбранном этапе.
   * @param event - Отправка формы подключения.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || kind === 'tdata') return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true);
    setMessage('');
    setFailure(false);
    try {
      const app = { apiId: String(values.get('apiId') ?? ''), apiHash: String(values.get('apiHash') ?? '') };
      const path = phone
        ? stage === 'code' ? '/auth/sign-in' : stage === 'password' ? '/auth/sign-in-2fa' : '/auth/send-code'
        : '/import';
      const body = phone
        ? stage === 'code' ? { code: values.get('code') } : stage === 'password'
          ? { password: values.get('password') } : { ...app, phone: values.get('phone') }
        : { kind, ...app, ...(files
          ? { fileBase64: await readTelegramSessionUpload(values.get('session')), metadata: kind === 'session-json'
            ? await readTelegramSessionMetadata(values.get('metadata')) : undefined }
          : { sessionString: values.get('sessionString') }) };
      const result = await apiRequest('POST', `${url}${path}`, body);
      if (result.ok === false) throw new Error(result.message || 'Не удалось подключить аккаунт');
      form.reset();
      if (phone && stage === 'start') setLoginPhone(String(values.get('phone') ?? '').trim());
      if (result.stage === 'code' || result.stage === 'password') setStage(result.stage);
      else {
        setStage('start');
        setMessage(result.stage === 'pending' ? result.message ?? 'Сессия сохранена и ожидает проверки' : 'Аккаунт подключён');
        onSaved(result.stage === 'done');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось подключить аккаунт');
      setFailure(true);
    } finally {
      setPending(false);
    }
  }

  /** Проверяет сохранённую сессию без повторной отправки файла. */
  async function retryVerification() {
    if (pending) return;
    setPending(true);
    setFailure(false);
    setMessage('');
    try {
      const result = await apiRequest('POST', `${url}/auth/verify`, {});
      if (result.ok === false) throw new Error(result.message || 'Не удалось проверить сессию');
      setMessage(result.stage === 'done' ? 'Аккаунт подключён' : result.message ?? 'Сессия ещё не подтверждена');
      onSaved(result.stage === 'done');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось проверить сессию');
      setFailure(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Сессия Telegram" className="space-y-2">
      <h3 className="text-sm font-semibold">Подключение Telegram</h3>
      <div className="space-y-3 rounded-lg border border-border p-3">
        {pendingVerification && <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Сохранённая сессия ожидает проверки.</p>
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => void retryVerification()}>Повторить проверку</Button>
        </div>}
        <Label htmlFor={id}>Способ подключения</Label>
        <select id={id} value={kind} disabled={pending || stage !== 'start'}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          onChange={event => { setKind(event.target.value); setMessage(''); }}>
          <option value="phone">Вход по номеру</option>
          <option value="string-session">Строка сессии</option>
          <option value="session">Файл .session</option>
          <option value="session-json">Файлы .session и .json</option>
          <option value="tdata">Telegram Desktop (tdata)</option>
        </select>
        {kind === 'tdata' ? (
          <p className="text-sm text-muted-foreground">Импорт tdata пока недоступен. Выберите вход по номеру или файл .session.</p>
        ) : (
          <form key={`${kind}-${stage}`} className="space-y-3" onSubmit={submit} autoComplete="off">
            {stage === 'start' && (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="min-w-0 space-y-1 text-xs">API ID<Input name="apiId" inputMode="numeric" required={kind !== 'session-json'} /></label>
                <label className="min-w-0 space-y-1 text-xs">API Hash<Input name="apiHash" type="password" required={kind !== 'session-json'} /></label>
              </div>
            )}
            {phone && stage === 'start' && <label className="block space-y-1 text-xs">Номер телефона<Input name="phone" type="tel" placeholder="+12345678900" required /></label>}
            {phone && stage !== 'start' && loginPhone && <p className="text-sm">Номер телефона <bdi>{loginPhone}</bdi></p>}
            {phone && stage === 'code' && <label className="block space-y-1 text-xs">Код из Telegram<Input name="code" inputMode="numeric" autoComplete="one-time-code" required /></label>}
            {phone && stage === 'password' && <label className="block space-y-1 text-xs">Пароль двухэтапной проверки<Input name="password" type="password" required /></label>}
            {files && <label className="block space-y-1 text-xs">Файл сессии<Input name="session" type="file" accept=".session" required /></label>}
            {kind === 'session-json' && <label className="block space-y-1 text-xs">Дополнительные данные<Input name="metadata" type="file" accept=".json,application/json" required /></label>}
            {kind === 'string-session' && <label className="block space-y-1 text-xs">Строка сессии<Input name="sessionString" type="password" required /></label>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" type="submit" disabled={pending}>
                {pending ? 'Подключение…' : phone ? stage === 'start' ? 'Отправить код' : 'Подтвердить' : 'Импортировать'}
              </Button>
              {stage !== 'start' && <Button size="sm" type="button" variant="outline" disabled={pending}
                onClick={() => { setStage('start'); setMessage(''); }}>Начать заново</Button>}
            </div>
          </form>
        )}
        {message && <p role={failure ? 'alert' : 'status'} className={failure ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{message}</p>}
      </div>
    </section>
  );
}
