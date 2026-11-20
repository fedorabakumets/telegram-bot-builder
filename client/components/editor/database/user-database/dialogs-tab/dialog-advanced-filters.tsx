/** @fileoverview Общие дополнительные фильтры пользователей под поиском личных диалогов. */
import { AdvancedUsersFilter } from '../components/filters/advanced-users-filter';
/**
 * Переиспользует встроенные диапазоны и переменные без отдельного окна; язык находится в основных фильтрах.
 * @param props - Область проекта, бота и текущего поиска.
 * @returns Раскрываемые дополнительные условия в общем стиле пользователей.
 */
export function DialogAdvancedFilters({ projectId, tokenId, search }: {
  /** Проект диалогов. */ projectId: number;
  /** Выбранный бот либо весь проект. */ tokenId: number | null;
  /** Текущий поиск диалогов. */ search: string;
}) {
  return <div className="dialogs-advanced-filters"><AdvancedUsersFilter projectId={projectId} tokenId={tokenId} search={search} hideLanguage /></div>;
}
