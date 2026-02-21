# 📦 Telegram Bot Builder - Инструкция по запуску

## ✅ ВАРИАНТ 1: Запуск из исходников (классический)

### Шаг 1: Установи Git
1. Скачай: https://git-scm.com/download/win
2. Установи (жми Next везде)

### Шаг 2: Скачай проект
```bash
git clone https://github.com/fedorabakumets/telegram-bot-builder.git
cd telegram-bot-builder
```

### Шаг 3: Установи Node.js
1. Скачай: https://nodejs.org/ (версия LTS)
2. Установи

### Шаг 4: Установи зависимости
```bash
npm install
```

### Шаг 5: Собери проект
```bash
npm run build
```

### Шаг 6: Настрой базу данных
Создай файл `.env` в корне проекта:
```
DATABASE_URL=postgresql://...
```

### Шаг 7: Запусти
```bash
npm run start
```

### Шаг 8: Открой в браузере
```
http://localhost:3000
```

---

## ✅ ВАРИАНТ 2: Через Electron (.exe приложение)

### Для разработчиков (запуск из кода):
```bash
npm run electron:dev
```

### Для клиентов (готовый .exe):
1. Скачай `Telegram Bot Builder Setup.exe`
2. Установи
3. При первом запуске вставь DATABASE_URL от Neon

---

## ✅ ВАРИАНТ 3: Сборка в .exe файл

### Сборка для Windows:
```bash
npm run electron:build
```

**Результат:** `dist/electron/Telegram Bot Builder Setup.exe` (~180-200 МБ)

### Сборка для всех платформ:
```bash
npm run electron:build:all
```

---

## 🔑 DATABASE_URL от Neon (бесплатно)

1. Зайди на https://neon.tech
2. Зарегистрируйся
3. Создай проект
4. Скопируй **DATABASE_URL**

---

## 🚀 Массовая рассылка аудио

1. Авторизуйся через Telegram
2. Создай проект → добавь бота
3. Создай узел "Массовая рассылка"
4. Впиши юзеров (@username1, @username2...)
5. Прикрепи MP3 файлы
6. Нажми "Отправить"

---

## 🛠️ Troubleshooting

### Ошибка: "DATABASE_URL not found"
Создай файл `.env` с твоим DATABASE_URL

### Ошибка: "module not found"
```bash
npm install
```

### Порт 3000 занят
Останови другие процессы или измени порт в `.env`

---

## 📞 Поддержка

Если что-то не работает — напиши разработчику.
