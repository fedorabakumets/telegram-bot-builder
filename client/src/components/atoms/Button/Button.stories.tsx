import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { Button } from './Button';
import { Icon } from '../Icon/Icon';

/**
 * Button component stories
 * 
 * Базовый компонент кнопки с поддержкой различных вариантов оформления,
 * размеров, состояний загрузки и иконок.
 */
const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Универсальный компонент кнопки с поддержкой:
- Различных вариантов оформления (primary, secondary, outline, ghost, destructive, link)
- Размеров (sm, md, lg, icon)
- Состояния загрузки с индикатором
- Иконок до и после текста
- Полиморфного рендеринга через asChild
- Оптимизации производительности с React.memo

## Использование

\`\`\`tsx
import { Button } from '@/components/atoms/Button';

// Базовая кнопка
<Button variant="primary" size="md">
  Нажми меня
</Button>

// Кнопка с иконкой
<Button icon={<Icon name="fa-solid fa-plus" />}>
  Добавить
</Button>

// Кнопка в состоянии загрузки
<Button loading disabled>
  Сохранение...
</Button>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
      description: 'Вариант оформления кнопки',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Размер кнопки',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Показать индикатор загрузки',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Отключить кнопку',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Рендерить как дочерний элемент (полиморфизм)',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Основная кнопка - используется для главных действий
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Вторичная кнопка - для менее важных действий
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Кнопка с контуром - для альтернативных действий
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Призрачная кнопка - минималистичный стиль
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Деструктивная кнопка - для опасных действий (удаление, сброс)
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

/**
 * Кнопка-ссылка - выглядит как ссылка
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

/**
 * Маленький размер кнопки
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

/**
 * Средний размер кнопки (по умолчанию)
 */
export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium Button',
  },
};

/**
 * Большой размер кнопки
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

/**
 * Кнопка в состоянии загрузки
 */
export const Loading: Story = {
  args: {
    loading: true,
    disabled: true,
    children: 'Loading...',
  },
};

/**
 * Отключенная кнопка
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

/**
 * Кнопка с иконкой слева
 */
export const WithIcon: Story = {
  args: {
    icon: <Icon name="fa-solid fa-plus" />,
    children: 'Add Item',
  },
};

/**
 * Кнопка с иконкой справа
 */
export const WithIconRight: Story = {
  args: {
    iconRight: <Icon name="fa-solid fa-arrow-right" />,
    children: 'Next',
  },
};

/**
 * Кнопка только с иконкой
 */
export const IconOnly: Story = {
  args: {
    size: 'icon',
    variant: 'outline',
    children: <Icon name="fa-solid fa-heart" />,
  },
};

/**
 * Все варианты кнопок в одном ряду
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

/**
 * Все размеры кнопок
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Icon name="fa-solid fa-star" />
      </Button>
    </div>
  ),
};

/**
 * Различные состояния кнопки
 */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button>Normal</Button>
      <Button loading disabled>Loading</Button>
      <Button disabled>Disabled</Button>
      <Button icon={<Icon name="fa-solid fa-check" />}>With Icon</Button>
    </div>
  ),
};