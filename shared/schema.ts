/**
 * @fileoverview Главная схема базы данных (старый файл, подлежит рефакторингу)
 * @deprecated Постепенно переносится в shared/schema/tables/
 */

// Экспорт из новых модулей
export { telegramUsers, insertTelegramUserSchema } from "./schema/tables/telegram-users";
export type { TelegramUser, InsertTelegramUser } from "./schema/tables/telegram-users";

export { botProjects, insertBotProjectSchema } from "./schema/tables/bot-projects";
export type { BotProject, InsertBotProject } from "./schema/tables/bot-projects";

export { botTokens, insertBotTokenSchema } from "./schema/tables/bot-tokens";
export type { BotToken, InsertBotToken } from "./schema/tables/bot-tokens";

export { botInstances, insertBotInstanceSchema } from "./schema/tables/bot-instances";
export type { BotInstance, InsertBotInstance } from "./schema/tables/bot-instances";

export { botTemplates, insertBotTemplateSchema } from "./schema/tables/bot-templates";
export type { BotTemplate, InsertBotTemplate } from "./schema/tables/bot-templates";

export { mediaFiles, insertMediaFileSchema } from "./schema/tables/media-files";
export type { MediaFile, InsertMediaFile } from "./schema/tables/media-files";

export { userBotData, insertUserBotDataSchema } from "./schema/tables/user-bot-data";
export type { UserBotData, InsertUserBotData } from "./schema/tables/user-bot-data";

export { botUsers, insertBotUserSchema } from "./schema/tables/bot-users";
export type { BotUser, InsertBotUser } from "./schema/tables/bot-users";

export { botGroups, insertBotGroupSchema } from "./schema/tables/bot-groups";
export type { BotGroup, InsertBotGroup } from "./schema/tables/bot-groups";

export { groupMembers, insertGroupMemberSchema } from "./schema/tables/group-members";
export type { GroupMember, InsertGroupMember } from "./schema/tables/group-members";

export { userTelegramSettings, insertUserTelegramSettingsSchema } from "./schema/tables/user-telegram-settings";
export type { UserTelegramSettings, InsertUserTelegramSettings } from "./schema/tables/user-telegram-settings";

export { botMessages, botMessageMedia, insertBotMessageSchema, insertBotMessageMediaSchema } from "./schema/tables/bot-messages";
export type { BotMessage, InsertBotMessage, BotMessageMedia, InsertBotMessageMedia } from "./schema/tables/bot-messages";

export { userIds, insertUserIdSchema } from "./schema/tables/user-ids";
export type { UserId, InsertUserId } from "./schema/tables/user-ids";

export { buttonSchema } from "./schema/tables/button-schema";
export type { Button } from "./schema/tables/button-schema";

export { nodeSchema } from "./schema/tables/node-schema";
export type { Node } from "./schema/tables/node-schema";

export { sheetViewStateSchema, canvasSheetSchema, botDataWithSheetsSchema, botDataSchema } from "./schema/tables/bot-sheets";
export type { SheetViewState, CanvasSheet, BotDataWithSheets, BotData } from "./schema/tables/bot-sheets";

export { sendMessageSchema } from "./schema/tables/additional-schemas";
export type { SendMessage, ComponentDefinition } from "./schema/tables/additional-schemas";

export { botLogs, insertBotLogSchema } from "./schema/tables/bot-logs";
export type { BotLog, InsertBotLog } from "./schema/tables/bot-logs";

export { botLaunchHistory, insertBotLaunchHistorySchema } from "./schema/tables/bot-launch-history";
export type { BotLaunchHistory, InsertBotLaunchHistory } from "./schema/tables/bot-launch-history";

export type TelegramUserDB = typeof telegramUsersTable.$inferSelect;

// Импорты для обратной совместимости
import { telegramUsers as telegramUsersTable } from "./schema/tables/telegram-users";
