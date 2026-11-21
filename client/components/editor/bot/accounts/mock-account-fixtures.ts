/** @fileoverview Вымышленные боты и аккаунты для прототипа холста. */
import type { MockAccountBot, MockAccountProxy, MockTelegramAccount } from './mock-account-types';

/** Вымышленные боты, которые можно привязать к аккаунту. */
export const mockAccountBots: MockAccountBot[] = [
  { id: 'demo-bot-1', name: 'Демо: Поддержка', username: '@demo_support_bot' },
  { id: 'demo-bot-2', name: 'Демо: Уведомления', username: '@demo_alerts_bot' },
  { id: 'demo-bot-3', name: 'Демо: Каталог', username: '@demo_catalog_bot' },
];

/** Пустые параметры демонстрационного прокси. */
export const emptyMockAccountProxy: MockAccountProxy = {
  enabled: false, type: 'socks5', host: '', port: '', status: 'idle',
};

/** Портреты для вымышленных профилей взяты из https://randomuser.me/photos/. */
const extraNames = ['Анна', 'Михаил', 'Дарья', 'Артём', 'София', 'Илья', 'Вера', 'Павел'];

/** Аккаунты для первого просмотра холста проекта. */
export const initialMockAccounts: MockTelegramAccount[] = [
  {
    id: 'demo-account-1', name: 'Основной аккаунт', maskedPhone: '+7 ••• ••• •• 01',
    avatarUrl: '/demo-account-avatars/1.jpg',
    status: 'connected', botIds: ['demo-bot-1', 'demo-bot-2'], sessionKind: 'session',
    proxy: { enabled: true, type: 'socks5', host: 'proxy.example.test', port: '1080', status: 'success' },
  },
  {
    id: 'demo-account-2', name: 'Резервный аккаунт', maskedPhone: 'Номер не указан',
    avatarUrl: '/demo-account-avatars/2.jpg',
    status: 'disconnected', botIds: [], sessionKind: null, proxy: emptyMockAccountProxy,
  },
  ...extraNames.map((name, index): MockTelegramAccount => {
    const number = index + 3;
    const connected = index % 3 !== 2;
    return {
      id: `demo-account-${number}`, name, maskedPhone: `+7 ••• ••• •• ${String(number).padStart(2, '0')}`,
      avatarUrl: `/demo-account-avatars/${number}.jpg`,
      status: connected ? 'connected' : 'disconnected', botIds: index === 0 ? ['demo-bot-3'] : [],
      sessionKind: connected ? 'session' : null, proxy: emptyMockAccountProxy,
    };
  }),
];
