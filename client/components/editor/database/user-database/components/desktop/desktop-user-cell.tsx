/**
 * @fileoverview Компонент ячейки пользователя в таблице
 * @description Отображает аватар, имя и Telegram ID пользователя
 */

import { TableCell } from '@/components/ui/table';
import { UserBotData } from '@shared/schema';
import { UserDialogAvatar } from './user-dialog-avatar';
import { UserIdentity } from './user-summary';
import { FoundBroadcastCheckbox } from '../found-broadcast-actions';

/**
 * Пропсы компонента DesktopUserCell
 */
interface DesktopUserCellProps {
  /** Управление раскрытием связанных ботов. */
  children?: React.ReactNode;
  /** Переход к переписке. */
  onNavigateToDialog?: (user: UserBotData) => void;
  /** Запасное открытие панели переписки. */
  onOpenDialogPanel?: (user: UserBotData) => void;
  /** Данные пользователя */
  user: UserBotData;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** ID проекта */
  projectId: number;
  /** ID токена для резолва аватара */
  tokenId?: number | null;
}

/**
 * Компонент ячейки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент ячейки
 */
export function DesktopUserCell({ user, projectId, tokenId, onNavigateToDialog, onOpenDialogPanel, children }: DesktopUserCellProps): React.JSX.Element {
  /** Предпочитает полноценную вкладку переписки. */
  const navigate = onNavigateToDialog ?? onOpenDialogPanel;
  const openDialog = navigate ? () => navigate(user) : undefined;
  return (
    <TableCell className="py-2">
      <div className="flex items-center gap-3 min-w-0">
        <FoundBroadcastCheckbox userId={user.userId} name={user.firstName} username={user.userName} />
        <UserDialogAvatar user={user} projectId={projectId} tokenId={tokenId} onOpenDialog={openDialog} />
        <div className="min-w-0 flex-1"><UserIdentity user={user} onOpenDialog={openDialog} />{children}</div>
      </div>
    </TableCell>
  );
}
