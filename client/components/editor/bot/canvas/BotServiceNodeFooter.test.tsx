/** @fileoverview Проверки подписи аварии бота без недоказанной ошибки запуска. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BotServiceNodeFooter } from './BotServiceNodeFooter';

afterEach(cleanup);

describe('диагностика завершения на холсте', () => {
  it('не называет падение работавшего бота ошибкой запуска', () => {
    const message = 'Общий обработчик завершился: signal=SIGKILL';
    render(<BotServiceNodeFooter isRunning={false} visualStatus="failed"
      failure={{ at: '2026-11-14T11:37:12Z', message }} />);
    expect(screen.getByText(/Бот завершился с ошибкой/)).toBeTruthy();
    expect(screen.queryByText(/Запуск с ошибкой/)).toBeNull();
    expect(screen.getByTitle(new RegExp(message))).toBeTruthy();
  });

  it('сохраняет понятную подпись без текста причины', () => {
    render(<BotServiceNodeFooter isRunning={false} visualStatus="failed"
      failure={{ at: '2026-11-14T11:37:12Z' }} />);
    expect(screen.getByTitle(/Бот завершился с ошибкой/)).toBeTruthy();
  });

  it('не заменяет отказ авторизации общей аварией', () => {
    render(<BotServiceNodeFooter isRunning={false} visualStatus="invalid"
      failure={{ at: '2026-11-14T11:37:12Z' }} />);
    expect(screen.getByText('Ошибка токена')).toBeTruthy();
    expect(screen.queryByText(/Бот завершился с ошибкой/)).toBeNull();
  });
});
