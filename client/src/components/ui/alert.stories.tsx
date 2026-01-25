import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

/**
 * Alert component stories
 * 
 * Компонент уведомлений для отображения важной информации пользователю.
 */
const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Компонент уведомлений для отображения важных сообщений с поддержкой:
- Различных вариантов (default, destructive)
- Заголовка (AlertTitle)
- Описания (AlertDescription)
- Иконок для визуального усиления
- Семантической разметки с role="alert"

## Использование

\`\`\`tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

<Alert>
  <AlertTitle>Внимание!</AlertTitle>
  <AlertDescription>
    Это важное уведомление для пользователя.
  </AlertDescription>
</Alert>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
      description: 'Вариант оформления уведомления',
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовое уведомление
 */
export const Default: Story = {
  render: () => (
    <Alert className="w-[400px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
      <AlertTitle>Информация</AlertTitle>
      <AlertDescription>
        Ваши изменения были успешно сохранены в системе.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Деструктивное уведомление для ошибок
 */
export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[400px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
      <AlertTitle>Ошибка!</AlertTitle>
      <AlertDescription>
        Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Уведомление только с описанием
 */
export const DescriptionOnly: Story = {
  render: () => (
    <Alert className="w-[400px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <AlertDescription>
        Операция выполнена успешно.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Уведомление без иконки
 */
export const WithoutIcon: Story = {
  render: () => (
    <Alert className="w-[400px]">
      <AlertTitle>Обновление системы</AlertTitle>
      <AlertDescription>
        Система будет недоступна с 02:00 до 04:00 по московскому времени для планового обновления.
      </AlertDescription>
    </Alert>
  ),
};

/**
 * Различные типы уведомлений
 */
export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      {/* Успех */}
      <Alert>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4 text-green-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <AlertTitle>Успех</AlertTitle>
        <AlertDescription>
          Файл успешно загружен на сервер.
        </AlertDescription>
      </Alert>

      {/* Предупреждение */}
      <Alert>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4 text-yellow-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <AlertTitle>Предупреждение</AlertTitle>
        <AlertDescription>
          Ваша подписка истекает через 3 дня.
        </AlertDescription>
      </Alert>

      {/* Ошибка */}
      <Alert variant="destructive">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <AlertTitle>Ошибка</AlertTitle>
        <AlertDescription>
          Не удалось подключиться к серверу.
        </AlertDescription>
      </Alert>

      {/* Информация */}
      <Alert>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4 text-blue-600"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <AlertTitle>Информация</AlertTitle>
        <AlertDescription>
          Новая версия приложения доступна для скачивания.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

/**
 * Длинное уведомление с большим количеством текста
 */
export const LongContent: Story = {
  render: () => (
    <Alert className="w-[500px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
      <AlertTitle>Важное обновление политики конфиденциальности</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Мы обновили нашу политику конфиденциальности в соответствии с новыми требованиями законодательства. 
          Изменения вступают в силу с 1 января 2024 года.
        </p>
        <p>
          Основные изменения касаются обработки персональных данных, сроков их хранения и ваших прав как субъекта данных. 
          Рекомендуем ознакомиться с полным текстом документа в разделе "Правовая информация".
        </p>
      </AlertDescription>
    </Alert>
  ),
};