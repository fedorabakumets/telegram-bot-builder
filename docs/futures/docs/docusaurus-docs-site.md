# Документация-сайт на Docusaurus

## Статус: MVP готов ✅

Сайт инициализирован в `docs-site/`, контент читается из корневого `docs/` (без копирования).

## Идея

Создать красивый сайт документации на Docusaurus с автодеплоем на GitHub Pages.
URL: `fedorabakumets.github.io/telegram-bot-builder/`

## Почему Docusaurus

- React-based (проект уже на React)
- Markdown → сайт с поиском, тёмной темой, навигацией
- Бесплатный хостинг на GitHub Pages
- Версионирование документации
- Поддержка i18n (RU/EN)

## Что уже сделано

1. ✅ `docs-site/` на Docusaurus 3 + TypeScript
2. ✅ Контент из `../docs` (единый источник)
3. ✅ Исключены `futures/`, `roadmaps/`, `smm/`, `bots/`
4. ✅ Локальный поиск (`@easyops-cn/docusaurus-search-local`)
5. ✅ Тёмная тема по умолчанию, RU locale
6. ✅ GitHub Actions: `.github/workflows/deploy-docs-site.yml`
7. ✅ Скрипты в корне: `npm run docs:site`, `docs:site:build`, `docs:site:serve`

## Локальный запуск

```bash
npm run docs:site
# или: cd docs-site && npm start
```

## Что осталось

- [ ] Включить GitHub Pages (Settings → Pages → Source: GitHub Actions)
- [ ] Починить битые ссылки в md (на `futures/`, ещё не написанные ноды, `lib/templates/`)
- [ ] Скриншоты UI
- [ ] Getting-started страницы (introduction, first-bot-in-5-minutes)
- [ ] Версионирование docs / i18n EN

## Структура сайта

### Для пользователей
- Быстрый старт (установка, первый бот за 5 минут)
- Справочник нод (все типы с примерами и скриншотами)
- Рецепты (антиспам, модерация, магазин, рассылка, чистка чата)
- Переменные (системные, пользовательские, синтаксис {var})
- Ограничения Telegram
- FAQ

### Для разработчиков
- Архитектура (client, server, lib, shared)
- Добавление новой ноды (чеклист)
- Шаблоны генерации кода (Jinja2)
- API reference
- Contributing

## Технические детали

- Папка: `docs-site/` (отдельно от основного проекта)
- Деплой: GitHub Actions → GitHub Pages
- Контент: `docs/` в корне репо (`path: '../docs'`)
- Сайдбар: ручной в `docs-site/sidebars.ts`
- Markdown mode (`format: 'md'`), чтобы `{variables}` не ломали MDX
