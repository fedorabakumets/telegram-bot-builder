/**
 * @fileoverview Экспорт всех таблиц базы данных
 * @module shared/schema/tables
 */

export { telegramUsers, insertTelegramUserSchema } from "./telegram-users";
export type { TelegramUser, InsertTelegramUser } from "./telegram-users";

export { botProjects, insertBotProjectSchema } from "./bot-projects";
export type { BotProject, InsertBotProject } from "./bot-projects";

export { botTokens, insertBotTokenSchema } from "./bot-tokens";
export type { BotToken, InsertBotToken } from "./bot-tokens";

export { botInstances, insertBotInstanceSchema } from "./bot-instances";
export type { BotInstance, InsertBotInstance } from "./bot-instances";

export { botTemplates, insertBotTemplateSchema } from "./bot-templates";
export type { BotTemplate, InsertBotTemplate } from "./bot-templates";

export { mediaFiles, insertMediaFileSchema } from "./media-files";
export type { MediaFile, InsertMediaFile } from "./media-files";

export { userBotData, insertUserBotDataSchema } from "./user-bot-data";
export type { UserBotData, InsertUserBotData } from "./user-bot-data";

export { botUsers, insertBotUserSchema } from "./bot-users";
export type { BotUser, InsertBotUser } from "./bot-users";

export { botGroups, insertBotGroupSchema } from "./bot-groups";
export type { BotGroup, InsertBotGroup } from "./bot-groups";

export { groupMembers, insertGroupMemberSchema } from "./group-members";
export type { GroupMember, InsertGroupMember } from "./group-members";

export { userTelegramSettings, insertUserTelegramSettingsSchema } from "./user-telegram-settings";
export type { UserTelegramSettings, InsertUserTelegramSettings } from "./user-telegram-settings";

export { botMessages, botMessageMedia, insertBotMessageSchema, insertBotMessageMediaSchema } from "./bot-messages";
export type { BotMessage, InsertBotMessage, BotMessageMedia, InsertBotMessageMedia } from "./bot-messages";

export { userIds, insertUserIdSchema } from "./user-ids";
export type { UserId, InsertUserId } from "./user-ids";

export { buttonSchema } from "./button-schema";
export type { Button } from "./button-schema";

export { nodeSchema } from "./node-schema";
export type { Node } from "./node-schema";

export { sheetViewStateSchema, canvasSheetSchema, botDataWithSheetsSchema, botDataSchema, connectionSchema } from "./bot-sheets";
export type { SheetViewState, CanvasSheet, BotDataWithSheets, BotData, Connection } from "./bot-sheets";

export { sendMessageSchema } from "./additional-schemas";
export type { SendMessage, ComponentDefinition } from "./additional-schemas";
