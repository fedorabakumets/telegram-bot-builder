/**
 * @fileoverview Проверки восстановления намерений после потери команд исполнителя.
 * @module server/bots/runtime-reconcile.test
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/** Подмена базы для изолированной проверки сверки. */
const state = vi.hoisted(() => ({
  instances: [] as Array<Record<string, unknown>>,
  workers: [] as Array<Record<string, unknown>>,
  start: vi.fn(async () => ({ success: true })),
  stop: vi.fn(async () => ({ success: true })),
  claim: vi.fn(async () => true),
  restart: vi.fn(async () => undefined),
  allowed: true,
  token: { token: "token", isActive: 1, authorizationError: null as string | null },
}));

vi.mock("../storages/storage", () => ({ storage: {
  getAllBotInstances: async () => state.instances,
  getBotInstanceByToken: async (tokenId: number) => state.instances.find((i) => i.tokenId === tokenId),
  getBotToken: async () => state.token,
} }));
vi.mock("./remoteRunnerHub", () => ({ RemoteRunnerHub: { get: async () => ({ inspect: async () => ({ workers: state.workers }) }) } }));
vi.mock("./botPlacement", () => ({ getProjectPlacement: () => ({ runnerId: "runner-1", railwayProjectId: null }) }));
vi.mock("./resolveRunnerRedisUrl", () => ({ resolveRunnerRedisUrl: () => "redis://test" }));
vi.mock("./startBot", () => ({ startBot: state.start }));
vi.mock("./stopBot", () => ({ stopBot: state.stop }));
vi.mock("./scheduleBotRestart", () => ({ scheduleBotRestart: state.restart }));
vi.mock("./automaticBotStartAllowed", () => ({ automaticBotStartAllowed: async () => state.allowed }));
vi.mock("./claimBuildLinkRetry", () => ({
  claimBuildLinkRetry: state.claim,
  isBuildLinkExpired: (error: string | null) => error?.includes("TBB_BUILD_LINK_EXPIRED:") === true,
}));

import { reconcileBotDesiredState, scheduleRuntimeReconcile } from "./runtime-reconcile";

beforeEach(() => {
  state.instances = [];
  state.workers = [];
  state.start.mockClear();
  state.stop.mockClear();
  state.claim.mockClear();
  state.restart.mockClear();
  state.allowed = true;
  state.token = { token: "token", isActive: 1, authorizationError: null };
});

