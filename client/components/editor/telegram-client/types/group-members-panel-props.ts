/**
 * @fileoverview Тип свойств компонента GroupMembersClientPanel
 *
 * Определяет интерфейс для панели управления участниками группы.
 *
 * @module GroupMembersClientPanelProps
 */

/**
 * Свойства компонента управления участниками группы
 */
export interface GroupMembersClientPanelProps {
  /** Уникальный ID группы */
  groupId: string;
  /** Название группы для отображения */
  groupName: string;
}
