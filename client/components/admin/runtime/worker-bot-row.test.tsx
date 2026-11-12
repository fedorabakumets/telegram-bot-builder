/** @fileoverview Проверки отличий выбранного режима, телеметрии и необходимости применения. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { WorkerBotRuntimeRow } from '@shared/worker-bot-runtime';
import { WorkerBotActualMode, WorkerBotActivity, WorkerBotApplication, WorkerBotSelectedMode } from './worker-bot-row';

/** Создаёт безопасную строку с несовпадающим выбором и текущим режимом. */
function row(overrides: Partial<WorkerBotRuntimeRow> = {}): WorkerBotRuntimeRow {
  return { tokenId: 30, projectId: 40, projectName: 'Проект', botName: 'Напоминалка', botUsername: null,
    configuredMode: 'process', effectiveMode: 'process', source: 'bot', launchMode: 'polling',
    status: 'running', desiredStatus: 'running', actualMode: 'direct', workerKey: 0,
    activity: 'active', restartRequired: true, transportCompatible: true, configurationError: null, ...overrides };
}
afterEach(cleanup);

it('различает выбранное освобождение памяти и фактическую постоянную работу', () => {
  const bot = row();
  render(<><WorkerBotSelectedMode bot={bot} /><WorkerBotActualMode bot={bot} /><WorkerBotApplication bot={bot} /></>);
  expect(screen.getByText('Освобождение памяти')).toBeTruthy();
  expect(screen.getByText('Постоянная работа')).toBeTruthy();
  expect(screen.getByText('Нужен перезапуск')).toBeTruthy();
  expect(screen.getByText('Группа 0')).toBeTruthy();
});

it('неизвестный исполнитель не становится спящим или применённым режимом', () => {
  const bot = row({ actualMode: null, activity: 'unknown', restartRequired: null, workerKey: null });
  render(<><WorkerBotActualMode bot={bot} /><WorkerBotActivity bot={bot} /><WorkerBotApplication bot={bot} /></>);
  expect(screen.getByText('Не подтверждён')).toBeTruthy();
  expect(screen.getByText('Нет данных')).toBeTruthy();
  expect(screen.getByText('Нет подтверждения')).toBeTruthy();
  expect(screen.queryByText('Спит')).toBeNull();
  expect(screen.queryByText('Перезапуск не нужен')).toBeNull();
});

it('остановленному боту объясняет применение при следующем запуске', () => {
  render(<WorkerBotApplication bot={row({ activity: 'stopped', restartRequired: false })} />);
  expect(screen.getByText('При следующем запуске')).toBeTruthy();
});

it('наследование и несовместимость транспорта видимы отдельно', () => {
  render(<WorkerBotSelectedMode bot={row({ source: 'server', configuredMode: null, launchMode: 'webhook', transportCompatible: false })} />);
  expect(screen.getByText('Общая настройка · Webhook')).toBeTruthy();
  expect(screen.getByText('Режим несовместим с транспортом')).toBeTruthy();
});

it('ошибка настройки не подменяется несовместимостью транспорта или успешным применением', () => {
  const bot = row({ effectiveMode: null, configurationError: 'Неизвестный режим бота', transportCompatible: false, restartRequired: false });
  render(<><WorkerBotSelectedMode bot={bot} /><WorkerBotApplication bot={bot} /></>);
  expect(screen.getByText('Неизвестный режим бота')).toBeTruthy();
  expect(screen.getByText('Исправьте настройку')).toBeTruthy();
  expect(screen.queryByText('Режим несовместим с транспортом')).toBeNull();
  expect(screen.queryByText('Перезапуск не нужен')).toBeNull();
});
