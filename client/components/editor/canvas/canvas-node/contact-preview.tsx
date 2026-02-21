/**
 * @fileoverview Компонент превью для узла типа "Контакт"
 * 
 * Отображает визуальное представление контакта с иконкой,
 * именем, фамилией и номером телефона.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента ContactPreview
 *
 * @interface ContactPreviewProps
 * @property {Node} node - Узел типа contact для отображения
 */
interface ContactPreviewProps {
  node: Node;
}

/**
 * Компонент превью контакта
 *
 * @component
 * @description Отображает превью узла с контактом
 *
 * @param {ContactPreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел типа contact
 *
 * @returns {JSX.Element} Компонент превью контакта
 */
export function ContactPreview({ node }: ContactPreviewProps) {
  return (
    <div className="bg-gradient-to-br from-sky-100/50 to-blue-100/50 dark:from-sky-900/30 dark:to-blue-900/30 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
      <div className="text-center space-y-2">
        <i className="fas fa-address-book text-sky-400 dark:text-sky-300 text-3xl"></i>
        <div className="text-xs text-sky-600 dark:text-sky-400 space-y-1">
          <div className="font-medium">{node.data.firstName} {node.data.lastName}</div>
          {node.data.phoneNumber && (
            <div className="flex items-center justify-center space-x-1">
              <i className="fas fa-phone text-xs"></i>
              <span>{node.data.phoneNumber}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
