import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { UserCard, type User, type UserCardAction } from './UserCard';
import { Badge } from '../../ui/badge';

/**
 * UserCard component stories
 * 
 * Компонент карточки пользователя для отображения информации о пользователе с действиями.
 */
const meta = {
  title: 'Organisms/UserCard',
  component: UserCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Компонент карточки пользователя для отображения информации с поддержкой:
- Компактного и детального вариантов отображения
- Аватара с индикатором статуса
- Настраиваемых действий (кнопки)
- Интерактивности с обработкой кликов
- Состояния загрузки со скелетоном
- Кастомного контента
- Переполнения действий в меню

## Использование

\`\`\`tsx
import { UserCard } from '@/components/organisms/UserCard';

<UserCard
  user={{
    id: '1',
    name: 'Алексей Иванов',
    email: 'alexey@example.com',
    avatar: '/avatars/alexey.jpg',
    role: 'Администратор',
    status: 'online'
  }}
  variant="detailed"
  actions={[
    { label: 'Редактировать', onClick: () => {}, variant: 'primary' },
    { label: 'Удалить', onClick: () => {}, variant: 'destructive' }
  ]}
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
      options: ['compact', 'detailed'],
      description: 'Вариант отображения карточки',
    },
    interactive: {
      control: { type: 'boolean' },
      description: 'Интерактивная карточка с эффектами наведения',
    },
    showStatus: {
      control: { type: 'boolean' },
      description: 'Показывать статус пользователя',
    },
    showEmail: {
      control: { type: 'boolean' },
      description: 'Показывать email пользователя',
    },
    showRole: {
      control: { type: 'boolean' },
      description: 'Показывать роль пользователя',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Состояние загрузки',
    },
    maxInlineActions: {
      control: { type: 'number', min: 0, max: 5 },
      description: 'Максимальное количество действий в строке',
    },
  },
  args: {
    onCardClick: fn(),
  },
} satisfies Meta<typeof UserCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Базовые данные пользователей для stories
const sampleUser: User = {
  id: '1',
  name: 'Алексей Иванов',
  email: 'alexey.ivanov@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  role: 'Frontend Developer',
  status: 'online',
};

const adminUser: User = {
  id: '2',
  name: 'Мария Петрова',
  email: 'maria.petrova@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  role: 'Администратор',
  status: 'away',
};

const offlineUser: User = {
  id: '3',
  name: 'Дмитрий Сидоров',
  email: 'dmitry.sidorov@example.com',
  role: 'Backend Developer',
  status: 'offline',
};

const basicActions: UserCardAction[] = [
  {
    label: 'Редактировать',
    onClick: fn(),
    variant: 'outline',
    icon: 'fa-solid fa-edit',
  },
  {
    label: 'Удалить',
    onClick: fn(),
    variant: 'destructive',
    icon: 'fa-solid fa-trash',
  },
];

/**
 * Компактная карточка пользователя
 */
export const Compact: Story = {
  args: {
    user: sampleUser,
    variant: 'compact',
    actions: basicActions,
  },
};

/**
 * Детальная карточка пользователя
 */
export const Detailed: Story = {
  args: {
    user: sampleUser,
    variant: 'detailed',
    actions: basicActions,
  },
};

/**
 * Интерактивная карточка
 */
export const Interactive: Story = {
  args: {
    user: sampleUser,
    variant: 'detailed',
    interactive: true,
    actions: [
      {
        label: 'Сообщение',
        onClick: fn(),
        variant: 'primary',
        icon: 'fa-solid fa-envelope',
      },
    ],
  },
};

/**
 * Карточка в состоянии загрузки
 */
export const Loading: Story = {
  args: {
    user: sampleUser,
    loading: true,
    variant: 'detailed',
  },
};

/**
 * Карточка без действий
 */
export const WithoutActions: Story = {
  args: {
    user: sampleUser,
    variant: 'detailed',
    actions: [],
  },
};

/**
 * Карточка без email
 */
export const WithoutEmail: Story = {
  args: {
    user: { ...sampleUser, email: undefined },
    variant: 'detailed',
    showEmail: false,
    actions: basicActions,
  },
};

/**
 * Карточка без статуса
 */
export const WithoutStatus: Story = {
  args: {
    user: sampleUser,
    variant: 'detailed',
    showStatus: false,
    actions: basicActions,
  },
};

/**
 * Карточка с множеством действий
 */
export const ManyActions: Story = {
  args: {
    user: adminUser,
    variant: 'detailed',
    maxInlineActions: 2,
    actions: [
      {
        label: 'Редактировать',
        onClick: fn(),
        variant: 'outline',
        icon: 'fa-solid fa-edit',
      },
      {
        label: 'Сообщение',
        onClick: fn(),
        variant: 'primary',
        icon: 'fa-solid fa-envelope',
      },
      {
        label: 'Заблокировать',
        onClick: fn(),
        variant: 'secondary',
        icon: 'fa-solid fa-ban',
      },
      {
        label: 'Удалить',
        onClick: fn(),
        variant: 'destructive',
        icon: 'fa-solid fa-trash',
      },
    ],
  },
};

/**
 * Карточка с кастомным контентом
 */
export const WithCustomContent: Story = {
  args: {
    user: adminUser,
    variant: 'detailed',
    actions: basicActions,
    children: (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Последний вход:</span>
          <span>2 часа назад</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Проектов:</span>
          <span>12</span>
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="secondary">React</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">Node.js</Badge>
        </div>
      </div>
    ),
  },
};

/**
 * Различные статусы пользователей
 */
export const UserStatuses: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <UserCard
        user={{ ...sampleUser, status: 'online' }}
        variant="compact"
        actions={[{ label: 'Написать', onClick: fn(), variant: 'primary' }]}
      />
      <UserCard
        user={{ ...adminUser, status: 'away' }}
        variant="compact"
        actions={[{ label: 'Написать', onClick: fn(), variant: 'outline' }]}
      />
      <UserCard
        user={{ ...offlineUser, status: 'offline' }}
        variant="compact"
        actions={[{ label: 'Написать', onClick: fn(), variant: 'outline', disabled: true }]}
      />
      <UserCard
        user={{ ...sampleUser, name: 'Анна Козлова', status: 'busy' }}
        variant="compact"
        actions={[{ label: 'Написать', onClick: fn(), variant: 'outline' }]}
      />
    </div>
  ),
};

/**
 * Команда разработчиков
 */
export const DeveloperTeam: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      <UserCard
        user={{
          id: '1',
          name: 'Алексей Иванов',
          email: 'alexey@company.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          role: 'Team Lead',
          status: 'online',
        }}
        variant="detailed"
        actions={[
          { label: 'Профиль', onClick: fn(), variant: 'outline' },
          { label: 'Сообщение', onClick: fn(), variant: 'primary' },
        ]}
      />
      
      <UserCard
        user={{
          id: '2',
          name: 'Мария Петрова',
          email: 'maria@company.com',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          role: 'Frontend Developer',
          status: 'away',
        }}
        variant="detailed"
        actions={[
          { label: 'Профиль', onClick: fn(), variant: 'outline' },
          { label: 'Сообщение', onClick: fn(), variant: 'primary' },
        ]}
      />
      
      <UserCard
        user={{
          id: '3',
          name: 'Дмитрий Сидоров',
          email: 'dmitry@company.com',
          role: 'Backend Developer',
          status: 'offline',
        }}
        variant="detailed"
        actions={[
          { label: 'Профиль', onClick: fn(), variant: 'outline' },
          { label: 'Сообщение', onClick: fn(), variant: 'outline', disabled: true },
        ]}
      />
      
      <UserCard
        user={{
          id: '4',
          name: 'Анна Козлова',
          email: 'anna@company.com',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
          role: 'UI/UX Designer',
          status: 'busy',
        }}
        variant="detailed"
        actions={[
          { label: 'Профиль', onClick: fn(), variant: 'outline' },
          { label: 'Сообщение', onClick: fn(), variant: 'primary' },
        ]}
      />
    </div>
  ),
};

/**
 * Административная панель
 */
export const AdminPanel: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <UserCard
        user={{
          id: '1',
          name: 'Супер Администратор',
          email: 'admin@company.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          role: 'Super Admin',
          status: 'online',
        }}
        variant="detailed"
        actions={[
          { label: 'Настройки', onClick: fn(), variant: 'outline', icon: 'fa-solid fa-cog' },
          { label: 'Логи', onClick: fn(), variant: 'secondary', icon: 'fa-solid fa-list' },
          { label: 'Блокировать', onClick: fn(), variant: 'destructive', icon: 'fa-solid fa-ban' },
        ]}
        children={
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Права доступа:</span>
              <Badge variant="destructive">Полный доступ</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Последний вход:</span>
              <span>Сейчас</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">IP адрес:</span>
              <span className="font-mono">192.168.1.100</span>
            </div>
          </div>
        }
      />
      
      <UserCard
        user={{
          id: '2',
          name: 'Модератор',
          email: 'moderator@company.com',
          role: 'Moderator',
          status: 'away',
        }}
        variant="detailed"
        actions={[
          { label: 'Редактировать', onClick: fn(), variant: 'outline', icon: 'fa-solid fa-edit' },
          { label: 'Права', onClick: fn(), variant: 'secondary', icon: 'fa-solid fa-key' },
          { label: 'Удалить', onClick: fn(), variant: 'destructive', icon: 'fa-solid fa-trash' },
        ]}
        children={
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Права доступа:</span>
              <Badge variant="secondary">Ограниченный</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Последний вход:</span>
              <span>1 час назад</span>
            </div>
          </div>
        }
      />
    </div>
  ),
};