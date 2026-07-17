# Документация-сайт BotCraft (Docusaurus)

Статический сайт из markdown в корневом `../docs`.

## Локально

```bash
cd docs-site
npm install
npm start
```

Откроется http://localhost:3000/telegram-bot-builder/

## Сборка

```bash
npm run build
npm run serve
```

## Деплой

GitHub Actions (`.github/workflows/deploy-docs-site.yml`) собирает сайт и публикует на GitHub Pages:

https://fedorabakumets.github.io/telegram-bot-builder/

В настройках репозитория: **Settings → Pages → Source: GitHub Actions**.

## Важно

- Контент **не копируется** — `docusaurus.config.ts` смотрит на `../docs`
- `futures/`, `roadmaps/`, `smm/` исключены из сайта
- Markdown режим (`format: 'md'`), чтобы `{variables}` не ломали MDX
