/**
 * @fileoverview Компонент панели выбора и отправки узла
 * @description В текущей реализации скрыт до следующего шага интеграции
 */

/**
 * Свойства компонента NodeSender
 */
export interface NodeSenderProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена бота */
  selectedTokenId?: number | null;
  /** ID выбранного пользователя */
  userId?: number;
  /** Колбэк после отправки */
  onSent?: () => void;
}

/**
 * Компонент для выбора и отправки узла пользователю
 * @param _props - Свойства компонента
 * @returns Пока ничего не отображает
 */
export function NodeSender(_props: NodeSenderProps) {
  return null;
}
