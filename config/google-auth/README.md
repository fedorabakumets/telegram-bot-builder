# Конфигурация Google OAuth

Эта папка содержит файлы для аутентификации с Google Sheets API.

## Файлы

### credentials.json
Файл учетных данных OAuth 2.0 из Google Cloud Console.

**Как получить:**
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите Google Sheets API
4. Создайте OAuth 2.0 Client ID (Application type: Web application)
5. Скачайте JSON файл
6. Переименуйте в `credentials.json` и поместите в эту папку

### token.json
Файл токена доступа (создается автоматически после первой аутентификации).

**Не делитесь этим файлом!** Содержит секретные токены доступа.

## Структура папок

```
config/
└── google-auth/
    ├── credentials.json  (скачать из Google Cloud Console)
    └── token.json        (создается автоматически)
```

## Безопасность

- ✅ Файлы в этой папке добавлены в `.gitignore`
- ✅ Никогда не коммитьте `credentials.json` и `token.json` в репозиторий
- ✅ Храните файлы в секрете

## Старые расположения (для обратной совместимости)

Система также ищет файлы в старых папках:
- `client/src/components/editor/`
- `server/google-sheets/`
- Корень проекта

Но рекомендуется использовать новую папку `config/google-auth/`.
