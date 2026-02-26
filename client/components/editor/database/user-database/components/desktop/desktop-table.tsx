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
  /** Функция открытия панели деталей */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Функция открытия диалога */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  /** Установка выбранного пользователя */
  setSelectedUser: (user: UserBotData) => void;
  /** Установка флага показа деталей */
  setShowUserDetails: (show: boolean) => void;
  /** Установка выбранного пользователя для диалога */
  setSelectedUserForDialog: (user: UserBotData) => void;
  /** Установка флага показа диалога */
  setShowDialog: (show: boolean) => void;
  /** Прокрутка вниз */
  scrollToBottom: () => void;
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
}

/**
 * Компонент таблицы пользователей для desktop
 * @param props - Пропсы компонента
 * @returns JSX компонент таблицы
 */
export function DesktopTable(props: DesktopTableProps): React.JSX.Element {
  const { users, searchQuery } = props;

  return (
    <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[600px]">
          <DesktopTableHeader />
          <TableBody>
            {users.length === 0 ? (
              <DesktopEmptyRow searchQuery={searchQuery} />
            ) : (
              users.map((user, index) => (
                <DesktopTableRow key={user.id || index} user={user} index={index} {...props} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
