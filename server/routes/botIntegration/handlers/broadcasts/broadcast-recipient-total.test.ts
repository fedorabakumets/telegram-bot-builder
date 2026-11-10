/**
 * @fileoverview Проверки начальных счётчиков одиночных рассылок и кампаний с группами.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { countBroadcastRecipients, normalizeBroadcastGroupIds } from "./broadcast-recipient-total";

const mocks = vi.hoisted(() => ({
  storage: {
    getUsersForBroadcast: vi.fn(), createBroadcast: vi.fn(), createBroadcastCampaign: vi.fn(),
    updateBroadcastCampaign: vi.fn(), getBroadcastsByCampaignId: vi.fn(),
    getBroadcastCampaignById: vi.fn(), getBotGroupsByProject: vi.fn(), listGroupChatsFromMessages: vi.fn(),
  },
  queue: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../../storages/storage", () => ({ storage: mocks.storage }));
vi.mock("./broadcastQueue", () => ({ runBroadcastQueue: mocks.queue }));
vi.mock("../../../../bots/frozenBotStatus", () => ({ isBotFrozen: () => false }));
vi.mock("../../../utils/resolve-request-token", () => ({
  getRequestTokenId: () => 1,
  resolveEffectiveProjectToken: async () => ({ selectedToken: { token: "test", isActive: true }, effectiveTokenId: 1 }),
}));
import { startBroadcastCampaign } from "./start-campaign-broadcasts";
import { createBroadcastHandler } from "./createBroadcastHandler";
import { syncCampaignAggregates } from "./sync-campaign-aggregates";

/**
 * Создаёт минимальное содержимое рассылки для проверки подсчёта.
 * @returns Параметры рассылки без реальных токенов
 */
function content() {
  return { projectId: 12, name: "Проверка", messageText: "Текст", mediaUrls: [], buttons: [],
    buttonsPerRow: 0, filters: { audienceType: "all" } };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.storage.createBroadcastCampaign.mockResolvedValue({ id: 9 });
  mocks.storage.createBroadcast.mockResolvedValue({ id: 10 });
  mocks.storage.getUsersForBroadcast.mockResolvedValue([]);
  mocks.storage.getBotGroupsByProject.mockResolvedValue([{ groupId: "-1" }]);
  mocks.storage.listGroupChatsFromMessages.mockResolvedValue([]);
});

describe("Общие получатели рассылки", () => {
  it("не меняет число пользователей и исключает дубликаты групп", () => {
    expect(countBroadcastRecipients(5, undefined)).toBe(5);
    expect(normalizeBroadcastGroupIds(["-1", " -1 ", "", "-2"])).toEqual(["-1", "-2"]);
    expect(countBroadcastRecipients(0, ["-1", "-1"])).toBe(1);
  });

  it("создаёт одиночную рассылку только группам с ненулевым общим числом", async () => {
    const request = { params: { projectId: "12" }, body: {
      ...content(), filters: { userIds: [], groupIds: ["-1", "-1"] },
    } };
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await createBroadcastHandler(request as any, response as any);
    expect(response.status).toHaveBeenCalledWith(201);
    expect(mocks.storage.createBroadcast).toHaveBeenCalledWith(expect.objectContaining({
      totalCount: 1, filters: expect.objectContaining({ groupIds: ["-1"] }),
    }));
  });

  it("суммирует пользователей и уникальные группы каждого бота", async () => {
    mocks.storage.getUsersForBroadcast.mockResolvedValueOnce([{}, {}]).mockResolvedValueOnce([]);
    await startBroadcastCampaign({ ...content(),
      groupsByToken: new Map([[1, ["-1", "-1"]], [2, ["-1", "-2"]]]),
    } as any, [{ id: 1, token: "test1" }, { id: 2, token: "test2" }] as any);
    const children = mocks.storage.createBroadcast.mock.calls.map(([child]) => child);
    expect(children.map((child) => child.totalCount)).toEqual([3, 2]);
    expect(mocks.storage.updateBroadcastCampaign).toHaveBeenCalledWith(9, { totalCount: 5 });
  });

  it("сводит общие счётчики смешанной и групповой дочерних рассылок", async () => {
    mocks.storage.getBroadcastsByCampaignId.mockResolvedValue([
      { status: "done", totalCount: 3, sentCount: 3, deliveredCount: 2, failedCount: 1 },
      { status: "done", totalCount: 2, sentCount: 2, deliveredCount: 1, failedCount: 1 },
    ]);
    mocks.storage.getBroadcastCampaignById.mockResolvedValue({ startedAt: new Date() });
    await syncCampaignAggregates(9);
    expect(mocks.storage.updateBroadcastCampaign).toHaveBeenCalledWith(9, expect.objectContaining({
      totalCount: 5, sentCount: 5, deliveredCount: 3, failedCount: 2,
    }));
  });
});
