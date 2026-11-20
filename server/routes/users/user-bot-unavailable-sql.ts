/** @fileoverview Проверка подтверждённой проблемы Telegram у ботов конкретного пользователя. */
import { userContactEligibility } from './user-contact-eligibility';
/**
 * Проверяет недоступность всех связанных ботов; один исправный бот сохраняет личный статус пользователя.
 * @returns Доверенное SQL-условие с областью $1/$2 и пользователем u.user_id.
 */
export function userBotUnavailableSql(): string {
  return `EXISTS(SELECT 1 FROM bot_users ub JOIN bot_tokens bt ON bt.id=ub.token_id AND bt.project_id=ub.project_id
    WHERE ub.project_id=$1 AND ($2::integer IS NULL OR ub.token_id=$2) AND ub.user_id=u.user_id
      AND ub.is_bot=0 AND NULLIF(bt.authorization_error,'') IS NOT NULL
      AND ${userContactEligibility('ub')})
    AND NOT EXISTS(SELECT 1 FROM bot_users healthy JOIN bot_tokens ht ON ht.id=healthy.token_id AND ht.project_id=healthy.project_id
      WHERE healthy.project_id=$1 AND ($2::integer IS NULL OR healthy.token_id=$2) AND healthy.user_id=u.user_id
        AND healthy.is_bot=0 AND NULLIF(ht.authorization_error,'') IS NULL
        AND ${userContactEligibility('healthy')})`;
}
/** Проверяет проблему в выбранной области и наличие другого бота с личной перепиской. @returns Безопасное условие с областью проекта. */
export function userHasOtherBotsSql(): string {
  return `EXISTS(SELECT 1 FROM bot_users affected JOIN bot_tokens failed ON failed.id=affected.token_id AND failed.project_id=affected.project_id
    WHERE affected.project_id=$1 AND ($2::integer IS NULL OR affected.token_id=$2) AND affected.user_id=u.user_id
      AND affected.is_bot=0 AND COALESCE(affected.is_deleted,0)=0 AND NULLIF(failed.authorization_error,'') IS NOT NULL
      AND ${userContactEligibility('affected')})
    AND EXISTS(SELECT 1 FROM bot_users other JOIN bot_tokens available ON available.id=other.token_id AND available.project_id=other.project_id
      WHERE other.project_id=$1 AND other.user_id=u.user_id AND ($2::integer IS NULL OR other.token_id<>$2)
        AND other.is_bot=0 AND COALESCE(other.is_deleted,0)=0 AND COALESCE(other.is_blocked,0)=0
        AND NULLIF(available.authorization_error,'') IS NULL
        AND EXISTS(SELECT 1 FROM bot_messages real_message WHERE real_message.project_id=other.project_id
          AND real_message.token_id=other.token_id AND real_message.user_id=other.user_id::text
          AND COALESCE(real_message.chat_type,'private')='private'))`;
}
