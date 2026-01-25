import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { StatCard } from './StatCard';

/**
 * StatCard component stories
 * 
 * Компонент карточки статистики для отображения ключевых метрик.
 */
const meta = {
  title: 'Molecules/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Компонент карточки статистики для отображения ключевых метрик с поддержкой:
- Различных вариантов оформления (default, success, warning, error, info)
- Размеров (sm, md, lg)
- Индикаторов изменений (рост, снижение, нейтрально)
- Иконок (Font Awesome или кастомные)
- Состояния загрузки со скелетоном
- Интерактивности с эффектами наведения
- Кастомного форматирования значений

## Использование

\`\`\`tsx
import { StatCard } from '@/components/molecules/StatCard';

// Базовая карточка
<StatCard 
  title="Всего пользователей" 
  value={1234} 
  iconName="fa-solid fa-users"
/>

// Карточка с индикатором изменений
<StatCard
  title="Доход"
  value="$45,678"
  subtitle="За этот месяц"
  change={{
    value: "+12.5%",
    type: "increase",
    label: "по сравнению с прошлым месяцем"
  }}
  variant="success"
  iconName="fa-solid fa-dollar-sign"
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'error', 'info'],
      description: 'Вариант оформления карточки',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Размер карточки',
    },
    interactive: {
      control: { type: 'boolean' },
      description: 'Интерактивная карточка с эффектами наведения',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Состояние загрузки',
    },
    title: {
      control: { type: 'text' },
      description: 'Заголовок карточки',
    },
    value: {
      control: { type: 'text' },
      description: 'Основное значение',
    },
    subtitle: {
      control: { type: 'text' },
      description: 'Подзаголовок',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовая карточка статистики
 */
export const Default: Story = {
  args: {
    title: 'Всего пользователей',
    value: 2350,
    iconName: 'fa-solid fa-users',
  },
};

/**
 * Карточка с положительным изменением
 */
export const WithPositiveChange: Story = {
  args: {
    title: 'Доход',
    value: '$45,678',
    subtitle: 'За этот месяц',
    change: {
      value: '+12.5%',
      type: 'increase',
      label: 'по сравнению с прошлым месяцем',
    },
    variant: 'success',
    iconName: 'fa-solid fa-dollar-sign',
  },
};

/**
 * Карточка с отрицательным изменением
 */
export const WithNegativeChange: Story = {
  args: {
    title: 'Активные сессии',
    value: 1234,
    subtitle: 'Сейчас онлайн',
    change: {
      value: '-8.2%',
      type: 'decrease',
      label: 'за последний час',
    },
    variant: 'error',
    iconName: 'fa-solid fa-chart-line',
  },
};

/**
 * Карточка с нейтральным изменением
 */
export const WithNeutralChange: Story = {
  args: {
    title: 'Среднее время сессии',
    value: '4:32',
    subtitle: 'Минуты',
    change: {
      value: '0%',
      type: 'neutral',
      label: 'без изменений',
    },
    iconName: 'fa-solid fa-clock',
  },
};

/**
 * Интерактивная карточка
 */
export const Interactive: Story = {
  args: {
    title: 'Новые заказы',
    value: 89,
    subtitle: 'За сегодня',
    interactive: true,
    iconName: 'fa-solid fa-shopping-cart',
    change: {
      value: '+23%',
      type: 'increase',
      label: 'по сравнению с вчера',
    },
  },
};

/**
 * Карточка в состоянии загрузки
 */
export const Loading: Story = {
  args: {
    title: 'Загрузка данных...',
    value: 0,
    loading: true,
  },
};

/**
 * Маленький размер
 */
export const Small: Story = {
  args: {
    title: 'Уведомления',
    value: 12,
    size: 'sm',
    iconName: 'fa-solid fa-bell',
  },
};

/**
 * Большой размер
 */
export const Large: Story = {
  args: {
    title: 'Общий доход',
    value: '$1,234,567',
    subtitle: 'За весь период',
    size: 'lg',
    change: {
      value: '+45.2%',
      type: 'increase',
      label: 'рост за год',
    },
    variant: 'success',
    iconName: 'fa-solid fa-chart-bar',
  },
};

/**
 * Различные варианты оформления
 */
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="По умолчанию"
        value={1234}
        variant="default"
        iconName="fa-solid fa-chart-line"
      />
      <StatCard
        title="Успех"
        value={5678}
        variant="success"
        iconName="fa-solid fa-check-circle"
        change={{ value: '+15%', type: 'increase' }}
      />
      <StatCard
        title="Предупреждение"
        value={890}
        variant="warning"
        iconName="fa-solid fa-exclamation-triangle"
        change={{ value: '-5%', type: 'decrease' }}
      />
      <StatCard
        title="Ошибка"
        value={123}
        variant="error"
        iconName="fa-solid fa-times-circle"
        change={{ value: '-25%', type: 'decrease' }}
      />
      <StatCard
        title="Информация"
        value={456}
        variant="info"
        iconName="fa-solid fa-info-circle"
        change={{ value: '0%', type: 'neutral' }}
      />
    </div>
  ),
};

/**
 * Все размеры карточек
 */
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Маленький размер</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Задачи"
            value={24}
            size="sm"
            iconName="fa-solid fa-tasks"
          />
          <StatCard
            title="Сообщения"
            value={8}
            size="sm"
            iconName="fa-solid fa-envelope"
          />
          <StatCard
            title="Файлы"
            value={156}
            size="sm"
            iconName="fa-solid fa-file"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Средний размер</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            title="Пользователи"
            value={2350}
            size="md"
            iconName="fa-solid fa-users"
            change={{ value: '+12%', type: 'increase' }}
          />
          <StatCard
            title="Продажи"
            value="$45,678"
            size="md"
            iconName="fa-solid fa-dollar-sign"
            change={{ value: '+8%', type: 'increase' }}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Большой размер</h3>
        <StatCard
          title="Общая выручка"
          value="$1,234,567"
          subtitle="За весь период работы"
          size="lg"
          iconName="fa-solid fa-chart-bar"
          change={{
            value: '+156.7%',
            type: 'increase',
            label: 'рост за последний год'
          }}
          variant="success"
        />
      </div>
    </div>
  ),
};

/**
 * Дашборд с различными метриками
 */
export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Всего пользователей"
        value={12543}
        change={{
          value: '+12.5%',
          type: 'increase',
          label: 'за месяц'
        }}
        variant="success"
        iconName="fa-solid fa-users"
        interactive
      />
      
      <StatCard
        title="Активные сессии"
        value={1834}
        change={{
          value: '-2.1%',
          type: 'decrease',
          label: 'за час'
        }}
        variant="warning"
        iconName="fa-solid fa-chart-line"
        interactive
      />
      
      <StatCard
        title="Доход"
        value="$89,432"
        change={{
          value: '+23.8%',
          type: 'increase',
          label: 'за неделю'
        }}
        variant="success"
        iconName="fa-solid fa-dollar-sign"
        interactive
      />
      
      <StatCard
        title="Ошибки"
        value={23}
        change={{
          value: '+15%',
          type: 'decrease',
          label: 'за день'
        }}
        variant="error"
        iconName="fa-solid fa-exclamation-triangle"
        interactive
      />
    </div>
  ),
};

/**
 * Карточки с кастомным форматированием
 */
export const CustomFormatting: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Использование диска"
        value={75.5}
        formatValue={(val) => `${val}%`}
        iconName="fa-solid fa-hdd"
        change={{
          value: '+5.2%',
          type: 'increase',
          label: 'за неделю'
        }}
      />
      
      <StatCard
        title="Время отклика"
        value={245}
        formatValue={(val) => `${val}ms`}
        iconName="fa-solid fa-tachometer-alt"
        change={{
          value: '-12ms',
          type: 'increase',
          label: 'улучшение'
        }}
        variant="success"
      />
      
      <StatCard
        title="Рейтинг"
        value={4.8}
        formatValue={(val) => `${val}/5.0 ⭐`}
        iconName="fa-solid fa-star"
        change={{
          value: '+0.2',
          type: 'increase',
          label: 'за месяц'
        }}
        variant="success"
      />
    </div>
  ),
};