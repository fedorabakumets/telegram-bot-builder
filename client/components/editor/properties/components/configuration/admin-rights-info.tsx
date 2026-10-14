/**
 * @fileoverview Информационная панель о правах администратора для admin_rights
 * 
 * Отображает информацию о функционале узла admin_rights:
 * описание, список возможностей, способы определения участника.
 * 
 * @module AdminRightsInfo
 */

import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента AdminRightsInfo
 */
interface AdminRightsInfoProps {
  /** Заголовок секции (по умолчанию "Права администратора") */
  title?: string;
}

/**
 * Компонент информационной панели о правах администратора
 * 
 * Отображает:
 * - Описание функционала
 * - Список возможностей с иконками
 * - Информацию об автоматическом определении участника
 * 
 * @param {AdminRightsInfoProps} props - Пропсы компонента
 * @returns {JSX.Element} Информационная панель
 */
export function AdminRightsInfo({ title = 'Права администратора' }: AdminRightsInfoProps) {
  return (
    <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 border border-violet-200/30 dark:border-violet-800/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
          <i className="fas fa-user-shield text-violet-600 dark:text-violet-400 text-xs"></i>
        </div>
        <Label className="text-sm font-semibold text-violet-900 dark:text-violet-100">{title}</Label>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-violet-800 dark:text-violet-200">
          При вызове команды автоматически отправляется сообщение с инлайн-кнопками, показывающими текущие права администратора:
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-violet-600 dark:text-violet-400">• 🏷️ Изменение профиля</div>
          <div className="text-violet-600 dark:text-violet-400">• 🗑️ Удаление сообщений</div>
          <div className="text-violet-600 dark:text-violet-400">• 🚫 Блокировка участников</div>
          <div className="text-violet-600 dark:text-violet-400">• 📨 Приглашение участников</div>
          <div className="text-violet-600 dark:text-violet-400">• 📌 Закрепление сообщений</div>
          <div className="text-violet-600 dark:text-violet-400">• 🎥 Управление видеочатами</div>
          <div className="text-violet-600 dark:text-violet-400">• 📰 Публикация историй</div>
          <div className="text-violet-600 dark:text-violet-400">• ✏️ Редактирование историй</div>
          <div className="text-violet-600 dark:text-violet-400">• 🗑️ Удаление историй</div>
          <div className="text-violet-600 dark:text-violet-400">• 🔒 Анонимность</div>
          <div className="text-violet-600 dark:text-violet-400">• 👑 Назначение администраторов</div>
          <div className="text-violet-600 dark:text-violet-400">• 🛠️ Управление чатом</div>
          <div className="text-violet-600 dark:text-violet-400">• 📝 Публикация сообщений</div>
          <div className="text-violet-600 dark:text-violet-400">• ✏️ Редактирование сообщений</div>
          <div className="text-violet-600 dark:text-violet-400">• ✉️ Личные сообщения</div>
          <div className="text-violet-600 dark:text-violet-400">• 🏷️ Управление тегами</div>
          <div className="text-violet-600 dark:text-violet-400">• 👋 Приветственные сообщения</div>
        </div>

        <div className="mt-3 p-3 bg-violet-100/50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700">
          <div className="text-xs text-violet-700 dark:text-violet-300 font-medium mb-1">
            💡 Автоматическое определение участника:
          </div>
          <div className="text-xs text-violet-600 dark:text-violet-400">
            • При ответе на сообщение — права того, кто отправил сообщение<br />
            • При упоминании (@username) — права упомянутого пользователя<br />
            • При добавлении ID в команду — права указанного участника
          </div>
        </div>
      </div>
    </div>
  );
}
