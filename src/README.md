# Src

Дополнительные исходные файлы и конфигурации проекта.

## Структура

### `stories/` - Storybook истории
Компоненты для Storybook - инструмента разработки UI компонентов:
- `Button.stories.ts` - истории для компонента Button
- `Button.tsx` - пример компонента Button
- `Header.stories.ts` - истории для компонента Header
- `Header.tsx` - пример компонента Header
- `Page.stories.ts` - истории для компонента Page
- `Page.tsx` - пример компонента Page
- `Configure.mdx` - документация по настройке

### Стили компонентов
- `button.css` - стили для Button компонента
- `header.css` - стили для Header компонента
- `page.css` - стили для Page компонента

### Ресурсы Storybook
- `assets/` - статические ресурсы для историй

### Полифиллы
- `polyfills.js` - полифиллы для браузеров
- `nixpacks-polyfills.js` - полифиллы для Nixpacks

### Python пакет
- `repl_nix_workspace.egg-info/` - метаданные Python пакета

## Storybook

### Назначение
Storybook используется для:
- **Разработки компонентов** в изоляции
- **Документирования** UI компонентов
- **Тестирования** различных состояний компонентов
- **Демонстрации** дизайн-системы

### Структура историй
```typescript
// stories/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Button',
  },
};
```

### Запуск Storybook
```bash
# Запуск в режиме разработки
npm run storybook

# Сборка статической версии
npm run build-storybook
```

## Полифиллы

### `polyfills.js`
Полифиллы для поддержки старых браузеров:
```javascript
// Полифилл для Promise (IE11)
if (!window.Promise) {
  window.Promise = require('es6-promise').Promise;
}

// Полифилл для fetch API
if (!window.fetch) {
  window.fetch = require('whatwg-fetch').fetch;
}

// Полифилл для Object.assign
if (!Object.assign) {
  Object.assign = require('object-assign');
}
```

### `nixpacks-polyfills.js`
Специальные полифиллы для развертывания на Nixpacks:
```javascript
// Полифиллы для Node.js окружения
if (typeof global === 'undefined') {
  var global = globalThis;
}

// Полифилл для Buffer в браузере
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}
```

## Python пакет

### `repl_nix_workspace.egg-info/`
Метаданные для Python пакета, используемого в Replit:
- `PKG-INFO` - информация о пакете
- `SOURCES.txt` - список файлов пакета
- `dependency_links.txt` - ссылки на зависимости
- `requires.txt` - требуемые зависимости
- `top_level.txt` - модули верхнего уровня

### Назначение
Этот пакет используется для:
- **Интеграции с Replit** - облачной IDE
- **Управления зависимостями** Python части проекта
- **Настройки окружения** для разработки

## Конфигурация Storybook

### `.storybook/main.js`
```javascript
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
```

### `.storybook/preview.js`
```javascript
import '../src/index.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
```

## Использование

### Разработка компонентов
1. Создайте компонент в `src/components/`
2. Создайте историю в `src/stories/`
3. Запустите Storybook для тестирования
4. Интегрируйте компонент в приложение

### Документирование
- Используйте MDX для создания документации
- Добавляйте описания к компонентам
- Документируйте все пропсы и их типы

### Тестирование
- Тестируйте различные состояния компонентов
- Используйте Storybook для визуального тестирования
- Интегрируйте с инструментами автоматического тестирования

## Деплой Storybook

### Статическая сборка
```bash
npm run build-storybook
```

### Хостинг
- **Chromatic** - официальный хостинг для Storybook
- **Netlify** - статический хостинг
- **GitHub Pages** - бесплатный хостинг
- **Vercel** - автоматический деплой

### Интеграция с CI/CD
```yaml
# .github/workflows/storybook.yml
name: Build and Deploy Storybook
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build-storybook
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```