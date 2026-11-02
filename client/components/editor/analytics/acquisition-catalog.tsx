/** @fileoverview Сохранённые ссылки и история расходов с доступными действиями. */
import { AnalyticsHeadingHint } from './analytics-heading-hint';
import { useState } from 'react';
import './acquisition-catalog.css';
import { Button } from '@/components/ui/button';
import type { AcquisitionCatalog as Catalog, AcquisitionExpense } from './acquisition-types';
import { acquisitionMoney } from './acquisition-money';
import { AcquisitionSourceTree } from './acquisition-source-tree';
import type { BotToken } from '@shared/schema';
import { Input } from '@/components/ui/input';
/** Показывает каталог. @param props - Проект, справочники и редактирование расхода. @returns Сохранённые ссылки и история оплат. */
export function AcquisitionCatalog({ projectId, catalog, onEditExpense, tokens = [] }: {
  /** Боты для публичных подписей ссылок. */ tokens?: BotToken[];
  /** Проект. */ projectId: number; /** Данные справочников. */ catalog: Catalog;
  /** Редактировать конкретную оплату. */ onEditExpense: (expense: AcquisitionExpense) => void;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  /** Копирует адрес. @param id - Идентификатор ссылки. @param url - Сохранённый адрес. @returns Завершение копирования. */
  async function copy(id: number, url: string) { try { await navigator.clipboard.writeText(url); setCopied(id); setError(''); } catch { setError('Не удалось скопировать. Выделите адрес ссылки и скопируйте вручную.'); } }
  /** Проверяет соответствие названия поиску. @param name - Название объекта. @param archive - Дата архива, сохранённая в старых данных. @returns Соответствие поиску. */
  const matches = (name: string, archive?: string | null) => !archive && name.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru'));
  /** Возвращает название размещения. @param id - Идентификатор размещения. @returns Понятная подпись. */
  const placementName = (id: number) => catalog.placements.find(item => item.id === id)?.name ?? 'Источник недоступен';
  /** Подписывает бота публичным именем. @param id - Идентификатор бота. @returns Имя без технического номера. */
  const botName = (id: number) => { const bot = tokens.find(item => item.id === id); return bot?.botUsername ? `@${bot.botUsername.replace(/^@/, '')}` : bot?.name ?? 'Бот недоступен'; };
  const sources = catalog.sources.filter(item => matches(item.name, item.archivedAt));
  const links = catalog.links.filter(item => matches(placementName(item.placementId), item.archivedAt));
  const expenses = catalog.expenses.filter(item => matches(placementName(item.placementId), item.archivedAt));
  return <div className="analytics-acquisition-catalog space-y-6">
    <div className="acquisition-catalog-toolbar"><Input aria-label="Поиск в ссылках и бюджетах" placeholder="Найти источник" value={search} onChange={event => setSearch(event.target.value)} /></div>
    <AcquisitionSourceTree projectId={projectId} catalog={{ ...catalog, sources }} />
    <details className="space-y-3"><summary className="cursor-pointer text-lg font-semibold"><AnalyticsHeadingHint label="Готовые ссылки" /></summary>{!links.length ? <p className="text-sm text-muted-foreground">Нет ссылок по выбранным условиям. Новую можно создать во вкладке «Создать ссылку».</p> : <ul className="space-y-3">{links.map(link => <li key={link.id} className="analytics-report-details space-y-2"><p className="font-medium">{catalog.placements.find(item => item.id === link.placementId)?.name ?? 'Источник'}{link.archivedAt ? ' · в архиве' : ''}</p><p className="text-xs text-muted-foreground">{botName(link.tokenId)}{link.referrerId ? ` · пригласивший ${link.referrerId}` : ''}</p><div className="flex flex-wrap items-center gap-3"><code className="min-w-0 break-all text-sm">{link.url ?? 'Обновите username бота, чтобы получить адрес'}</code><Button variant="outline" size="sm" disabled={!link.url} onClick={() => link.url && void copy(link.id, link.url)}>{copied === link.id ? 'Скопировано' : 'Копировать'}</Button></div></li>)}</ul>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</details>
    <details className="space-y-3"><summary className="cursor-pointer text-lg font-semibold"><AnalyticsHeadingHint label="История рекламных бюджетов" /></summary>{!expenses.length ? <p className="text-sm text-muted-foreground">Нет расходов по выбранным условиям.</p> : <div className="analytics-table-scroll"><table className="analytics-report-table analytics-expense-table"><thead><tr><th scope="col">Дата</th><th scope="col">Источник</th><th scope="col">Сумма</th><th scope="col">Курс, ₽ за $</th><th scope="col">Действия</th></tr></thead><tbody>{expenses.map(item => <tr key={item.id}><td>{new Date(`${item.day}T12:00:00Z`).toLocaleDateString('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}</td><td>{catalog.placements.find(placement => placement.id === item.placementId)?.name}{item.archivedAt && <p className="text-xs text-muted-foreground">Расход отменён</p>}{item.note && <details className="acquisition-expense-note"><summary>Примечание</summary><p>{item.note}</p></details>}</td><td>{acquisitionMoney(item.amount, item.currency)}</td><td>{item.exchangeRateRubPerUsd == null ? '—' : Number(item.exchangeRateRubPerUsd).toLocaleString('ru-RU', { maximumFractionDigits: 6 })}</td><td><div className="analytics-expense-actions"><Button variant="ghost" size="sm" aria-label={`Изменить расход: ${placementName(item.placementId)}`} onClick={() => onEditExpense(item)}>Изменить</Button></div></td></tr>)}</tbody></table></div>}</details>
  </div>;
}
