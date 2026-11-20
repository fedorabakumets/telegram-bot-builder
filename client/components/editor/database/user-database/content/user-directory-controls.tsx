/** @fileoverview Общее состояние серверного фильтра источника и сортировки таблицы пользователей. */
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { SortField, SortDirection } from '../types';
import type { UserDirectoryResult } from '@shared/user-directory-result';
import type { AdvancedUserFilters } from '@shared/user-advanced-filters';
/** Состояние дополнительных контролов списка. */
interface DirectoryControls {
  /** Область справочников и переменных: пользователи либо личные диалоги. */
  audience: 'users' | 'dialogs';
  /** Дополнительные ограничения по активности, датам, переменным и действиям. */
  advanced: AdvancedUserFilters;
  /** Применяет проверенный набор дополнительных фильтров. */
  setAdvanced: (value: AdvancedUserFilters) => void;
  /** Итог последнего загруженного результата. */
  result?: UserDirectoryResult;
  /** Обновляет итог после серверной фильтрации. */
  setResult: (value: UserDirectoryResult | undefined) => void;
  /** Выбранный фильтр Premium. */
  premium: string;
  /** Устанавливает фильтр Premium для серверного запроса. */
  setPremium: (value: string) => void;
  /** Статус пользователя с учётом удаления и блокировки. */
  status: string;
  /** Устанавливает статус. */
  setStatus: (value: string) => void;
  /** Выбранная подпись источника либо все источники. */
  source: string;
  /** Устанавливает источник. */
  setSource: (value: string) => void;
  /** Поле сортировки, выбранное в заголовке или списке. */
  field?: SortField;
  /** Направление сортировки. */
  direction: SortDirection;
  /** Устанавливает поле и направление сортировки. */
  sort: (field: SortField, direction: SortDirection) => void;
}
/** Отсутствие провайдера сохраняет прежнее поведение диалогов. */
const Controls = createContext<DirectoryControls | null>(null);
/** Возвращает контролы текущей вкладки. @returns Состояние либо отсутствие провайдера. */
export function useDirectoryControls() { return useContext(Controls); }
/** Предоставляет состояние только панели пользователей. @param props - Содержимое панели. @returns Провайдер контролов. */
export function UserDirectoryControls({ children, audience = 'users' }: { /** Содержимое панели. */ children: ReactNode; /** Область повторно используемых фильтров. */ audience?: 'users' | 'dialogs' }) {
  const [source, setSource] = useState('');
  const [advanced, setAdvanced] = useState<AdvancedUserFilters>({});
  const [status, setStatus] = useState('all');
  const [premium, setPremium] = useState('all');
  const [result, setResult] = useState<UserDirectoryResult>();
  const [order, setOrder] = useState<{ /** Поле сортировки. */ field?: SortField; /** Направление сортировки. */ direction: SortDirection }>({ direction: 'desc' });
  return <Controls.Provider value={{ audience, advanced, setAdvanced, source, setSource, status, setStatus, premium, setPremium, result, setResult,
    ...order, sort: (field, direction) => setOrder({ field, direction }) }}>{children}</Controls.Provider>;
}
