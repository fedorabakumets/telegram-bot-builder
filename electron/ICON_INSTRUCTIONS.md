# 🖼️ Как создать иконку для Electron

## Вариант 1: Использовать готовую PNG

1. Найди или создай PNG изображение 512x512 пикселей
2. Переименуй в `icon.png`
3. Положи в папку `electron/`

## Вариант 2: Создать онлайн

1. Зайди на https://www.canva.com/ или https://photopea.com
2. Создай изображение 512x512
3. Нарисуй логотип (например, буква T на синем фоне #2AABEE)
4. Скачай как PNG
5. Положи в папку `electron/`

## Вариант 3: Через npm (если есть canvas)

```bash
npm install canvas
node electron/generate-icon.js
```

## Требования electron-builder:

- **Windows:** PNG 256x256 или больше
- **macOS:** PNG 512x512
- **Linux:** PNG 512x512

electron-builder автоматически создаст нужные размеры из одной иконки.
