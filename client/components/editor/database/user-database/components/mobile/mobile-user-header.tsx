/**
 * @fileoverview Компонент заголовка мобильной карточки пользователя
 * @description Отображает имя и ID пользователя
 */

import { UserBotData } from '@shared/schema';

/**
 * Пропсы компонента MobileUserHeader
 */
interface MobileUserHeaderProps {
  /** Данные пользователя */
  user: UserBotData;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Индекс пользователя в списке */
  index: number;
}

/**
 * Компонент заголовка мобильной карточки пользователя
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка
 */
export function MobileUserHeader(props: MobileUserHeaderProps): React.JSX.Element {
  const {
    user,
    formatUserName,
    index,
  } = props;

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="font-medium text-base">{formatUserName(user)}</div>
        <div className="text-sm text-muted-foreground">ID: {user.id}</div>
      </div>
    </div>
  );
}
