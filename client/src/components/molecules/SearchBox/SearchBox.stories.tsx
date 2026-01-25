import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { SearchBox } from './SearchBox';

/**
 * SearchBox component stories
 * 
 * Компонент поиска с автодополнением, дебаунсингом и фильтрацией.
 */
const meta = {
  title: 'Molecules/SearchBox',
  component: SearchBox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Компонент поиска с расширенными возможностями:
- Дебаунсинг для оптимизации производительности
- Автодополнение с выпадающим списком
- Навигация с клавиатуры (стрелки, Enter, Escape)
- Кнопка очистки
- Состояние загрузки
- Настраиваемая фильтрация предложений

## Использование

\`\`\`tsx
import { SearchBox } from '@/components/molecules/SearchBox';

<SearchBox
  placeholder="Поиск пользователей..."
  suggestions={['Алексей', 'Мария', 'Дмитрий']}
  onChange={(value, debouncedValue) => console.log(value, debouncedValue)}
  onSearch={(value) => console.log('Search:', value)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Размер поля поиска',
    },
    debounceMs: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Задержка дебаунсинга в миллисекундах',
    },
    showClearButton: {
      control: { type: 'boolean' },
      description: 'Показывать кнопку очистки',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Состояние загрузки',
    },
    showSuggestions: {
      control: { type: 'boolean' },
      description: 'Показывать предложения автодополнения',
    },
    maxSuggestions: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Максимальное количество предложений',
    },
  },
  args: {
    onChange: fn(),
    onSearch: fn(),
    onSuggestionSelect: fn(),
  },
} satisfies Meta<typeof SearchBox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовый поиск без автодополнения
 */
export const Default: Story = {
  args: {
    placeholder: 'Поиск...',
  },
};

/**
 * Поиск с автодополнением
 */
export const WithSuggestions: Story = {
  args: {
    placeholder: 'Поиск пользователей...',
    suggestions: [
      'Алексей Иванов',
      'Мария Петрова', 
      'Дмитрий Сидоров',
      'Анна Козлова',
      'Сергей Морозов',
      'Елена Волкова',
      'Михаил Новиков',
      'Ольга Соколова'
    ],
  },
};

/**
 * Поиск в состоянии загрузки
 */
export const Loading: Story = {
  args: {
    placeholder: 'Поиск...',
    loading: true,
    value: 'поисковый запрос',
  },
};

/**
 * Маленький размер
 */
export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Маленький поиск...',
    suggestions: ['React', 'Vue', 'Angular', 'Svelte'],
  },
};

/**
 * Большой размер
 */
export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Большой поиск...',
    suggestions: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#'],
  },
};

/**
 * Без кнопки очистки
 */
export const WithoutClearButton: Story = {
  args: {
    placeholder: 'Поиск без очистки...',
    showClearButton: false,
    suggestions: ['Опция 1', 'Опция 2', 'Опция 3'],
  },
};

/**
 * Отключенный поиск
 */
export const Disabled: Story = {
  args: {
    placeholder: 'Отключенный поиск...',
    disabled: true,
    value: 'Нельзя редактировать',
  },
};

/**
 * Быстрый дебаунсинг
 */
export const FastDebounce: Story = {
  args: {
    placeholder: 'Быстрый дебаунсинг (100мс)...',
    debounceMs: 100,
    suggestions: ['Быстро 1', 'Быстро 2', 'Быстро 3'],
  },
};

/**
 * Медленный дебаунсинг
 */
export const SlowDebounce: Story = {
  args: {
    placeholder: 'Медленный дебаунсинг (800мс)...',
    debounceMs: 800,
    suggestions: ['Медленно 1', 'Медленно 2', 'Медленно 3'],
  },
};

/**
 * Ограниченное количество предложений
 */
export const LimitedSuggestions: Story = {
  args: {
    placeholder: 'Максимум 3 предложения...',
    maxSuggestions: 3,
    suggestions: [
      'Первое предложение',
      'Второе предложение', 
      'Третье предложение',
      'Четвертое предложение (не показывается)',
      'Пятое предложение (не показывается)',
    ],
  },
};

/**
 * Поиск по странам
 */
export const CountrySearch: Story = {
  args: {
    placeholder: 'Выберите страну...',
    suggestions: [
      'Россия',
      'США',
      'Германия',
      'Франция',
      'Италия',
      'Испания',
      'Великобритания',
      'Канада',
      'Австралия',
      'Япония',
      'Китай',
      'Индия',
      'Бразилия',
      'Аргентина',
      'Мексика'
    ],
  },
};

/**
 * Поиск по технологиям
 */
export const TechSearch: Story = {
  args: {
    placeholder: 'Поиск технологий...',
    suggestions: [
      'React',
      'Vue.js',
      'Angular',
      'Svelte',
      'Next.js',
      'Nuxt.js',
      'Gatsby',
      'TypeScript',
      'JavaScript',
      'Node.js',
      'Express',
      'Fastify',
      'Nest.js',
      'MongoDB',
      'PostgreSQL',
      'MySQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'AWS',
      'Azure',
      'Google Cloud'
    ],
  },
};

/**
 * Все размеры поиска
 */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="text-sm font-medium mb-1 block">Маленький</label>
        <SearchBox 
          size="sm" 
          placeholder="Маленький поиск..." 
          suggestions={['Опция 1', 'Опция 2']}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Средний</label>
        <SearchBox 
          size="md" 
          placeholder="Средний поиск..." 
          suggestions={['Опция 1', 'Опция 2']}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Большой</label>
        <SearchBox 
          size="lg" 
          placeholder="Большой поиск..." 
          suggestions={['Опция 1', 'Опция 2']}
        />
      </div>
    </div>
  ),
};

/**
 * Различные состояния поиска
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="text-sm font-medium mb-1 block">Обычный</label>
        <SearchBox placeholder="Обычный поиск..." />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">С предложениями</label>
        <SearchBox 
          placeholder="С автодополнением..." 
          suggestions={['Предложение 1', 'Предложение 2', 'Предложение 3']}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Загрузка</label>
        <SearchBox 
          placeholder="Поиск..." 
          loading 
          value="поисковый запрос"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Отключенный</label>
        <SearchBox 
          placeholder="Отключенный поиск..." 
          disabled 
          value="нельзя редактировать"
        />
      </div>
    </div>
  ),
};