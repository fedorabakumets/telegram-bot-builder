/** @fileoverview Профиль и сведения о демонстрационной сессии Telegram. */
import type { ReactNode } from 'react';
import { createMockAccountProfile, demoTelegramApp } from './mock-account-profile';
import type { MockTelegramAccount } from './mock-account-types';

/**
 * Показывает профиль и наличие примеров файлов после подключения.
 * @param props - Карточка демонстрационного аккаунта.
 * @returns Сведения о профиле и реквизитах.
 */
export function AccountProfileDetails({ account }: { /** Открытый аккаунт. */ account: MockTelegramAccount }) {
  if (account.status !== 'connected') return null;

  const number = Number(account.id.split('-').pop()) || 1;
  const profile = account.profile ?? createMockAccountProfile(number);
  const kind = account.sessionKind;
  /** Подпись поля и его отображаемое значение. */
  const fields: [string, ReactNode][] = [
    ['Номер телефона', profile.phone],
    ['Имя и фамилия', `${profile.firstName} ${profile.lastName}`],
    ['Юзернейм', profile.username],
    ['API ID', demoTelegramApp.id],
    ['API Hash', (
      <details>
        <summary className="cursor-pointer text-primary">Показать демо-хеш</summary>
        <code className="break-all">{demoTelegramApp.hash}</code>
      </details>
    )],
    ['Сессия', kind === 'string-session' ? 'Пример StringSession' : kind === 'tdata' || !kind ? 'Нет образца' : 'demo.session'],
    ['Telegram Desktop (tdata)', kind === 'tdata' ? 'Папка tdata' : 'Нет образца'],
    ['JSON', kind === 'session-json' ? 'demo.json' : 'Нет образца'],
  ];

  return (
    <section aria-label="Данные аккаунта" className="space-y-2">
      <h3 className="text-sm font-semibold">Данные аккаунта</h3>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {fields.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 items-start gap-2 px-3 py-2 text-xs">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
