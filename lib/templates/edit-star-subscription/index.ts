/**
 * @fileoverview Экспорт модуля edit_star_subscription
 * @module templates/edit-star-subscription
 */

export type {
  EditStarSubscriptionEntry,
  EditStarSubscriptionTemplateParams,
  SubscriptionAction,
  SubscriptionUserSource,
} from './edit-star-subscription.params';
export type { EditStarSubscriptionParams } from './edit-star-subscription.schema';
export {
  editStarSubscriptionParamsSchema,
  editStarSubscriptionEntrySchema,
  subscriptionActionSchema,
  subscriptionUserSourceSchema,
} from './edit-star-subscription.schema';
export {
  collectEditStarSubscriptionEntries,
  generateEditStarSubscription,
  generateEditStarSubscriptionHandlers,
} from './edit-star-subscription.renderer';
