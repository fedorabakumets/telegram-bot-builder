/**
 * @fileoverview Примеры JSON для OpenAPI кампаний рассылок («большая рассылка»)
 * @module server/swagger/paths/project-broadcast-campaigns-examples
 */

/** Карточка кампании */
export const BROADCAST_CAMPAIGN_EXAMPLE = {
  id: 3,
  projectId: 42,
  name: "Акция августа",
  messageText: "Привет! Скидка 20%.",
  mediaUrls: [],
  buttons: [],
  buttonsPerRow: 0,
  filters: { tags: ["vip"] },
  tokenIds: [7, 8],
  status: "running",
  totalCount: 240,
  sentCount: 120,
  deliveredCount: 115,
  failedCount: 5,
  createdAt: "2026-08-12T01:48:00.000Z",
  startedAt: "2026-08-12T01:48:01.000Z",
  finishedAt: null,
};

/** Дочерняя рассылка одного бота кампании */
const CAMPAIGN_CHILD_EXAMPLE = {
  id: 15,
  projectId: 42,
  campaignId: 3,
  tokenId: 7,
  name: "Акция августа",
  messageText: "Привет! Скидка 20%.",
  status: "running",
  totalCount: 120,
  sentCount: 60,
  deliveredCount: 58,
  failedCount: 2,
  mediaUrls: [],
  buttons: [],
  buttonsPerRow: 0,
  filters: { tags: ["vip"] },
  createdAt: "2026-08-12T01:48:00.000Z",
  startedAt: "2026-08-12T01:48:01.000Z",
  finishedAt: null,
};

/** GET …/broadcast-campaigns */
export const BROADCAST_CAMPAIGNS_LIST_EXAMPLE = {
  campaigns: [BROADCAST_CAMPAIGN_EXAMPLE],
};

/** GET …/broadcast-campaigns/{campaignId} */
export const BROADCAST_CAMPAIGN_DETAIL_EXAMPLE = {
  campaign: BROADCAST_CAMPAIGN_EXAMPLE,
  broadcasts: [
    CAMPAIGN_CHILD_EXAMPLE,
    { ...CAMPAIGN_CHILD_EXAMPLE, id: 16, tokenId: 8, sentCount: 60, deliveredCount: 57, failedCount: 3 },
  ],
};

/** POST …/stop */
export const STOP_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE = {
  campaign: { ...BROADCAST_CAMPAIGN_EXAMPLE, status: "stopped", finishedAt: "2026-08-12T01:50:00.000Z" },
  stopped: [15, 16],
};

/** PUT body */
export const EDIT_BROADCAST_CAMPAIGN_BODY_EXAMPLE = {
  messageText: "Обновлённый текст рассылки",
};

/** PUT 200 */
export const EDIT_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE = {
  ok: true,
  edited: 221,
  failed: 9,
  perBot: [
    { broadcastId: 15, tokenId: 7, edited: 113, failed: 5 },
    { broadcastId: 16, tokenId: 8, edited: 108, failed: 4 },
  ],
};

/** DELETE 200 */
export const DELETE_BROADCAST_CAMPAIGN_RESPONSE_EXAMPLE = {
  ok: true,
  deleted: 231,
  broadcasts: 2,
};

/** 403 — кампания чужого проекта */
export const CAMPAIGN_FORBIDDEN_EXAMPLE = {
  message: "Кампания не принадлежит этому проекту",
};

/** 404 */
export const CAMPAIGN_NOT_FOUND_EXAMPLE = {
  message: "Кампания рассылки не найдена",
};
