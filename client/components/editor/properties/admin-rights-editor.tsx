/**
 * @fileoverview Компонент настройки прав администратора для promote_user
 * 
 * Отображает список прав администратора с переключателями
 * для узла типа promote_user.
 * 
 * @module AdminRightsEditor
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Описание права администратора
 */
interface AdminRight {
  /** Ключ права в данных узла */
  key: string;
  /** Текст описания для UI */
  label: string;
  /** Иконка для отображения */
  icon: string;
  /** Значение по умолчанию */
  default?: boolean;
}

/**
 * Пропсы компонента AdminRightsEditor
 */
interface AdminRightsEditorProps {
  /** Узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Список прав администратора с настройками по умолчанию
 */
const ADMIN_RIGHTS: AdminRight[] = [
  { key: 'canChangeInfo', label: 'Изменять информацию группы', icon: 'fas fa-edit' },
  { key: 'canDeleteMessages', label: 'Удалять сообщения', icon: 'fas fa-trash', default: true },
  { key: 'canBanUsers', label: 'Блокировать пользователей', icon: 'fas fa-ban' },
  { key: 'canInviteUsers', label: 'Приглашать пользователей', icon: 'fas fa-user-plus', default: true },
  { key: 'canPinMessages', label: 'Закреплять сообщения', icon: 'fas fa-thumbtack', default: true },
  { key: 'canAddAdmins', label: 'Добавлять администраторов', icon: 'fas fa-user-shield' },
  { key: 'canRestrictMembers', label: 'Ограничивать участников', icon: 'fas fa-user-lock' },
  { key: 'canPromoteMembers', label: 'Повышать участников', icon: 'fas fa-arrow-up' },
  { key: 'canManageVideoChats', label: 'Управлять видеозвонками', icon: 'fas fa-video' },
  { key: 'isAnonymous', label: 'Анонимный админ', icon: 'fas fa-user-secret' }
];

/**
 * Компонент редактирования прав администратора
 * 
 * Отображает список прав с переключателями для узла promote_user.
 * Каждое право имеет иконку, описание и переключатель.
 * 
 * @param {AdminRightsEditorProps} props - Пропсы компонента
 * @returns {JSX.Element} Редактор прав администратора
 */
export function AdminRightsEditor({ selectedNode, onNodeUpdate }: AdminRightsEditorProps) {
  return (
    <div className="bg-gradient-to-br from-yellow-50/50 to-amber-50/30 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200/30 dark:border-yellow-800/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
          <i className="fas fa-crown text-yellow-600 dark:text-yellow-400 text-xs"></i>
        </div>
        <Label className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Права администратора</Label>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {ADMIN_RIGHTS.map(({ key, label, icon, default: defaultValue }) => (
          <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-yellow-200/30 dark:border-yellow-800/30">
            <div className="flex items-center space-x-2">
              <i className={`${icon} text-yellow-600 dark:text-yellow-400 text-xs`}></i>
              <Label className="text-xs text-yellow-700 dark:text-yellow-300">{label}</Label>
            </div>
            <Switch
              checked={(selectedNode.data as any)[key] ?? (defaultValue ?? false)}
              onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { [key]: checked } as any)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
