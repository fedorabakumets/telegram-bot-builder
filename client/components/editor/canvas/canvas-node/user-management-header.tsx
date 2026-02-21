/**
 * @fileoverview Компонент заголовка узла управления пользователями
 * 
 * Отображает заголовок для узлов управления пользователями:
 * блокировка, разблокировка, мут, кик, продвижение и т.д.
 */

import { Node } from '@/types/bot';

/**
 * Типы узлов управления пользователями
 */
type UserManagementType = 
  | 'ban_user' 
  | 'unban_user' 
  | 'mute_user' 
  | 'unmute_user' 
  | 'kick_user' 
  | 'promote_user' 
  | 'demote_user';

/**
 * Тексты заголовков для каждого типа
 */
const HEADER_TEXTS: Record<UserManagementType, string> = {
  ban_user: 'Заблокировать пользователя',
  unban_user: 'Разблокировать пользователя',
  mute_user: 'Заглушить пользователя',
  unmute_user: 'Разрешить говорить',
  kick_user: 'Исключить пользователя',
  promote_user: 'Назначить администратором',
  demote_user: 'Снять с администратора'
};

/**
 * Интерфейс свойств компонента UserManagementHeader
 *
 * @interface UserManagementHeaderProps
 * @property {Node} node - Узел с данными
 * @property {UserManagementType} type - Тип узла
 */
interface UserManagementHeaderProps {
  node: Node;
  type: UserManagementType;
}

/**
 * Компонент заголовка управления пользователями
 *
 * @component
 * @description Отображает заголовок для узлов управления пользователями
 *
 * @param {UserManagementHeaderProps} props - Свойства компонента
 * @param {Node} props.node - Узел с данными
 * @param {UserManagementType} props.type - Тип узла
 *
 * @returns {JSX.Element} Компонент заголовка
 */
export function UserManagementHeader({ node, type }: UserManagementHeaderProps) {
  return (
    <span className="flex flex-col gap-2">
      <span className="text-rose-600 dark:text-rose-400 font-mono text-sm bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 inline-block w-fit">
        {node.data.command || `/${type}`}
      </span>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
        {HEADER_TEXTS[type]}
      </span>
    </span>
  );
}
