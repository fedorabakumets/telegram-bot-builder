import { ChildProcess } from "node:child_process";
import { botProcesses } from "./routes";

// Функция для поиска активного процесса для проекта
export function findActiveProcessForProject(projectId: number): { processKey: string; process: ChildProcess; } | null {
  for (const [key, process] of Array.from(botProcesses.entries())) {
    if (key.startsWith(`${projectId}_`) && process && !process.killed && process.exitCode === null) {
      return { processKey: key, process };
    }
  }
  return null;
}
