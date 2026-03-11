

**Дата выпуска:** 11 марта 2026 г.

**Сравнение версий:** [v2.0.1...v2.0.2](https://github.com/fedorabakumets/telegram-bot-builder/compare/v2.0.1...v2.0.2)

---

## 🎯 Основные изменения

### 📎 Улучшения работы с медиафайлами

#### 1. Разделение медиа на группы при отправке

**Проблема:** Telegram не позволяет смешивать документы с другими типами медиа (photo, video, audio) в одной группе `sendMediaGroup`.

**Решение:**
- Документы отправляются **отдельной группой** через `send_media_group`
- Photo/Video/Audio отправляются **вместе** в одной группе
- Генерация кода автоматически определяет типы и разделяет их

**Новые утилиты:**

| Файл | Назначение |
|------|----------|
| `get-media-type-by-url.ts` | Определение типа медиа по расширению URL |
| `group-media-by-type.ts` | Группировка медиафайлов по типам |
| `split-media-for-sending.ts` | Разделение на groupable и документы |
| `can-send-in-one-group.ts` | Проверка возможности отправки вместе |

**Пример генерируемого кода:**

```python
# Группа медиа (photo/video/audio)
media_group = []
media_group.append(InputMediaPhoto(media="file1.jpg", caption="Текст"))
media_group.append(InputMediaVideo(media="file2.mp4"))
await bot.send_media_group(chat_id, media_group)

# Группа документов (отдельно)
document_group = []
document_group.append(InputMediaDocument(media="file3.pdf"))
document_group.append(InputMediaDocument(media="file4.docx"))
await bot.send_media_group(chat_id, document_group)
```

---

#### 2. Исправление отправки клавиатуры с медиагруппами

**Проблема:** В aiogram 3.x метод `send_media_group()` не поддерживает параметр `reply_markup`.

**Решение:**
- Медиагруппа отправляется **без клавиатуры**
- Клавиатура отправляется **отдельным сообщением** сразу после медиагруппы

**Пример генерируемого кода:**

```python
# Отправка медиагруппы
sent_messages = await bot.send_media_group(chat_id, media_group)

# Отправка клавиатуры отдельным сообщением
if keyboard is not None:
    await bot.send_message(chat_id, text, reply_markup=keyboard)
```

---

#### 3. Обработка прямых URL в attachedMedia

**Проблема:** Медиафайлы с прямыми URL (http/https) не отправлялись, так как генератор искал их в БД.

**Решение:**
- `collectMediaVariables` теперь добавляет прямые URL в `mediaVariablesMap`
- `generateAttachedMediaSendCode` использует прямые URL напрямую, без поиска в БД
- Тип медиа определяется по расширению файла в URL

**Поддерживаемые форматы:**

| Тип | Расширения |
|-----|----------|
| Photo | jpg, jpeg, png, gif, webp, bmp |
| Video | mp4, avi, mov, webm |
| Audio | mp3, wav, ogg |
| Document | остальные |

---

### 🎨 Улучшения пользовательского интерфейса

#### 4. Скрытие медиафайлов при включенной клавиатуре

**Функционал:**
- При включении клавиатуры и наличии >1 медиафайлов — показывается только первый
- Остальные файлы **сохраняются**, но отображаются с пометкой "Скрыт"
- Скрытые файлы показываются:
  - Полупрозрачным фоном (opacity-60)
  - Серой рамкой вместо зелёной
  - Чёрной плашкой "Скрыт" поверх превью
  - Бейджем "Скрыт" рядом с названием

**Кнопка "Включить все файлы":**
- Показывается между списком файлов и полем ввода
- При нажатии отключает клавиатуру (`keyboardType = 'none'`)
- Все файлы снова отображаются и отправляются

**Автоматическое отключение клавиатуры:**
- При добавлении второго файла клавиатура автоматически отключается
- `useEffect` отслеживает количество файлов и устанавливает `keyboardType: 'none'`
- Изменение сохраняется в `project.json` и генерируемом коде

---

#### 5. Автоматическое раскрытие секций при наличии контента

**Раньше:** Все секции (кроме "Текст сообщения") были свёрнуты по умолчанию.

**Теперь:** Секции автоматически раскрываются, если в них есть контент:

| Секция | Условие раскрытия |
|--------|------------------|
| 📎 Медиафайлы | Есть `attachedMedia`, `imageUrl`, `videoUrl`, `audioUrl`, `documentUrl` |
| ⌨️ Клавиатура | Есть кнопки или включена клавиатура (inline/reply) |
| ⚡ Автопереход | Включён автопереход |
| 📋 Условные сообщения | Есть условные сообщения |
| 👤 Ввод пользователя | Включён сбор ввода (текст, фото, видео, аудио, документы) |

---

#### 6. Увеличен размер панели свойств по умолчанию

**Изменение:** Размер панели свойств увеличен с **20%** до **25%** экрана.

**Баланс макета:**
- Сайдбар (компоненты): 20%
- Холст: 30%
- Панель свойств: 25%
- Остальное: шапка

---

### 🧩 Новые компоненты

#### InfoBlock

Универсальный компонент для информационных блоков с вариантами:

```tsx
<InfoBlock
  variant="warning"  // info | warning | recommendation
  title="⚠️ Заголовок"
  description="Описание"
/>
```

**Файл:** `client/components/ui/info-block.tsx`

---

#### ToggleGroup

Переиспользуемый компонент для групп переключателей:

```tsx
<ToggleGroup
  title="Заголовок"
  icon="fa-icon"
  colorClasses={{ title: '...', icon: '...' }}
  configs={configs}
  selectedNode={node}
  onNodeUpdate={onNodeUpdate}
  description="Описание"
/>
```

**Файл:** `client/components/editor/properties/components/media/toggle-group.tsx`

---

#### MediaFileCard

Карточка медиафайла с поддержкой скрытых файлов:

```tsx
<MediaFileCard
  url="https://..."
  fileName="Файл 1"
  fileType="image"
  isHidden={false}
  onRemove={handleRemove}
/>
```

**Файл:** `client/components/editor/properties/media/media-file-card.tsx`

---

#### MediaAttachmentsPreview

Превью медиафайлов на канвасе с поддержкой скрытия при клавиатуре:

```tsx
<MediaAttachmentsPreview node={node} />
```

**Файл:** `client/components/editor/canvas/canvas-node/media-attachments-preview.tsx`

---

## 📦 Обновление версии

- **Версия приложения** обновлена с `2.0.1` до `2.0.2`
- **VersionBadge** — отображает актуальную версию

---

## 📊 Статистика изменений

| Категория | Файлов изменено | Строк добавлено | Строк удалено |
|-----------|-----------------|-----------------|---------------|
| Генератор медиа | 8 | 600+ | 200+ |
| UI компоненты | 10 | 400+ | 300+ |
| Рефакторинг | 16 | 500+ | 800+ |
| **Всего** | **34** | **1514** | **1342** |

---

## 🔧 Технические детали

### Структура утилит медиа

```typescript
// client/lib/bot-generator/MediaHandler/utils/

get-media-type-by-url.ts    // Определение типа по URL
group-media-by-type.ts      // Группировка по типам
split-media-for-sending.ts  // Разделение для отправки
can-send-in-one-group.ts    // Проверка совместимости
index.ts                    // Экспорт всех утилит
```

### Пример использования утилит

```typescript
import { splitMediaForSending, getMediaTypeByUrl } from './utils';

// Разделение медиа
const { groupable, documents } = splitMediaForSending(mediaUrls);

// groupable: ['file1.jpg', 'file2.mp4', 'file3.mp3']
// documents: ['file4.pdf', 'file5.docx']

// Определение типа
const type = getMediaTypeByUrl('https://example.com/file.jpg');
// 'photo'
```

### Логика скрытия файлов

```typescript
// В multi-media-selector.tsx
const hasKeyboard = keyboardType === 'inline' || keyboardType === 'reply';
const isHidden = hasKeyboard && index > 0;

// Автоматическое отключение клавиатуры
useEffect(() => {
  if (value.length > 1 && hasKeyboard && onNodeUpdate && nodeId) {
    onNodeUpdate(nodeId, { keyboardType: 'none' });
  }
}, [value.length, hasKeyboard, onNodeUpdate, nodeId]);
```

### Автораскрытие секций

```typescript
// В properties-panel.tsx
useEffect(() => {
  if (!selectedNode?.data) return;

  // Секция медиафайлов
  const hasMedia = selectedNode.data.attachedMedia?.length > 0 || 
                   selectedNode.data.imageUrl || 
                   selectedNode.data.videoUrl;
  if (hasMedia && !isMediaSectionOpen) {
    setIsMediaSectionOpen(true);
  }

  // Секция клавиатуры
  const hasKeyboard = selectedNode.data.keyboardType !== 'none';
  const hasButtons = selectedNode.data.buttons?.length > 0;
  if ((hasKeyboard || hasButtons) && !isKeyboardSectionOpen) {
    setIsKeyboardSectionOpen(true);
  }

  // ... и так далее для других секций
}, [selectedNode?.data, selectedNode?.id]);
```

---

## 🚀 Установка

### Обновление с v2.0.1:

```bash
# Обновите проект
git pull origin main

# Установите зависимости
cd client
npm install

# Соберите проект
npm run build

# Запустите
npm run start
```

### Через Docker:

```bash
# Пересоберите образ
docker-compose build --no-cache

# Запустите
docker-compose up -d
```

---

## ⚠️ Важные замечания

### Совместимость с aiogram 3.x

Изменения в генерации кода учитывают особенности aiogram 3.x:
- `send_media_group()` не поддерживает `reply_markup`
- Клавиатура отправляется отдельным сообщением
- Это корректно работает во всех случаях

### Обратная совместимость

- Все изменения обратно совместимы
- Старые проекты продолжат работать
- Новые функции применяются только к новым узлам

### Миграция проектов

Проекты, созданные в предыдущих версиях, не требуют миграции. Новые функции применяются автоматически при редактировании узлов.

---

## 🐛 Исправления

| Проблема | Решение |
|----------|---------|
| `send_media_group() got an unexpected keyword argument 'reply_markup'` | Клавиатура отправляется через `send_message()` |
| Медиафайлы с прямыми URL не отправлялись | Прямые URL используются напрямую, без поиска в БД |
| Документы вызывали ошибку Telegram | Документы разделяются и отправляются отдельной группой |
| Секции сворачивались при переключении узлов | Секции автоматически раскрываются при наличии контента |

---

## 📋 Чек-лист изменений

- [x] Разделение медиа на группы (документы отдельно)
- [x] Исправление отправки клавиатуры с медиагруппами
- [x] Обработка прямых URL в attachedMedia
- [x] Скрытие лишних медиафайлов при клавиатуре
- [x] Кнопка "Включить все файлы"
- [x] Автоматическое отключение клавиатуры при >1 файлов
- [x] Автоматическое раскрытие секций
- [x] Увеличен размер панели свойств до 25%
- [x] Новые переиспользуемые компоненты
- [x] Утилиты для работы с медиагруппами
- [x] Обновлена версия до 2.0.2

---

## 🔗 Ссылки

- [Исходный код релиза](https://github.com/fedorabakumets/telegram-bot-builder/tree/v2.0.2)
- [Сравнение изменений](https://github.com/fedorabakumets/telegram-bot-builder/compare/v2.0.1...v2.0.2)
- [Полный список коммитов](https://github.com/fedorabakumets/telegram-bot-builder/commits/v2.0.2)

---

**Полный список изменений:** [Коммиты v2.0.1...v2.0.2](https://github.com/fedorabakumets/telegram-bot-builder/compare/v2.0.1...v2.0.2)
