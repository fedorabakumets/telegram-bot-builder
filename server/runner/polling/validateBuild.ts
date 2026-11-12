/** @fileoverview Краткая AST-проверка совместимости сборки без запуска сценария и постоянного Python. */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import type { RunnerConfig } from "../runnerConfig";
import { childEnvironment } from "./pythonChildSupport";

/** Проверяет маркеры через Python AST; завершает проверяющий процесс по таймауту. */
export function validateProcessBuild(config: RunnerConfig, botFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(config.pythonPath, ["-u", join(dirname(config.workerScript), "process_validate.py")],
      { env: childEnvironment(process.env), stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    let output = "";
    let finished = false;
    /** Завершает проверку только один раз и не публикует входные пути либо секреты. */
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (error) { child.kill("SIGKILL"); reject(error); } else resolve();
    };
    const timer = setTimeout(() => finish(new Error("Истекло ожидание проверки сборки")), 10_000);
    child.on("error", () => finish(new Error("Не удалось проверить совместимость сборки")));
    child.stdout.on("data", (data: Buffer) => {
      output += data.toString("utf8");
      if (Buffer.byteLength(output) > 1024) finish(new Error("Некорректный ответ проверки сборки"));
    });
    child.on("close", (code) => {
      let valid = false;
      try { valid = JSON.parse(output).event === "ready"; } catch { /* Некорректный ответ отклоняется. */ }
      finish(code === 0 && valid ? undefined : new Error("Сборка несовместима с process: пересоберите бота или отключите фоновые возможности"));
    });
    child.stdin.on("error", () => finish(new Error("Канал проверки сборки закрыт")));
    child.stdin.end(JSON.stringify({ bot_file: botFile }) + "\n");
  });
}
