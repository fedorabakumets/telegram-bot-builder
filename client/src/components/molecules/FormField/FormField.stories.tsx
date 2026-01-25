import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { FormField } from './FormField';
import { Input } from '../../atoms/Input/Input';
import { Icon } from '../../atoms/Icon/Icon';

/**
 * FormField component stories
 * 
 * Универсальный компонент поля формы для консистентного оформления полей ввода.
 */
const meta = {
  title: 'Molecules/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Универсальный компонент поля формы с поддержкой:
- Консистентного оформления label, input и helper text
- Индикаторов обязательных полей
- Состояний ошибки, успеха и описания
- Горизонтальной и вертикальной ориентации
- Полной доступности с ARIA атрибутами
- Интеграции с любыми элементами форм
- Оптимизации производительности с React.memo

## Использование

\`\`\`tsx
import { FormField } from '@/components/molecules/FormField';
import { Input } from '@/components/atoms/Input';

// Базовое поле формы
<FormField
  label="Email Address"
  id="email"
  required
  description="Мы никогда не поделимся вашим email"
>
  <Input 
    id="email"
    type="email" 
    placeholder="Введите email"
  />
</FormField>

// Поле с ошибкой
<FormField
  label="Пароль"
  id="password"
  required
  error="Пароль должен содержать минимум 8 символов"
>
  <Input 
    id="password"
    type="password"
    error="Пароль должен содержать минимум 8 символов"
  />
</FormField>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Ориентация поля (вертикальная или горизонтальная)',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Обязательное поле (показывает звездочку)',
    },
    hideLabel: {
      control: { type: 'boolean' },
      description: 'Скрыть label визуально (но оставить для скринридеров)',
    },
    label: {
      control: { type: 'text' },
      description: 'Текст метки поля',
    },
    error: {
      control: { type: 'text' },
      description: 'Сообщение об ошибке',
    },
    success: {
      control: { type: 'text' },
      description: 'Сообщение об успехе',
    },
    description: {
      control: { type: 'text' },
      description: 'Описание или подсказка',
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовое поле формы
 */
export const Default: Story = {
  args: {
    label: 'Имя пользователя',
    id: 'username',
    children: <Input id="username" placeholder="Введите имя пользователя" />,
  },
};

/**
 * Обязательное поле
 */
export const Required: Story = {
  args: {
    label: 'Email адрес',
    id: 'email',
    required: true,
    children: <Input id="email" type="email" placeholder="user@example.com" />,
  },
};

/**
 * Поле с описанием
 */
export const WithDescription: Story = {
  args: {
    label: 'Пароль',
    id: 'password',
    required: true,
    description: 'Пароль должен содержать минимум 8 символов, включая цифры и буквы',
    children: <Input id="password" type="password" placeholder="Введите пароль" />,
  },
};

/**
 * Поле с ошибкой
 */
export const WithError: Story = {
  args: {
    label: 'Email адрес',
    id: 'email-error',
    required: true,
    error: 'Введите корректный email адрес',
    children: (
      <Input 
        id="email-error" 
        type="email" 
        value="invalid-email"
        error="Введите корректный email адрес"
      />
    ),
  },
};

/**
 * Поле с успешным состоянием
 */
export const WithSuccess: Story = {
  args: {
    label: 'Имя пользователя',
    id: 'username-success',
    success: 'Имя пользователя доступно',
    children: (
      <Input 
        id="username-success" 
        value="john_doe"
        success="Имя пользователя доступно"
      />
    ),
  },
};

/**
 * Горизонтальная ориентация
 */
export const Horizontal: Story = {
  args: {
    label: 'Получать уведомления',
    id: 'notifications',
    orientation: 'horizontal',
    description: 'Получать email уведомления о новых функциях',
    children: (
      <input 
        id="notifications"
        type="checkbox"
        className="rounded border-gray-300 text-primary focus:ring-primary"
      />
    ),
  },
};

/**
 * Скрытый label
 */
export const HiddenLabel: Story = {
  args: {
    label: 'Поиск',
    id: 'search',
    hideLabel: true,
    children: (
      <Input 
        id="search" 
        startIcon={<Icon name="fa-solid fa-search" />}
        placeholder="Поиск..."
      />
    ),
  },
};

/**
 * Поле с иконкой
 */
export const WithIcon: Story = {
  args: {
    label: 'Поиск пользователей',
    id: 'user-search',
    description: 'Найти пользователя по имени или email',
    children: (
      <Input 
        id="user-search"
        startIcon={<Icon name="fa-solid fa-search" />}
        placeholder="Начните вводить имя..."
      />
    ),
  },
};

/**
 * Различные размеры полей
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <FormField
        label="Маленькое поле"
        id="small"
        description="Компактное поле ввода"
      >
        <Input id="small" size="sm" placeholder="Маленькое поле" />
      </FormField>
      
      <FormField
        label="Среднее поле"
        id="medium"
        description="Стандартное поле ввода"
      >
        <Input id="medium" size="md" placeholder="Среднее поле" />
      </FormField>
      
      <FormField
        label="Большое поле"
        id="large"
        description="Увеличенное поле ввода"
      >
        <Input id="large" size="lg" placeholder="Большое поле" />
      </FormField>
    </div>
  ),
};

/**
 * Различные состояния полей
 */
export const States: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <FormField
        label="Обычное поле"
        id="normal"
        description="Поле в обычном состоянии"
      >
        <Input id="normal" placeholder="Введите текст" />
      </FormField>
      
      <FormField
        label="Обязательное поле"
        id="required-field"
        required
        description="Это поле обязательно для заполнения"
      >
        <Input id="required-field" placeholder="Обязательное поле" />
      </FormField>
      
      <FormField
        label="Поле с ошибкой"
        id="error-field"
        required
        error="Это поле обязательно для заполнения"
      >
        <Input 
          id="error-field" 
          error="Это поле обязательно для заполнения"
          placeholder="Поле с ошибкой"
        />
      </FormField>
      
      <FormField
        label="Успешное поле"
        id="success-field"
        success="Данные сохранены успешно"
      >
        <Input 
          id="success-field" 
          success="Данные сохранены успешно"
          value="Корректные данные"
        />
      </FormField>
    </div>
  ),
};

/**
 * Форма регистрации
 */
export const RegistrationForm: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <FormField
        label="Имя"
        id="first-name"
        required
      >
        <Input id="first-name" placeholder="Введите имя" />
      </FormField>
      
      <FormField
        label="Фамилия"
        id="last-name"
        required
      >
        <Input id="last-name" placeholder="Введите фамилию" />
      </FormField>
      
      <FormField
        label="Email адрес"
        id="reg-email"
        required
        description="Мы используем email для входа в систему"
      >
        <Input 
          id="reg-email" 
          type="email" 
          startIcon={<Icon name="fa-solid fa-envelope" />}
          placeholder="user@example.com" 
        />
      </FormField>
      
      <FormField
        label="Пароль"
        id="reg-password"
        required
        description="Минимум 8 символов, включая цифры и буквы"
      >
        <Input 
          id="reg-password" 
          type="password"
          startIcon={<Icon name="fa-solid fa-lock" />}
          placeholder="Создайте пароль" 
        />
      </FormField>
      
      <FormField
        label="Согласие на обработку данных"
        id="consent"
        orientation="horizontal"
        required
        description="Я согласен на обработку персональных данных"
      >
        <input 
          id="consent"
          type="checkbox"
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      </FormField>
    </div>
  ),
};

/**
 * Различные типы полей
 */
export const FieldTypes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <FormField
        label="Текстовое поле"
        id="text-field"
      >
        <Input id="text-field" type="text" placeholder="Введите текст" />
      </FormField>
      
      <FormField
        label="Числовое поле"
        id="number-field"
        description="Введите число от 1 до 100"
      >
        <Input id="number-field" type="number" min="1" max="100" placeholder="42" />
      </FormField>
      
      <FormField
        label="Телефон"
        id="phone-field"
      >
        <Input 
          id="phone-field" 
          type="tel" 
          startIcon={<Icon name="fa-solid fa-phone" />}
          placeholder="+7 (999) 123-45-67" 
        />
      </FormField>
      
      <FormField
        label="Веб-сайт"
        id="url-field"
      >
        <Input 
          id="url-field" 
          type="url" 
          startIcon={<Icon name="fa-solid fa-globe" />}
          placeholder="https://example.com" 
        />
      </FormField>
      
      <FormField
        label="Дата рождения"
        id="date-field"
      >
        <Input id="date-field" type="date" />
      </FormField>
    </div>
  ),
};