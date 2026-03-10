/**
 * @fileoverview Компонент таблицы пользователей для desktop
 * @description Отображает таблицу пользователей со всеми ячейками
 */

import { Table, TableBody } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { DesktopTableHeader } from './desktop-table-header';
import { DesktopEmptyRow } from './desktop-empty-row';
import { DesktopTableRow } from './desktop-table-row';

/**
 * Пропсы компонента DesktopTable
 */
interface DesktopTableProps {
  /** Список пользователей */
  users: UserBotData[];
  /** Поисковый запрос */
  searchQuery: string;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
  /** Количество видимых колонок */
  visibleColumns?: number;
  /** ID проекта */
  projectId: number;
}

/**
 * Компонент таблицы пользователей для desktop
 * @param props - Пропсы компонента
 * @returns JSX компонент таблицы
 */
export function DesktopTable(props: DesktopTableProps): React.JSX.Element {
  const { users, searchQuery, visibleColumns, projectId, formatUserName, deleteUserMutation } = props;

  return (
    <div className="rounded-lg border border-border bg-card/40 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <DesktopTableHeader visibleColumns={visibleColumns} />
          <TableBody>
            {users.length === 0 ? (
              <DesktopEmptyRow searchQuery={searchQuery} />
            ) : (
              users.map((user, index) => (
                <DesktopTableRow key={user.id || index} user={user} index={index} visibleColumns={visibleColumns} projectId={projectId} formatUserName={formatUserName} deleteUserMutation={deleteUserMutation} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
