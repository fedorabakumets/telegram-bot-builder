/**
 * @fileoverview Компонент настройки контакта
 * 
 * Блок управления настройками контакта: телефон, имя, фамилия и vCard.
 * 
 * @module ContactConfiguration
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Пропсы компонента настройки контакта
 */
interface ContactConfigurationProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки контакта
 * 
 * Позволяет указать:
 * - Номер телефона
 * - Имя и фамилию
 * - User ID Telegram
 * - vCard данные
 * 
 * @param {ContactConfigurationProps} props - Пропсы компонента
 * @returns {JSX.Element} Конфигурация контакта
 */
export function ContactConfiguration({
  selectedNode,
  onNodeUpdate
}: ContactConfigurationProps) {
  return (
    <div className="space-y-6">
      {/* Contact Info Section */}
      <div className="bg-gradient-to-br from-cyan-50/50 to-blue-50/30 dark:from-cyan-950/20 dark:to-blue-950/10 border border-cyan-200/30 dark:border-cyan-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
            <i className="fas fa-address-book text-cyan-600 dark:text-cyan-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">Контактная информация</Label>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2 block">
              <i className="fas fa-phone mr-1"></i>
              Номер телефона (обязательно)
            </Label>
            <Input
              value={selectedNode.data.phoneNumber || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { phoneNumber: e.target.value })}
              className="border-cyan-200 dark:border-cyan-700 focus:border-cyan-500 focus:ring-cyan-200"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2 block">
                <i className="fas fa-user mr-1"></i>
                Имя (обязательно)
              </Label>
              <Input
                value={selectedNode.data.firstName || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { firstName: e.target.value })}
                className="border-cyan-200 dark:border-cyan-700 focus:border-cyan-500 focus:ring-cyan-200"
                placeholder="Иван"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2 block">
                <i className="fas fa-user mr-1"></i>
                Фамилия
              </Label>
              <Input
                value={selectedNode.data.lastName || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { lastName: e.target.value })}
                className="border-cyan-200 dark:border-cyan-700 focus:border-cyan-500 focus:ring-cyan-200"
                placeholder="Петров"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Contact Details Section */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 border border-indigo-200/30 dark:border-indigo-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <i className="fas fa-id-card text-indigo-600 dark:text-indigo-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Дополнительные данные</Label>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 block">
              <i className="fas fa-at mr-1"></i>
              User ID Telegram
            </Label>
            <Input
              type="number"
              value={selectedNode.data.userId || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { userId: parseInt(e.target.value) || 0 })}
              className="border-indigo-200 dark:border-indigo-700 focus:border-indigo-500 focus:ring-indigo-200"
              placeholder="123456789"
            />
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              ID пользователя в Telegram (если известен)
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 block">
              <i className="fas fa-address-card mr-1"></i>
              vCard данные
            </Label>
            <Textarea
              value={selectedNode.data.vcard || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { vcard: e.target.value })}
              className="resize-none border-indigo-200 dark:border-indigo-700 focus:border-indigo-500 focus:ring-indigo-200 transition-all duration-200"
              rows={4}
              placeholder="BEGIN:VCARD&#10;VERSION:3.0&#10;FN:Иван Петров&#10;TEL:+79991234567&#10;END:VCARD"
            />
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Дополнительная контактная информация в формате vCard (опционально)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
