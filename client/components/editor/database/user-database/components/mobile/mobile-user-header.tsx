/**
 * @fileoverview Имя пользователя и его идентификатор Telegram в компактной карточке.
 */
import { UserBotData } from '@shared/schema';
import { UserDialogAvatar } from '../desktop/user-dialog-avatar';
import { UserIdentity } from '../desktop/user-summary';
import { FoundBroadcastCheckbox } from '../found-broadcast-actions';

/** Свойства заголовка карточки. */
interface MobileUserHeaderProps {
  /** Переход во вкладку переписки. */
  onNavigateToDialog?: (user: UserBotData) => void;
  /** Проект для загрузки аватара. */
  projectId?: number;
  /** Выбранный бот для загрузки аватара. */
  tokenId?: number | null;
  /** Данные пользователя. */
  user: UserBotData;
  /** Форматирует имя пользователя. */
  formatUserName: (user: UserBotData) => string;
}

/**
 * Показывает переносимое имя и идентификатор Telegram.
 * @param props - Данные пользователя и форматирование имени.
 * @returns Заголовок карточки.
 */
export function MobileUserHeader({ user, projectId, tokenId, onNavigateToDialog }: MobileUserHeaderProps): React.JSX.Element {
  /** Общий переход с фотографии и username. */
  const openDialog = onNavigateToDialog ? () => onNavigateToDialog(user) : undefined;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <FoundBroadcastCheckbox userId={user.userId} name={user.firstName} username={user.userName} />
      <UserDialogAvatar user={user} projectId={projectId} tokenId={tokenId} size={36} onOpenDialog={openDialog} />
      <UserIdentity user={user} onOpenDialog={openDialog} />
    </div>
  );
}
