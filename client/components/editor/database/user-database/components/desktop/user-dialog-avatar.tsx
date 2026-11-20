/** @fileoverview Аватар пользователя с доступным переходом к переписке, включая запасную иконку. */
import type { UserBotData } from '@shared/schema';
import { UserAvatar } from '../../../dialog/components/user-avatar';
/**
 * Открывает диалог по нажатию на фотографию или её заглушку.
 * @param props - Пользователь, область загрузки и переход к переписке.
 * @returns Аватар с кнопкой перехода при доступном обработчике.
 */
export function UserDialogAvatar({ user, projectId, tokenId, size, onOpenDialog }: {
  /** Пользователь бота. */ user: UserBotData;
  /** Проект для загрузки фото. */ projectId?: number;
  /** Выбранный бот. */ tokenId?: number | null;
  /** Размер аватара. */ size?: number;
  /** Переход к переписке. */ onOpenDialog?: () => void;
}) {
  /** В режиме всех ботов использует бота исходной строки, а не бота по умолчанию. */
  const avatar = <UserAvatar messageType="user" user={user} projectId={projectId} tokenId={tokenId ?? user.tokenId} size={size} />;
  return onOpenDialog ? <button type="button" className="users-dialog-avatar shrink-0 rounded-full"
    aria-label={`Открыть диалог по аватару: ${[user.firstName, user.lastName].filter(Boolean).join(' ') || user.userId}`}
    title="Открыть диалог" onClick={onOpenDialog}>{avatar}</button> : avatar;
}
