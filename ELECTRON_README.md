# 📦 Инструкция по сборке Telegram Bot Builder в .exe

## ✅ Что уже сделано:
- Установлены зависимости Electron
- Создан главный процесс (electron/main.js)
- Создан preload скрипт (electron/preload.js)
- Настроен package.json
- Настроен Vite для Electron
- Настроен electron-builder

---

## 🚀 Запуск в режиме разработки

### Вариант 1: Через терминал
```bash
npm run electron:dev
```

Это запустит:
1. Vite dev-сервер на порту 5173
2. Electron приложение, которое подключается к серверу

### Вариант 2: По отдельности
```bash
# Терминал 1 - запустить dev-сервер
npm run dev

# Терминал 2 - запустить Electron
npm run electron:start
```

---

## 📦 Сборка .exe файла

### Сборка для Windows (x64)
```bash
npm run electron:build
```

**Результат:** `dist/electron/Telegram Bot Builder Setup.exe`

### Сборка для всех платформ
```bash
npm run electron:build:all
```

**Результат:**
- Windows: `dist/electron/Telegram Bot Builder Setup.exe`
- macOS: `dist/electron/Telegram Bot Builder.dmg`
- Linux: `dist/electron/Telegram Bot Builder.AppImage`

---

## ⚙️ Настройка DATABASE_URL для клиента

### Вариант 1: Вшить в приложение (не рекомендуется)
Создай файл `electron/config.json` перед сборкой:
```json
{
  "databaseUrl": "postgresql://..."
}
```

### Вариант 2: Через окно при первом запуске (рекомендуется)
Приложение сохраняет конфиг в:
- Windows: `%APPDATA%\com.fedorabakumets.telegram-bot-builder\config.json`
- macOS: `~/Library/Application Support/com.fedorabakumets.telegram-bot-builder/config.json`
- Linux: `~/.config/com.fedorabakumets.telegram-bot-builder/config.json`

Клиент может вставить свой DATABASE_URL от Neon при первом запуске.

---

## 📝 Инструкция для клиента

### 1. Скачать и установить
1. Скачай `Telegram Bot Builder Setup.exe`
2. Запусти установщик
3. Следуй инструкциям

### 2. Настроить базу данных
1. Зайди на https://neon.tech
2. Зарегистрируйся (бесплатно)
3. Создай проект → скопируй **DATABASE_URL**

### 3. Запустить приложение
1. Запусти Telegram Bot Builder
2. При первом запуске вставь DATABASE_URL
3. Готово!

---

## 🛠️ Troubleshooting

### Ошибка: "Cannot find module 'electron'"
```bash
npm install
```

### Ошибка: "Port 5173 is already in use"
```bash
# Останови другие процессы или смени порт
npm run dev -- --port 5174
```

### Electron не запускается после сборки
Проверь, что все файлы в папке `dist/client`:
```bash
npm run build:client
```

### Белый экран в Electron
Открой DevTools (Ctrl+Shift+I) и проверь консоль на ошибки.

---

## 📊 Размер итогового файла

- **Windows Setup.exe:** ~180-220 МБ
- **macOS .dmg:** ~200-250 МБ
- **Linux .AppImage:** ~180-220 МБ

Размер зависит от количества зависимостей и встроенного Chromium.
