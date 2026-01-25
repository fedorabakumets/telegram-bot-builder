import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';

/**
 * Card component stories
 * 
 * Компонент карточки для группировки связанного контента.
 */
const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Компонент карточки для отображения группированного контента с поддержкой:
- Заголовка (CardHeader)
- Названия (CardTitle) 
- Описания (CardDescription)
- Основного контента (CardContent)
- Подвала (CardFooter)

## Использование

\`\`\`tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Заголовок карточки</CardTitle>
    <CardDescription>Описание карточки</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Основной контент карточки</p>
  </CardContent>
  <CardFooter>
    <Button>Действие</Button>
  </CardFooter>
</Card>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовая карточка с полной структурой
 */
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Создать проект</CardTitle>
        <CardDescription>Разверните новый проект за одну минуту.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Выберите шаблон для быстрого старта вашего проекта.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Отмена</Button>
        <Button>Создать</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Простая карточка только с контентом
 */
export const Simple: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="pt-6">
        <p>Простая карточка с минимальным контентом.</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Карточка без подвала
 */
export const WithoutFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Уведомления</CardTitle>
        <CardDescription>У вас есть 3 непрочитанных сообщения.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm">Новое сообщение от Алексея</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm">Задача выполнена</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-sm">Ошибка в системе</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

/**
 * Карточка с формой
 */
export const WithForm: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Вход в систему</CardTitle>
        <CardDescription>Введите ваши данные для входа в аккаунт.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input 
            type="email" 
            placeholder="m@example.com"
            className="w-full px-3 py-2 border border-input rounded-md"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Пароль</label>
          <input 
            type="password"
            className="w-full px-3 py-2 border border-input rounded-md"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Войти</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Карточка со статистикой
 */
export const Statistics: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+2,350</div>
          <p className="text-xs text-muted-foreground">+180.1% с прошлого месяца</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Подписки</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12,234</div>
          <p className="text-xs text-muted-foreground">+19% с прошлого месяца</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Продажи</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+573</div>
          <p className="text-xs text-muted-foreground">+201 с прошлого часа</p>
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * Различные размеры карточек
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Card className="w-[250px]">
        <CardHeader>
          <CardTitle className="text-lg">Маленькая карточка</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Компактный размер для боковых панелей.</p>
        </CardContent>
      </Card>
      
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Средняя карточка</CardTitle>
          <CardDescription>Стандартный размер для большинства случаев.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Оптимальный размер для отображения основного контента.</p>
        </CardContent>
      </Card>
      
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle className="text-xl">Большая карточка</CardTitle>
          <CardDescription>Расширенное описание для детальной информации.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Большой размер подходит для отображения подробной информации, форм или сложного контента, который требует больше места для комфортного восприятия.</p>
        </CardContent>
        <CardFooter>
          <Button>Подробнее</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};