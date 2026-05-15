-- Seed: данные для таблиц проекта "обменники" (project_id = 240)

-- Таблица urls (id=4): ссылки на API обменников
INSERT INTO bot_table_rows (table_id, row_index, data) VALUES
(4, 1, '{"54": "https://swop.is/valuta.json", "55": "https://sova.is/valuta.json", "56": "https://pocket-exchange.com/valuta.json", "57": "https://ferma.cc/valuta.json"}');

-- Таблица ids (id=5): ID валют в API обменников
INSERT INTO bot_table_rows (table_id, row_index, data) VALUES
(5, 1, '{"58": "2", "59": "18", "60": "48", "61": "55", "62": "5", "63": "107", "64": "139"}');

-- Таблица texts (id=6): тексты сообщений бота
INSERT INTO bot_table_rows (table_id, row_index, data) VALUES
(6, 1, '{"65": "Привет, {user_name}! Выбери пару для обмена.", "66": "Ошибка загрузки курсов. Попробуйте позже.", "67": "Бот мониторинга обменников"}');
