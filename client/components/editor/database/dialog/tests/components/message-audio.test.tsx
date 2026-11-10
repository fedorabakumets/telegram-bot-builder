/** @fileoverview Проверка управления аудиозаписью и ошибок воспроизведения. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MessageAudio } from '../../components/message-audio';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Плеер сообщения', () => {
  it('перематывает запись и синхронизирует показанное время с аудио', () => {
    const { container } = render(<MessageAudio src="/voice.ogg" duration={160} />);
    const audio = container.querySelector('audio')!;
    fireEvent.change(screen.getByRole('slider', { name: 'Перемотка записи' }), { target: { value: '45' } });
    expect(audio.currentTime).toBe(45);
    audio.currentTime = 78;
    fireEvent.timeUpdate(audio);
    expect(screen.getByText('1:18 / 2:40')).toBeInTheDocument();
  });

  it('показывает паузу после запуска и меняет настоящую скорость аудио', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const { container } = render(<MessageAudio src="/voice.ogg" duration={160} />);
    fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести запись' }));
    await waitFor(() => expect(play).toHaveBeenCalledOnce());
    const audio = container.querySelector('audio')!;
    fireEvent.play(audio);
    expect(screen.getByRole('button', { name: 'Приостановить запись' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Скорость воспроизведения/ }));
    expect(audio.playbackRate).toBe(1.5);
    fireEvent.ended(audio);
    expect(screen.getByRole('button', { name: 'Воспроизвести запись' })).toBeInTheDocument();
  });

  it('объясняет отказ воспроизведения и даёт повторить запуск', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValueOnce(new Error('Недоступно')).mockResolvedValue();
    render(<MessageAudio src="/voice.ogg" />);
    fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести запись' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось воспроизвести');
    fireEvent.click(screen.getByRole('button', { name: 'Воспроизвести запись' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
