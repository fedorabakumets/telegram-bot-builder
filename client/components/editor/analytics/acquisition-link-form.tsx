/** @fileoverview Мгновенная Telegram-ссылка по введённой метке без создания размещения. */
import { AcquisitionLinkBudget } from './acquisition-link-budget';
import { useState } from 'react';
import type { BotToken } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
/** Формирует обычную start-ссылку без записи источников, размещений и кодов авторизации. */
export function AcquisitionLinkForm({ projectId, timezone, tokenId, tokens }: {
  /** Проект. */ projectId: number; /** Часовой пояс расхода. */ timezone: string;
  /** Бот выбранной области. */ tokenId?: number | null;
  /** Доступные боты. */ tokens: BotToken[];
}) {
  const [bot, setBot] = useState(String(tokenId ?? (tokens.length === 1 ? tokens[0].id : '')));
  const [source, setSource] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const marker = source.trim();
  const selected = tokens.find(item => String(item.id) === bot);
  const username = selected?.botUsername?.replace(/^@/, '');
  const valid = /^[A-Za-z0-9_-]{1,64}$/.test(marker) && !/^link_/i.test(marker);
  const url = username && valid ? `https://t.me/${username}?start=${marker}` : '';
  /** Копирует текущую ссылку; изменение полей сбрасывает сообщение об успехе. */
  async function copy() {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopied(true); setError(''); }
    catch { setError('Не удалось скопировать. Выделите ссылку и скопируйте вручную.'); }
  }
  return <section className="space-y-4"><div><h3 className="text-lg font-semibold">Конструктор ссылки</h3><p className="text-sm text-muted-foreground">Введите метку источника — ссылка появится сразу. Ссылка готова к использованию.</p></div>
    <div className="analytics-form-grid"><label>Бот<select className="analytics-native-field" value={bot} onChange={event => { setBot(event.target.value); setCopied(false); setError(''); }}><option value="">Выберите бота</option>{tokens.map(item => <option key={item.id} value={item.id}>{item.name}{item.botUsername ? ` · @${item.botUsername}` : ''}</option>)}</select></label>
      <label>Метка источника<Input value={source} onChange={event => { setSource(event.target.value); setCopied(false); setError(''); }} placeholder="Например, raspred" aria-invalid={!!marker && !valid} aria-describedby="acquisition-marker-help" /></label></div>
    <p id="acquisition-marker-help" className="text-xs text-muted-foreground">От 1 до 64 символов: латинские буквы, цифры, дефис и подчёркивание. Префикс link_ зарезервирован для входа на сайт.</p>
    {selected && !username && <p role="status" className="text-sm text-muted-foreground">Укажите username бота в его настройках, чтобы получить ссылку.</p>}
    {url && <div className="analytics-report-details space-y-3"><label className="analytics-control-field text-sm"><span>Готовая ссылка</span><Input readOnly value={url} onFocus={event => event.target.select()} /></label><Button type="button" variant="outline" onClick={() => void copy()}>{copied ? 'Скопировано' : 'Скопировать ссылку'}</Button><p className="text-xs text-muted-foreground">Источник появится в статистике после запуска бота по этой ссылке. Одна метка объединяет все публикации с ней.</p></div>}
    {url && <AcquisitionLinkBudget key={`${bot}:${marker}`} projectId={projectId} tokenId={Number(bot)} marker={marker} timezone={timezone} />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>;
}
