-- Создание таблицы настроек приложения (ключ-значение)
-- Используется Setup Wizard для хранения конфигурации Telegram Login и других параметров

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
