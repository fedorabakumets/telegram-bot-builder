/** @fileoverview Проверки видимого состояния защиты webhook без раскрытия сохранённого токена. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BotLaunchSettings } from './BotLaunchSettings';

vi.mock('./use-bot-launch-settings', () => ({ useBotLaunchSettings: () => ({
  localMode: 'webhook', localBaseUrl: '', localSecret: '', inheritedBaseUrl: 'https://api.example',
  effectiveBaseUrl: 'https://api.example', handleModeChange: vi.fn(), handleBaseUrlChange: vi.fn(), handleSecretChange: vi.fn(),
}) }));
afterEach(cleanup);

it('показывает сохранённую защиту маской и не заполняет поле секретом', () => {
  render(<BotLaunchSettings tokenId={58} projectId={12} launchMode="webhook"
    webhookBaseUrl={null} webhookSecretToken={null} hasWebhookSecret />);
  expect(screen.getByPlaceholderText('•••••••• — токен сохранён')).toHaveProperty('value', '');
  expect(screen.getByText(/Защита настроена/)).toBeTruthy();
});

it('объясняет автоматическое создание для бота без секрета', () => {
  render(<BotLaunchSettings tokenId={58} projectId={12} launchMode="webhook"
    webhookBaseUrl={null} webhookSecretToken={null} hasWebhookSecret={false} />);
  expect(screen.getByText(/Токен защиты будет создан автоматически/)).toBeTruthy();
});
