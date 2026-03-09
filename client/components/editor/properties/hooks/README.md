# Хуки (Hooks)

**Модуль:** `components/editor/properties/hooks`

## 📁 Структура

```
hooks/
├── use-media.ts              # Хуки для работы с медиафайлами
├── use-media-variables.ts    # Управление медиа-переменными
├── use-media-query.ts        # Media query хук
├── use-properties-panel.ts   # Главный хук панели свойств
├── use-properties-panel-state.ts  # Состояние панели
├── use-properties-panel-memo.ts   # Мемоизированные значения
├── use-command-validation.ts # Валидация команд
└── use-handle-add-button.ts  # Обработчик добавления кнопки
```

## 📦 Использование

### Главный хук PropertiesPanel

```typescript
import { usePropertiesPanel } from 'components/editor/properties/hooks';

function MyComponent(props) {
  const { state, setState, memo, handlers } = usePropertiesPanel({
    selectedNode: node,
    allNodes: nodes,
    allSheets: sheets,
    currentSheetId: 'sheet-1',
    onNodeUpdate: handleUpdate
  });

  return (
    <div>
      <Section isOpen={state.isBasicSettingsOpen}>
        {/* Контент */}
      </Section>
    </div>
  );
}
```

### Хук состояния

```typescript
import { usePropertiesPanelState } from 'components/editor/properties/hooks';

const {
  isBasicSettingsOpen,
  setIsBasicSettingsOpen,
  isKeyboardSectionOpen,
  setIsKeyboardSectionOpen,
  displayNodeId,
  setDisplayNodeId
} = usePropertiesPanelState(selectedNode);
```

### Хук медиа

```typescript
import { useMediaFiles, useUploadMedia } from 'components/editor/properties/hooks';

// Получение списка файлов
const { data: mediaFiles, isLoading } = useMediaFiles(projectId);

// Загрузка файла
const uploadMedia = useUploadMedia(projectId);
await uploadMedia.mutateAsync({
  file: myFile,
  description: 'Описание',
  tags: ['тег1', 'тег2'],
  isPublic: true,
  onProgress: (progress) => console.log(`${progress}%`)
});
```

## 📝 API

### usePropertiesPanel

**Пропсы:**
- `selectedNode: Node | null` — выбранный узел
- `allNodes: Node[]` — все узлы
- `allSheets: unknown[]` — все листы
- `currentSheetId?: string` — ID текущего листа
- `onNodeUpdate: (nodeId, updates) => void` — функция обновления

**Возвращает:**
- `state` — объект состояний секций
- `setState` — функции установки состояний
- `memo` — мемоизированные данные
- `handlers` — обработчики событий

### useMediaFiles

**Параметры:**
- `projectId: number` — ID проекта
- `fileType?: string` — тип файлов для фильтрации

**Возвращает:**
- `data: MediaFile[]` — массив файлов
- `isLoading: boolean` — статус загрузки
- `error: Error` — ошибка

### useUploadMedia

**Параметры:**
- `projectId: number` — ID проекта

**Возвращает:**
- `mutateAsync: (params) => Promise<MediaFile>` — функция загрузки

## 🎯 Принципы

1. **Один хук — одна ответственность**
2. **Строгая типизация** — никаких `any`
3. **JSDoc комментарии** — для всех экспортов
4. **Иммутабельность** — не мутировать входные данные
