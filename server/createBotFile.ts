import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Функция для создания Python файла бота

export function createBotFile(botCode: string, projectId: number, tokenId?: number): string {
  const botsDir = join(process.cwd(), 'bots');
  if (!existsSync(botsDir)) {
    mkdirSync(botsDir, { recursive: true });
  }

  const fileName = tokenId ? `bot_${projectId}_${tokenId}.py` : `bot_${projectId}.py`;
  const filePath = join(botsDir, fileName);
  writeFileSync(filePath, botCode);
  return filePath;
}
