# 🤝 Как внести вклад в проект

Спасибо за интерес к развитию Telegram Bot Builder! Мы рады любой помощи.

##  Связь

Хотите участвовать в разработке? Напишите в наш [Telegram-чат](https://t.me/bot_builder_chat) — обсудим задачи и направления.

- [Telegram-чат](https://t.me/bot_builder_chat) — обсуждение, вопросы, координация
- [Telegram-канал](https://t.me/botcraft_studio) — новости и обновления
- [GitHub Issues](https://github.com/fedorabakumets/telegram-bot-builder/issues) — баги и предложения
- [GitHub Discussions](https://github.com/fedorabakumets/telegram-bot-builder/discussions) — идеи и обсуждения

---

## 🐛 Сообщить об ошибке

1. Проверь, что ошибка ещё не была [зарегистрирована](https://github.com/fedorabakumets/telegram-bot-builder/issues)
2. Создай новый Issue с описанием:
   - Что делал
   - Что ожидал
   - Что получил
   - Скриншоты (если возможно)

---

## 🔧 Внести изменения в код

### Быстрый старт

Подробная инструкция по установке: **[INSTALLATION.md](INSTALLATION.md)**

Кратко:
```bash
git clone https://github.com/fedorabakumets/telegram-bot-builder.git
cd telegram-bot-builder
npm install
pip install -r requirements.txt
cp .env.example .env
npm run dev
```

> Требуется: Node.js ≥ 18, PostgreSQL ≥ 17, Redis ≥ 7 (Memurai на Windows), Python ≥ 3.10

### Процесс внесения изменений

1. **Fork** репозитория
2. Создай ветку: `git checkout -b feature/amazing-feature`
3. Внеси изменения и протестируй
4. Закоммить: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Создай **Pull Request**

---

## 📋 Стандарты кода

- **TypeScript** — весь серверный и клиентский код
- **JSDoc на русском языке** — все комментарии обязательно на русском (см. [JSDOC_STANDARDS.md](../JSDOC_STANDARDS.md))
- **100 строк на файл** — стремиться к компактным файлам, максимум 150 строк за итерацию
- Следуй существующему стилю кода
- Не запускай `npm run check` или `npx tsc --noEmit` — используй проверку конкретных файлов

---

## 🏗️ Архитектура проекта

| Директория | Назначение |
|-----------|-----------|
| `client/` | React frontend (визуальный редактор) |
| `server/` | Express backend (API, генерация кода) |
| `server/bots/` | Запуск и управление Python-процессами ботов |
| `server/redis/` | Redis pub/sub, события платформы |
| `server/routes/` | API маршруты |
| `server/templates/` | Jinja2-шаблоны генерации Python-кода |
| `shared/` | Общие типы и схемы (Drizzle ORM) |
| `bots/` | Сгенерированные Python-боты |
| `docs/` | Документация |
| `migrations/` | Миграции базы данных |

---

## 🎯 Приоритетные области для помощи

1. **Новые типы узлов** — см. [adding-new-trigger.md](adding-new-trigger.md)
2. **Улучшение UI/UX** интерфейса
3. **Оптимизация производительности**
4. **Документация и примеры**
5. **Тестирование на разных платформах**

---

Спасибо за помощь в развитии проекта! 🚀
