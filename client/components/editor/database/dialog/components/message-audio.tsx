/** @fileoverview Компактный аудиоплеер сообщений с доступной перемоткой. */
import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { CopyFileIdButton } from './copy-file-id-button';

/** Свойства аудиозаписи сообщения. */
interface MessageAudioProps {
  /** Адрес аудиофайла через прокси или локальное хранилище. */
  src: string;
  /** Идентификатор Telegram для копирования. */
  fileId?: string;
  /** Длительность из метаданных Telegram в секундах. */
  duration?: number;
  /** Подпись типа записи или имя файла. */
  label?: string;
}

/**
 * Форматирует время записи без дробной части.
 * @param seconds - Количество секунд
 * @returns Время в формате минуты:секунды
 */
function audioTime(seconds: number): string {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

/**
 * Показывает плеер с отдельной полосой перемотки на всю ширину сообщения.
 * @param props - Источник, подпись и метаданные аудио
 * @returns Управление аудиозаписью
 */
export function MessageAudio({ src, fileId, duration = 0, label = 'Аудиозапись' }: MessageAudioProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [length, setLength] = useState(duration);
  const [speed, setSpeed] = useState(1);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(false);
  /** Запускает запись или ставит её на паузу, обрабатывая отказ браузера. */
  async function togglePlayback() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) { element.pause(); return; }
    setError(false);
    setWaiting(true);
    try { await element.play(); }
    catch { setError(true); }
    finally { setWaiting(false); }
  }
  /** Переключает скорость записи, сохраняя текущее положение. */
  function changeSpeed() {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    if (audio.current) audio.current.playbackRate = next;
    setSpeed(next);
  }
  return (
    <div className="w-[280px] max-w-full rounded-lg border border-border bg-background p-3">
      <audio ref={audio} src={src} preload="metadata"
        onLoadedMetadata={() => { const value = audio.current?.duration; if (value && Number.isFinite(value)) setLength(value); }}
        onTimeUpdate={() => setCurrent(audio.current?.currentTime ?? 0)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setWaiting(false); }}
        onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)}
        onError={() => { setError(true); setPlaying(false); setWaiting(false); }} />
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Приостановить запись' : 'Воспроизвести запись'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" title={label}>{label}</p>
          <p className="text-xs tabular-nums text-muted-foreground">{audioTime(current)} / {audioTime(length)}</p>
        </div>
        <button type="button" onClick={changeSpeed} aria-label={`Скорость воспроизведения ${speed}. Изменить скорость`}
          className="shrink-0 rounded px-1.5 py-1 text-xs tabular-nums text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{speed}×</button>
        {fileId && <CopyFileIdButton fileId={fileId} />}
      </div>
      <input type="range" min={0} max={length || 1} step={0.1} value={Math.min(current, length || 1)} disabled={!length}
        aria-label="Перемотка записи" aria-valuetext={`${audioTime(current)} из ${audioTime(length)}`}
        onChange={(event) => { const value = Number(event.target.value); if (audio.current) audio.current.currentTime = value; setCurrent(value); }}
        className="mt-2 block h-5 w-full cursor-pointer accent-primary disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      {error ? <p role="alert" className="mt-1 text-xs text-destructive">Не удалось воспроизвести запись. Попробуйте ещё раз.</p>
        : waiting && <p role="status" className="mt-1 text-xs text-muted-foreground">Загрузка записи…</p>}
    </div>
  );
}
