/** @fileoverview Локальная форма демонстрационных настроек прокси Telegram-аккаунта. */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import * as React from 'react';
import type { MockAccountProxy } from './mock-account-types';

interface AccountMockProxyProps {
  /** Демонстрационные настройки прокси выбранного аккаунта. */
  proxy: MockAccountProxy;
  /** Обновляет настройки в состоянии прототипа. */
  onChange: (proxy: MockAccountProxy) => void;
}

/**
 * Показывает форму прокси и проверяет введённые параметры локально.
 * @param props - Текущие параметры и обработчик обновления.
 * @returns Раздел настроек прокси.
 */
export function AccountMockProxy({ proxy, onChange }: AccountMockProxyProps) {
  const id = React.useId();
  const port = Number(proxy.port);
  const hostValid = proxy.host.trim().length > 0 && !/[\s/@]/.test(proxy.host.trim());
  const portValid = /^\d{1,5}$/.test(proxy.port) && port > 0 && port <= 65535;
  const hostInvalid = proxy.status === 'error' && !hostValid;
  const portInvalid = proxy.status === 'error' && !portValid;

  /**
   * Применяет значения и сбрасывает результат предыдущей проверки.
   * @param patch - Изменённые параметры прокси.
   */
  const update = (patch: Partial<MockAccountProxy>) => onChange({ ...proxy, ...patch, status: 'idle' });

  /** Проверяет, подходят ли введённые параметры для демонстрации. */
  const verify = () => onChange({ ...proxy, status: hostValid && portValid ? 'success' : 'error' });

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id={`${id}-title`} className="text-sm font-medium">Прокси</h3>
        <Switch aria-label="Использовать прокси" checked={proxy.enabled} onCheckedChange={(enabled) => update({ enabled })} />
      </div>
      {proxy.enabled && (
        <div className="min-w-0 space-y-3">
          <div className="grid gap-2">
            <Label htmlFor={`${id}-type`}>Тип прокси</Label>
            <Select value={proxy.type} onValueChange={(type) => {
              if (type === 'socks5' || type === 'http') update({ type });
            }}>
              <SelectTrigger id={`${id}-type`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="socks5">SOCKS5</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor={`${id}-host`}>Адрес</Label>
              <Input id={`${id}-host`} value={proxy.host} placeholder="proxy.example.test" autoComplete="off"
                aria-invalid={hostInvalid} aria-describedby={hostInvalid ? `${id}-result` : undefined}
                onChange={(event) => update({ host: event.currentTarget.value })} />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor={`${id}-port`}>Порт</Label>
              <Input id={`${id}-port`} value={proxy.port} placeholder="1080" autoComplete="off" inputMode="numeric"
                aria-invalid={portInvalid} aria-describedby={portInvalid ? `${id}-result` : undefined}
                onChange={(event) => update({ port: event.currentTarget.value })} />
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={verify}>Проверить параметры</Button>
          {proxy.status !== 'idle' && (
            <p id={`${id}-result`} role="status" className={proxy.status === 'error' ? 'text-xs text-destructive' : 'text-xs text-emerald-500'}>
              {proxy.status === 'error'
                ? 'Укажите адрес без схемы и порт от 1 до 65535.'
                : 'Демо-проверка пройдена. Соединение с прокси не устанавливалось.'}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
