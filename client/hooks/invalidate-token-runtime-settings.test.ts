/** @fileoverview Проверки точечного обновления режима исполнения и восстановления пропущенных событий. */
import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { invalidateRuntimeSettingsAfterReconnect, invalidateTokenRuntimeSettings } from './invalidate-token-runtime-settings';

/**
 * Заполняет кэш разных проектов и ботов без активных сетевых запросов.
 * @returns Клиент кэша и проверяемые адреса
 */
function setup() {
  const client = new QueryClient();
  const urls = [
    '/api/projects/40/tokens',
    '/api/projects/40/tokens/31/runtime-settings',
    '/api/projects/40/tokens/31/env-variables',
    '/api/projects/40/tokens/32/runtime-settings',
    '/api/projects/41/tokens/31/runtime-settings',
    '/api/projects/40/tokens/31/logs',
  ];
  urls.forEach((url) => client.setQueryData([url], { mode: 'direct' }));
  return { client, urls };
}

it('событие бота обновляет только его режим и окружение, сохраняя текущие данные до ответа API', () => {
  const { client, urls } = setup();
  invalidateTokenRuntimeSettings(client, 40, 31);
  expect(urls.map((url) => client.getQueryState([url])?.isInvalidated)).toEqual([false, true, true, false, false, false]);
  expect(client.getQueryData([urls[1]])).toEqual({ mode: 'direct' });
  client.clear();
});

it('событие без токена не затрагивает другие настройки', () => {
  const { client, urls } = setup();
  invalidateTokenRuntimeSettings(client, 40);
  expect(urls.every((url) => !client.getQueryState([url])?.isInvalidated)).toBe(true);
  client.clear();
});

it('переподключение отдельного проекта восстанавливает настройки и список только этого проекта', () => {
  const { client, urls } = setup();
  invalidateRuntimeSettingsAfterReconnect(client, 40);
  expect(urls.map((url) => client.getQueryState([url])?.isInvalidated)).toEqual([true, true, true, true, false, false]);
  client.clear();
});

it('переподключение общей подписки восстанавливает настройки всех проектов, не затрагивая логи', () => {
  const { client, urls } = setup();
  invalidateRuntimeSettingsAfterReconnect(client);
  expect(urls.map((url) => client.getQueryState([url])?.isInvalidated)).toEqual([true, true, true, true, true, false]);
  client.clear();
});
