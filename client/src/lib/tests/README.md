# Тестирование

В этом проекте для тестирования используется стандартная библиотека Node.js - `assert`.

## Особенности

- Используется `strict assert` режим (`assert.strict` или `assert` с опцией `strict: true`)
- Тесты находятся рядом с тестируемыми файлами или в папке `tests`
- Для запуска тестов используется команда: `tsx --tsconfig tsconfig.json path/to/test/file.js`

## Пример структуры

```
src/
├── lib/
│   ├── format/
│   │   ├── stripHtmlTags.ts
│   │   └── stripHtmlTags.node_test.js
│   └── tests/
│       └── README.md (этот файл)
```

## Запуск тестов

Чтобы запустить отдельный тест, выполните команду:

```bash
npx tsx --tsconfig tsconfig.json path/to/test/file.js
```

где `path/to/test/file.js` - путь к файлу с тестами.

## Запуск всех тестов

Чтобы запустить все тесты проекта одной командой, выполните:

```bash
node run-tests.js
```

или

```bash
npm run test
```

если соответствующий скрипт добавлен в package.json.