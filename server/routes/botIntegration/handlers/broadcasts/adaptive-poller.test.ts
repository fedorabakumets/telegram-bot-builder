/** @fileoverview Проверки пауз, последовательности и остановки фонового опроса. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { startAdaptivePoller } from "../../../../utils/adaptive-poller";

afterEach(() => vi.useRealTimers());

describe("Последовательный адаптивный опрос", () => {
  it("увеличивает пустые паузы до предела и сбрасывает после появления работы", async () => {
    vi.useFakeTimers();
    const poll = vi.fn().mockResolvedValue(false);
    const stop = startAdaptivePoller({ poll, onError: vi.fn(), intervalMs: 2_000, maxIntervalMs: 10_000 });
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4_000);
    expect(poll).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(8_000);
    expect(poll).toHaveBeenCalledTimes(3);
    poll.mockResolvedValue(true);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(poll).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(poll).toHaveBeenCalledTimes(5);
    stop();
  });

  it("не накладывает проходы и не возобновляет таймер после остановки текущего", async () => {
    vi.useFakeTimers();
    let complete!: (value: boolean) => void;
    const poll = vi.fn(() => new Promise<boolean>((resolve) => { complete = resolve; }));
    const stop = startAdaptivePoller({ poll, onError: vi.fn(), intervalMs: 2_000, maxIntervalMs: 10_000 });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(poll).toHaveBeenCalledOnce();
    stop();
    complete(true);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(poll).toHaveBeenCalledOnce();
  });

  it("продолжает проверки после временной ошибки", async () => {
    vi.useFakeTimers();
    const error = new Error("Недоступна база");
    const poll = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(true);
    const onError = vi.fn();
    const stop = startAdaptivePoller({ poll, onError, intervalMs: 2_000, maxIntervalMs: 10_000 });
    await vi.advanceTimersByTimeAsync(4_000);
    expect(onError).toHaveBeenCalledWith(error);
    expect(poll).toHaveBeenCalledTimes(2);
    stop();
  });
});
