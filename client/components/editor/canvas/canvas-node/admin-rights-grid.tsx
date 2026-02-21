/**
 * @fileoverview Компонент сетки прав администратора
 * 
 * Отображает сетку из 6 основных прав администратора
 * с возможностью расширения (показывает "+5 ещё").
 */

import { AdminRightCard } from './admin-right-card';

/**
 * Интерфейс свойств компонента AdminRightsGrid
 *
 * @interface AdminRightsGridProps
 */
interface AdminRightsGridProps {
  // Резерв для будущих кастомных прав
}

// Список прав администратора
const ADMIN_RIGHTS = [
  { key: 'can_change_info', name: '🏷️ Профиль' },
  { key: 'can_delete_messages', name: '🗑️ Удаление' },
  { key: 'can_restrict_members', name: '🚫 Блокировка' },
  { key: 'can_invite_users', name: '📨 Приглашения' },
  { key: 'can_pin_messages', name: '📌 Закрепление' },
  { key: 'can_manage_video_chats', name: '🎥 Видеочаты' }
];

const HIDDEN_RIGHTS_COUNT = 5;

/**
 * Компонент сетки прав администратора
 *
 * @component
 * @description Отображает сетку прав с индикатором скрытых элементов
 *
 * @param {AdminRightsGridProps} props - Свойства компонента
 *
 * @returns {JSX.Element} Компонент сетки прав
 */
export function AdminRightsGrid({}: AdminRightsGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {ADMIN_RIGHTS.map((right) => (
          <AdminRightCard key={right.key} icon="" name={right.name} />
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1 font-medium">
        <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
          +{HIDDEN_RIGHTS_COUNT} еще
        </span>
      </div>
    </>
  );
}
