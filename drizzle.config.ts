import { defineConfig } from "drizzle-kit";

// Railway автоматически устанавливает DATABASE_URL когда подключен PostgreSQL сервис
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found. Ensure PostgreSQL service is connected to your Railway project.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts", // или путь к вашей схеме
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Включаем verbose логирование для отладки
  verbose: true,
  // Строгий режим для безопасности
  strict: true,
});