describe("сверка исполнителя", () => {
  /** Стандартный интервал очереди — пять секунд, без повторной привязки во время ожидания. */
  it("проверяет очередь раз в пять секунд без наложения проходов", async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const reattach = vi.fn(() => new Promise<void>(resolve => { release = resolve; }));
    const stop = scheduleRuntimeReconcile(undefined, reattach);
    try {
      await vi.advanceTimersByTimeAsync(4_999);
      expect(reattach).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(reattach).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(reattach).toHaveBeenCalledTimes(1);
      release(); await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(5_000);
      expect(reattach).toHaveBeenCalledTimes(2);
      release(); await vi.advanceTimersByTimeAsync(0);
    } finally { stop(); vi.useRealTimers(); }
  });
  /** После недоступности исполнителя повторяет привязку и не прерывает таймер. */
  it("повторяет привязку после ошибки", async () => {
    vi.useFakeTimers();
    const reattach = vi.fn().mockRejectedValueOnce(new Error("исполнитель недоступен")).mockResolvedValue(0);
    const stop = scheduleRuntimeReconcile(1_000, reattach);
    try {
      await vi.advanceTimersByTimeAsync(2_000);
      expect(reattach).toHaveBeenCalledTimes(2);
    } finally {
      stop();
      vi.useRealTimers();
    }
  });

  it("восстанавливает пропущенную команду запуска", async () => {
    state.instances = [{ id: 1, projectId: 7, tokenId: 9, status: "stopped", desiredStatus: "running", desiredGeneration: 2 }];
    expect((await reconcileBotDesiredState()).started).toBe(1);
    expect(state.start).toHaveBeenCalledWith(7, "token", 9, { reuseGeneratedCode: true });
  });

  it("не запускает бота повторно во время подготовки сборки", async () => {
    state.instances = [{ id: 1, projectId: 7, tokenId: 9, status: "stopped", desiredStatus: "running", desiredGeneration: 2 }];
    state.workers = [{ tokenIds: [], pendingTokenIds: [9] }];
    await reconcileBotDesiredState();
    expect(state.start).not.toHaveBeenCalled();
  });

  it("останавливает живого бота после пропущенной команды остановки", async () => {
    state.instances = [{ id: 1, projectId: 7, tokenId: 9, status: "running", desiredStatus: "stopped", desiredGeneration: 3 }];
    state.workers = [{ tokenIds: [9], pendingTokenIds: [] }];
    expect((await reconcileBotDesiredState()).stopped).toBe(1);
    expect(state.stop).toHaveBeenCalledWith(7, 9);
  });

  it("ограничивает повтор просроченной ссылки и пропускает прочие ошибки", async () => {
    state.instances = [{ id: 1, projectId: 7, tokenId: 9, status: "error", desiredStatus: "running", desiredGeneration: 2,
      errorMessage: "Ошибка запуска: TBB_BUILD_LINK_EXPIRED: HTTP 403 при скачивании сборки" }];
    state.claim.mockResolvedValueOnce(false);
    await reconcileBotDesiredState();
    expect(state.start).not.toHaveBeenCalled();
    expect(state.claim).toHaveBeenCalledWith(1, 2);
    state.instances[0].errorMessage = "Ошибка запуска: неверный токен";
    await reconcileBotDesiredState();
    expect(state.start).not.toHaveBeenCalled();
    expect(state.claim).toHaveBeenCalledTimes(1);
  });

  /** Авария общего процесса использует общий ограниченный планировщик даже без автоповторов бота. */
  it("передаёт инфраструктурную аварию планировщику вместо прямого запуска", async () => {
    state.instances = [{ id: 1, projectId: 7, tokenId: 9, status: "error", desiredStatus: "running", desiredGeneration: 2,
      errorMessage: "[worker_host_crash] Общий обработчик завершился: code=null, signal=SIGKILL" }];
    await reconcileBotDesiredState();
    expect(state.restart).toHaveBeenCalledWith(7, 9, "worker_host_crash", { infrastructure: true });
    expect(state.start).not.toHaveBeenCalled();
  });

  /** Нехватка памяти восстанавливается отдельной очередью с паузой вместо аварийного планировщика. */
  it("восстанавливает отказ памяти один раз и не повторяет без паузы", async () => {
    state.instances = [{ id: 1, projectId: 12, tokenId: 45, status: "error", desiredStatus: "running", desiredGeneration: 2,
      errorMessage: "Ошибка выполнения: [runner_memory] Недостаточно свободной памяти исполнителя" }];
    await reconcileBotDesiredState();
    expect(state.start).toHaveBeenCalledTimes(1);
    expect(state.start).toHaveBeenCalledWith(12, 'token', 45,
      { clearLogs: false, reuseGeneratedCode: true, waitForExistingLock: true });
    await reconcileBotDesiredState();
    expect(state.start).toHaveBeenCalledTimes(1);
    expect(state.restart).not.toHaveBeenCalled();
  });

  /** Старое предупреждение и запреты токена не превращаются в разрешение восстановления. */
  it("не восстанавливает предупреждение, замороженный или отозванный токен", async () => {
    state.instances = [{ id: 1, projectId: 7, tokenId: 9, status: "error", desiredStatus: "running", desiredGeneration: 2,
      errorMessage: "Ошибка запуска: WARNING DeepLink fallback" }];
    await reconcileBotDesiredState();
    state.instances[0].errorMessage = "[worker_host_crash] Общий обработчик завершился";
    state.allowed = false;
    await reconcileBotDesiredState();
    state.allowed = true;
    state.token.authorizationError = "unauthorized";
    await reconcileBotDesiredState();
    expect(state.restart).not.toHaveBeenCalled();
    expect(state.start).not.toHaveBeenCalled();
  });
});
