/**
 * @fileoverview Компонент строки таблицы пользователей
 * @description Объединяет все ячейки в одну строку
 */

import { TableRow } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { DesktopUserCell } from './desktop-user-cell';
import { DesktopStatusCell } from './desktop-status-cell';
import { DesktopMessagesCell } from './desktop-messages-cell';
import { UserResponsesPreview } from '../../../responses-table/components/user-responses-preview';
import { DesktopDateCell } from './desktop-date-cell';
import { DesktopActionsCell } from './desktop-actions-cell';

/**
 * Пропсы компонента DesktopTableRow
 */
interface DesktopTableRowProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Индекс в списке */
  index: number;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Функция открытия панели деталей */
  onOpenUserDetailsPanel?: (user: UserBotData) => void;
  /** Функция открытия диалога */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Функция переключения статуса */
  handleUserStatusToggle: (user: UserBotData, field: 'isActive' | 'isBlocked' | 'isPremium') => void;
  /** Мутация удаления пользователя */
  deleteUserMutation: any;
}

/**
 * Компонент строки таблицы пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент строки
 */
export function DesktopTableRow(props: DesktopTableRowProps): React.JSX.Element {
  const { user, onOpenUserDetailsPanel, onOpenDialogPanel } = props;

  return (
    <TableRow
      key={user.id || props.index}
      className="border-b border-border/30 hover:bg-muted/30 transition-colors h-14 cursor-pointer"
      onClick={() => {
        onOpenUserDetailsPanel?.(user);
      }}
    >
      <DesktopUserCell user={user} formatUserName={props.formatUserName} />
      <DesktopStatusCell user={user} />
      <DesktopMessagesCell user={user} />
      <UserResponsesPreview user={user} />
      <DesktopDateCell date={user.lastInteraction} />
      <DesktopDateCell date={user.createdAt} />
      <DesktopActionsCell {...props} />
    </TableRow>
  );
}
