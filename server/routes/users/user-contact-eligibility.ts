/** @fileoverview Единое условие видимости личного контакта или явно импортированной записи. */
/** Возвращает SQL для доверенного псевдонима таблицы. @param alias - Псевдоним из исходного кода. @returns SQL-условие. */
export function userContactEligibility(alias: string): string {
  if (!/^[a-z]+$/.test(alias)) throw new Error('Неверный псевдоним контакта');
  return `(${alias}.imported_at IS NOT NULL OR EXISTS(SELECT 1 FROM bot_messages contact_message
    WHERE contact_message.project_id=${alias}.project_id AND contact_message.token_id=${alias}.token_id
      AND contact_message.user_id=${alias}.user_id::text AND COALESCE(contact_message.chat_type,'private')='private'))`;
}
/** Проверяет реальную переписку человека в выбранной области, включая сводную строку. @returns SQL без параметров пользователя. */
export function hasPrivateMessagesSql(): string {
  return `EXISTS(SELECT 1 FROM bot_messages private_message WHERE private_message.project_id=$1
    AND ($2::integer IS NULL OR private_message.token_id=$2) AND private_message.user_id=u.user_id::text
    AND COALESCE(private_message.chat_type,'private')='private')`;
}
/** Определяет импортированный контакт без подтверждённой личной переписки. @returns SQL статуса. */
export function unverifiedContactSql(): string { return `(u.imported_at IS NOT NULL AND NOT (${hasPrivateMessagesSql()}))`; }
