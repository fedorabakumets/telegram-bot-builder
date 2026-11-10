/** @fileoverview Проверки доставки групп и общего прогресса без Telegram и базы данных. */
import { describe, expect, it, vi } from "vitest";
import { runBroadcastGroups, type GroupSendResult } from "./run-broadcast-groups";

/** Создаёт изолированные действия очереди с накоплением общего прогресса. */
function fixture(initialDelivered = 0) {
  const counts = { sentCount: initialDelivered, deliveredCount: initialDelivered, failedCount: 0 };
  const snapshots: typeof counts[] = [];
  const actions = {
    stopped: vi.fn(() => false),
    send: vi.fn(async (_id: string): Promise<GroupSendResult> => ({ ok: true, messageId: 11 })),
    pause: vi.fn(async (_seconds: number) => undefined),
    unauthorized: vi.fn(async (_description?: string) => undefined),
    record: vi.fn(async (_id: string, result: GroupSendResult) => {
      counts.sentCount++;
      if (result.ok) counts.deliveredCount++;
      else counts.failedCount++;
    }),
    history: vi.fn(async (_id: string) => undefined),
    progress: vi.fn(async () => { snapshots.push({ ...counts }); }),
    log: vi.fn(),
  };
  return { actions, counts, snapshots };
}

describe("Групповая очередь рассылки", () => {
  it("учитывает каждую группу в рассылке без пользователей", async () => {
    const f = fixture();
    await runBroadcastGroups(["-1", "-2"], f.actions);
    expect(f.counts).toEqual({ sentCount: 2, deliveredCount: 2, failedCount: 0 });
    expect(f.snapshots.map(x => x.sentCount)).toEqual([1, 2]);
  });
  it("продолжает общий прогресс после пользователей и сохраняет ошибки", async () => {
    const f = fixture(3);
    f.actions.send.mockResolvedValueOnce({ ok: false, description: "chat not found" });
    await runBroadcastGroups(["-1", "-2"], f.actions);
    expect(f.counts).toEqual({ sentCount: 5, deliveredCount: 4, failedCount: 1 });
    expect(f.actions.record.mock.calls[0][1]).toMatchObject({ ok: false, description: "chat not found" });
  });
  it("сохраняет исключение отправки как неудачный результат", async () => {
    const f = fixture();
    f.actions.send.mockRejectedValueOnce(new Error("network unavailable"));
    await runBroadcastGroups(["-1"], f.actions);
    expect(f.counts.failedCount).toBe(1);
    expect(f.actions.record.mock.calls[0][1]).toMatchObject({ ok: false, description: "network unavailable" });
    expect(f.actions.history).not.toHaveBeenCalled();
  });
  it("останавливается между группами с сохранённым частичным прогрессом", async () => {
    const f = fixture();
    f.actions.stopped.mockImplementation(() => f.counts.sentCount === 1);
    await runBroadcastGroups(["-1", "-2"], f.actions);
    expect(f.actions.send).toHaveBeenCalledTimes(1);
    expect(f.snapshots[0].sentCount).toBe(1);
  });
  it("не повторяет отправку и не меняет успех при сбое истории", async () => {
    const f = fixture();
    f.actions.history.mockRejectedValueOnce(new Error("history write failed"));
    await runBroadcastGroups(["-1", "-2"], f.actions);
    expect(f.actions.send).toHaveBeenCalledTimes(2);
    expect(f.actions.record).toHaveBeenCalledTimes(2);
    expect(f.counts).toEqual({ sentCount: 2, deliveredCount: 2, failedCount: 0 });
    expect(f.actions.log).toHaveBeenCalledTimes(1);
  });
  it("не пересчитывает доставку при сбое сохранения результата", async () => {
    const f = fixture();
    f.actions.record.mockImplementationOnce(async () => {
      f.counts.sentCount++;
      f.counts.deliveredCount++;
      throw new Error("result write failed");
    });
    await runBroadcastGroups(["-1"], f.actions);
    expect(f.actions.send).toHaveBeenCalledTimes(1);
    expect(f.actions.record).toHaveBeenCalledTimes(1);
    expect(f.snapshots[0]).toEqual({ sentCount: 1, deliveredCount: 1, failedCount: 0 });
    expect(f.actions.log).toHaveBeenCalledTimes(1);
  });
  it("не отправляет повторно после остановки во время паузы 429", async () => {
    const f = fixture();
    f.actions.send.mockResolvedValueOnce({ ok: false, errorCode: 429, retryAfter: 3 });
    f.actions.pause.mockImplementation(async () => { f.actions.stopped.mockReturnValue(true); });
    await runBroadcastGroups(["-1", "-2"], f.actions);
    expect(f.actions.send).toHaveBeenCalledTimes(1);
    expect(f.actions.record).not.toHaveBeenCalled();
  });
  it("после 429 считает доставку один раз", async () => {
    const f = fixture();
    f.actions.send.mockResolvedValueOnce({ ok: false, errorCode: 429, retryAfter: 3 });
    await runBroadcastGroups(["-1"], f.actions);
    expect(f.actions.pause).toHaveBeenCalledWith(3);
    expect(f.actions.send).toHaveBeenCalledTimes(2);
    expect(f.counts.sentCount).toBe(1);
  });
  it("прекращает отправку при отзыве токена", async () => {
    const f = fixture();
    f.actions.send.mockResolvedValueOnce({ ok: false, errorCode: 401, description: "Unauthorized" });
    await runBroadcastGroups(["-1", "-2"], f.actions);
    expect(f.actions.unauthorized).toHaveBeenCalledWith("Unauthorized");
    expect(f.actions.send).toHaveBeenCalledTimes(1);
    expect(f.actions.record).not.toHaveBeenCalled();
  });
});
