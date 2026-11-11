/**
 * @fileoverview Проверки захвата и восстановления заданий рассылки исполнителем.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(), connect: vi.fn(), clientQuery: vi.fn(), release: vi.fn(), run: vi.fn(),
}));
vi.mock("../../../../database/db", () => ({ pool: { query: mocks.query, connect: mocks.connect } }));
vi.mock("../../../../database/pool-diagnostics", () => ({ suppressPoolClientHoldWarning: vi.fn() }));
vi.mock("./broadcastQueue", () => ({ runBroadcastQueue: mocks.run }));
vi.mock("./sync-campaign-aggregates", () => ({ syncCampaignAggregates: vi.fn() }));
import { reconcileBroadcasts } from "./broadcast-runtime";

/** Ожидает завершения задачи, запущенной без блокировки вызывающего кода. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Восстановление рассылок", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockResolvedValue({ rows: [{ id: 7 }] });
    mocks.connect.mockResolvedValue({ query: mocks.clientQuery, release: mocks.release });
    mocks.clientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("pg_try_advisory_lock")) return { rows: [{ locked: true }] };
      if (sql.includes("SELECT t.token")) return { rows: [{ token: "secret", is_active: 1, campaign_id: null }] };
      return { rows: [] };
    });
    mocks.run.mockResolvedValue(undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("держит блокировку до завершения отправки и затем освобождает её", async () => {
    await reconcileBroadcasts();
    await flush();
    expect(mocks.run).toHaveBeenCalledWith(7, "secret");
    const statements = mocks.clientQuery.mock.calls.map(([sql]) => sql);
    expect(statements[statements.length - 1]).toContain("pg_advisory_unlock");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("не запускает задание, которым владеет другой процесс", async () => {
    mocks.clientQuery.mockResolvedValueOnce({ rows: [{ locked: false }] });
    await reconcileBroadcasts();
    await flush();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("возвращает слот после ошибки получения соединения и повторяет задание", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.connect.mockRejectedValueOnce(new Error("Пул занят"));
    await reconcileBroadcasts();
    await flush();
    expect(log).toHaveBeenCalled();
    expect(mocks.release).not.toHaveBeenCalled();
    await reconcileBroadcasts();
    await flush();
    expect(mocks.connect).toHaveBeenCalledTimes(2);
    expect(mocks.run).toHaveBeenCalledWith(7, "secret");
    expect(mocks.release).toHaveBeenCalledOnce();
  });

  it("уничтожает соединение, если снять сессионную блокировку не удалось", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.clientQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("pg_try_advisory_lock")) return { rows: [{ locked: true }] };
      if (sql.includes("SELECT t.token")) return { rows: [{ token: "secret", is_active: 1, campaign_id: null }] };
      if (sql.includes("pg_advisory_unlock")) throw new Error("Соединение потеряно");
      return { rows: [] };
    });
    await reconcileBroadcasts();
    await flush();
    expect(mocks.release).toHaveBeenCalledWith(true);
  });
});
