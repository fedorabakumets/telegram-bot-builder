/** @fileoverview Безопасный учёт реально отправленных режимов ботов без хранения команд и секретов. */
import { buildWorkerBaseEnv } from "../bots/workerBaseEnv";
import { parseWorkerSystemMessage } from "../bots/parseWorkerSystemMessage";

/** Публичное состояние одного запуска бота. */
export interface RunnerBotMode {
  /** Идентификатор записи токена в БД. */
  tokenId: number;
  /** Режим последней отправленной команды запуска. */
  mode: "direct" | "ondemand" | "process";
  /** Подтверждённая активность; старый протокол не позволяет отличить сон. */
  activity: "active" | "sleeping" | "starting" | "waiting" | "unknown";
  /** Простой сценария в применённой команде запуска. */
  idleSeconds?: number;
}

/** Хранит только разрешённые скалярные поля на время жизни регистрации. */
export class RunnerBotModes {
  /** Применённые команды текущей группы. */
  private readonly bots = new Map<number, RunnerBotMode>();

  /** Запоминает настройки непосредственно перед передачей проверенной команды. */
  start(command: { token_id: number; env?: Record<string, string> }): void {
    const env = { ...buildWorkerBaseEnv(), ...command.env };
    const selected = env.BOT_ON_DEMAND_TOKEN_IDS?.trim();
    const included = !selected || selected.split(",").some((id) => Number(id.trim()) === command.token_id);
    const configured = env.BOT_POLLING_MODE ?? "direct";
    const mode = included && (configured === "ondemand" || configured === "process") ? configured : "direct";
    const idle = Number(env.BOT_ON_DEMAND_IDLE_SECONDS ?? "30");
    this.bots.set(command.token_id, { tokenId: command.token_id, mode, activity: "starting",
      ...(mode !== "direct" && Number.isFinite(idle) ? { idleSeconds: idle } : {}) });
  }

  /** Снимает регистрацию после подтверждённой остановки либо ошибки запуска. */
  remove(tokenId: number): void { this.bots.delete(tokenId); }

  /** Применяет только подтверждения жизненного цикла, не сохраняя исходный вывод. */
  observe(content: string): void {
    const event = parseWorkerSystemMessage(content);
    if (event.tokenId === undefined) return;
    if (event.kind === "bot_stopped" || event.kind === "bot_exited") this.remove(event.tokenId);
    else if (event.kind === "bot_started") {
      const bot = this.bots.get(event.tokenId);
      if (bot) bot.activity = "unknown";
    }
  }

  /** Объединяет применённый режим с точной активностью Node-приёмника. */
  snapshot(actual: Array<{ tokenId: number; activity: RunnerBotMode["activity"] }> = []): RunnerBotMode[] {
    const activities = new Map(actual.map((bot) => [bot.tokenId, bot.activity]));
    return [...this.bots.values()].map((bot) => ({ ...bot, activity: activities.get(bot.tokenId) ?? bot.activity }));
  }
}
