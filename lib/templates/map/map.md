# Шаблон геолокации (map.py.jinja2)

## Описание

Шаблон генерирует Python обработчик для отправки геолокации или запроса геолокации у пользователя в Telegram боте. Поддерживает отправку статических координат, запрос геолокации через кнопку, проверки безопасности и автопереходы.

## Параметры

| Параметр | Тип | Описание | Значение по умолчанию |
|----------|-----|----------|----------------------|
| nodeId | string | Уникальный идентификатор узла | - |
| messageText | string | Текст сообщения | '' |
| formatMode | 'html' \| 'markdown' \| 'none' | Режим форматирования | 'none' |
| latitude | number | Широта | - |
| longitude | number | Долгота | - |
| locationTitle | string | Название места | '' |
| locationAddress | string | Адрес места | '' |
| requestUserLocation | boolean | Запросить геолокацию у пользователя | false |
| locationVariable | string | Переменная для сохранения геолокации | '' |
| isPrivateOnly | boolean | Только приватные чаты | false |
| adminOnly | boolean | Только администраторы | false |
| requiresAuth | boolean | Требуется авторизация | false |
| userDatabaseEnabled | boolean | База данных пользователей включена | false |
| keyboardType | 'inline' \| 'reply' \| 'none' | Тип клавиатуры | 'none' |
| buttons | Button[] | Кнопки | [] |
| oneTimeKeyboard | boolean | Скрыть клавиатуру после использования | false |
| resizeKeyboard | boolean | Изменить размер клавиатуры | false |
| enableAutoTransition | boolean | Автопереход включен | false |
| autoTransitionTo | string | Цель автоперехода | '' |
| state | FSMContext | Опциональный FSM контекст (state: FSMContext = None). Используется для чтения/записи данных между переходами. | None |

## Примеры использования

### Пример 1: Отправка статической геолокации

```typescript
generateMap({
  nodeId: 'map_1',
  messageText: '📍 Наш офис находится здесь:',
  latitude: 55.7558,
  longitude: 37.6176,
  locationTitle: 'Офис',
  locationAddress: 'Москва, Красная площадь, 1',
});
```

### Пример 2: Запрос геолокации у пользователя

```typescript
generateMap({
  nodeId: 'map_2',
  messageText: '📍 Поделитесь вашим местоположением:',
  requestUserLocation: true,
  locationVariable: 'user_location',
  userDatabaseEnabled: true,
  keyboardType: 'reply',
  buttons: [
    { text: '📍 Отправить геолокацию', action: 'location', target: 'location', id: 'btn_location' },
  ],
});
```

### Пример 3: С автопереходом

```typescript
generateMap({
  nodeId: 'map_3',
  messageText: '📍 Вот наш адрес!',
  latitude: 59.9343,
  longitude: 30.3351,
  enableAutoTransition: true,
  autoTransitionTo: 'main_menu',
});
```

## Структура файлов

```
map/
├── map.py.jinja2       (шаблон обработчика)
├── map.params.ts       (типы параметров)
├── map.schema.ts       (Zod схема)
├── map.renderer.ts     (функция рендеринга)
├── map.fixture.ts      (тестовые данные)
├── map.test.ts         (тесты)
├── map.md              (документация)
└── index.ts            (экспорт)
```

## Тесты

```bash
npm test -- map.test.ts
```
