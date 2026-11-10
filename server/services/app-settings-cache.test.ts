/** @fileoverview Узкие проверки кэширования настроек через настоящий сервис с подменённой БД. */
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }));
vi.mock("../database/db", () => ({ db: {
  select: () => ({ from: () => ({ where: () => ({ limit: mocks.read }) }) }),
  insert: () => ({ values: () => ({ onConflictDoUpdate: mocks.write }) }),
  delete: () => ({ where: mocks.write }),
} }));
vi.mock("./telegram-bot-username", () => ({ fetchBotUsernameFromToken: vi.fn() }));
/** Загружает изолированный экземпляр сервиса и его кэша. */
async function service() { return import("./app-settings.service"); }
beforeEach(() => { vi.resetModules(); mocks.read.mockReset(); mocks.write.mockReset(); mocks.write.mockResolvedValue(undefined); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
it("объединяет тридцать чтений одного ключа", async () => {
  mocks.read.mockResolvedValue([{ value: "да" }]);
  const { getSetting } = await service();
  expect(await Promise.all(Array.from({ length: 30 }, () => getSetting("test")))).toEqual(Array(30).fill("да"));
  expect(mocks.read).toHaveBeenCalledTimes(1);
});
it("кэширует отсутствие и возвращает значение окружения", async () => {
  vi.stubEnv("SUPPORT_BOT_TOKEN", "из-окружения");
  mocks.read.mockResolvedValue([]);
  const { getSetting } = await service();
  expect(await getSetting("support_bot_token")).toBe("из-окружения");
  expect(await getSetting("support_bot_token")).toBe("из-окружения");
  expect(await getSetting("missing")).toBeUndefined();
  expect(await getSetting("missing")).toBeUndefined();
  expect(mocks.read).toHaveBeenCalledTimes(2);
});
it("после срока жизни объединяет повторные чтения", async () => {
  vi.useFakeTimers();
  mocks.read.mockResolvedValue([{ value: "да" }]);
  const { getSetting } = await service();
  await getSetting("test");
  vi.advanceTimersByTime(60_001);
  await Promise.all([getSetting("test"), getSetting("test")]);
  expect(mocks.read).toHaveBeenCalledTimes(2);
});
it("ошибка БД не превращается в отсутствие или fallback и допускает повтор", async () => {
  vi.stubEnv("SUPPORT_BOT_TOKEN", "резерв");
  mocks.read.mockRejectedValueOnce(new Error("нет соединения")).mockResolvedValueOnce([]);
  const { getSetting } = await service();
  await expect(getSetting("support_bot_token")).rejects.toThrow("нет соединения");
  expect(await getSetting("support_bot_token")).toBe("резерв");
  expect(mocks.read).toHaveBeenCalledTimes(2);
});
it.each(["set", "delete"])("мутация %s не допускает устаревший ответ ожидающего чтения", async operation => {
  let finish!: (rows: Array<{ value: string }>) => void;
  mocks.read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce([{ value: "актуальное" }]);
  const { getSetting, setSetting, deleteSetting } = await service();
  const old = getSetting("test");
  await Promise.resolve();
  if (operation === "set") await setSetting("test", "актуальное");
  else await deleteSetting("test");
  const current = getSetting("test");
  finish([{ value: "устаревшее" }]);
  expect(await old).toBe("актуальное");
  expect(await current).toBe("актуальное");
  expect(await getSetting("test")).toBe("актуальное");
  expect(mocks.read).toHaveBeenCalledTimes(2);
});
it("ошибка записи сохраняет подтверждённое значение кэша", async () => {
  mocks.read.mockResolvedValue([{ value: "проверенное" }]);
  mocks.write.mockRejectedValueOnce(new Error("запись отклонена"));
  const { getSetting, setSetting } = await service();
  await getSetting("test");
  await expect(setSetting("test", "новое")).rejects.toThrow("запись отклонена");
  expect(await getSetting("test")).toBe("проверенное");
  expect(mocks.read).toHaveBeenCalledTimes(1);
});
it("отрицательный кэш истекает и видит появившуюся строку", async () => {
  vi.useFakeTimers();
  mocks.read.mockResolvedValueOnce([]).mockResolvedValueOnce([{ value: "появилось" }]);
  const { getSetting } = await service();
  expect(await getSetting("missing")).toBeUndefined();
  vi.advanceTimersByTime(60_001);
  expect(await getSetting("missing")).toBe("появилось");
  expect(mocks.read).toHaveBeenCalledTimes(2);
});
