import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Input } from './Input';
import { Icon } from '../Icon/Icon';

/**
 * Input component stories
 * 
 * Компонент поля ввода с поддержкой различных состояний, размеров и иконок.
 */
const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Универсальный компонент поля ввода с поддержкой:
- Различных вариантов (default, error, success)
- Размеров (sm, md, lg)
- Иконок в начале и конце поля
- Состояния загрузки с индикатором
- Сообщений об ошибках и успехе
- Оптимизации производительности с React.memo

## Использование

\`\`\`tsx
import { Input } from '@/components/atoms/Input';

// Базовое поле ввода
<Input placeholder="Введите текст" />

// Поле с ошибкой
<Input error="Это поле обязательно" placeholder="Email" />

// Поле с иконками
<Input 
  startIcon={<Icon name="fa-solid fa-search" />}
  placeholder="Поиск..."
/>

// Поле в состоянии загрузки
<Input loading placeholder="Поиск..." />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'error', 'success'],
      description: 'Вариант оформления поля',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Размер поля',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Тип поля ввода',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Показать индикатор загрузки',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Отключить поле',
    },
    error: {
      control: { type: 'text' },
      description: 'Сообщение об ошибке',
    },
    success: {
      control: { type: 'text' },
      description: 'Сообщение об успехе',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Текст-подсказка',
    },
  },
  args: {
    onChange: fn(),
    onFocus: fn(),
    onBlur: fn(),
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовое поле ввода
 */
export const Default: Story = {
  args: {
    placeholder: 'Введите текст...',
  },
};

/**
 * Поле с ошибкой
 */
export const Error: Story = {
  args: {
    placeholder: 'Email',
    error: 'Это поле обязательно для заполнения',
    value: 'invalid-email',
  },
};

/**
 * Поле с успешным состоянием
 */
export const Success: Story = {
  args: {
    placeholder: 'Email',
    success: 'Email корректный',
    value: 'user@example.com',
  },
};

/**
 * Маленький размер
 */
export const Small: Story = {
  args: {
    size: 'sm',
    placeholder: 'Маленькое поле',
  },
};

/**
 * Средний размер (по умолчанию)
 */
export const Medium: Story = {
  args: {
    size: 'md',
    placeholder: 'Среднее поле',
  },
};

/**
 * Большой размер
 */
export const Large: Story = {
  args: {
    size: 'lg',
    placeholder: 'Большое поле',
  },
};

/**
 * Отключенное поле
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Отключенное поле',
    value: 'Нельзя редактировать',
  },
};

/**
 * Поле в состоянии загрузки
 */
export const Loading: Story = {
  args: {
    loading: true,
    placeholder: 'Поиск...',
    value: 'Поисковый запрос',
  },
};

/**
 * Поле с иконкой в начале
 */
export const WithStartIcon: Story = {
  args: {
    startIcon: <Icon name="fa-solid fa-search" />,
    placeholder: 'Поиск...',
  },
};

/**
 * Поле с иконкой в конце
 */
export const WithEndIcon: Story = {
  args: {
    endIcon: <Icon name="fa-solid fa-eye" />,
    type: 'password',
    placeholder: 'Пароль',
  },
};

/**
 * Поле с иконками с обеих сторон
 */
export const WithBothIcons: Story = {
  args: {
    startIcon: <Icon name="fa-solid fa-user" />,
    endIcon: <Icon name="fa-solid fa-check" color="success" />,
    placeholder: 'Имя пользователя',
    value: 'john_doe',
  },
};

/**
 * Различные типы полей
 */
export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input type="text" placeholder="Текст" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Пароль" />
      <Input type="number" placeholder="Число" />
      <Input type="tel" placeholder="Телефон" />
      <Input type="url" placeholder="URL" />
      <Input type="search" placeholder="Поиск" />
    </div>
  ),
};

/**
 * Все размеры полей
 */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="text-sm font-medium mb-1 block">Маленький</label>
        <Input size="sm" placeholder="Маленькое поле" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Средний</label>
        <Input size="md" placeholder="Среднее поле" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Большой</label>
        <Input size="lg" placeholder="Большое поле" />
      </div>
    </div>
  ),
};

/**
 * Все состояния полей
 */
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="text-sm font-medium mb-1 block">Обычное</label>
        <Input placeholder="Обычное поле" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">С ошибкой</label>
        <Input error="Поле обязательно" placeholder="Поле с ошибкой" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Успешное</label>
        <Input success="Все корректно" placeholder="Успешное поле" value="Корректное значение" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Отключенное</label>
        <Input disabled placeholder="Отключенное поле" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Загрузка</label>
        <Input loading placeholder="Поле в загрузке" />
      </div>
    </div>
  ),
};

/**
 * Поля с различными иконками
 */
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input 
        startIcon={<Icon name="fa-solid fa-search" />}
        placeholder="Поиск"
      />
      <Input 
        startIcon={<Icon name="fa-solid fa-envelope" />}
        type="email"
        placeholder="Email"
      />
      <Input 
        startIcon={<Icon name="fa-solid fa-lock" />}
        endIcon={<Icon name="fa-solid fa-eye" />}
        type="password"
        placeholder="Пароль"
      />
      <Input 
        startIcon={<Icon name="fa-solid fa-phone" />}
        type="tel"
        placeholder="Телефон"
      />
      <Input 
        endIcon={<Icon name="fa-solid fa-check" color="success" />}
        placeholder="Проверенное поле"
        value="Корректное значение"
      />
    </div>
  ),
};