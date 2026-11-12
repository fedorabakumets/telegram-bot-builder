/** @fileoverview Ограниченные строки вывода, безопасное окружение и завершение дерева Python. */
import { spawn, type ChildProcess } from "node:child_process";
import { WORKER_TECH_ENV, WORKER_TUNING_ENV } from "../../bots/workerBaseEnv";

/** Собирает только явно разрешённые настройки; секреты передаются отдельным stdin. */
export function childEnvironment(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const names = new Set([...WORKER_TECH_ENV, ...WORKER_TUNING_ENV]);
  return Object.fromEntries(Object.entries(source).filter(([key]) => names.has(key.toUpperCase())));
}

/** Удаляет значения секретов и адреса подключений из диагностического сообщения. */
export function redactChildLog(value: string, secrets: readonly string[]): string {
  let result = value;
  for (const secret of secrets) if (secret.length > 0) result = result.split(secret).join("[скрыто]");
  return result.replace(/(?:redis|rediss|postgres|postgresql):\/\/[^\s"']+/gi, "[подключение скрыто]")
    .replace(/\b\d{5,}:[A-Za-z0-9_-]{15,}\b/g, "[токен скрыт]");
}

/** Очищает только строковые значения события, не повреждая числа и логические поля протокола. */
export function redactChildEvent(value: unknown, secrets: readonly string[]): unknown {
  if (typeof value === "string") return redactChildLog(value, secrets);
  if (Array.isArray(value)) return value.map((item) => redactChildEvent(item, secrets));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .map(([key, item]) => [key, redactChildEvent(item, secrets)]));
  return value;
}

/** Разбирает строки без неограниченного накопления незавершённого сообщения. */
export function boundedLines(onLine: (line: string) => void, maxBytes = 256 * 1024): (chunk: string) => void {
  let tail = "";
  return (chunk) => {
    for (const part of chunk.split(/(?<=\n)/)) {
      tail += part;
      if (Buffer.byteLength(tail) > maxBytes) throw new Error("Превышен размер строки обработчика");
      if (tail.endsWith("\n")) { onLine(tail.trimEnd()); tail = ""; }
    }
  };
}

/** Завершает только собственное дерево процесса без интерпретации команды оболочкой. */
export async function killChildTree(child: ChildProcess): Promise<void> {
  const pid = child.pid;
  if (!pid || !Number.isSafeInteger(pid) || pid <= 0) return;
  if (process.platform === "win32") {
    if (child.exitCode !== null || child.signalCode !== null) return;
    await new Promise<void>((resolve) => {
      const killer = spawn("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      killer.once("error", () => { child.kill("SIGKILL"); resolve(); });
      killer.once("exit", () => { child.kill("SIGKILL"); resolve(); });
    });
  } else {
    try { process.kill(-pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
  }
}
