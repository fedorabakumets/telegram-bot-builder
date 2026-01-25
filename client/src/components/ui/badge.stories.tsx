import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

/**
 * Badge component stories
 * 
 * Компонент значка для отображения статусов, меток и категорий.
 */
const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Компонент значка для отображения коротких меток, статусов и категорий с поддержкой:
- Различных вариантов оформления (default, secondary, destructive, outline)
- Настраиваемых цветов и стилей
- Компактного размера для встраивания в другие компоненты

## Использование

\`\`\`tsx
import { Badge } from '@/components/ui/badge';

// Базовый значок
<Badge>Новый</Badge>

// Значок с вариантом
<Badge variant="destructive">Ошибка</Badge>

// Значок с контуром
<Badge variant="outline">В процессе</Badge>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'Вариант оформления значка',
    },
    children: {
      control: { type: 'text' },
      description: 'Текст значка',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовый значок
 */
export const Default: Story = {
  args: {
    children: 'Значок',
  },
};

/**
 * Вторичный значок
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Вторичный',
  },
};

/**
 * Деструктивный значок для ошибок и предупреждений
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Ошибка',
  },
};

/**
 * Значок с контуром
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Контур',
  },
};

/**
 * Все варианты значков
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">По умолчанию</Badge>
      <Badge variant="secondary">Вторичный</Badge>
      <Badge variant="destructive">Деструктивный</Badge>
      <Badge variant="outline">Контур</Badge>
    </div>
  ),
};

/**
 * Значки статусов
 */
export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Активный</Badge>
      <Badge variant="secondary">В ожидании</Badge>
      <Badge variant="destructive">Отклонен</Badge>
      <Badge variant="outline">Черновик</Badge>
    </div>
  ),
};

/**
 * Значки с числами
 */
export const WithNumbers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>1</Badge>
      <Badge variant="secondary">12</Badge>
      <Badge variant="destructive">99+</Badge>
      <Badge variant="outline">0</Badge>
    </div>
  ),
};

/**
 * Значки в контексте
 */
export const InContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Задачи</h3>
        <Badge>5</Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 border rounded">
          <span>Исправить баг в авторизации</span>
          <Badge variant="destructive">Критично</Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded">
          <span>Добавить новую функцию</span>
          <Badge variant="secondary">В процессе</Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded">
          <span>Обновить документацию</span>
          <Badge variant="outline">Планируется</Badge>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded">
          <span>Оптимизировать производительность</span>
          <Badge>Готово</Badge>
        </div>
      </div>
    </div>
  ),
};

/**
 * Значки разных размеров (с кастомными стилями)
 */
export const CustomSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge className="text-xs px-2 py-0.5">Маленький</Badge>
      <Badge>Обычный</Badge>
      <Badge className="text-sm px-3 py-1">Большой</Badge>
    </div>
  ),
};

/**
 * Цветные значки (с кастомными стилями)
 */
export const ColoredBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-500 text-white hover:bg-blue-600">Синий</Badge>
      <Badge className="bg-green-500 text-white hover:bg-green-600">Зеленый</Badge>
      <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">Желтый</Badge>
      <Badge className="bg-purple-500 text-white hover:bg-purple-600">Фиолетовый</Badge>
      <Badge className="bg-pink-500 text-white hover:bg-pink-600">Розовый</Badge>
    </div>
  ),
};