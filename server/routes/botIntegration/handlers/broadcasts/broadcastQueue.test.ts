/** @fileoverview Проверки общих счётчиков реальной очереди с подменой внешних зависимостей. */
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  storage: { getBroadcastById: vi.fn(), getBroadcastResults: vi.fn(), getUsersForBroadcast: vi.fn(), updateBroadcast: vi.fn(),
    createBroadcastResult: vi.fn(), createBotMessage: vi.fn() },
  event: vi.fn(), send: vi.fn(), pause: vi.fn(), sync: vi.fn(), unauthorized: vi.fn(),
}));
vi.mock("../../../../storages/storage", () => ({ storage: mocks.storage }));
vi.mock("../../../../terminal/broadcastProjectEvent", () => ({ broadcastProjectEvent: mocks.event }));
vi.mock("../messages/send-telegram-message", () => ({ sendTelegramMessage: mocks.send }));
vi.mock("../messages/telegram-message-limiter", () => ({ pauseTelegramMessages: mocks.pause }));
vi.mock("../messages/replace-variables", () => ({ replaceVariablesInText: async ({ text }: { text: string }) => text }));
vi.mock("../messages/build-media-files", () => ({ buildMediaFiles: () => [] }));
vi.mock("../messages/extract-buttons", () => ({ extractButtonsFromNode: () => [] }));
vi.mock("./sync-campaign-aggregates", () => ({ syncCampaignAggregates: mocks.sync }));
vi.mock("./record-broadcast-unauthorized", () => ({ recordBroadcastUnauthorized: mocks.unauthorized }));
vi.mock("./mark-user-delivery-status", () => ({ markUserAfterBroadcastError: vi.fn(), resolveBroadcastErrorStatus: () => "failed" }));
import { activeBroadcasts, runBroadcastQueue } from "./broadcastQueue";

/** Возвращает сохранённый итог очереди. */
function finalUpdate() {
  const calls = mocks.storage.updateBroadcast.mock.calls;
  return calls[calls.length - 1]?.[1];
}

describe("Общие счётчики пользователей и групп", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeBroadcasts.clear();
    mocks.storage.getBroadcastById.mockResolvedValue({ id: 1, projectId: 4, tokenId: 2,
      messageText: "Текст", filters: { groupIds: ["-1", "-1", "-2"] }, campaignId: 9 });
    mocks.storage.getUsersForBroadcast.mockResolvedValue([]);
    mocks.storage.getBroadcastResults.mockResolvedValue([]);
    mocks.send.mockResolvedValue({ ok: true, result: { message_id: 5 } });
    mocks.storage.createBotMessage.mockResolvedValue(undefined);
    mocks.storage.createBroadcastResult.mockResolvedValue(undefined);
  });
  it("учитывает уникальные группы в total, БД, событиях и итогах", async () => {
    await runBroadcastQueue(1, "test-token");
    expect(mocks.storage.updateBroadcast.mock.calls[0][1]).toEqual({ totalCount: 2 });
    expect(finalUpdate()).toMatchObject({ status: "done", sentCount: 2, deliveredCount: 2, failedCount: 0 });
    const progress = mocks.event.mock.calls.map(x => x[1]).filter(x => x.type === "broadcast-progress");
    expect(progress.map(x => x.data.sentCount)).toEqual([0, 1, 2, 2]);
    expect(progress.every(x => x.data.totalCount === 2)).toBe(true);
    expect(mocks.sync).toHaveBeenCalledTimes(4);
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });
  it("суммирует успех пользователей и ошибку группы", async () => {
    mocks.storage.getUsersForBroadcast.mockResolvedValue([{ userId: "42" }]);
    mocks.send.mockResolvedValueOnce({ ok: true, result: { message_id: 5 } })
      .mockResolvedValueOnce({ ok: false, error_code: 400, description: "chat not found" });
    await runBroadcastQueue(1, "test-token");
    expect(mocks.storage.updateBroadcast.mock.calls[0][1]).toEqual({ totalCount: 3 });
    expect(finalUpdate()).toMatchObject({ status: "done", sentCount: 3, deliveredCount: 2, failedCount: 1 });
    expect(mocks.storage.createBroadcastResult.mock.calls.map(x => x[0].status)).toEqual(["sent", "failed", "sent"]);
  });
  it("сохраняет неудачу при сетевом исключении отправки группы", async () => {
    mocks.send.mockRejectedValueOnce(new Error("network failure"));
    await runBroadcastQueue(1, "test-token");
    expect(finalUpdate()).toMatchObject({ status: "done", sentCount: 2, deliveredCount: 1, failedCount: 1 });
    expect(mocks.storage.createBroadcastResult.mock.calls[0][0]).toMatchObject({ userId: "-1", status: "failed", errorMessage: "network failure" });
  });
  it("не превращает сбой истории после доставки в ошибку и продолжает очередь", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.storage.createBotMessage.mockRejectedValueOnce(new Error("history failure"));
    await runBroadcastQueue(1, "test-token");
    expect(finalUpdate()).toMatchObject({ status: "done", deliveredCount: 2, failedCount: 0 });
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.storage.createBroadcastResult).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });
  it("сохраняет прогресс и прекращает отправки после остановки группы", async () => {
    mocks.storage.createBotMessage.mockImplementationOnce(async () => { activeBroadcasts.set(1, "stopped"); });
    await runBroadcastQueue(1, "test-token");
    expect(finalUpdate()).toMatchObject({ status: "stopped", sentCount: 1, deliveredCount: 1 });
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
  it("учитывает остановку, записанную другим процессом в БД", async () => {
    mocks.storage.getBroadcastById.mockResolvedValueOnce({ id: 1, projectId: 4, tokenId: 2,
      messageText: "Текст", filters: { groupIds: ["-1"] }, campaignId: 9, status: "running" });
    mocks.storage.getBroadcastById.mockResolvedValue({ id: 1, status: "stopped" });
    await runBroadcastQueue(1, "test-token");
    expect(finalUpdate()).toMatchObject({ status: "stopped", sentCount: 0 });
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("после восстановления не повторяет получателей с сохранённым результатом", async () => {
    mocks.storage.getUsersForBroadcast.mockResolvedValue([{ userId: "42" }, { userId: "43" }]);
    mocks.storage.getBroadcastResults.mockResolvedValue([
      { userId: "42", status: "sent" }, { userId: "-1", status: "failed" },
    ]);
    await runBroadcastQueue(1, "test-token");
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(finalUpdate()).toMatchObject({ status: "done", sentCount: 4, deliveredCount: 3, failedCount: 1 });
  });
});
