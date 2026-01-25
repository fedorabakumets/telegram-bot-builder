import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';

/**
 * Icon component stories
 * 
 * Универсальный компонент иконок с поддержкой Font Awesome и кастомных SVG.
 */
const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Универсальный компонент иконок с поддержкой:
- Font Awesome иконок через prop name
- Кастомных SVG иконок через children
- Различных размеров (xs, sm, md, lg, xl, 2xl)
- Семантических цветов (default, muted, primary, success, warning, error, info)
- Полной доступности с aria-label и role

## Использование

\`\`\`tsx
import { Icon } from '@/components/atoms/Icon';

// Font Awesome иконка
<Icon name="fa-solid fa-user" size="lg" color="primary" aria-label="Пользователь" />

// Кастомная SVG иконка
<Icon size="md" color="success" aria-label="Успех">
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
</Icon>

// Декоративная иконка (скрыта от скринридеров)
<Icon name="fa-solid fa-star" decorative />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Размер иконки',
    },
    color: {
      control: { type: 'select' },
      options: ['default', 'muted', 'primary', 'secondary', 'success', 'warning', 'error', 'info'],
      description: 'Цвет иконки',
    },
    name: {
      control: { type: 'text' },
      description: 'Имя Font Awesome иконки (например, "fa-solid fa-user")',
    },
    decorative: {
      control: { type: 'boolean' },
      description: 'Декоративная иконка (скрыта от скринридеров)',
    },
    'aria-label': {
      control: { type: 'text' },
      description: 'Подпись для скринридеров',
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовая иконка Font Awesome
 */
export const Default: Story = {
  args: {
    name: 'fa-solid fa-star',
    'aria-label': 'Звезда',
  },
};

/**
 * Кастомная SVG иконка
 */
export const CustomSVG: Story = {
  args: {
    'aria-label': 'Галочка',
    children: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    ),
  },
};

/**
 * Все размеры иконок
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <Icon name="fa-solid fa-star" size="xs" />
        <div className="text-xs mt-1">xs</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-star" size="sm" />
        <div className="text-xs mt-1">sm</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-star" size="md" />
        <div className="text-xs mt-1">md</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-star" size="lg" />
        <div className="text-xs mt-1">lg</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-star" size="xl" />
        <div className="text-xs mt-1">xl</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-star" size="2xl" />
        <div className="text-xs mt-1">2xl</div>
      </div>
    </div>
  ),
};

/**
 * Все цвета иконок
 */
export const Colors: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="default" />
        <div className="text-xs mt-1">default</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="muted" />
        <div className="text-xs mt-1">muted</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="primary" />
        <div className="text-xs mt-1">primary</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="secondary" />
        <div className="text-xs mt-1">secondary</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="success" />
        <div className="text-xs mt-1">success</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="warning" />
        <div className="text-xs mt-1">warning</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="error" />
        <div className="text-xs mt-1">error</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-circle" color="info" />
        <div className="text-xs mt-1">info</div>
      </div>
    </div>
  ),
};

/**
 * Популярные Font Awesome иконки
 */
export const FontAwesome: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      <div className="text-center">
        <Icon name="fa-solid fa-user" size="lg" />
        <div className="text-xs mt-1">user</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-home" size="lg" />
        <div className="text-xs mt-1">home</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-cog" size="lg" />
        <div className="text-xs mt-1">settings</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-heart" size="lg" />
        <div className="text-xs mt-1">heart</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-star" size="lg" />
        <div className="text-xs mt-1">star</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-bell" size="lg" />
        <div className="text-xs mt-1">bell</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-envelope" size="lg" />
        <div className="text-xs mt-1">mail</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-search" size="lg" />
        <div className="text-xs mt-1">search</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-plus" size="lg" />
        <div className="text-xs mt-1">plus</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-trash" size="lg" />
        <div className="text-xs mt-1">trash</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-edit" size="lg" />
        <div className="text-xs mt-1">edit</div>
      </div>
      <div className="text-center">
        <Icon name="fa-solid fa-check" size="lg" />
        <div className="text-xs mt-1">check</div>
      </div>
    </div>
  ),
};

/**
 * Кастомные SVG иконки
 */
export const CustomSVGs: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <div className="text-center">
        <Icon size="lg" aria-label="Галочка">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </Icon>
        <div className="text-xs mt-1">check</div>
      </div>
      <div className="text-center">
        <Icon size="lg" aria-label="Крестик">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </Icon>
        <div className="text-xs mt-1">close</div>
      </div>
      <div className="text-center">
        <Icon size="lg" aria-label="Стрелка вправо">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </Icon>
        <div className="text-xs mt-1">arrow</div>
      </div>
      <div className="text-center">
        <Icon size="lg" aria-label="Информация">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </Icon>
        <div className="text-xs mt-1">info</div>
      </div>
    </div>
  ),
};

/**
 * Иконки в контексте (с текстом)
 */
export const InContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="fa-solid fa-user" color="primary" />
        <span>Профиль пользователя</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="fa-solid fa-envelope" color="info" />
        <span>Новое сообщение</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="fa-solid fa-exclamation-triangle" color="warning" />
        <span>Предупреждение</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="fa-solid fa-check-circle" color="success" />
        <span>Операция выполнена</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name="fa-solid fa-times-circle" color="error" />
        <span>Произошла ошибка</span>
      </div>
    </div>
  ),
};