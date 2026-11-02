/** @fileoverview Сохранённые ссылки и история расходов с доступными действиями. */
import { useState } from 'react';
import './acquisition-catalog.css';
import { Button } from '@/components/ui/button';
import type { AcquisitionCatalog as Catalog, AcquisitionExpense } from './acquisition-types';
import { acquisitionMoney } from './acquisition-money';
import { AcquisitionSourceTree } from './acquisition-source-tree';
import { AcquisitionSourceForm } from './acquisition-source-form';
import { AcquisitionResourceActions } from './acquisition-resource-actions';
/** Показывает каталог. @param props - Проект, справочники и редактирование расхода. @returns Сохранённые ссылки и история оплат. */
export function AcquisitionCatalog({ projectId, catalog, onEditExpense }: {
  /** Проект. */ projectId: number; /** Данные справочников. */ catalog: Catalog;
  /** Редактировать конкретную оплату. */ onEditExpense: (expense: AcquisitionExpense) => void;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');
  /** Копирует адрес. @param id - Идентификатор ссылки. @param url - Сохранённый адрес. @returns Завершение копирования. */
  async function copy(id: number, url: string) { try { await navigator.clipboard.writeText(url); setCopied(id); setError(''); } catch { setError('Не удалось скопировать. Выделите адрес ссылки и скопируйте вручную.'); } }
  const source = catalog.sources.find(item => item.id === editing);
  return <div className="analytics-acquisition-catalog space-y-6">
    {source && <AcquisitionSourceForm key={source.id} projectId={projectId} source={source} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />}
    <AcquisitionSourceTree projectId={projectId} catalog={catalog} onEdit={setEditing} />
    <details className="space-y-3"><summary className="cursor-pointer text-lg font-semibold">Готовые ссылки</summary>{!catalog.links.length ? <p className="text-sm text-muted-foreground">Создайте ссылку в конструкторе выше.</p> : <ul className="space-y-3">{catalog.links.map(link => <li key={link.id} className="analytics-report-details space-y-2"><p className="font-medium">{catalog.placements.find(item => item.id === link.placementId)?.name ?? 'Источник'}{link.archivedAt ? ' · в архиве' : ''}</p><p className="text-xs text-muted-foreground">{catalog.sources.find(item => item.id === link.sourceId)?.name} · бот {link.tokenId}{link.referrerId ? ` · пригласивший ${link.referrerId}` : ''}</p><div className="flex flex-wrap items-center gap-3"><code className="min-w-0 break-all text-sm">{link.url ?? 'Обновите username бота, чтобы получить адрес'}</code><Button variant="outline" size="sm" disabled={!link.url} onClick={() => link.url && void copy(link.id, link.url)}>{copied === link.id ? 'Скопировано' : 'Копировать'}</Button><AcquisitionResourceActions projectId={projectId} resource="links" id={link.id} archived={!!link.archivedAt} /></div></li>)}</ul>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</details>
    <details className="space-y-3"><summary className="cursor-pointer text-lg font-semibold">История рекламных бюджетов</summary>{!catalog.expenses.length ? <p className="text-sm text-muted-foreground">Рекламный бюджет пока не указан.</p> : <div className="analytics-table-scroll"><table className="analytics-report-table analytics-expense-table"><thead><tr><th scope="col">Дата рекламного бюджета</th><th scope="col">Источник</th><th scope="col">Сумма</th><th scope="col">Курс, ₽ за $</th><th scope="col">Действие</th></tr></thead><tbody>{catalog.expenses.map(item => <tr key={item.id}><td>{item.day}</td><td>{catalog.placements.find(placement => placement.id === item.placementId)?.name}<p className="text-xs text-muted-foreground">{item.note}{item.archivedAt ? ' · расход отменён' : ''}</p></td><td>{acquisitionMoney(item.amount, item.currency)}</td><td>{item.exchangeRateRubPerUsd ?? 'Не указан'}</td><td><div className="analytics-expense-actions"><Button variant="ghost" size="sm" onClick={() => onEditExpense(item)}>Изменить</Button><AcquisitionResourceActions projectId={projectId} resource="expenses" id={item.id} archived={!!item.archivedAt} /></div></td></tr>)}</tbody></table></div>}</details>
  </div>;
}
