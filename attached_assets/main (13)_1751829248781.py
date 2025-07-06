import telebot
import re
import json
import os
from datetime import datetime
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
import logging
from flask import Flask
import threading
import time
from requests.exceptions import ConnectionError, ReadTimeout
from urllib3.exceptions import ProtocolError

# Добавлены библиотеки для графиков
import matplotlib
matplotlib.use('Agg')  # Устанавливаем неинтерактивный backend
import matplotlib.pyplot as plt
import io

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Flask веб-сервер для деплоймента
app = Flask(__name__)

@app.route('/')
def index():
    return "🤖 ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot работает!"

@app.route('/health')
def health():
    return {"status": "ok", "bot": "running"}

def run_flask():
    app.run(host='0.0.0.0', port=5000, debug=False)

# Инициализация бота
BOT_TOKEN = "7630457695:AAGDylpXjyqqY7Naq2IXnwGc_x7QwAA8GoY"
bot = telebot.TeleBot(BOT_TOKEN)
ADMIN_ID = 1612141295  # ID админа
DATA_FILE = "users_data.json"
CHAT_LINK = "https://t.me/+agkIVgCzHtY2ZTA6"  # Фиксированная ссылка на чат

# Загрузка данных из JSON с устранением дубликатов
def load_users_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as file:
            data = json.load(file)
        unique_data = {}
        for user_id, user_data in data.items():
            if user_id in unique_data:
                logging.warning(f"Обнаружен дубликат для user_id {user_id}, сохранена последняя запись")
            unique_data[user_id] = user_data
        return unique_data
    return {}

# Сохранение данных в JSON
def save_users_data(data, force=False):
    try:
        # Сохраняем без отступов для экономии места и скорости
        with open(DATA_FILE, 'w') as file:
            json.dump(data, file, separators=(',', ':'))
        logging.debug(f"DATA_SAVE: Данные успешно сохранены в {DATA_FILE}")
    except Exception as e:
        logging.error(f"Ошибка при сохранении данных в {DATA_FILE}: {e}")

# Инициализация базы
users_data = load_users_data()

# Функция для очистки некорректных данных метро
def clean_metro_data(user):
    """Очищает некорректные данные метро у пользователя"""
    metro_stations = user.get('description', {}).get('metro_station', [])
    if isinstance(metro_stations, list) and "Я не в Питере" in metro_stations:
        # Если есть "Я не в Питере", оставляем только его
        if len(metro_stations) > 1:
            user['description']['metro_station'] = ["Я не в Питере"]
            return True
    return False

# Проверка, заполнено ли описание пользователя
def is_description_complete(user):
    desc = user.get('description', {})
    return all([
        desc.get('gender'),
        desc.get('name'),
        desc.get('age'),
        desc.get('metro_station'),
        desc.get('interests'),
        desc.get('marital_status'),
        desc.get('sexual_orientation')
        # Телеграм-канал и доп. информация необязательны
    ])

# Функция для отображения прогресс-бара заполнения профиля
def get_profile_progress(user):
    desc = user.get('description', {})
    # Обязательные поля
    required_steps = [
        ('Пол', desc.get('gender')),
        ('Имя', desc.get('name')),
        ('Возраст', desc.get('age')),
        ('Метро', desc.get('metro_station')),
        ('Интересы', desc.get('interests')),
        ('Семейное положение', desc.get('marital_status')),
        ('Ориентация', desc.get('sexual_orientation'))
    ]

    # Дополнительные поля (необязательные)
    optional_steps = [
        ('Telegram-канал', desc.get('telegram_channel') is not None),
        ('Доп. информация', desc.get('extra_info') is not None and desc.get('extra_info') != "")
    ]

    required_completed = sum(1 for _, value in required_steps if value)
    optional_completed = sum(1 for _, value in optional_steps if value)

    total_required = len(required_steps)
    total_optional = len(optional_steps)

    # Создаем визуальный прогресс-бар для обязательных полей
    filled_required = "🟢" * required_completed
    empty_required = "⚪" * (total_required - required_completed)

    # Добавляем опциональные поля
    filled_optional = "🟡" * optional_completed
    empty_optional = "⚫" * (total_optional - optional_completed)

    progress_bar = filled_required + empty_required + filled_optional + empty_optional

    return f"📊 Прогресс: {required_completed}/{total_required} обязательных + {optional_completed}/{total_optional} доп.\n{progress_bar}\n"

# Клавиатура для вопроса о присоединении к чату
def get_join_request_keyboard():
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    markup.add(KeyboardButton("Да 😎"), KeyboardButton("Нет 🙅"))
    return markup

# Клавиатура для пола (reply-кнопки)
def get_gender_keyboard(show_back=False):
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    markup.add(KeyboardButton("Мужчина 👨"), KeyboardButton("Женщина 👩"))
    return markup

# --- Многоуровневая клавиатура интересов ---
def get_interests_keyboard(selected=None, category=None, show_back=False):
    markup = InlineKeyboardMarkup(row_width=2)
    selected = selected or []
    if not category:
        # Показываем категории в две колонки
        categories = list(INTEREST_CATEGORIES.keys())
        for i in range(0, len(categories), 2):
            if i + 1 < len(categories):
                markup.add(
                    InlineKeyboardButton(categories[i], callback_data=f"interestcat_{categories[i]}"),
                    InlineKeyboardButton(categories[i + 1], callback_data=f"interestcat_{categories[i + 1]}")
                )
            else:
                markup.add(InlineKeyboardButton(categories[i], callback_data=f"interestcat_{categories[i]}"))
        markup.add(InlineKeyboardButton("Готово ✅", callback_data="interests_done"))
        if show_back:
            markup.add(InlineKeyboardButton("Назад ⬅️", callback_data="back_to_metro"))
    else:
        # Показываем интересы выбранной категории в две колонки
        interests = list(INTEREST_CATEGORIES[category])
        for i in range(0, len(interests), 2):
            if i + 1 < len(interests):
                interest1, emoji1 = interests[i]
                interest2, emoji2 = interests[i + 1]
                is_selected1 = interest1 in selected
                is_selected2 = interest2 in selected
                btn_text1 = f"{emoji1} {interest1}{' ✅' if is_selected1 else ''}"
                btn_text2 = f"{emoji2} {interest2}{' ✅' if is_selected2 else ''}"
                markup.add(
                    InlineKeyboardButton(btn_text1, callback_data=f"interest_{interest1}"),
                    InlineKeyboardButton(btn_text2, callback_data=f"interest_{interest2}")
                )
            else:
                interest, emoji = interests[i]
                is_selected = interest in selected
                btn_text = f"{emoji} {interest}{' ✅' if is_selected else ''}"
                markup.add(InlineKeyboardButton(btn_text, callback_data=f"interest_{interest}"))
        markup.add(InlineKeyboardButton("⬅️ К категориям", callback_data="interests_back"))
        markup.add(InlineKeyboardButton("Готово ✅", callback_data="interests_done"))
        if show_back:
            markup.add(InlineKeyboardButton("Назад ⬅️", callback_data="back_to_edit_select"))
    return markup
# --- конец многоуровневой клавиатуры ---

# Клавиатуры для станций метро по веткам
def get_metro_keyboard(selected=None, show_back=False):
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    markup.add(
        KeyboardButton("Красная ветка 🟥"),
        KeyboardButton("Синяя ветка 🟦")
    )
    markup.add(
        KeyboardButton("Зелёная ветка 🟩"),
        KeyboardButton("Оранжевая ветка 🟧")
    )
    markup.add(
        KeyboardButton("Фиолетовая ветка 🟪"),
        KeyboardButton("Я из ЛО 🏡")
    )
    markup.add(KeyboardButton("Я не в Питере 🌍"))

    # Всеt�да показываем кнопку "Готово ✅"
    markup.add(KeyboardButton("Готово ✅"))

    # Добавляем кнопку "Назад" если нужно
    if show_back:
        markup.add(KeyboardButton("Назад ⬅️"))

    return markup

def get_line_keyboard(stations, color, selected=None):
    markup = ReplyKeyboardMarkup(row_width=3, resize_keyboard=True, one_time_keyboard=True)

    # Безопасная инициализация selected
    if selected is None:
        selected = []
    elif not isinstance(selected, list):
        selected = [selected] if selected else []

    # Добавляем станции по 3 в ряд
    current_row = []
    for station in stations:
        is_selected = station in selected
        text = f"{color} {station}{' ✅' if is_selected else ''}"
        current_row.append(KeyboardButton(text))
        if len(current_row) == 3:
            markup.add(*current_row)
            current_row = []

    # Добавляем оставшиеся станции
    if current_row:
        markup.add(*current_row)

    markup.add(KeyboardButton("Назад ⬅️"), KeyboardButton("Готово ✅"))
    return markup

def get_red_line_keyboard(selected=None):
    stations = [
        "Девяткино", "Гражданский проспект", "Академическая", "Политехническая",
        "Площадь Мужества", "Лесная", "Выборгская", "Площадь Ленина",
        "Чернышевская", "Площадь Восстания", "Владимирская", "Пушкинская",
        "Технологический институт", "Балтийская", "Нарвская", "Кировский завод",
        "Автово", "Ленинский проспект", "Проспект Ветеранов"
    ]
    return get_line_keyboard(stations, "🟥", selected)

def get_blue_line_keyboard(selected=None):
    stations = [
        "Парнас", "Проспект Просвещения", "Озерки", "Удельная", "Пионерская",
        "Чёрная речка", "Петроградская", "Горьковская", "Невский проспект",
        "Сенная площадь", "Технологический институт", "Фрунзенская",
        "Московские ворота", "Электросила", "Парк Победы", "Московская",
        "Звёздная", "Купчино"
    ]
    return get_line_keyboard(stations, "🟦", selected)

def get_green_line_keyboard(selected=None):
    stations = [
        "Беговая", "Зенит", "Приморская", "Василеостровская",
        "Гостиный двор", "Маяковская", "Площадь Александра Невского",
        "Елизаровская", "Ломоносовская", "Пролетарская", "Обухово", "Рыбацкое"
    ]
    return get_line_keyboard(stations, "🟩", selected)

def get_orange_line_keyboard(selected=None):
    stations = [
        "Спасская", "Достоевская", "Лиговский проспект",
        "Площадь Александра Невского", "Новочеркасская", "Ладожская",
        "Проспект Большевиков", "Улица Дыбенко"
    ]
    return get_line_keyboard(stations, "🟧", selected)

def get_purple_line_keyboard(selected=None):
    stations = [
        "Комендантский проспект", "Старая Деревня", "Крестовский остров",
        "Чкаловская", "Спортивная", "Адмиралтейская", "Садовая",
        "Звенигородская", "Обводный канал", "Волковская", "Бухарестская",
        "Международная", "Проспект Славы", "Дунайская", "Шушары"
    ]
    return get_line_keyboard(stations, "🟪", selected)

def get_lo_cities_keyboard(selected=None):
    markup = ReplyKeyboardMarkup(row_width=3, resize_keyboard=True, one_time_keyboard=True)

    # Безопасная инициализация selected
    if selected is None:
        selected = []
    elif not isinstance(selected, list):
        selected = [selected] if selected else []

    cities = [
        "Кронштадт", "Петергоф", "Ломоносов", "Пушкин", "Павловск", "Колпино", "Сестрорецк", "Зеленогорск",
        "Всеволожск", "Гатчина", "Выборг", "Приозерск", "Тосно", "Луга", "Кириши", "Волхов", "Кингисепп",
        "Сосновый Бор", "Тихвин", "Сертолово", "Шлиссельбург", "Отрадное", "Сланцы", "Бокситогорск", "Подпорожье",
        "Лодейное Поле", "Никольское", "Коммунар", "Волосово", "Новая Ладога", "Сясьстрой", "Светогорск",
        "Каменногорск", "Ивангород", "Пикалёво", "Высоцк", "Рощино", "Мурино", "Токсово", "Синявино", "Бугры",
        "Кировск", "Мга", "Ульяновка", "Любань", "Приморск", "Другое ✍️"
    ]

    # Добавляем города по 3 в ряд
    current_row = []
    for city in cities:
        is_selected = f"ЛО: {city}" in selected
        text = f"🏡 {city}{' ✅' if is_selected else ''}"
        current_row.append(KeyboardButton(text))
        if len(current_row) == 3:
            markup.add(*current_row)
            current_row = []

    # Добавляем оставшиеся города
    if current_row:
        markup.add(*current_row)

    markup.add(KeyboardButton("Назад ⬅️"), KeyboardButton("Готово ✅"))
    return markup

# Клавиатура для семейного положения
def get_marital_status_keyboard(show_back=False):
    markup = ReplyKeyboardMarkup(row_width=3, resize_keyboard=True, one_time_keyboard=True)
    markup.add(
        KeyboardButton("💔 Не женат"),
        KeyboardButton("💔 Не замужем"),
        KeyboardButton("💕 Встречаюсь")
    )
    markup.add(
        KeyboardButton("💍 Помолвлен(а)"),
        KeyboardButton("💒 Женат"),
        KeyboardButton("💒 Замужем")
    )
    markup.add(
        KeyboardButton("🤝 В гражданском браке"),
        KeyboardButton("😍 Влюблён"),
        KeyboardButton("🤷 Всё сложно")
    )
    markup.add(
        KeyboardButton("🔍 В активном поиске")
    )
    if show_back:
        markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Клавиатура для сексуальной ориентации
def get_sexual_orientation_keyboard(show_back=False):
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    orientations = [
        "Гетеро 😊",
        "Би 🌈",
        "Гей/Лесби 🏳️‍🌈",
        "Другое ✍️"
    ]
    for text in orientations:
        markup.add(KeyboardButton(text))
    if show_back:
        markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Клавиатура для телеграм-канала
def get_telegram_channel_keyboard(show_back=False):
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    markup.add(
        KeyboardButton("Указать канал 📢"),
        KeyboardButton("Не указывать 🚫")
    )
    markup.add(KeyboardButton("К профилю ↩️"))
    if show_back:
        markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Клавиатура для выбора поля для редактирования (inline)
def get_edit_field_keyboard():
    markup = InlineKeyboardMarkup(row_width=2)
    fields = [
        ("Пол 👨👩", "edit_gender"),
        ("Имя ✏️", "edit_name"),
        ("Возраст 🎂", "edit_age"),
        ("Станция метро 🚇", "edit_metro"),
        ("Интересы 🎉", "edit_interests"),
        ("Семейное положение 💍", "edit_marital"),
        ("Сексуальная ориентация 🌈", "edit_orientation"),
        ("Телеграм-канал 📢", "edit_tg_channel"),
        ("Доп. информация 📝", "edit_extra")
    ]
    for text, callback in fields:
        markup.add(InlineKeyboardButton(text, callback_data=callback))
    markup.add(InlineKeyboardButton("К профилю ↩️", callback_data="back_to_profile"))
    markup.add(InlineKeyboardButton("Заполнить профиль заново 🔄", callback_data="reset_profile"))
    return markup

# Reply-клавиатура для редактирования профиля
def get_edit_field_reply_keyboard():
    markup = ReplyKeyboardMarkup(row_width=3, resize_keyboard=True, one_time_keyboard=True)
    markup.add(
        KeyboardButton("Пол 👨👩"),
        KeyboardButton("Имя ✏️"),
        KeyboardButton("Возраст 🎂")
    )
    markup.add(
        KeyboardButton("Станция метро 🚇"),
        KeyboardButton("Интересы 🎉"),
        KeyboardButton("Семейное положение 💍")
    )
    markup.add(
        KeyboardButton("Сексуальная ориентация 🌈"),
        KeyboardButton("Телеграм-канал 📢"),
        KeyboardButton("Доп. информация 📝")
    )
    markup.add(
        KeyboardButton("К профилю ↩️"),
        KeyboardButton("Заполнить профиль заново 🔄")
    )
    return markup

# Клавиатура для админа
def get_admin_keyboard():
    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton("Статистика 📊", callback_data="admin_stats"),
        InlineKeyboardButton("Список пользователей 📋", callback_data="list_users")
    )
    return markup

# Клавиатура для профиля пользователя
def get_profile_keyboard():
    markup = ReplyKeyboardMarkup(row_width=1, resize_keyboard=True)
    markup.add(KeyboardButton("✏️ Редактировать профиль"))
    return markup

# Reply-клавиатура для дополнительной информации
def get_extra_info_keyboard(edit=False, show_back=False):
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    if edit:
        markup.add(
            KeyboardButton("Изменить"),
            KeyboardButton("Удалить 🗑️")
        )
        markup.add(KeyboardButton("К профилю ↩️"))
    else:
        markup.add(
            KeyboardButton("Добавить"),
            KeyboardButton("Пропустить")
        )
        if show_back:
            markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Reply-клавиатура для дополнительной информации
def get_extra_info_reply_keyboard(show_back=False):
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    markup.add(
        KeyboardButton("Добавить"),
        KeyboardButton("Пропустить")
    )
    markup.add(KeyboardButton("К профилю ↩️"))
    if show_back:
        markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Функция для получения эмодзи интереса
def get_interest_emoji(interest):
    for category_name, interests_list in INTEREST_CATEGORIES.items():
        for interest_name, emoji in interests_list:
            if interest_name == interest:
                return emoji
    return "🎯"  # Дефолтный эмодзи для неизвестных интересов

# Функция для получения эмодзи станции метро
def get_metro_emoji(station):
    # Красная ветка
    red_stations = [
        "Девяткино", "Гражданский проспект", "Академическая", "Политехническая",
        "Площадь Мужества", "Лесная", "Выборгская", "Площадь Ленина",
        "Чернышевская", "Площадь Восстания", "Владимирская", "Пушкинская",
        "Технологический институт", "Балтийская", "Нарвская", "Кировский завод",
        "Автово", "Ленинский проспект", "Проспект Ветеранов"
    ]
    # Синяя ветка
    blue_stations = [
        "Парнас", "Проспект Просвещения", "Озерки", "Удельная", "Пионерская",
        "Чёрная речка", "Петроградская", "Горьковская", "Невский проспект",
        "Сенная площадь", "Технологический институт", "Фрунзенская",
        "Московские ворота", "Электросила", "Парк Победы", "Московская",
        "Звёздная", "Купчино"
    ]
    # Зелёная ветка
    green_stations = [
        "Беговая", "Зенит", "Приморская", "Василеостровская",
        "Гостиный двор", "Маяковская", "Площадь Александра Невского",
        "Елизаровская", "Ломоносовская", "Пролетарская", "Обухово", "Рыбацкое"
    ]
    # Оранжевая ветка
    orange_stations = [
        "Спасская", "Достоевская", "Лиговский проспект",
        "Площадь Александра Невского", "Новочеркасская", "Ладожская",
        "Проспект Большевиков", "Улица Дыбенко"
    ]
    # Фиолетовая ветка
    purple_stations = [
        "Комендантский проспект", "Старая Деревня", "Крестовский остров",
        "Чкаловская", "Спортивная", "Адмиралтейская", "Садовая",
        "Звенигородская", "Обводный канал", "Волковская", "Бухарестская",
        "Международная", "Проспект Славы", "Дунайская", "Шушары"
    ]

    if station in red_stations:
        return "🟥"
    elif station in blue_stations:
        return "🟦"
    elif station in green_stations:
        return "🟩"
    elif station in orange_stations:
        return "🟧"
    elif station in purple_stations:
        return "🟪"
    elif station.startswith("ЛО:"):
        return "🏡"
    elif station == "Я не в Питере":
        return "🌍"
    else:
        return "🚇"

# Функция для получения эмодзи семейного положения
def get_marital_status_emoji(status):
    if status == "Не женат":
        return "💔"
    elif status == "Не замужем":
        return "💔"
    elif status == "Встречаюсь":
        return "💕"
    elif status == "Помолвлен(а)":
        return "💍"
    elif status == "Женат":
        return "💒"
    elif status == "Замужем":
        return "💒"
    elif status == "В гражданском браке":
        return "🤝"
    elif status == "Влюблён":
        return "😍"
    elif status == "Всё сложно":
        return "🤷"
    elif status == "В активном поиске":
        return "🔍"
    else:
        return "💔"

# Функция для получения эмодзи сексуальной ориентации
def get_orientation_emoji(orientation):
    if orientation == "Гетеро":
        return "😊"
    elif orientation == "Би":
        return "🌈"
    elif orientation == "Гей/Лесби":
        return "🏳️‍🌈"
    else:
        return "✍️"

# Функция для создания reply-клавиатуры с кнопками "Да" и "Нет"
def get_yes_no_reply_keyboard():
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
    btn_yes = KeyboardButton("Да")
    btn_no = KeyboardButton("Нет")
    markup.add(btn_yes, btn_no)
    return markup

# Функция для создания клавиатуры с кнопками Профиль и Ссылка на чат
def get_emoji_keyboard():
    markup = InlineKeyboardMarkup(row_width=2)

    # Кнопки Профиль и Ссылка на чат
    markup.add(
        InlineKeyboardButton("👤 Профиль", callback_data="show_profile"),
        InlineKeyboardButton("🔗 Ссылка на чат", callback_data="show_chat_link")
    )

    return markup

# Функция для создания reply-клавиатуры с кнопкой Назад
def get_back_reply_keyboard():
    markup = ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
    markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Функция для создания reply-клавиатуры с основными действиями
def get_main_reply_keyboard():
    markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True)
    markup.add(
        KeyboardButton("👤 Профиль"),
        KeyboardButton("🔗 Ссылка на чат")
    )
    markup.add(KeyboardButton("✏️ Редактировать профиль"))
    return markup

# Форматирование профиля для отображения
def format_profile(user, is_own_profile=True):
    desc = user['description']

    # Корректно выводим список станций метро/городов с эмодзи
    metro = desc.get('metro_station')
    metro_label = "Станция метро"

    if isinstance(metro, list):
        metro_with_emoji = []
        for station in metro:
            if station == "Я не в Питере":
                metro_with_emoji.append("🌍 Я не в Питере")
                metro_label = "Местоположение"
            else:
                emoji = get_metro_emoji(station)
                metro_with_emoji.append(f"{emoji} {station}")
        metro_str = ', '.join(metro_with_emoji) if metro else "Не указано"
    elif isinstance(metro, str):
        if metro == "Я не в Питере":
            metro_str = "🌍 Я не в Питере"
            metro_label = "Местоположение"
        else:
            emoji = get_metro_emoji(metro)
            metro_str = f"{emoji} {metro}"
    else:
        metro_str = "Не указано"

    # Интересы с эмодзи
    if desc['interests']:
        interests_with_emoji = []
        for interest in desc['interests']:
            emoji = get_interest_emoji(interest)
            interests_with_emoji.append(f"{emoji} {interest}")
        interests = ', '.join(interests_with_emoji)
    else:
        interests = "Не указано"

    # Семейное положение с эмодзи
    marital_status = desc['marital_status']
    marital_emoji = get_marital_status_emoji(marital_status)
    marital_str = f"{marital_emoji} {marital_status}" if marital_status else "Не указано"

    # Сексуальная ориентация с эмодзи
    orientation = desc['sexual_orientation']
    orientation_emoji = get_orientation_emoji(orientation)
    orientation_str = f"{orientation_emoji} {orientation}" if orientation else "Не указано"

    tg_channel = desc['telegram_channel'] if desc['telegram_channel'] else "Не указано"
    extra_info = desc['extra_info'] if desc['extra_info'] not in (None, "") else "Не указано"

    # Заголовок профиля в зависимости от контекста
    if is_own_profile:
        # Добавляем прогресс-бар только для своего профиля
        progress = get_profile_progress(user)
        header = f"🌟 Твой профиль ᴠᴨᴩᴏᴦʏᴧᴋᴇ:\n\n{progress}\n"
    else:
        # Для чужого профиля показываем статус участия в чате
        username = user.get('username', 'Пользователь')
        name = desc.get('name', username)

        # Проверяем заполненность профиля для определения статуса в чате
        is_complete = is_description_complete(user)
        wants_link = user.get('wants_link', False)

        # Определяем статус в чате
        if is_complete and wants_link:
            chat_status = "💚 Состоит в чате"
        else:
            chat_status = "💔 Не состоит в чате"

        header = f"👤 Это пользователь [{name}](https://t.me/{username})\n{chat_status}\n\n"

    return (
        f"{header}"
        f"Пол: {desc['gender']} {'👨' if desc['gender'] == 'Мужчина' else '👩'}\n"
        f"Имя: {desc['name']} ✏️\n"
        f"Возраст: {desc['age']} 🎂\n"
        f"{metro_label}: {metro_str}\n"
        f"Интересы: {interests}\n"
        f"Семейное положение: {marital_str}\n"
        f"Сексуальная ориентация: {orientation_str}\n"
        f"Телеграм-канал: {tg_channel} 📢\n"
        f"Доп. информация: {extra_info} 📝\n"
    )

# --- Категории и интересы с эмодзи ---
INTEREST_CATEGORIES = {
    "🎮 Хобби": [
        ("Компьютерные игры", "🎮"), ("Мода и красота", "💄"), ("Автомобили", "🚗"), ("IT и технологии", "💻"), ("Психология", "🧠"), ("Астрология", "🔮"), ("Медитации", "🧘"), ("Комиксы", "📚"), ("Манга", "📖"), ("Фанфики", "✍️"), ("Коллекционирование", "🧩"), ("Изучение языков", "🈴"), ("Стриминги", "📺"), ("Игры на приставке", "🕹️")
    ],
    "👥 Социальная жизнь": [
        ("Кинотеатры", "🎬"), ("Концерты и шоу", "🎤"), ("Музеи и галереи", "🖼️"), ("Театры", "🎭"), ("Отдых на природе", "🌳"), ("Фестивали", "🎪"), ("Тусовки и клубы", "🎉"), ("Рестораны", "🍽️"), ("Путешествия", "✈️"), ("Шопинг", "🛍️"), ("Встречи с друзьями", "👫"), ("Искусство", "🎨"), ("Активный отдых", "🏕️"), ("Мастер-классы", "🛠️"), ("Караоке", "🎤"), ("Квизы", "❓")
    ],
    "🎨 Творчество": [
        ("Фотография", "📷"), ("Видеосъемка", "🎥"), ("Дизайн", "🎨"), ("Макияж", "💋"), ("Рукоделие", "🧵"), ("Танцы", "💃"), ("Пение", "🎤"), ("Музыка", "🎶"), ("Ведение блога", "📝"), ("Рисование", "🖌️"), ("Стрит-арт", "🖍️"), ("Флористика", "💐"), ("Косплей", "👗")
    ],
    "🏃 Активный образ жизни": [
        ("Бег", "🏃"), ("Фитнес", "🏋️"), ("Велосипед", "🚴"), ("Верховая езда", "🐎"), ("Лыжи", "🎿"), ("Йога", "🧘"), ("Пилатес", "🤸"), ("Сноуборд", "🏂"), ("Ролики", "🛼"), ("Скейтборд", "🛹"), ("Самокат", "🛴"), ("Прогулки", "🚶"), ("Альпинизм", "🧗")
    ],
    "🍕 Еда и напитки": [
        ("Пицца", "🍕"), ("Суши", "🍣"), ("Бургеры", "🍔"), ("Здоровое питание", "🥗"), ("Веганство", "🥦"), ("Вегетарианство", "🥕"), ("Кофе", "☕"), ("Чай", "🍵"), ("Выпечка", "🥐"), ("Сладости", "🍬"), ("Домашняя F�ухня", "🍲"), ("Бабл-ти", "🧋"), ("Паста", "🍝"), ("Шаурма", "🌯"), ("Острая еда", "🌶️")
    ],
    "⚽ Спорт": [
        ("Футбол", "⚽"), ("Плавание", "🏊"), ("Волейбол", "🏐"), ("Баскетбол", "🏀"), ("Хоккей", "🏒"), ("Тяжёлая атлетика", "🏋️"), ("Бокс", "🥊"), ("Киберспорт", "🕹️"), ("Единоборства", "🥋"), ("Теннис", "🎾")
    ],
    "🏠 Время дома": [
        ("Кулинария", "👩‍🍳"), ("Настольные игры", "🎲"), ("Кино и сериалы", "📺"), ("Садоводство", "🌱"), ("Книги", "📚"), ("Саморазвитие", "🌱"), ("Онлайн-обучение", "💻"), ("Просмотр шоу", "📺"), ("Подкасты", "🎧")
    ],
    "✈️ Путешествия": [
        ("Загородные поездки", "🚙"), ("Турпоходы", "🥾"), ("Экскурсии", "🗺️"), ("Пляжный отдых", "🏖️"), ("Охота и рыбалка", "🎣"), ("Круизы", "🛳️"), ("Горы", "🏔️"), ("Мероприятия и концерты", "🎟️"), ("Путешествия за границей", "🌍"), ("Экстрим", "🤪"), ("Путешествия по России", "🇷🇺")
    ],
    "🐾 Домашние животные": [
        ("Кошки", "🐱"), ("Собаки", "🐶"), ("Птицы", "🐦"), ("Рыбки", "🐟"), ("Кролики", "🐰"), ("Черепахи", "🐢"), ("Змеи", "🐍"), ("Ящерицы", "🦎"), ("Хомяки", "🐹")
    ],
    "🎬 Фильмы и сериалы": [
        ("Комедии", "😂"), ("Мультфильмы", "🎬"), ("Исторические", "🏺"), ("Детективы", "🕵️"), ("Приключения", "🏝️"), ("Ужасы", "👻"), ("Драмы", "🎭"), ("Мелодрамы", "💔"), ("Триллеры", "🔪"), ("Боевики", "💥"), ("Аниме", "🧑‍🎤"), ("Тру-крайм", "🚔"), ("Документальное кино", "🎞️"), ("Развлекательные шоу", "🎤"), ("Стендап", "🎙️"), ("Дорамы", "🌸"), ("Фантастика", "👽")
    ],
    "🎵 Музыка": [
        ("Поп-музыка", "🎤"), ("Хип-хоп", "🎧"), ("Электроника", "🎹"), ("Рок", "🎸"), ("Рэп", "🎤"), ("Классическая музыка", "🎻"), ("Метал", "🤘"), ("Техно", "🎛️"), ("Блюз", "🎷"), ("Меломан", "🎼"), ("K-pop", "🎵")
    ]
}
# --- конец объединённого блока ---

# Клавиатура для возврата на предыдущий шаг
def get_back_keyboard(back_to):
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton("Назад ⬅️", callback_data=f"back_to_{back_to}"))
    return markup

# Клавиатура для ввода имени с предыдущим именем
def get_name_keyboard(previous_name=None, show_back=False):
    markup = ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
    if previous_name:
        markup.add(KeyboardButton(previous_name))
    if show_back:
        markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Клавиатура для ввода возраста с предыдущим возрастом
def get_age_keyboard(previous_age=None, show_back=False):
    markup = ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
    if previous_age:
        markup.add(KeyboardButton(str(previous_age)))
    if show_back:
        markup.add(KeyboardButton("Назад ⬅️"))
    return markup

# Функция для записи активности пользователя
def log_user_activity(user_id, username, action, chat_type='private'):
    """Записывает активность пользователя в базу данных"""
    if user_id not in users_data:
        users_data[user_id] = {
            'id': user_id,
            'username': username,
            'source': None,
            'timestamp': None,
            'wants_link': False,
            'description': {
                'gender': None,
                'name': None,
                'age': None,
                'metro_station': None,
                'interests': [],
                'marital_status': None,
                'sexual_orientation': None,
                'telegram_channel': None,
                'extra_info': None
            },
            'awaiting': None,
            'activity_log': []
        }

    # Добавляем запись об активности
    if 'activity_log' not in users_data[user_id]:
        users_data[user_id]['activity_log'] = []

    activity_entry = {
        'date': datetime.now().strftime("%Y-%m-%d"),
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'action': action,
        'chat_type': chat_type
    }

    users_data[user_id]['activity_log'].append(activity_entry)

    # Оставляем только последние 100 записей для каждого пользователя
    if len(users_data[user_id]['activity_log']) > 100:
        users_data[user_id]['activity_log'] = users_data[user_id]['activity_log'][-100:]

    save_users_data(users_data)
    logging.info(f"ACTIVITY_LOG: Пользователь {user_id} ({username}) - {action} в {chat_type}")

# Функция для генерации графика активности конкретного пользователя
def generate_user_activity_chart(user_id):
    """Генерирует график активности для конкретного пользователя"""
    try:
        if user_id not in users_data or 'activity_log' not in users_data[user_id]:
            return None

        activity_log = users_data[user_id]['activity_log']
        if not activity_log:
            return None

        # Подсчитываем активность по датам
        date_counts = {}
        for entry in activity_log:
            date = entry['date']
            date_counts[date] = date_counts.get(date, 0) + 1

        # Сортируем даты
        sorted_dates = sorted(date_counts.keys())
        counts = [date_counts[date] for date in sorted_dates]

        # Форматируем даты в формат dd.mm точно как на изображении
        from datetime import datetime
        formatted_dates = []
        for date in sorted_dates:
            dt = datetime.strptime(date, "%Y-%m-%d")
            formatted_dates.append(dt.strftime("%d.%m"))

        # Создаем график максимально похожий на образец
        plt.style.use('default')
        fig, ax = plt.subplots(figsize=(16, 8))
        fig.patch.set_facecolor('#f8f8f8')
        ax.set_facecolor('#f8f8f8')

        # Создаем столбцы точно таким же ярко-зеленым цветом как на образце
        bars = ax.bar(formatted_dates, counts, color='#8BC34A', width=0.7, alpha=1.0)

        # Убираем все границы рамки
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_visible(False)
        ax.spines['bottom'].set_visible(False)

        # Настройка сетки точно как на образце
        ax.grid(True, axis='y', alpha=0.4, color='#e0e0e0', linestyle='-', linewidth=0.8)
        ax.set_axisbelow(True)

        # Убираем подписи осей
        ax.set_xlabel("")
        ax.set_ylabel("")

        # Заголовок по центру точно как на образце
        ax.set_title("Статистика активности", fontsize=16, color='#5c6bc0', 
                    fontweight='normal', pad=30, ha='center')

        # Настройка меток на осях
        ax.tick_params(axis='x', colors='#666666', labelsize=10, length=0, pad=8)
        ax.tick_params(axis='y', colors='#666666', labelsize=10, length=0, pad=8)

        # Создаем правую ось с подписью "Количество сообщений" справа
        if counts and max(counts) > 0:
            max_count = max(counts)
            ax2 = ax.twinx()
            ax2.set_ylim(0, max_count + max_count * 0.1)
            ax2.set_ylabel("Количество\nсообщений", fontsize=11, color='#666666', 
                          rotation=270, labelpad=25, ha='center', va='center')

            # Настройка правой оси с зеленой шкалой как на образце
            ax2.tick_params(axis='y', colors='#8BC34A', labelsize=10, length=0, pad=8)
            ax2.spines['right'].set_visible(False)
            ax2.spines['top'].set_visible(False)
            ax2.spines['left'].set_visible(False)
            ax2.spines['bottom'].set_visible(False)

            # Настройка левой оси
            ax.set_ylim(0, max_count + max_count * 0.1)

        # Убираем отступы
        plt.subplots_adjust(left=0.08, right=0.92, top=0.9, bottom=0.15)

        # Сохраняем график в буфер памяти
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', 
                   facecolor='#f8f8f8', edgecolor='none', pad_inches=0.3)
        buf.seek(0)
        plt.close()

        return buf
    except Exception as e:
        logging.error(f"Ошибка при генерации графика активности пользователя {user_id}: {e}")
        return None

# Функция для генерации общего графика активности
def generate_activity_chart():
    """Генерирует общий график активности всех пользователей"""
    try:
        # Собираем данные по активности за последние 30 дней
        from datetime import datetime, timedelta

        today = datetime.now()
        thirty_days_ago = today - timedelta(days=30)

        daily_activity = {}

        # Инициализируем все дни нулями
        for i in range(30):
            date = (thirty_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_activity[date] = 0

        # Подсчитываем активность
        for user_data in users_data.values():
            if 'activity_log' in user_data:
                for entry in user_data['activity_log']:
                    entry_date = entry['date']
                    if entry_date in daily_activity:
                        daily_activity[entry_date] += 1

        # Подготавливаем данные для графика
        dates = sorted(daily_activity.keys())
        counts = [daily_activity[date] for date in dates]

        # Форматируем даты для отображения точно как на образце (dd.mm)
        formatted_dates = []
        for date in dates:
            dt = datetime.strptime(date, "%Y-%m-%d")
            formatted_dates.append(dt.strftime("%d.%m"))

        # Создаем график максимально похожий на образец
        plt.style.use('default')
        fig, ax = plt.subplots(figsize=(16, 8))
        fig.patch.set_facecolor('#f8f8f8')
        ax.set_facecolor('#f8f8f8')

        # Создаем столбцы точно таким же ярко-зеленым цветом как на образце
        bars = ax.bar(formatted_dates, counts, color='#8BC34A', width=0.7, alpha=1.0)

        # Убираем все границы рамки
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_visible(False)
        ax.spines['bottom'].set_visible(False)

        # Настройка сетки точно как на образце
        ax.grid(True, axis='y', alpha=0.4, color='#e0e0e0', linestyle='-', linewidth=0.8)
        ax.set_axisbelow(True)

        # Убираем подписи осей
        ax.set_xlabel("")
        ax.set_ylabel("")

        # Заголовок по центру точно как на образце
        ax.set_title("Статистика активности", fontsize=16, color='#5c6bc0', 
                    fontweight='normal', pad=30, ha='center')

        # Настройка меток на осях
        ax.tick_params(axis='x', colors='#666666', labelsize=10, length=0, pad=8)
        ax.tick_params(axis='y', colors='#666666', labelsize=10, length=0, pad=8)

        # Создаем правую ось с подписью "Количество сообщений" справа
        if counts and max(counts) > 0:
            max_count = max(counts)
            ax2 = ax.twinx()
            ax2.set_ylim(0, max_count + max_count * 0.1)
            ax2.set_ylabel("Количество\nсообщений", fontsize=11, color='#666666', 
                          rotation=270, labelpad=25, ha='center', va='center')

            # Настройка правой оси с зеленой шкалой как на образце
            ax2.tick_params(axis='y', colors='#8BC34A', labelsize=10, length=0, pad=8)
            ax2.spines['right'].set_visible(False)
            ax2.spines['top'].set_visible(False)
            ax2.spines['left'].set_visible(False)
            ax2.spines['bottom'].set_visible(False)

            # Настройка левой оси
            ax.set_ylim(0, max_count + max_count * 0.1)

        # Убираем отступы
        plt.subplots_adjust(left=0.08, right=0.92, top=0.9, bottom=0.15)

        # Сохраняем график в буфер памяти
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', 
                   facecolor='#f8f8f8', edgecolor='none', pad_inches=0.3)
        buf.seek(0)
        plt.close()

        return buf
    except Exception as e:
        logging.error(f"Ошибка при генерации общего графика активности: {e}")
        return None

# Обработчик команды для демонстрации reply-клавиатуры
@bot.message_handler(commands=['keyboard'])
def show_keyboard_demo(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name

    logging.info(f"ACTION: Пользователь {user_id} (@{username}) запросил демо клавиатуры")

    bot.reply_to(message, "Выбери вариант:", reply_markup=get_yes_no_reply_keyboard())

# Обработчик команды /start
@bot.message_handler(commands=['start'])
def start(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name
    chat_type = 'group' if message.chat.type in ['group', 'supergroup'] else 'private'

    logging.info(f"ACTION: Пользователь {user_id} (@{username}) выполнил команду /start")

    # Логируем активность
    log_user_activity(user_id, username, 'Команда /start', chat_type)

    # --- Новое: разрешаем /start и в группах для сбора источника ---
    if user_id not in users_data:
        users_data[user_id] = {
            'id': user_id,
            'username': username,
            'source': None,
            'timestamp': None,
            'wants_link': False,
            'description': {
                'gender': None,
                'name': None,
                'age': None,
                'metro_station': None,
                'interests': [],
                'marital_status': None,
                'sexual_orientation': None,
                'telegram_channel': None,
                'extra_info': None
            },
            'awaiting': 'source'
        }
        save_users_data(users_data)
        logging.info(f"NEW_USER: Создан новый пользователь {user_id} (@{username})")

    state = users_data[user_id]['awaiting']
    logging.info(f"USER_STATE: Пользователь {user_id} находится в состоянии '{state}'")

    try:
        if state == 'source':
            logging.info(f"SEND_MESSAGE: Отправка запроса источника пользователю {user_id}")
            bot.reply_to(message, "🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot! Откуда ты узнал о нашем чате? 😎")
        elif state == 'join_request':
            logging.info(f"SEND_MESSAGE: Отправка запроса присоединения к чату пользователю {user_id}")
            bot.reply_to(message, "Хочешь присоединиться к нашему чату? 🚀", reply_markup=get_join_request_keyboard())
        elif state == 'gender':
            progress = get_profile_progress(users_data[user_id])
            logging.info(f"SEND_MESSAGE: Отправка запроса пола пользователю {user_id}")
            bot.reply_to(message, f"{progress}Укажи свой пол: 👨👩", reply_markup=get_gender_keyboard())
        elif state == 'name':
            progress = get_profile_progress(users_data[user_id])
            logging.info(f"SEND_MESSAGE: Отправка запроса имени пользователю {user_id}")
            
            # Проверяем, есть ли предыдущее имя (при заполнении профиля заново)
            previous_name = users_data[user_id].get('previous_name')
            if previous_name:
                bot.reply_to(message, f"{progress}Как тебя зовут? ✏️\n\nМожешь выбрать предыдущее имя или ввести новое:", reply_markup=get_name_keyboard(previous_name, show_back=True))
            else:
                bot.reply_to(message, f"{progress}Как тебя зовут? ✏️", reply_markup=get_back_reply_keyboard())
        elif state == 'age':
            progress = get_profile_progress(users_data[user_id])
            logging.info(f"SEND_MESSAGE: Отправка запроса возраста пользователю {user_id}")
            
            # Проверяем, есть ли предыдущий возраст (при заполнении профиля заново)
            previous_age = users_data[user_id].get('previous_age')
            if previous_age:
                bot.reply_to(message, f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂\n\nМожешь выбрать предыдущий возраст или ввести новый:", reply_markup=get_age_keyboard(previous_age, show_back=True))
            else:
                bot.reply_to(message, f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂", reply_markup=get_back_reply_keyboard())
        elif state == 'metro':
            progress = get_profile_progress(users_data[user_id])
            logging.info(f"SEND_MESSAGE: Отправка запроса станции метро пользователю {user_id}")

            # Показываем уже выбранные станции с эмодзи
            current_metro = users_data[user_id]['description'].get('metro_station', [])
            if current_metro:
                metro_with_emoji = []
                for station in current_metro:
                    emoji = get_metro_emoji(station)
                    metro_with_emoji.append(f"{emoji} {station}")
                metro_display = ', '.join(metro_with_emoji)
                message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇\n\nУже выбрано: {metro_display}"
            else:
                message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇"

            bot.reply_to(message, message_text, reply_markup=get_metro_keyboard(show_back=True))
        elif state == 'marital_status':
            progress = get_profile_progress(users_data[user_id])
            logging.info(f"SEND_MESSAGE: Отправка запроса семейного положения пользователю {user_id}")
            bot.reply_to(message, f"{progress}Выбери семейное положение 💍:", reply_markup=get_marital_status_keyboard(show_back=True))
        elif state == 'sexual_orientation':
            progress = get_profile_progress(users_data[user_id])
            logging.info(f"SEND_MESSAGE: Отправка запроса ориентации пользователю {user_id}")
            bot.reply_to(message, f"{progress}Укажи свою сексуальную ориентацию 🌈:", reply_markup=get_sexual_orientation_keyboard(show_back=True))
        elif state == 'custom_lo':
            logging.info(f"SEND_MESSAGE: Отправка запроса города ЛО пользователю {user_id}")
            bot.reply_to(message, "Укажи свой город в Ленинградской области (например, 'Мурино') ✍️:")
        elif state == 'telegram_channel':
            progress = get_profile_progress(users_data[user_id])
            logging.info(f"SEND_MESSAGE: Отправка запроса телеграм-канала пользователю {user_id}")
            bot.reply_to(message, f"{progress}Хочешь указать свой телеграм-канал? 📢", reply_markup=get_telegram_channel_keyboard(show_back=True))
        elif state == 'custom_tg_channel':
            progress = get_profile_progress(users_data[user_id])
            # Новая подсказка с расширенными правилами
            bot.reply_to(message, f"{progress}Введи свой телеграм-канал (можно ссылку, ник с @ или просто имя, например: @MyChannel, t.me/MyChannel, https://t.me/MyChannel или MyChannel) 📢:")
        elif state == 'extra_info':
            progress = get_profile_progress(users_data[user_id])
            bot.reply_to(message, f"{progress}Хочешь добавить что-то ещё о себе? (до 2000 символов) 📝", reply_markup=get_extra_info_reply_keyboard(show_back=True))
        elif state == 'edit_extra_info':
            bot.reply_to(message, "Хочешь изменить доп. информацию? (до 2000 символов) 📝", reply_markup=get_extra_info_keyboard(edit=True))
        elif state and state.startswith('edit_'):
            field = state.split('_')[1]
            if field == 'gender':
                bot.reply_to(message, "Укажи новый пол: 👨👩", reply_markup=get_gender_keyboard())
            elif field == 'name':
                bot.reply_to(message, "Введи новое имя ✏️:")
            elif field == 'age':
                progress = get_profile_progress(user)
                bot.reply_to(message, f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂", reply_markup=get_back_keyboard("name"))
            elif field == 'metro':
                bot.reply_to(message, "Выбери новую станцию метро 🚇:", reply_markup=get_metro_keyboard())
            elif field == 'interests':
                bot.reply_to(message, "Выбери новые интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard())
            elif field == 'marital':
                bot.reply_to(message, "Выбери новое семейное положение 💍:", reply_markup=get_marital_status_keyboard())
            elif field == 'orientation':
                bot.reply_to(message, "Укажи новую сексуальную ориентацию 🌈:", reply_markup=get_sexual_orientation_keyboard())
            elif field == 'tg_channel':
                bot.reply_to(message, "Хочешь указать свой телеграм-канал? 📢", reply_markup=get_telegram_channel_keyboard())
            elif field == 'extra':
                bot.reply_to(message, "Хочешь изменить доп. информацию? (до 2000 символов) 📝", reply_markup=get_extra_info_keyboard(edit=True))
        else:
            # Если профиль заполнен, показываем reply-клавиатуру
            if is_description_complete(users_data[user_id]):
                bot.reply_to(message, "Привет! Твой профиль уже заполнен. Используй кнопки ниже для навигации! 😊", reply_markup=get_main_reply_keyboard())
            else:
                # Проверяем, находится ли пользователь в процессе заполнения профиля
                current_state = users_data[user_id].get('awaiting')
                if current_state in ['gender', 'name', 'age', 'metro', 'interests', 'marital_status', 'sexual_orientation', 'telegram_channel', 'extra_info'] or current_state and (current_state.startswith('interests:') or current_state.startswith('edit_')):
                    # Пользователь уже в процессе заполнения профиля, не сбрасываем состояние
                    bot.reply_to(message, "Ты уже заполняешь профиль! Продолжай с текущего шага. 😊")
                    return

                # Если профиль не заполнен и пользователь не в процессе заполнения, начинаем процесс заполнения
                users_data[user_id]['awaiting'] = 'source'
                save_users_data(users_data)
                logging.info(f"STATE_RESET: Пользователь {user_id} перезапущен в состояние 'source'")
                bot.reply_to(message, "🌟 Привет от ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot! Откуда ты узнал о нашем чате? 😎")

        if state and state.startswith('interests:'):
            category = state.split(':', 1)[1]
            progress = get_profile_progress(users_data[user_id])
            bot.reply_to(message, f"{progress}Выбери интересы в категории: {category} (можно несколько, затем 'Готово') 🎉:", reply_markup=get_interests_keyboard(selected=users_data[user_id]['description']['interests'], category=category))
        elif state == 'edit_interests':
            bot.reply_to(message, "Выбери новые интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard(selected=users_data[user_id]['description']['interests']))
        elif state and state.startswith('edit_interests:'):
            category = state.split(':', 1)[1]
            progress = get_profile_progress(users_data[user_id])
            bot.reply_to(message, f"{progress}Выбери интересы в категории: {category} (можно несколько, затем 'Готово') 🎉:", reply_markup=get_interests_keyboard(selected=users_data[user_id]['description']['interests'], category=category))
    except Exception as e:
        logging.error(f"Ошибка в start для пользователя {user_id}: {str(e)}")
        bot.reply_to(message, "Произошла ошибка при отображении профиля. Попробуй ещё раз! 😅")
    logging.info(f"Пользователь {user_id} (@{username}) начал взаимодействие")

# База данных профилей ботов
BOT_PROFILES = {
    "VProgulkeBot": {
        "name": "ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot",
        "description": "Бот для знакомств и общения в Санкт-Петербурге",
        "version": "2.0",
        "features": [
            "📝 Создание профиля пользователя",
            "🚇 Поиск по станциям метро",
            "🎯 Подбор по интересам", 
            "💬 Связь с чатом знакомств",
            "📊 Статистика для админов"
        ],
        "creator": "@dmitrij_gz",
        "created": "2025-06-26"
    }
    # Здесь можно добавить профили других ботов
}

def format_bot_profile(bot_username):
    """Форматирует профиль бота для отображения"""
    if bot_username not in BOT_PROFILES:
        return None

    profile = BOT_PROFILES[bot_username]
    features_text = '\n'.join(profile['features'])

    return (
        f"🤖 **Профиль бота {profile['name']}**\n\n"
        f"📋 **Описание:** {profile['description']}\n"
        f"⚡ **Версия:** {profile['version']}\n"
        f"👨‍💻 **Создатель:** {profile['creator']}\n"
        f"📅 **Дата создания:** {profile['created']}\n\n"
        f"🛠️ **Функции:**\n{features_text}\n\n"
        f"💡 *Для взаимодействия с ботом напишите /start*"
    )

# Обработчик команд с упоминанием бота в реплаях
@bot.message_handler(func=lambda message: message.text and message.reply_to_message and message.reply_to_message.from_user and message.reply_to_message.from_user.is_bot and any(cmd in message.text.lower() for cmd in ['/profile@vprogulkebot', '/link@vprogulkebot']))
def handle_bot_command_reply(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name
    text = message.text.strip().lower()

    logging.info(f"BOT_COMMAND_REPLY: Пользователь {user_id} (@{username}) выполнил команду '{message.text}' в ответ на сообщение бота")

    # Логируем активность
    log_user_activity(user_id, username, f'Команда в ответ на бота: {message.text}', 'group' if message.chat.type in ['group', 'supergroup'] else 'private')

    if '/profile@vprogulkebot' in text:
        show_profile(message)
    elif '/link@vprogulkebot' in text:
        send_chat_link(message)

# Обработчик команды для просмотра профиля (своего или другого пользователя)
@bot.message_handler(func=lambda message: message.text and any(message.text.lower().startswith(cmd) for cmd in ['о себе', 'описание', 'профиль', 'био', 'кто я', 'кто ты', 'хто ты', 'хто я']))
def show_user_profile(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name
    text = message.text.strip()
    is_group_chat = message.chat.type in ['group', 'supergroup']
    chat_type = 'group' if is_group_chat else 'private'

    logging.info(f"ACTION: Пользователь {user_id} (@{username}) запросил профиль: '{text}' в {'группе' if is_group_chat else 'ЛС'}")

    # Логируем активность
    log_user_activity(user_id, username, 'Просмотр профиля', chat_type)

    # Проверяем, отвечает ли пользователь на чужое сообщение
    if message.reply_to_message and message.reply_to_message.from_user:
        replied_user_id = str(message.reply_to_message.from_user.id)
        replied_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name
        replied_is_bot = message.reply_to_message.from_user.is_bot

        logging.info(f"PROFILE_REPLY: Пользователь {user_id} запросил профиль в ответ на сообщение пользователя {replied_user_id} (@{replied_username})")

        # Проверяем, является ли пользователь ботом
        if replied_is_bot:
            bot_profile = format_bot_profile(replied_username)
            if bot_profile:
                bot.reply_to(message, bot_profile)
                logging.info(f"BOT_PROFILE_SHOWN: Пользователь {user_id} просмотрел профиль бота @{replied_username}")
            else:
                bot.reply_to(message, f"🤖 Профиль бота @{replied_username} не найден в базе данных")
            return

        # Ищем профиль пользователя, на сообщение которого отвечают
        if replied_user_id not in users_data:
            bot.reply_to(message, f"Пользователь @{replied_username} не найден в базе данных ᴠᴨᴩᴏᴦʏᴧᴋᴇ 😔")
            return

        if not is_description_complete(users_data[replied_user_id]):
            bot.reply_to(message, f"У пользователя @{replied_username} профиль не заполнен 📝")
            return

        # Отправляем профиль пользователя, на сообщение которого отвечают
        try:
            profile_text = format_profile(users_data[replied_user_id], is_own_profile=False)
            bot.reply_to(message, profile_text, parse_mode='Markdown')
            logging.info(f"PROFILE_SHOWN: Пользователь {user_id} просмотрел профиль @{replied_username} через reply в {'группе' if is_group_chat else 'ЛС'}")
        except Exception as e:
            logging.error(f"Ошибка в show_user_profile для пользователя {user_id}: {str(e)}")
            bot.reply_to(message, "Произошла ошибка при отображении профиля. Попробуй ещё раз! 😅")
        return

    # Извлекаем username из текста
    target_username = None

    # Различные форматы: "профиль @username", "описание username", "о себе t.me/@username" и т.д.
    import re

    # Паттерны для извлечения username
    patterns = [
        r'@(\w+)',  # @username
        r't\.me/@(\w+)',  # t.me/@username
        r't\.me/(\w+)',  # t.me/username
        r'https://t\.me/@(\w+)',  # https://t.me/@username
        r'https://t\.me/(\w+)',  # https://t.me/username
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            target_username = match.group(1)
            break

    # Если не найден через паттерны, ищем последнее слово как username
    # НО исключаем случаи когда это просто "о себе", "профиль" или "описание"
    if not target_username:
        words = text.split()
        if len(words) > 1:
            last_word = words[-1]
            # Исключаем служебные слова и местоимения
            if last_word.lower() not in ['себе', 'профиль', 'описание', 'я', 'ты']:
                # Убираем @ если есть
                if last_word.startswith('@'):
                    target_username = last_word[1:]
                else:
                    target_username = last_word

    # Специальная обработка для команд о боте
    if any(phrase in text.lower() for phrase in ['кто ты', 'хто ты']):
        bot_profile = format_bot_profile("VProgulkeBot")
        if bot_profile:
            bot.reply_to(message, bot_profile)
            logging.info(f"BOT_PROFILE_SHOWN: Пользователь {user_id} просмотрел профиль бота")
        else:
            bot.reply_to(message, "🤖 Информация о боте недоступна")
        return

    # Если username не найден, показываем профиль самого пользователя
    if not target_username:
        logging.info(f"PROFILE_SELF: Пользователь {user_id} запросил свой профиль в {'группе' if is_group_chat else 'ЛС'}")

        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎")
            return

        if not is_description_complete(users_data[user_id]):
            bot.reply_to(message, "Сначала заполни свой профиль через /start! 📝")
            return

        try:
            profile_text = format_profile(users_data[user_id])

            if is_group_chat:
                # В группе не показываем кнопку редактирования
                bot.reply_to(message, profile_text)
            else:
                # В ЛС показываем кнопку редактирования
                bot.reply_to(message, profile_text, reply_markup=get_profile_keyboard())

            logging.info(f"PROFILE_SHOWN: Пользователь {user_id} просмотрел свой профиль в {'группе' if is_group_chat else 'ЛС'}")
        except Exception as e:
            logging.error(f"Ошибка в show_user_profile для пользователя {user_id}: {str(e)}")
            bot.reply_to(message, "Произошла ошибка при отображении профиля. Попробуй ещё раз! 😅")
        return

    # Сначала проверяем, не является ли это ботом
    bot_profile = format_bot_profile(target_username)
    if bot_profile:
        bot.reply_to(message, bot_profile)
        logging.info(f"BOT_PROFILE_SHOWN: Пользователь {user_id} просмотрел профиль бота @{target_username}")
        return

    # Ищем другого пользователя в базе данных
    target_user = None
    for uid, data in users_data.items():
        if data.get('username') and data['username'].lower() == target_username.lower():
            target_user = data
            break

    if not target_user:
        bot.reply_to(message, f"Пользователь @{target_username} не найден в базе данных ᴠᴨᴩᴏᴦʏᴧᴋᴇ 😔")
        return

    if not is_description_complete(target_user):
        bot.reply_to(message, f"У пользователя @{target_username} профиль не заполнен 📝")
        return

    # Отправляем профиль найденного пользователя
    try:
        profile_text = format_profile(target_user, is_own_profile=False)
        bot.reply_to(message, profile_text, parse_mode='Markdown')
        logging.info(f"PROFILE_SHOWN: Пользователь {user_id} просмотрел профиль @{target_username} в {'группе' if is_group_chat else 'ЛС'}")
    except Exception as e:
        logging.error(f"Ошибка в show_user_profile для пользователя {user_id}: {str(e)}")
        bot.reply_to(message, "Произошла ошибка при отображении профиля. Попробуй ещё раз! 😅")



# Обработчик reply-кнопок
@bot.message_handler(func=lambda message: message.text and (message.text in ["👤 Профиль", "🔗 Ссылка на чат", "📝 Редактировать профиль", "✏️ Редактировать профиль", "Да 😎", "Нет 🙅", "Да", "Нет", "Мужчина 👨", "Женщина 👩", "Назад ⬅️", "К профилю ↩️", "Гетеро 😊", "Би 🌈", "Гей/Лесби 🏳️‍🌈", "Другое ✍️", "Указать канал 📢", "Не указывать 🚫", "Добавить", "Пропустить", "Изменить", "Удалить 🗑️", "💔 Не женат", "💔 Не замужем", "💕 Встречаюсь", "💍 Помолвлен(а)", "💒 Женат", "💒 Замужем", "🤝 В гражданском браке", "😍 Влюблён", "🤷 Всё сложно", "🔍 В активном поиске", "Пол 👨👩", "Имя ✏️", "Возраст 🎂", "Станция метро 🚇", "Интересы 🎉", "Семейное положение 💍", "Сексуальная ориентация 🌈", "Телеграм-канал 📢", "Доп. информация 📝", "Заполнить профиль заново 🔄", "Красная ветка 🟥", "Синяя ветка 🟦", "Зелёная ветка 🟩", "Оранжевая ветка 🟧", "Фиолетовая ветка 🟪", "Я из ЛО 🏡", "Я не в Питере 🌍", "Готово ✅"] or message.text.startswith(("🟥", "🟦", "🟩", "🟧", "🟪", "🏡"))))
def handle_reply_buttons(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name
    text = message.text.strip()

    logging.info(f"REPLY_BUTTON: Пользователь {user_id} (@{username}) нажал reply-кнопку: '{text}'")

    # Логируем активность
    log_user_activity(user_id, username, f'Reply-кнопка: {text}', 'private')

    if text == "👤 Профиль":
        show_profile(message)
    elif text == "🔗 Ссылка на чат":
        send_chat_link(message)
    elif text in ["📝 Редактировать профиль", "✏️ Редактировать профиль"]:
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎")
            return
        users_data[user_id]['awaiting'] = 'edit_select'
        save_users_data(users_data)
        bot.reply_to(message, "Что хочешь изменить в профиле? ✏️", reply_markup=get_edit_field_reply_keyboard())
    elif text in ["Да 😎", "Да"]:
        # Проверяем состояние пользователя
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'join_request':
            logging.info(f"USER_DECISION: Пользователь {user_id} решил присоединиться к чату")
            users_data[user_id]['wants_link'] = True
            users_data[user_id]['awaiting'] = 'gender'
            save_users_data(users_data)

            # Логируем активность
            log_user_activity(user_id, username, 'Желание присоединиться к чату')

            logging.info(f"STATE_CHANGE: Пользователь {user_id} переведен в состояние 'gender'")
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, "Укажи свой пол: 👨👩", reply_markup=get_gender_keyboard())
        else:
            bot.reply_to(message, "Отлично! Ты выбрал 'Да' 👍", reply_markup=get_main_reply_keyboard())
    elif text in ["Нет 🙅", "Нет"]:
        # Проверяем состояние пользователя
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'join_request':
            logging.info(f"USER_DECISION: Пользователь {user_id} отказался присоединяться к чату")
            users_data[user_id]['awaiting'] = None
            save_users_data(users_data)
            logging.info(f"STATE_CHANGE: Пользователь {user_id} завершил взаимодействие")
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, "Понятно! Если передумаешь, напиши /start! 😊", reply_markup=ReplyKeyboardRemove())
        else:
            bot.reply_to(message, "Понятно, ты выбрал 'Нет' 👎", reply_markup=get_main_reply_keyboard())
    elif text in ["Мужчина 👨", "Женщина 👩"]:
        # Обработка выбора пола через reply-кнопки
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'gender':
            gender = "Мужчина" if text == "Мужчина 👨" else "Женщина"
            users_data[user_id]['description']['gender'] = gender
            users_data[user_id]['awaiting'] = 'name'
            save_users_data(users_data)

            logging.info(f"USER_PROFILE: {user_id} указал пол: {gender}")
            progress = get_profile_progress(users_data[user_id])
            
            # Проверяем, есть ли предыдущее имя (при заполнении профиля заново)
            previous_name = users_data[user_id].get('previous_name')
            if previous_name:
                bot.send_message(message.chat.id, f"{progress}Как тебя зовут? ✏️\n\nМожешь выбрать предыдущее имя или ввести новое:", reply_markup=get_name_keyboard(previous_name, show_back=True))
            else:
                bot.send_message(message.chat.id, f"{progress}Как тебя зовут? ✏️", reply_markup=get_back_reply_keyboard())
        elif state == 'edit_gender':
            gender = "Мужчина" if text == "Мужчина 👨" else "Женщина"
            users_data[user_id]['description']['gender'] = gender
            users_data[user_id]['awaiting'] = None
            save_users_data(users_data)

            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nПрофиль обновлён!", reply_markup=get_profile_keyboard())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери пол в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text in ["Назад ⬅️", "К профилю ↩️"]:
        # Обработка reply-кнопки Назад или К профилю
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        logging.info(f"BACK_BUTTON: Пользователь {user_id} нажал {text} из состояния '{state}'")

        # Если нажата кнопка "К профилю ↩️", всегда возвращаемся к профилю
        if text == "К профилю ↩️":
            users_data[user_id]['awaiting'] = None
            users_data[user_id].pop('current_metro_line', None)  # Очищаем временные данные
            users_data[user_id].pop('prev_awaiting', None)  # Очищаем временные данные
            save_users_data(users_data)
            from telebot.types import ReplyKeyboardRemove

            profile_text = format_profile(users_data[user_id])

            # Если профиль заполнен, добавляем ссылку на чат
            if is_description_complete(users_data[user_id]):
                profile_text += f"\n\n💬 Ссылка на чат: {CHAT_LINK}"

            bot.send_message(message.chat.id, profile_text, reply_markup=get_profile_keyboard())


            return

        # Определяем, куда вернуться в зависимости от текущего состояния
        if state == 'name':
            users_data[user_id]['awaiting'] = 'gender'
            save_users_data(users_data)
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, "Укажи свой пол: 👨👩", reply_markup=get_gender_keyboard())
        elif state == 'age':
            users_data[user_id]['awaiting'] = 'name'
            save_users_data(users_data)
            progress = get_profile_progress(users_data[user_id])
            
            # Проверяем, есть ли предыдущее имя (при заполнении профиля заново)
            previous_name = users_data[user_id].get('previous_name')
            if previous_name:
                bot.send_message(message.chat.id, f"{progress}Как тебя зовут? ✏️\n\nМожешь выбрать предыдущее имя или ввести новое:", reply_markup=get_name_keyboard(previous_name, show_back=True))
            else:
                bot.send_message(message.chat.id, f"{progress}Как тебя зовут? ✏️", reply_markup=get_back_reply_keyboard())
        elif state == 'metro' or state == 'edit_metro':
            # Проверяем, выбирает ли пользователь станции на конкретной ветке или в городах ЛО
            if users_data[user_id].get('current_metro_line'):
                # Если находимся на конкретной ветке, возвращаемся к выбору веток метро
                users_data[user_id].pop('current_metro_line', None)
                save_users_data(users_data)

                if state == 'edit_metro':
                    # При редактировании возвращаемся к главному меню выбора метро
                    current_metro = users_data[user_id]['description'].get('metro_station', [])
                    if isinstance(current_metro, list):
                        if current_metro:
                            metro_with_emoji = []
                            for station in current_metro:
                                emoji = get_metro_emoji(station)
                                metro_with_emoji.append(f"{emoji} {station}")
                            metro_display = ', '.join(metro_with_emoji)
                        else:
                            metro_display = 'Не указано'
                    else:
                        if current_metro:
                            emoji = get_metro_emoji(current_metro)
                            metro_display = f"{emoji} {current_metro}"
                        else:
                            metro_display = 'Не указано'
                    message_text = f"Выбери новую станцию метро 🚇:\n\nТекущие станции: {metro_display}"
                    bot.send_message(message.chat.id, message_text, reply_markup=get_metro_keyboard())
                else:
                    # При первичном заполнении профиля
                    progress = get_profile_progress(users_data[user_id])
                    current_metro = users_data[user_id]['description'].get('metro_station', [])
                    if current_metro:
                        metro_with_emoji = []
                        for station in current_metro:
                            emoji = get_metro_emoji(station)
                            metro_with_emoji.append(f"{emoji} {station}")
                        metro_display = ', '.join(metro_with_emoji)
                        message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇\n\nУже выбрано: {metro_display}"
                    else:
                        message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇"
                    bot.send_message(message.chat.id, message_text, reply_markup=get_metro_keyboard(show_back=True))
            else:
                # Если находимся на главном экране выбора веток метро, возвращаемся к предыдущему этапу
                if state == 'edit_metro':
                    # При редактировании возвращаемся к профилю
                    users_data[user_id]['awaiting'] = None
                    save_users_data(users_data)
                    from telebot.types import ReplyKeyboardRemove

                    # Генерируем персональный график активности
                    chart_buffer = generate_user_activity_chart(user_id)
                    profile_text = format_profile(users_data[user_id])

                    if chart_buffer:
                        # Отправляем график с профилем в caption
                        bot.send_photo(
                            message.chat.id,
                            photo=chart_buffer,
                            caption=profile_text,
                            reply_markup=get_profile_keyboard()
                        )
                    else:
                        # Если график не создался, отправляем только профиль
                        bot.send_message(message.chat.id, profile_text, reply_markup=get_profile_keyboard())
                else:
                    # При первичном заполнении возвращаемся к возрасту
                    users_data[user_id]['awaiting'] = 'age'
                    save_users_data(users_data)
                    progress = get_profile_progress(users_data[user_id])
                    
                    # Проверяем, есть ли предыдущий возраст (при заполнении профиля заново)
                    previous_age = users_data[user_id].get('previous_age')
                    if previous_age:
                        bot.send_message(message.chat.id, f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂\n\nМожешь выбрать предыдущий возраст или ввести новый:", reply_markup=get_age_keyboard(previous_age, show_back=True))
                    else:
                        bot.send_message(message.chat.id, f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂", reply_markup=get_back_reply_keyboard())
        elif state == 'interests':
            users_data[user_id]['awaiting'] = 'metro'
            save_users_data(users_data)
            progress = get_profile_progress(users_data[user_id])

            # Показываем уже выбранные станции с эмодзи
            current_metro = users_data[user_id]['description'].get('metro_station', [])
            if current_metro:
                metro_with_emoji = []
                for station in current_metro:
                    emoji = get_metro_emoji(station)
                    metro_with_emoji.append(f"{emoji} {station}")
                metro_display = ', '.join(metro_with_emoji)
                message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇\n\nУже выбрано: {metro_display}"
            else:
                message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇"

            bot.send_message(message.chat.id, message_text, reply_markup=get_metro_keyboard(show_back=True))
        elif state == 'marital_status':
            users_data[user_id]['awaiting'] = 'interests'
            save_users_data(users_data)
            progress = get_profile_progress(users_data[user_id])
            bot.send_message(message.chat.id, f"{progress}Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard())
        elif state == 'sexual_orientation':
            users_data[user_id]['awaiting'] = 'marital_status'
            save_users_data(users_data)
            progress = get_profile_progress(users_data[user_id])
            bot.send_message(message.chat.id, f"{progress}Выбери семейное положение 💍:", reply_markup=get_marital_status_keyboard(show_back=True))
        elif state == 'telegram_channel':
            users_data[user_id]['awaiting'] = 'sexual_orientation'
            save_users_data(users_data)
            progress = get_profile_progress(users_data[user_id])
            bot.send_message(message.chat.id, f"{progress}Укажи свою сексуальную ориентацию 🌈:", reply_markup=get_sexual_orientation_keyboard(show_back=True))
        elif state == 'extra_info':
            users_data[user_id]['awaiting'] = 'telegram_channel'
            save_users_data(users_data)
            progress = get_profile_progress(users_data[user_id])
            bot.send_message(message.chat.id, f"{progress}Хочешь указать свой телеграм-канал? 📢", reply_markup=get_telegram_channel_keyboard(show_back=True))
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Нет предыдущего шага для возврата.", reply_markup=get_main_reply_keyboard())
    elif text in ["Гетеро 😊", "Би 🌈", "Гей/Лесби 🏳️‍🌈", "Другое ✍️"]:
        # Обработка выбора сексуальной ориентации через reply-кнопки
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'sexual_orientation':
            if text == "Другое ✍️":
                users_data[user_id]['awaiting'] = 'custom_orientation'
                save_users_data(users_data)
                from telebot.types import ReplyKeyboardRemove
                bot.send_message(message.chat.id, "Укажи свою ориентацию (например, 'Пансексуал') ✍️:", reply_markup=ReplyKeyboardRemove())
            else:
                orientation = text.split()[0]  # Убираем эмодзи
                users_data[user_id]['description']['sexual_orientation'] = orientation
                users_data[user_id]['awaiting'] = 'telegram_channel'
                save_users_data(users_data)

                progress = get_profile_progress(users_data[user_id])
                bot.send_message(message.chat.id, f"{progress}Хочешь указать свой телеграм-канал? 📢", reply_markup=get_telegram_channel_keyboard(show_back=True))
        elif state == 'edit_orientation':
            if text == "Другое ✍️":
                users_data[user_id]['awaiting'] = 'edit_custom_orientation'
                save_users_data(users_data)
                from telebot.types import ReplyKeyboardRemove
                bot.send_message(message.chat.id, "Укажи свою ориентацию (например, 'Пансексуал') ✍️:", reply_markup=ReplyKeyboardRemove())
            else:
                orientation = text.split()[0]  # Убираем эмодзи
                users_data[user_id]['description']['sexual_orientation'] = orientation
                users_data[user_id]['awaiting'] = None
                save_users_data(users_data)

                from telebot.types import ReplyKeyboardRemove
                bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nПрофиль обновлён!", reply_markup=get_profile_keyboard())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери ориентацию в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text == "Указать канал 📢":
        # Обработка reply-кнопки "Указать канал"
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'telegram_channel':
            users_data[user_id]['awaiting'] = 'custom_tg_channel'
            save_users_data(users_data)
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, "Введи свой телеграм-канал (можно ссылку, ник с @ или просто имя, например: @MyChannel, t.me/MyChannel, https://t.me/MyChannel или MyChannel) 📢:", reply_markup=ReplyKeyboardRemove())
        elif state == 'edit_tg_channel':
            users_data[user_id]['prev_awaiting'] = 'edit_tg_channel'
            users_data[user_id]['awaiting'] = 'custom_tg_channel'
            save_users_data(users_data)
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, "Введи новый телеграм-канал (можно ссылку, ник с @ или просто имя, например: @MyChannel, t.me/MyChannel, https://t.me/MyChannel или MyChannel) 📢:", reply_markup=ReplyKeyboardRemove())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери действие в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text == "Не указывать 🚫":
        # Обработка reply-кнопки "Не указывать"
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'telegram_channel':
            users_data[user_id]['description']['telegram_channel'] = None
            users_data[user_id]['awaiting'] = 'extra_info'
            save_users_data(users_data)
            progress = get_profile_progress(users_data[user_id])
            bot.send_message(message.chat.id, f"{progress}Хочешь добавить что-то ещё о себе? (до 2000 символов) 📝", reply_markup=get_extra_info_reply_keyboard(show_back=True))
        elif state == 'edit_tg_channel':
            users_data[user_id]['description']['telegram_channel'] = None
            users_data[user_id]['awaiting'] = None
            save_users_data(users_data)
            bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nПрофиль обновлён!", reply_markup=get_profile_keyboard())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери действие в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text == "Добавить":
        # Обработка reply-кнопки "Добавить"
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'extra_info':
            users_data[user_id]['awaiting'] = 'extra_info_input'
            save_users_data(users_data)
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, "Расскажи что-то ещё о себе (до 2000 символов) 📝:", reply_markup=ReplyKeyboardRemove())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери действие в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text == "Пропустить":
        # Обработка reply-кнопки "Пропустить"
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'extra_info':
            users_data[user_id]['description']['extra_info'] = ""
            users_data[user_id]['awaiting'] = None
            save_users_data(users_data)
            bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nСпасибо за информацию! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_main_reply_keyboard())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери действие в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text == "Изменить":
        # Обработка reply-кнопки "Изменить" для дополнительной информации
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'edit_extra_info':
            users_data[user_id]['awaiting'] = 'edit_extra_info_input'
            save_users_data(users_data)
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, "Расскажи что-то ещё о себе (до 2000 символов) 📝:", reply_markup=ReplyKeyboardRemove())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери действие в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text == "Удалить 🗑️":
        # Обработка reply-кнопки "Удалить" для дополнительной информации
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'edit_extra_info':
            users_data[user_id]['description']['extra_info'] = None
            users_data[user_id]['awaiting'] = None
            save_users_data(users_data)
            bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nДоп. информация удалена!", reply_markup=get_profile_keyboard())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери действие в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text in ["💔 Не женат", "💔 Не замужем", "💕 Встречаюсь", "💍 Помолвлен(а)", "💒 Женат", "💒 Замужем", "🤝 В гражданском браке", "😍 Влюблён", "🤷 Всё сложно", "🔍 В активном поиске"]:
        # Обработка выбора семейного положения через reply-кнопки
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state == 'marital_status':
            # Убираем эмодзи для сохранения в базе
            marital_status = text.split(' ', 1)[1]  # Убираем эмодзи в начале
            users_data[user_id]['description']['marital_status'] = marital_status
            users_data[user_id]['awaiting'] = 'sexual_orientation'
            save_users_data(users_data)

            progress = get_profile_progress(users_data[user_id])
            bot.send_message(message.chat.id, f"{progress}Укажи свою сексуальную ориентацию 🌈:", reply_markup=get_sexual_orientation_keyboard(show_back=True))
        elif state == 'edit_marital':
            # Убираем эмодзи для сохранения в базе
            marital_status = text.split(' ', 1)[1]  # Убираем эмодзи в начале
            users_data[user_id]['description']['marital_status'] = marital_status
            users_data[user_id]['awaiting'] = None
            save_users_data(users_data)

            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nПрофиль обновлён!", reply_markup=get_profile_keyboard())
        else:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери семейное положение в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
    elif text in ["Красная ветка 🟥", "Синяя ветка 🟦", "Зелёная ветка 🟩", "Оранжевая ветка 🟧", "Фиолетовая ветка 🟪", "Я из ЛО 🏡", "Я не в Питере 🌍", "Готово ✅"]:
        # Обработка выбора веток метро через reply-кнопки
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state not in ['metro', 'edit_metro']:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери ветку метро в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
            return

        # Ensure metro_station is always a list
        if 'metro_station' not in users_data[user_id]['description']:
            users_data[user_id]['description']['metro_station'] = []
        elif users_data[user_id]['description']['metro_station'] is None:
            users_data[user_id]['description']['metro_station'] = []
        elif not isinstance(users_data[user_id]['description']['metro_station'], list):
            current_value = users_data[user_id]['description']['metro_station']
            users_data[user_id]['description']['metro_station'] = [current_value] if current_value else []

        if text == "Красная ветка 🟥":
            users_data[user_id]['current_metro_line'] = 'red'
            save_users_data(users_data)
            markup = get_red_line_keyboard(selected=users_data[user_id]['description'].get('metro_station', []))
            # Показываем уже выбранные станции с эмодзи веток
            current_selected = []
            for station in users_data[user_id]['description'].get('metro_station', []):
                if not station.startswith('ЛО:') and station != 'Я не в Питере':
                    emoji = get_metro_emoji(station)
                    current_selected.append(f"{emoji} {station}")
            selected_text = f"\n\nУже выбрано: {', '.join(current_selected)}" if current_selected else ""
            bot.send_message(message.chat.id, f"Выбери станции на Красной ветке (можно несколько, затем 'Готово ✅'):{selected_text}", reply_markup=markup)
        elif text == "Синяя ветка 🟦":
            users_data[user_id]['current_metro_line'] = 'blue'
            save_users_data(users_data)
            markup = get_blue_line_keyboard(selected=users_data[user_id]['description'].get('metro_station', []))
            # Показываем уже выбранные станции с эмодзи веток
            current_selected = []
            for station in users_data[user_id]['description'].get('metro_station', []):
                if not station.startswith('ЛО:') and station != 'Я не в Питере':
                    emoji = get_metro_emoji(station)
                    current_selected.append(f"{emoji} {station}")
            selected_text = f"\n\nУже выбрано: {', '.join(current_selected)}" if current_selected else ""
            bot.send_message(message.chat.id, f"Выбери станции на Синей ветке (можно несколько, затем 'Готово ✅'):{selected_text}", reply_markup=markup)
        elif text == "Зелёная ветка 🟩":
            users_data[user_id]['current_metro_line'] = 'green'
            save_users_data(users_data)
            markup = get_green_line_keyboard(selected=users_data[user_id]['description'].get('metro_station', []))
            # Показываем уже выбранные станции с эмодзи веток
            current_selected = []
            for station in users_data[user_id]['description'].get('metro_station', []):
                if not station.startswith('ЛО:') and station != 'Я не в Питере':
                    emoji = get_metro_emoji(station)
                    current_selected.append(f"{emoji} {station}")
            selected_text = f"\n\nУже выбрано: {', '.join(current_selected)}" if current_selected else ""
            bot.send_message(message.chat.id, f"Выбери станции на Зелёной ветке (можно несколько, затем 'Готово ✅'):{selected_text}", reply_markup=markup)
        elif text == "Оранжевая ветка 🟧":
            users_data[user_id]['current_metro_line'] = 'orange'
            save_users_data(users_data)
            markup = get_orange_line_keyboard(selected=users_data[user_id]['description'].get('metro_station', []))
            # Показываем уже выбранные станции с эмодзи веток
            current_selected = []
            for station in users_data[user_id]['description'].get('metro_station', []):
                if not station.startswith('ЛО:') and station != 'Я не в Питере':
                    emoji = get_metro_emoji(station)
                    current_selected.append(f"{emoji} {station}")
            selected_text = f"\n\nУже выбрано: {', '.join(current_selected)}" if current_selected else ""
            bot.send_message(message.chat.id, f"Выбери станции на Оранжевой ветке (можно несколько, затем 'Готово ✅'):{selected_text}", reply_markup=markup)
        elif text == "Фиолетовая ветка 🟪":
            users_data[user_id]['current_metro_line'] = 'purple'
            save_users_data(users_data)
            markup = get_purple_line_keyboard(selected=users_data[user_id]['description'].get('metro_station', []))
            # Показываем уже выбранные станции с эмодзи веток
            current_selected = []
            for station in users_data[user_id]['description'].get('metro_station', []):
                if not station.startswith('ЛО:') and station != 'Я не в Питере':
                    emoji = get_metro_emoji(station)
                    current_selected.append(f"{emoji} {station}")
            selected_text = f"\n\nУже выбрано: {', '.join(current_selected)}" if current_selected else ""
            bot.send_message(message.chat.id, f"Выбери станции на Фиолетовой ветке (можно несколько, затем 'Готово ✅'):{selected_text}", reply_markup=markup)
        elif text == "Я из ЛО 🏡":
            users_data[user_id].pop('current_metro_line', None)
            save_users_data(users_data)
            markup = get_lo_cities_keyboard(selected=users_data[user_id]['description'].get('metro_station', []))
            # Показываем уже выбранные города ЛО с эмодзи
            current_selected = []
            for station in users_data[user_id]['description'].get('metro_station', []):
                if station.startswith('ЛО:'):
                    emoji = get_metro_emoji(station)
                    current_selected.append(f"{emoji} {station}")
            selected_text = f"\n\nУже выбрано: {', '.join(current_selected)}" if current_selected else ""
            bot.send_message(message.chat.id, f"Выбери города ЛО (можно несколько, затем 'Готово ✅'):{selected_text}", reply_markup=markup)
        elif text == "Я не в Питере 🌍":
            # Очищаем все предыдущие выборы станций и устанавливаем только "Я не в Питере"
            users_data[user_id]['description']['metro_station'] = ["Я не в Питере"]
            users_data[user_id].pop('current_metro_line', None)

            if state == 'edit_metro':
                users_data[user_id]['awaiting'] = None
                save_users_data(users_data)
                bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nПрофиль обновлён!", reply_markup=get_profile_keyboard())
            else:
                users_data[user_id]['awaiting'] = 'interests'
                save_users_data(users_data)
                progress = get_profile_progress(users_data[user_id])
                bot.send_message(message.chat.id, f"{progress}Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard())
        elif text == "Готово ✅":
            current_metro = users_data[user_id]['description'].get('metro_station', [])
            if not current_metro:
                bot.reply_to(message, "Выбери хотя бы одну станцию или город! 😊")
                return

            users_data[user_id].pop('current_metro_line', None)

            if state == 'edit_metro':
                users_data[user_id]['awaiting'] = None
                save_users_data(users_data)
                bot.send_message(message.chat.id, f"{format_profile(users_data[user_id])}\nПрофиль обновлён!", reply_markup=get_profile_keyboard())
            else:
                users_data[user_id]['awaiting'] = 'interests'
                save_users_data(users_data)
                progress = get_profile_progress(users_data[user_id])
                bot.send_message(message.chat.id, f"{progress}Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard())
    elif text in ["Пол 👨👩", "Имя ✏️", "Возраст 🎂", "Станция метро 🚇", "Интересы 🎉", "Семейное положение 💍", "Сексуальная ориентация 🌈", "Телеграм-канал 📢", "Доп. информация 📝", "Заполнить профиль заново 🔄"]:
        # Обработка reply-кнопок редактирования профиля
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        # Проверяем, что пользователь в режиме редактирования
        state = users_data[user_id].get('awaiting')
        if state != 'edit_select':
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Используй эти кнопки только при редактировании профиля!", reply_markup=get_main_reply_keyboard())
            return

        if text == "Пол 👨👩":
            users_data[user_id]['awaiting'] = 'edit_gender'
            save_users_data(users_data)
            bot.send_message(message.chat.id, "Укажи новый пол: 👨👩", reply_markup=get_gender_keyboard())
        elif text == "Имя ✏️":
            users_data[user_id]['awaiting'] = 'edit_name'
            save_users_data(users_data)
            current_name = users_data[user_id]['description'].get('name', 'Не указано')
            from telebot.types import ReplyKeyboardMarkup, KeyboardButton
            reply_markup = ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
            reply_markup.add(KeyboardButton("К профилю ↩️"))
            bot.send_message(message.chat.id, f"Введи новое имя ✏️:\n\nТекущее имя: {current_name}", reply_markup=reply_markup)
        elif text == "Возраст 🎂":
            users_data[user_id]['awaiting'] = 'edit_age'
            save_users_data(users_data)
            current_age = users_data[user_id]['description'].get('age', 'Не указано')
            from telebot.types import ReplyKeyboardMarkup, KeyboardButton
            reply_markup = ReplyKeyboardMarkup(row_width=1, resize_keyboard=True, one_time_keyboard=True)
            reply_markup.add(KeyboardButton("К профилю ↩️"))
            bot.send_message(message.chat.id, f"Сколько тебе лет? (Введи число, например, 25) 🎂\n\nТекущий возраст: {current_age}", reply_markup=reply_markup)
        elif text == "Станция метро 🚇":
            users_data[user_id]['awaiting'] = 'edit_metro'
            save_users_data(users_data)
            current_metro = users_data[user_id]['description'].get('metro_station', [])
            if isinstance(current_metro, list):
                metro_display = ', '.join(current_metro) if current_metro else 'Не указано'
            else:
                metro_display = current_metro if current_metro else 'Не указано'
            bot.send_message(message.chat.id, f"Выбери новую станцию метро 🚇:\n\nТекущие станции: {metro_display}", reply_markup=get_metro_keyboard())
        elif text == "Интересы 🎉":
            users_data[user_id]['awaiting'] = 'edit_interests'
            save_users_data(users_data)
            current_interests = users_data[user_id]['description'].get('interests', [])
            interests_display = ', '.join(current_interests) if current_interests else 'Не указано'
            from telebot.types import ReplyKeyboardRemove
            bot.send_message(message.chat.id, f"Выбери новые интересы (можно несколько, затем нажми 'Готово') 🎉:\n\nТекущие интересы: {interests_display}", reply_markup=ReplyKeyboardRemove())
            bot.send_message(message.chat.id, "Выбери категории интересов:", reply_markup=get_interests_keyboard(selected=current_interests))
        elif text == "Семейное положение 💍":
            users_data[user_id]['awaiting'] = 'edit_marital'
            save_users_data(users_data)
            current_marital = users_data[user_id]['description'].get('marital_status', 'Не указано')
            from telebot.types import ReplyKeyboardMarkup, KeyboardButton
            markup = ReplyKeyboardMarkup(row_width=3, resize_keyboard=True, one_time_keyboard=True)
            markup.add(
                KeyboardButton("💔 Не женат"),
                KeyboardButton("💔 Не замужем"),
                KeyboardButton("💕 Встречаюсь")
            )
            markup.add(
                KeyboardButton("💍 Помолвлен(а)"),
                KeyboardButton("💒 Женат"),
                KeyboardButton("💒 Замужем")
            )
            markup.add(
                KeyboardButton("🤝 В гражданском браке"),
                KeyboardButton("😍 Влюблён"),
                KeyboardButton("🤷 Всё сложно")
            )
            markup.add(
                KeyboardButton("🔍 В активном поиске")
            )
            markup.add(KeyboardButton("К профилю ↩️"))
            bot.send_message(message.chat.id, f"Выбери новое семейное положение 💍:\n\nТекущее семейное положение: {current_marital}", reply_markup=markup)
        elif text == "Сексуальная ориентация 🌈":
            users_data[user_id]['awaiting'] = 'edit_orientation'
            save_users_data(users_data)
            current_orientation = users_data[user_id]['description'].get('sexual_orientation', 'Не указано')
            from telebot.types import ReplyKeyboardMarkup, KeyboardButton
            markup = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True, one_time_keyboard=True)
            orientations = [
                "Гетеро 😊",
                "Би 🌈",
                "Гей/Лесби 🏳️‍🌈",
                "Другое ✍️"
            ]
            for text_option in orientations:
                markup.add(KeyboardButton(text_option))
            markup.add(KeyboardButton("К профилю ↩️"))
            bot.send_message(message.chat.id, f"Укажи новую сексуальную ориентацию 🌈:\n\nТекущая ориентация: {current_orientation}", reply_markup=markup)
        elif text == "Телеграм-канал 📢":
            users_data[user_id]['awaiting'] = 'edit_tg_channel'
            save_users_data(users_data)
            current_channel = users_data[user_id]['description'].get('telegram_channel', 'Не указано')
            bot.send_message(message.chat.id, f"Хочешь указать новый телеграм-канал? 📢\n\nТекущий канал: {current_channel}", reply_markup=get_telegram_channel_keyboard())
        elif text == "Доп. информация 📝":
            users_data[user_id]['awaiting'] = 'edit_extra_info'
            save_users_data(users_data)
            current_extra = users_data[user_id]['description'].get('extra_info', 'Не указано')
            if not current_extra or current_extra == "":
                current_extra = 'Не указано'
            bot.send_message(message.chat.id, f"Хочешь изменить доп. информацию? (до 2000 символов) 📝\n\nТекущая доп. информация: {current_extra}", reply_markup=get_extra_info_keyboard(edit=True))
        elif text == "Заполнить профиль заново 🔄":
            # Сохраняем предыдущее имя и возраст для удобства пользователя
            previous_name = users_data[user_id]['description'].get('name')
            previous_age = users_data[user_id]['description'].get('age')
            users_data[user_id]['description'] = {
                'gender': None,
                'name': None,
                'age': None,
                'metro_station': None,
                'interests': [],
                'marital_status': None,
                'sexual_orientation': None,
                'telegram_channel': None,
                'extra_info': None
            }
            users_data[user_id]['previous_name'] = previous_name  # Сохраняем для дальнейшего использования
            users_data[user_id]['previous_age'] = previous_age  # Сохраняем для дальнейшего использования
            users_data[user_id]['awaiting'] = 'gender'
            save_users_data(users_data)
            bot.send_message(message.chat.id, "Укажи свой пол: 👨👩", reply_markup=get_gender_keyboard())
    # Обработка станций метро и городов ЛО
    elif message.text and (message.text.startswith(("🟥", "🟦", "🟩", "🟧", "🟪", "🏡"))):
        if user_id not in users_data:
            bot.reply_to(message, "Пожалуйста, начни с /start. 😎", reply_markup=ReplyKeyboardRemove())
            return

        state = users_data[user_id].get('awaiting')
        if state not in ['metro', 'edit_metro']:
            from telebot.types import ReplyKeyboardRemove
            bot.reply_to(message, "Выбери станцию в соответствующем разделе анкеты.", reply_markup=ReplyKeyboardRemove())
            return

        # Извлекаем название станции/города из текста (убираем эмодзи и галочку)
        if message.text.startswith("🏡"):
            # Для городов ЛО
            city_name = message.text.replace("🏡 ", "").replace(" ✅", "")
            if city_name == "Другое ✍️":
                users_data[user_id].pop('current_metro_line', None)
                if state == 'edit_metro':
                    users_data[user_id]['awaiting'] = 'edit_custom_lo'
                else:
                    users_data[user_id]['awaiting'] = 'custom_lo'
                save_users_data(users_data)
                from telebot.types import ReplyKeyboardRemove
                bot.send_message(message.chat.id, "Укажи свой город в Ленинградской области (например, 'Мурино') ✍️:", reply_markup=ReplyKeyboardRemove())
                return

            station_name = f"ЛО: {city_name}"
        else:
            # Для станций метро
            station_name = message.text.split(" ", 1)[1].replace(" ✅", "")  # Убираем эмодзи и галочку

        # Инициализируем список станций метро, если его нет
        if 'metro_station' not in users_data[user_id]['description'] or not isinstance(users_data[user_id]['description']['metro_station'], list):
            users_data[user_id]['description']['metro_station'] = []

        # При выборе реальной станции метро или города ЛО убираем "Я не в Питере"
        if "Я не в Питере" in users_data[user_id]['description']['metro_station']:
            users_data[user_id]['description']['metro_station'].remove("Я не в Питере")

        # Переключаем выбор станции
        if station_name in users_data[user_id]['description']['metro_station']:
            users_data[user_id]['description']['metro_station'].remove(station_name)
        else:
            users_data[user_id]['description']['metro_station'].append(station_name)

        save_users_data(users_data)

        # Обновляем клавиатуру с учетом изменений
        line = users_data[user_id].get('current_metro_line')
        if line == 'red':
            markup = get_red_line_keyboard(selected=users_data[user_id]['description']['metro_station'])
            message_text = "Выбери станции на Красной ветке (можно несколько, затем 'Готово ✅'):"
        elif line == 'blue':
            markup = get_blue_line_keyboard(selected=users_data[user_id]['description']['metro_station'])
            message_text = "Выбери станции на Синей ветке (можно несколько, затем 'Готово ✅'):"
        elif line == 'green':
            markup = get_green_line_keyboard(selected=users_data[user_id]['description']['metro_station'])
            message_text = "Выбери станции на Зелёной ветке (можно несколько, затем 'Готово ✅'):"
        elif line == 'orange':
            markup = get_orange_line_keyboard(selected=users_data[user_id]['description']['metro_station'])
            message_text = "Выбери станции на Оранжевой ветке (можно несколько, затем 'Готово ✅'):"
        elif line == 'purple':
            markup = get_purple_line_keyboard(selected=users_data[user_id]['description']['metro_station'])
            message_text = "Выбери станции на Фиолетовой ветке (можно несколько, затем 'Готово ✅'):"
        else:
            # Если мы в городах ЛО
            markup = get_lo_cities_keyboard(selected=users_data[user_id]['description']['metro_station'])
            message_text = "Выбери города ЛО (можно несколько, затем 'Готово ✅'):"

        # Отправляем новое сообщение с обновленной клавиатурой
        try:
            bot.send_message(message.chat.id, message_text, reply_markup=markup)
        except Exception as e:
            logging.error(f"Ошибка при отправке обновленной клавиатуры метро: {e}")
            # Если не удалось отправить, просто показываем что станция выбрана
            selected_count = len(users_data[user_id]['description']['metro_station'])
            bot.reply_to(message, f"Станция {'добавлена' if station_name in users_data[user_id]['description']['metro_station'] else 'убрана'}! Выбрано: {selected_count}")

# Обработчик текстовых сообщений
@bot.message_handler(content_types=['text'], func=lambda message: message.text and not message.text.startswith('/'))
def handle_text(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name
    text = message.text.strip() if message.text else ""

    # Проверяем, не является ли это reply-кнопкой, которая должна обрабатываться отдельно
    reply_buttons = ["👤 Профиль", "🔗 Ссылка на чат", "📝 Редактировать профиль", "✏️ Редактировать профиль", 
                    "Да 😎", "Нет 🙅", "Да", "Нет", "Мужчина 👨", "Женщина 👩", "Назад ⬅️", "К профилю ↩️",
                    "Гетеро 😊", "Би 🌈", "Гей/Лесби 🏳️‍🌈", "Другое ✍️", "Указать канал 📢", "Не указывать 🚫",
                    "Добавить", "Пропустить", "💔 Не женат", "💔 Не замужем", "💕 Встречаюсь", "💍 Помолвлен(а)",
                    "💒 Женат", "💒 Замужем", "🤝 В гражданском браке", "😍 Влюблён", "🤷 Всё сложно",
                    "🔍 В активном поиске", "Пол 👨👩", "Имя ✏️", "Возраст 🎂", "Станция метро 🚇",
                    "Интересы 🎉", "Семейное положение 💍", "Сексуальная ориентация 🌈", "Телеграм-канал 📢",
                    "Доп. информация 📝", "Заполнить профиль заново 🔄"]

    if text in reply_buttons:
        # Это reply-кнопка, не обрабатываем здесь
        return

    logging.info(f"TEXT_MESSAGE: Пользователь {user_id} (@{username}) отправил сообщение: '{text[:100]}{'...' if len(text) > 100 else ''}'")

    # --- Новое: разрешаем обработку источника в группах ---
    if user_id not in users_data:
        users_data[user_id] = {
            'id': user_id,
            'username': username,
            'source': None,
            'timestamp': None,
            'wants_link': False,
            'description': {
                'gender': None,
                'name': None,
                'age': None,
                'metro_station': None,
                'interests': [],
                'marital_status': None,
                'sexual_orientation': None,
                'telegram_channel': None,
                'extra_info': None
            },
            'awaiting': 'source'
        }
        save_users_data(users_data)

    state = users_data[user_id].get('awaiting')

    # --- Изменено: всегда спрашиваем про чат после источника ---
    if state == 'source':
        logging.info(f"USER_SOURCE: Пользователь {user_id} указал источник: '{text}'")
        users_data[user_id]['source'] = text
        users_data[user_id]['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        users_data[user_id]['awaiting'] = 'join_request'
        save_users_data(users_data)
        logging.info(f"STATE_CHANGE: Пользователь {user_id} переведен в состояние 'join_request'")
        bot.send_message(message.chat.id, "Спасибо! Хочешь присоединиться к нашему чату? 🚀", reply_markup=get_join_request_keyboard())
        return

    if user_id not in users_data:
        bot.reply_to(message, "Пожалуйста, начни с /start. 😎")
        return

    if text.lower() == 'редактировать профиль':
        bot.reply_to(message, "Нажми кнопку [Редактировать профиль] в сообщении с твоим профилем. ✏️")
        return

    if len(text) > 2000:
        bot.reply_to(message, "Слишком длинное сообщение! Максимум 2000 символов. 😅")
        return

    user = users_data[user_id]

    try:
        if state == 'name':
            # Разрешаем буквы ё, Ё, дефис и пробелы
            if not re.match(r'^[А-Яа-яЁёA-Za-z\-\s]+$', text):
                logging.info(f"USER_ERROR: {user_id} ввел неправильное имя: '{text}'")
                bot.reply_to(message, "Имя должно содержать только буквы, пробелы или дефис! ✏️")
                return
            if len(text) > 50:
                logging.info(f"USER_ERROR: {user_id} ввел слишком длинное имя: '{text}' (длина: {len(text)})")
                bot.reply_to(message, "Имя слишком длинное! Максимум 50 символов. 😅")
                return
            user['description']['name'] = text
            user['awaiting'] = 'age'
            # Очищаем предыдущее имя после использования
            user.pop('previous_name', None)
            save_users_data(users_data)
            logging.info(f"USER_PROFILE: {user_id} указал имя: '{text}'")
            progress = get_profile_progress(user)
            
            # Проверяем, есть ли предыдущий возраст (при заполнении профиля заново)
            previous_age = user.get('previous_age')
            if previous_age:
                bot.send_message(message.chat.id, f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂\n\nМожешь выбрать предыдущий возраст или ввести новый:", reply_markup=get_age_keyboard(previous_age, show_back=True))
            else:
                bot.send_message(message.chat.id, f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂", reply_markup=get_back_reply_keyboard())

        elif state == 'age':
            try:
                if text == "-":
                    user['description']['age'] = None
                    user['awaiting'] = 'metro'
                    save_users_data(users_data)
                    logging.info(f"USER_PROFILE: {user_id} не указал возраст")
                    progress = get_profile_progress(user)
                    bot.reply_to(message, f"{progress}На какой станции метро ты обычно бываешь? 🚇", reply_markup=get_metro_keyboard(show_back=True))
                else:
                    age = int(text)
                    if 16 <= age <= 100:
                        user['description']['age'] = age
                        user['awaiting'] = 'metro'
                        # Очищаем предыдущий возраст после использования
                        user.pop('previous_age', None)
                        save_users_data(users_data)
                        logging.info(f"USER_PROFILE: {user_id} указал возраст: {age}")
                        progress = get_profile_progress(user)
                        bot.send_message(message.chat.id, f"{progress}На какой станции метро ты обычно бываешь? 🚇", reply_markup=get_metro_keyboard(show_back=True))
                    else:
                        logging.info(f"USER_ERROR: {user_id} ввел неправильный возраст: {age}")
                        bot.reply_to(message, "Возраст должен быть от 16 до 100 лет! 😊")
            except ValueError:
                logging.info(f"USER_ERROR: {user_id} ввел нечисловой возраст: '{text}'")
                bot.reply_to(message, "Пожалуйста, введи число (например, 25). 😅")

        elif state == 'custom_interest':
            if len(text) > 200:
                bot.reply_to(message, "Интерес слишком длинный! Максимум 200 символов. 😅")
                return
            user['description']['interests'].append(text)
            user['awaiting'] = 'interests'
            save_users_data(users_data)
            bot.reply_to(message, "Круто! Можешь выбрать ещё интересы или нажать 'Готово' ✅:", reply_markup=get_interests_keyboard())

        elif state == 'custom_lo':
            if len(text) > 50:
                bot.reply_to(message, "Название города слишком длинное! Максимум 50 символов. 😅")
                return
            if not re.match(r'^[А-Яа-яA-Za-z\s-]+$', text):
                bot.reply_to(message, "Название города должно содержать только буквы, пробелы или дефис! ✏️")
                return
            # --- Исправление: сохраняем как список ---
            user['description']['metro_station'] = [f"ЛО: {text}"]
            # --- конец исправления ---
            user['awaiting'] = 'interests'
            save_users_data(users_data)
            progress = get_profile_progress(user)
            bot.reply_to(message, f"{progress}Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard())

        elif state == 'edit_custom_lo':
            if len(text) > 50:
                bot.reply_to(message, "Название города слишком длинное! Максимум 50 символов. 😅")
                return
            if not re.match(r'^[А-Яа-яA-Za-z\s-]+$', text):
                bot.reply_to(message, "Название города должно содержать только буквы, пробелы или дефис! ✏️")
                return
            # --- Исправление: сохраняем как список ---
            user['description']['metro_station'] = [f"ЛО: {text}"]
            # --- конец исправления ---
            user['awaiting'] = None
            save_users_data(users_data)
            bot.reply_to(message, f"{format_profile(user)}\nПрофиль обновлён! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_profile_keyboard())

        elif state == 'custom_orientation':
            if len(text) > 50:
                bot.reply_to(message, "Ориентация слишком длинная! Максимум 50 символов. 😅")
                return
            user['description']['sexual_orientation'] = text
            user['awaiting'] = 'telegram_channel'
            save_users_data(users_data)
            bot.reply_to(message, "Хочешь указать свой телеграм-канал? 📢", reply_markup=get_telegram_channel_keyboard())

        elif state == 'edit_custom_orientation':
            if len(text) > 50:
                bot.reply_to(message, "Ориентация слишком длинная! Максимум 50 символов. 😅")
                return
            user['description']['sexual_orientation'] = text
            user['awaiting'] = None
            save_users_data(users_data)
            bot.reply_to(message, f"{format_profile(user)}\nПрофиль обновлён! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_profile_keyboard())

        elif state == 'custom_tg_channel':
            # Расширенная обработка Telegram-канала
            channel = text.strip()
            if not channel:
                current_channel = user['description'].get('telegram_channel', 'Не указано')
                bot.reply_to(message, f"Пожалуйста, введи название канала (например, @MyChannel, ссылку или ник)! 📢\n\nТекущий канал: {current_channel}")
                return
            # Приведение к формату @username
            if channel.startswith('https://t.me/'):
                channel = channel.replace('https://t.me/', '')
            elif channel.startswith('t.me/'):
                channel = channel.replace('t.me/', '')
            if channel.startswith('@'):
                channel = channel[1:]
            # Проверка допустимых символов
            if not re.match(r'^[A-Za-zА-Яа-яЁё0-9_]+$', channel):
                current_channel = user['description'].get('telegram_channel', 'Не указано')
                bot.reply_to(message, f"Канал должен содержать только буквы, цифры или подчеркивания! 📢\n\nТекущий канал: {current_channel}")
                return
            if len(channel) > 50:
                current_channel = user['description'].get('telegram_channel', 'Не указано')
                bot.reply_to(message, f"Название канала слишком длинное! Максимум 50 символов. 😅\n\nТекущий канал: {current_channel}")
                return
            user['description']['telegram_channel'] = f"@{channel}"
            # Проверяем, редактируем ли мы канал
            if user.get('prev_awaiting') == 'edit_tg_channel':
                user['awaiting'] = None
                user['prev_awaiting'] = None
                save_users_data(users_data)
                bot.reply_to(message, f"{format_profile(user)}\nПрофиль обновлён! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_profile_keyboard())
            else:
                user['awaiting'] = 'extra_info'
                save_users_data(users_data)
                bot.reply_to(message, "Телеграм-канал сохранён! Хочешь добавить что-то ещё о себе? (до 2000 символов) 📝", reply_markup=get_extra_info_reply_keyboard(show_back=True))
        elif state == 'extra_info_input':
            # Обработка ввода дополнительной информации
            if not text or text.strip() == '-':
                user['description']['extra_info'] = None
            else:
                user['description']['extra_info'] = text
            user['awaiting'] = None
            save_users_data(users_data)
            bot.reply_to(message, f"{format_profile(user)}\nСпасибо за информацию! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_main_reply_keyboard())

        # --- ДОБАВЛЕНО: обработка изменения дополнительной информации ---
        elif state == 'edit_extra_info_input':
            if not text or text.strip() == '-':
                user['description']['extra_info'] = None
            else:
                user['description']['extra_info'] = text
            user['awaiting'] = None
            save_users_data(users_data)
            bot.reply_to(message, f"{format_profile(user)}\nДоп. информация обновлена!", reply_markup=get_profile_keyboard())
        # --- КОНЕЦ ДОБАВЛЕНИЯ ---

        elif state and state.startswith('edit_'):
            field = state.split('_')[1]
            if field == 'gender':
                bot.reply_to(message, "Укажи новый пол: 👨👩", reply_markup=get_gender_keyboard())
            elif field == 'name':
                if not re.match(r'^[А-Яа-яЁёA-Za-z\-\s]+$', text):
                    current_name = user['description'].get('name', 'Не указано')
                    logging.info(f"USER_ERROR: {user_id} ввел неправильное имя: '{text}'")
                    bot.reply_to(message, f"Имя должно содержать только буквы, пробелы или дефис! ✏️\n\nТекущее имя: {current_name}")
                    return
                if len(text) > 50:
                    current_name = user['description'].get('name', 'Не указано')
                    logging.info(f"USER_ERROR: {user_id} ввел слишком длинное имя: '{text}' (длина: {len(text)})")
                    bot.reply_to(message, f"Имя слишком длинное! Максимум 50 символов. 😅\n\nТекущее имя: {current_name}")
                    return
                user['description']['name'] = text
                user['awaiting'] = None
                save_users_data(users_data)
                bot.reply_to(message, f"{format_profile(user)}\nПрофиль обновлён! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_profile_keyboard())
            elif field == 'age':
                try:
                    age = int(text)
                    if 16 <= age <= 100:
                        user['description']['age'] = age
                        user['awaiting'] = None
                        save_users_data(users_data)
                        bot.reply_to(message, f"{format_profile(user)}\nПрофиль обновлён! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_profile_keyboard())
                    else:
                        current_age = user['description'].get('age', 'Не указано')
                        bot.reply_to(message, f"Возраст должен быть от 16 до 100 лет! 😊\n\nТекущий возраст: {current_age}")
                except ValueError:
                    current_age = user['description'].get('age', 'Не указано')
                    bot.reply_to(message, f"Пожалуйста, введи число (например, 25). 😅\n\nТекущий возраст: {current_age}")
            else:
                # Не показываем сообщение об ошибке для кнопки "К профилю ↩️" и других системных сообщений
                if text not in ["К профилю ↩️", "Назад ⬅️"]:
                    current_field = field.replace('_', ' ').title()
                    bot.reply_to(message, f"Используй кнопки для изменения поля '{current_field}'! 😊")

        elif state and state.startswith('interests:'):
            category = state.split(':', 1)[1]
            progress = get_profile_progress(users_data[user_id])
            bot.reply_to(message, f"{progress}Выбери интересы в категории: {category} (можно несколько, затем 'Готово') 🎉:", reply_markup=get_interests_keyboard(selected=users_data[user_id]['description']['interests'], category=category))
        elif state == 'edit_interests':
            bot.reply_to(message, "Выбери новые интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard(selected=users_data[user_id]['description']['interests']))
        elif state and state.startswith('edit_interests:'):
            category = state.split(':', 1)[1]
            bot.reply_to(message, "Выбери интересы в категории: {category} (можно несколько, затем 'Готово') 🎉:", reply_markup=get_interests_keyboard(selected=users_data[user_id]['description']['interests'], category=category))
        else:
            # Если состояние None или неизвестно, ничего не делаем
            pass
    except Exception as e:
        logging.error(f"Ошибка в handle_text для пользователя {user_id}: {str(e)}")
        bot.reply_to(message, "Произошла ошибка. Попробуй ещё раз! 😅")



# Обработчик команды /profile
@bot.message_handler(commands=['profile', 'profile@VProgulkeBot'])
def show_profile(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name
    chat_type = 'group' if message.chat.type in ['group', 'supergroup'] else 'private'
    is_group_chat = message.chat.type in ['group', 'supergroup']

    logging.info(f"ACTION: Пользователь {user_id} (@{username}) запросил профиль")

    # Логируем активность
    log_user_activity(user_id, username, 'Команда /profile', chat_type)

    # Проверяем, отвечает ли пользователь на чужое сообщение (работает как "профиль @username")
    if message.reply_to_message and message.reply_to_message.from_user:
        replied_user_id = str(message.reply_to_message.from_user.id)
        replied_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name
        replied_is_bot = message.reply_to_message.from_user.is_bot

        logging.info(f"PROFILE_REPLY: Пользователь {user_id} запросил профиль в ответ на сообщение пользователя {replied_user_id} (@{replied_username})")

        # Проверяем, является ли пользователь ботом
        if replied_is_bot:
            bot_profile = format_bot_profile(replied_username)
            if bot_profile:
                bot.reply_to(message, bot_profile)
                logging.info(f"BOT_PROFILE_SHOWN: Пользователь {user_id} просмотрел профиль бота @{replied_username}")
            else:
                bot.reply_to(message, f"🤖 Профиль бота @{replied_username} не найден в базе данных")
            return

        # Ищем профиль пользователя, на сообщение которого отвечают
        if replied_user_id not in users_data:
            bot.reply_to(message, f"Пользователь @{replied_username} не найден в базе данных ᴠᴨᴩᴏᴦʏᴧᴋᴇ 😔")
            return

        if not is_description_complete(users_data[replied_user_id]):
            bot.reply_to(message, f"У пользователя @{replied_username} профиль не заполнен 📝")
            return

        # Отправляем профиль пользователя, на сообщение которого отвечают
        try:
            profile_text = format_profile(users_data[replied_user_id], is_own_profile=False)
            bot.reply_to(message, profile_text, parse_mode='Markdown')
            logging.info(f"PROFILE_SHOWN: Пользователь {user_id} просмотрел профиль @{replied_username} через reply команду /profile в {'группе' if is_group_chat else 'ЛС'}")
        except Exception as e:
            logging.error(f"Ошибка в show_profile для пользователя {user_id}: {str(e)}")
            bot.reply_to(message, "Произошла ошибка при отображении профиля. Попробуй ещё раз! 😅")
        return

    # Если это не ответ на сообщение, показываем свой профиль
    if user_id not in users_data:
        logging.warning(f"PROFILE_ERROR: Пользователь {user_id} не найден в базе данных")
        bot.reply_to(message, "Пожалуйста, начни с /start. 😎")
        return

    if not is_description_complete(users_data[user_id]):
        bot.reply_to(message, "Сначала заполни свой профиль через /start! 📝")
        return

    try:
        logging.info(f"PROFILE_DISPLAY: Отображение профиля пользователя {user_id}")

        if is_group_chat:
            # В группе не показываем кнопку редактирования
            bot.reply_to(message, f"{format_profile(users_data[user_id])}")
        else:
            # В ЛС показываем кнопку редактирования
            bot.reply_to(message, f"{format_profile(users_data[user_id])}", reply_markup=get_profile_keyboard())
    except Exception as e:
        logging.error(f"Ошибка в show_profile для пользователя {user_id}: {str(e)}")
        bot.reply_to(message, "Произошла ошибка при отображении профиля. Попробуй ещё раз! 😅")

# Обработчик inline-кнопок
@bot.callback_query_handler(func=lambda call: True)
def handle_callback(call):
    user_id = str(call.from_user.id)
    username = call.from_user.username or call.from_user.first_name

    # Сразу отвечаем на callback, чтобы убрать "часики" у пользователя
    bot.answer_callback_query(call.id)

    logging.info(f"CALLBACK: Пользователь {user_id} (@{username}) нажал кнопку: '{call.data}'")

    if user_id in users_data:
        current_state = users_data[user_id].get('awaiting', 'None')
        logging.info(f"USER_STATE: Пользователь {user_id} находится в состоянии '{current_state}' при нажатии кнопки '{call.data}'")

    # --- Автоматическое преобразование metro_station в список для старых пользователей ---
    if user_id in users_data:
        user = users_data[user_id]
        metro = user['description'].get('metro_station')
        data_changed = False

        # Преобразуем строку в список
        if isinstance(metro, str):
            if metro:
                user['description']['metro_station'] = [metro]
            else:
                user['description']['metro_station'] = []
            data_changed = True

        # Очищаем некорректные данные метро
        if clean_metro_data(user):
            data_changed = True

        if data_changed:
            save_users_data(users_data)

    # Проверка, что кнопка нажата тем же пользователем (если reply_to_message есть)
    if getattr(call.message, 'reply_to_message', None) is not None:
        if str(call.message.reply_to_message.from_user.id) != user_id:
            logging.warning(f"SECURITY: Пользователь {user_id} пытался нажать кнопку другого пользователя")
            bot.answer_callback_query(call.id, "Эта кнопка не для тебя!🙂 ")
            return

    if user_id not in users_data:
        logging.warning(f"USER_NOT_FOUND: Пользователь {user_id} не найден в базе данных")
        bot.answer_callback_query(call.id, "Начни с /start! 😎")
        return

    user = users_data[user_id]
    data = call.data

    try:
        # Обработка админских кнопок в первую очередь
        if data == "admin_stats":
            if call.from_user.id != ADMIN_ID:
                bot.answer_callback_query(call.id, "Только для админа! 😎")
                return
            show_stats(call.message)
            bot.answer_callback_query(call.id)
            return

        elif data == "list_users":
            if call.from_user.id != ADMIN_ID:
                bot.answer_callback_query(call.id, "Только для админа! 😎")
                return
            list_users(call.message)
            bot.answer_callback_query(call.id)
            return



        elif data == "show_profile":
            logging.info(f"ACTION: Пользователь {user_id} (@{username}) нажал inline-кнопку Профиль")

            # Логируем активность
            log_user_activity(user_id, username, 'Inline-кнопка Профиль', 'private')

            if not is_description_complete(user):
                bot.answer_callback_query(call.id, "Сначала заполни свой профиль через /start! 📝")
                return

            try:
                profile_text = format_profile(user)
                bot.send_message(call.message.chat.id, profile_text, reply_markup=get_profile_keyboard())
            except Exception as e:
                logging.error(f"Ошибка в show_profile для пользователя {user_id}: {str(e)}")
                bot.answer_callback_query(call.id, "Произошла ошибка при отображении профиля. Попробуй ещё раз! 😅")
            return

        elif data == "show_chat_link":
            logging.info(f"ACTION: Пользователь {user_id} (@{username}) нажал inline-кнопку Ссылка на чат")

            # Логируем активность
            log_user_activity(user_id, username, 'Inline-кнопка Ссылка на чат', 'private')

            if not is_description_complete(user):
                bot.answer_callback_query(call.id, "Сначала заполни свой профиль через /start, чтобы получить ссылку на чат! 📝")
                return

            bot.send_message(call.message.chat.id, f"Актуальная ссылка на чат: {CHAT_LINK}")
            bot.answer_callback_query(call.id, "Ссылка отправлена! 🔗")
            return



        elif data == "back_to_profile":
            user['awaiting'] = None
            user.pop('current_metro_line', None)  # Очищаем временные данные
            user.pop('prev_awaiting', None)  # Очищаем временные данные
            save_users_data(users_data)

            profile_text = format_profile(user)

            # Если профиль заполнен, добавляем ссылку на чат
            if is_description_complete(user):
                profile_text += f"\n\n💬 Ссылка на чат: {CHAT_LINK}"

            bot.send_message(call.message.chat.id, profile_text, reply_markup=get_profile_keyboard())
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id)
            return

        elif data == "reset_profile":
            # Сохраняем предыдущее имя и возраст для удобства пользователя
            previous_name = user['description'].get('name')
            previous_age = user['description'].get('age')
            user['description'] = {
                'gender': None,
                'name': None,
                'age': None,
                'metro_station': None,
                'interests': [],
                'marital_status': None,
                'sexual_orientation': None,
                'telegram_channel': None,
                'extra_info': None
            }
            user['previous_name'] = previous_name  # Сохраняем для дальнейшего использования
            user['previous_age'] = previous_age  # Сохраняем для дальнейшего использования
            user['awaiting'] = 'gender'
            save_users_data(users_data)
            bot.send_message(call.message.chat.id, "Укажи свой пол: 👨👩", reply_markup=get_gender_keyboard())
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id)
            return

        # --- Добавлено: обработка кнопок "Телеграм-канал 📢" и "Доп. информация" в меню редактирования ---
        elif data == "edit_tg_channel":
            user['awaiting'] = "edit_tg_channel"
            save_users_data(users_data)
            current_channel = user['description'].get('telegram_channel', 'Не указано')
            bot.send_message(call.message.chat.id, f"Хочешь указать новый телеграм-канал? 📢\n\nТекущий канал: {current_channel}", reply_markup=get_telegram_channel_keyboard())
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id)
            return
        elif data == "edit_extra":
            user['awaiting'] = "edit_extra_info"
            save_users_data(users_data)
            bot.send_message(call.message.chat.id, "Хочешь изменить доп. информацию? (до 2000 символов) 📝", reply_markup=get_extra_info_keyboard(edit=True))
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id)
            return
        elif data == "edit_add_extra_info":
            user['awaiting'] = "edit_extra_info"
            save_users_data(users_data)
            bot.send_message(call.message.chat.id, "Расскажи что-то ещё о себе (до 2000 символов) 📝:")
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id)
            return

        elif data == "delete_extra_info":
            user['description']['extra_info'] = None
            user['awaiting'] = None
            save_users_data(users_data)
            bot.send_message(call.message.chat.id, f"{format_profile(user)}\nДоп. информация удалена! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_profile_keyboard())
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id, "Доп. информация удалена! 🗑️")
            return



        elif data.startswith("edit_marital_"):
            marital_mapping = {
                "не_женат": "Не женат",
                "не_замужем": "Не замужем", 
                "встречаюсь": "Встречаюсь",
                "помолвлен": "Помолвлен(а)",
                "женат": "Женат",
                "замужем": "Замужем",
                "гражданский_брак": "В гражданском браке",
                "влюблён": "Влюблён",
                "всё_сложно": "Всё сложно",
                "активный_поиск": "В активном поиске"
            }
            marital_key = data.split("edit_marital_")[1]
            if marital_key in marital_mapping:
                user['description']['marital_status'] = marital_mapping[marital_key]
                user['awaiting'] = None
                save_users_data(users_data)
                bot.edit_message_text(f"{format_profile(user)}\nПрофиль обновлён!", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_profile_keyboard())
                bot.answer_callback_query(call.id)
                return

        elif data.startswith("edit_orientation_"):
            orientation_mapping = {
                "гетеро": "Гетеро",
                "би": "Би",
                "гей_лесби": "Гей/Лесби",
                "другое": "custom"
            }
            orientation_key = data.split("edit_orientation_")[1]
            if orientation_key in orientation_mapping:
                if orientation_mapping[orientation_key] == "custom":
                    user['awaiting'] = 'edit_custom_orientation'
                    save_users_data(users_data)
                    markup = InlineKeyboardMarkup()
                    markup.add(InlineKeyboardButton("К профилю ↩️", callback_data="back_to_profile"))
                    bot.edit_message_text("Укажи свою ориентацию (например, 'Пансексуал') ✍️:", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
                else:
                    user['description']['sexual_orientation'] = orientation_mapping[orientation_key]
                    user['awaiting'] = None
                    save_users_data(users_data)
                    bot.edit_message_text(f"{format_profile(user)}\nПрофиль обновлён!", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_profile_keyboard())
                bot.answer_callback_query(call.id)
                return






        # --- МНОГОУРОВНЕВЫЙ ВЫБОР ИНТЕРЕСОВ ---
        elif data.startswith("interestcat_"):
            category = data.split("_", 1)[1]
            if user['awaiting'].startswith('edit_'):
                user['awaiting'] = f"edit_interests:{category}"
            else:
                user['awaiting'] = f"interests:{category}"
            save_users_data(users_data)
            markup = get_interests_keyboard(selected=user['description']['interests'], category=category)
            bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
            bot.answer_callback_query(call.id)
            return

        elif data == "interests_back":
            # Исправлено: корректная проверка для возврата на уровень категорий
            if user['awaiting'].startswith('edit_interests'):
                user['awaiting'] = 'edit_interests'
            else:
                user['awaiting'] = 'interests'
            save_users_data(users_data)

            # Определяем правильный текст в зависимости от контекста
            current_interests = user['description'].get('interests', [])
            if user['awaiting'] == 'edit_interests' and current_interests:
                interests_display = ', '.join(current_interests)
                message_text = f"Выбери новые интересы (можно несколько, затем нажми 'Готово') 🎉:\n\nТекущие интересы: {interests_display}"
            else:
                if current_interests:
                    interests_display = ', '.join(current_interests)
                    message_text = f"Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:\n\nВыбранные интересы: {interests_display}"
                else:
                    message_text = "Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:"

            markup = get_interests_keyboard(selected=user['description']['interests'])
            bot.edit_message_text(message_text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
            bot.answer_callback_query(call.id)
            return

        elif data.startswith("interest_"):
            # Выбор/снятие интереса внутри категории
            interest = data.split("_", 1)[1]
            # Определяем текущую категорию, если есть
            awaiting = user.get('awaiting', '')
            category = None
            if awaiting.startswith('interests:'):
                category = awaiting.split(':', 1)[1]
            elif awaiting.startswith('edit_interests:'):
                category = awaiting.split(':', 1)[1]
            if interest == "Другое":
                user['awaiting'] = 'custom_interest'
                save_users_data(users_data)
                bot.send_message(call.message.chat.id, "Укажи свой интерес (например, 'Книги') ✍️:")
                bot.delete_message(call.message.chat.id, call.message.message_id)
                bot.answer_callback_query(call.id)
            else:
                if interest in user['description']['interests']:
                    user['description']['interests'].remove(interest)
                else:
                    user['description']['interests'].append(interest)
                save_users_data(users_data)
                # Остаёмся в текущей категории, если выбрана категория
                if category:
                    markup = get_interests_keyboard(selected=user['description']['interests'], category=category)
                else:
                    markup = get_interests_keyboard(selected=user['description']['interests'])
                bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
                bot.answer_callback_query(call.id)
            return

        elif data == "interests_done":
            if not user['description']['interests']:
                bot.answer_callback_query(call.id, "Выбери хотя бы один интерес! 😊")
                return
            # После выбора интересов переходим к следующему этапу анкеты
            if user['awaiting'] and user['awaiting'].startswith('edit_'):
                user['awaiting'] = None
                save_users_data(users_data)
                # Удаляем старое сообщение и отправляем новое с профилем
                bot.delete_message(call.message.chat.id, call.message.message_id)
                bot.send_message(call.message.chat.id, f"{format_profile(user)}\nПрофиль обновлён!", reply_markup=get_profile_keyboard())
            else:
                user['awaiting'] = 'marital_status'
                save_users_data(users_data)
                progress = get_profile_progress(user)
                # Удаляем inline-сообщение и отправляем reply-клавиатуру для семейного положения
                bot.delete_message(call.message.chat.id, call.message.message_id)
                bot.send_message(call.message.chat.id, f"{progress}Выбери семейное положение 💍:", reply_markup=get_marital_status_keyboard(show_back=True))
            bot.answer_callback_query(call.id)
            return
        # --- КОНЕЦ МНОГОУРОВНЕВОГО ВЫБОРА ИНТЕРЕСОВ ---
        # --- МЕТРО: выбор ветки, станции, ЛО, не в Питере (МНОЖЕСТВЕННЫЙ ВЫБОР) ---
        if data.startswith("metro_line_"):
            # Устанавливаем текущую ветку метро
            line = data.split("_")[2]
            user['current_metro_line'] = line
            save_users_data(users_data)
            # Показываем клавиатуру выбора станции для выбранной ветки
            if line == "red":
                markup = get_red_line_keyboard(selected=user['description'].get('metro_station', []))
            elif line == "blue":
                markup = get_blue_line_keyboard(selected=user['description'].get('metro_station', []))
            elif line == "green":
                markup = get_green_line_keyboard(selected=user['description'].get('metro_station', []))
            elif line == "orange":
                markup = get_orange_line_keyboard(selected=user['description'].get('metro_station', []))
            elif line == "purple":
                markup = get_purple_line_keyboard(selected=user['description'].get('metro_station', []))
            else:
                markup = get_metro_keyboard(selected=user['description'].get('metro_station', []))
            bot.edit_message_text(f"Выбери станции на ветке (можно несколько вместе с городами ЛО, затем 'Готово ✅'):", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
            bot.answer_callback_query(call.id)
            return

        if data.startswith("metro_"):
            value = data[6:]
            # --- обработка возврата к выбору линии ---
            if value == "back":
                user.pop('current_metro_line', None)
                save_users_data(users_data)
                markup = get_metro_keyboard(selected=user['description'].get('metro_station', []))

                # Определяем правильный текст в зависимости от контекста
                current_metro = user['description'].get('metro_station', [])
                if user['awaiting'] and user['awaiting'].startswith('edit_') and current_metro:
                    if isinstance(current_metro, list):
                        metro_display = ', '.join(current_metro)
                    else:
                        metro_display = current_metro
                    message_text = f"Выбери станции метро или города ЛО (можно неско �ько, затем 'Готово ✅'):\n\nТекущие станции: {metro_display}"
                else:
                    message_text = "На какой станции метро ты обычно бываешь? 🚇"

                bot.edit_message_text(message_text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
                bot.answer_callback_query(call.id)
                return
            if value == "done":
                current_metro = user['description'].get('metro_station', [])
                if not current_metro:
                    bot.answer_callback_query(call.id, "Выбери хотя бы одну станцию или город! 😊")
                    return
                user.pop('current_metro_line', None)
                user['awaiting'] = 'interests' if not user['awaiting'].startswith('edit_') else None
                save_users_data(users_data)
                if user['awaiting'] == 'interests':
                    progress = get_profile_progress(user)
                    bot.edit_message_text(f"{progress}Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_interests_keyboard())
                else:
                    # Убрана ссылка на чат
                    bot.edit_message_text(f"{format_profile(user)}\nПрофиль обновлён!", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_profile_keyboard())
                bot.answer_callback_query(call.id)
                return
            if value == "Я из ЛО":
                user.pop('current_metro_line', None)
                save_users_data(users_data)
                markup = get_lo_cities_keyboard(selected=user['description'].get('metro_station', []))
                bot.edit_message_text("Выбери города ЛО (можно несколько вместе со станциями метро, затем 'Готово ✅'):", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
                bot.answer_callback_query(call.id)
                return

            if value == "Я не в Питере":
                # Проверяем, есть ли уже это значение (для снятия галочки при редактировании)
                current_metro = user['description'].get('metro_station', [])
                if isinstance(current_metro, list) and "Я не в Питере" in current_metro:
                    # Снимаем значение
                    user['description']['metro_station'] = []
                else:
                    # Полностью очищаем все предыдущие выборы (станции метро и города ЛО) и устанавливаем только "Я не в Питере"
                    user['description']['metro_station'] = ["Я не в Питере"]

                user.pop('current_metro_line', None)

                # Определяем следующее действие в зависимости от текущего состояния
                if user['awaiting'] and user['awaiting'].startswith('edit_'):
                    # При редактировании обновляем клавиатуру, чтобы показать изменения
                    save_users_data(users_data)
                    markup = get_metro_keyboard(selected=user['description']['metro_station'])
                    bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
                    bot.answer_callback_query(call.id)
                    return
                else:
                    user['awaiting'] = 'interests'
                    save_users_data(users_data)
                    bot.send_message(call.message.chat.id, "Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:", reply_markup=get_interests_keyboard())
                    bot.delete_message(call.message.chat.id, call.message.message_id)
                    bot.answer_callback_query(call.id)
                    return

            # Множественный выбор станции метро
            if 'metro_station' not in user['description']:
                user['description']['metro_station'] = []
            elif user['description']['metro_station'] is None:
                user['description']['metro_station'] = []
            elif not isinstance(user['description']['metro_station'], list):
                current_value = user['description']['metro_station']
                user['description']['metro_station'] = [current_value] if current_value else []

            # Запоминаем старое состояние для проверки изменений
            old_metro_stations = user['description']['metro_station'].copy()

            # При выборе реальной станции метро убираем "Я не в Питере"
            if "Я не в Питере" in user['description']['metro_station']:
                user['description']['metro_station'].remove("Я не в Питере")

            if value in user['description']['metro_station']:
                user['description']['metro_station'].remove(value)
            else:
                user['description']['metro_station'].append(value)

            save_users_data(users_data)

            # Обновляем клавиатуру только если список изменился
            if old_metro_stations != user['description']['metro_station']:
                try:
                    # Определяем, на какой линии сейчас пользователь
                    line = user.get('current_metro_line')
                    if line == "red":
                        markup = get_red_line_keyboard(selected=user['description']['metro_station'])
                    elif line == "blue":
                        markup = get_blue_line_keyboard(selected=user['description']['metro_station'])
                    elif line == "green":
                        markup = get_green_line_keyboard(selected=user['description']['metro_station'])
                    elif line == "orange":
                        markup = get_orange_line_keyboard(selected=user['description']['metro_station'])
                    elif line == "purple":
                        markup = get_purple_line_keyboard(selected=user['description']['metro_station'])
                    else:
                        markup = get_metro_keyboard(selected=user['description']['metro_station'])
                    bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
                except Exception as e:
                    # Если не удалось обновить разметку, просто логируем
                    logging.warning(f"Не удалось обновить клавиатуру метро для пользователя {user_id}: {e}")

            bot.answer_callback_query(call.id)
            return

        if data.startswith("lo_"):
            city = data[3:]
            if 'metro_station' not in user['description']:
                user['description']['metro_station'] = []
            elif user['description']['metro_station'] is None:
                user['description']['metro_station'] = []
            elif not isinstance(user['description']['metro_station'], list):
                current_value = user['description']['metro_station']
                user['description']['metro_station'] = [current_value] if current_value else []

            value = f"ЛО: {city}"
            if city == "Другое ✍️":
                user.pop('current_metro_line', None)
                if user['awaiting'] and user['awaiting'].startswith('edit_'):
                    user['awaiting'] = 'edit_custom_lo'
                else:
                    user['awaiting'] = 'custom_lo'
                save_users_data(users_data)
                bot.send_message(call.message.chat.id, "Укажи свой город в Ленинградской области (например, 'Мурино') ✍️:")
                bot.delete_message(call.message.chat.id, call.message.message_id)
                bot.answer_callback_query(call.id)
                return

            # Запоминаем старое состояние для проверки изменений
            old_metro_stations = user['description']['metro_station'].copy()

            # При выборе города ЛО убираем "Я не в Питере"
            if "Я не в Питере" in user['description']['metro_station']:
                user['description']['metro_station'].remove("Я не в Питере")

            if value in user['description']['metro_station']:
                user['description']['metro_station'].remove(value)
            else:
                user['description']['metro_station'].append(value)

            save_users_data(users_data)

            # Обновляем клавиатуру только если список изменился
            if old_metro_stations != user['description']['metro_station']:
                try:
                    markup = get_lo_cities_keyboard(selected=user['description']['metro_station'])
                    bot.edit_message_reply_markup(chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=markup)
                except Exception as e:
                    # Если не удалось обновить разметку, просто логируем
                    logging.warning(f"Не удалось обновить клавиатуру ЛО для пользователя {user_id}: {e}")

            bot.answer_callback_query(call.id)
            return
        # --- КОНЕЦ МЕТРО ---





        # --- ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ---
        elif data == "add_extra_info":
            user['awaiting'] = 'extra_info'
            save_users_data(users_data)
            bot.send_message(call.message.chat.id, "Расскажи что-то ещё о себе (до 2000 символов) 📝:")
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id)
            return

        elif data == "skip_extra_info":
            user['description']['extra_info'] = ""
            user['awaiting'] = None
            save_users_data(users_data)
            bot.send_message(call.message.chat.id, f"{format_profile(user)}\nСпасибо за информацию! Вот ссылка на чат: {CHAT_LINK}", reply_markup=get_profile_keyboard())
            bot.delete_message(call.message.chat.id, call.message.message_id)
            bot.answer_callback_query(call.id)
            return
        # --- Кнопка возврата ---
        elif data.startswith("back_to_"):
            back_to = data.split("_")[2]
            if back_to == "start":
                user['awaiting'] = 'join_request'
                save_users_data(users_data)
                bot.edit_message_text("Хочешь присоединиться к нашему чату? 🚀", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_join_request_keyboard())
            elif back_to == "gender":
                user['awaiting'] = 'gender'
                save_users_data(users_data)
                progress = get_profile_progress(user)
                bot.edit_message_text(f"{progress}Укажи свой пол: 👨👩", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_gender_keyboard())
            elif back_to == "name":
                user['awaiting'] = 'name'
                save_users_data(users_data)
                progress = get_profile_progress(user)
                
                # Проверяем, есть ли предыдущее имя (при заполнении профиля заново)
                previous_name = user.get('previous_name')
                if previous_name:
                    bot.send_message(call.message.chat.id, f"{progress}Как тебя зовут? ✏️\n\nМожешь выбрать предыдущее имя или ввести новое:", reply_markup=get_name_keyboard(previous_name, show_back=True))
                else:
                    bot.send_message(call.message.chat.id, f"{progress}Как тебя зовут? ✏️", reply_markup=get_back_reply_keyboard())
                bot.delete_message(call.message.chat.id, call.message.message_id)
            elif back_to == "age":
                user['awaiting'] = 'age'
                save_users_data(users_data)
                progress = get_profile_progress(user)
                bot.edit_message_text(f"{progress}Сколько тебе лет? (Введи число, например, 25) 🎂", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_back_keyboard("name"))
            elif back_to == "metro":
                user['awaiting'] = 'metro'
                save_users_data(users_data)
                progress = get_profile_progress(user)

                # Показываем уже выбранные станции с эмодзи
                current_metro = user['description'].get('metro_station', [])
                if current_metro:
                    metro_with_emoji = []
                    for station in current_metro:
                        emoji = get_metro_emoji(station)
                        metro_with_emoji.append(f"{emoji} {station}")
                    metro_display = ', '.join(metro_with_emoji)
                    message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇\n\nУже выбрано: {metro_display}"
                else:
                    message_text = f"{progress}На какой станции метро ты обычно бываешь? 🚇"

                bot.edit_message_text(message_text, chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_metro_keyboard(show_back=True))
            elif back_to == "interests":
                user['awaiting'] = 'interests'
                save_users_data(users_data)
                progress = get_profile_progress(user)
                bot.edit_message_text(f"{progress}Выбери свои интересы (можно несколько, затем нажми 'Готово') 🎉:", chat_id=call.message.chat.id, message_id=call.message.message_id, reply_markup=get_interests_keyboard(show_back=True))
            elif back_to == "marital":
                user['awaiting'] = 'marital_status'
                save_users_data(users_data)
                progress = get_profile_progress(user)
                bot.send_message(call.message.chat.id, f"{progress}Выбери семейное положение 💍:", reply_markup=get_marital_status_keyboard(show_back=True))
                bot.delete_message(call.message.chat.id, call.message.message_id)
            elif back_to == "orientation":
                user['awaiting'] = 'sexual_orientation'
                save_users_data(users_data)
                progress = get_profile_progress(user)
                bot.send_message(call.message.chat.id, f"{progress}Укажи свою сексуальную ориентацию 🌈:", reply_markup=get_sexual_orientation_keyboard(show_back=True))
                bot.delete_message(call.message.chat.id, call.message.message_id)
            elif back_to == "edit_select":
                user['awaiting'] = 'edit_select'
                user.pop('current_metro_line', None)  # Очищаем временные данные
                user.pop('prev_awaiting', None)  # Очищаем временные данные
                save_users_data(users_data)
                bot.send_message(call.message.chat.id, "Что хочешь изменить в профиле? ✏️", reply_markup=get_edit_field_reply_keyboard())
                bot.delete_message(call.message.chat.id, call.message.message_id)
            elif back_to == "profile":
                user['awaiting'] = None
                user.pop('current_metro_line', None)  # Очищаем временные данные
                user.pop('prev_awaiting', None)  # Очищаем временные данные
                save_users_data(users_data)
                
                profile_text = format_profile(user)

                # Если профиль заполнен, добавляем ссылку на чат
                if is_description_complete(user):
                    profile_text += f"\n\n💬 Ссылка на чат: {CHAT_LINK}"

                # Удаляем старое сообщение
                bot.delete_message(call.message.chat.id, call.message.message_id)
                bot.send_message(call.message.chat.id, profile_text, reply_markup=get_profile_keyboard())
            bot.answer_callback_query(call.id)
            return

        # --- КОНЕЦ ДОПОЛНИТЕЛЬНОЙ ИНФОРМАЦИИ ---

        else:
            # Неизвестная кнопка - логируем и игнорируем
            logging.warning(f"UNKNOWN_CALLBACK: Пользователь {user_id} нажал неизвестную кнопку: '{data}'")
            bot.answer_callback_query(call.id, "Неизвестная команда!")
            return

    except Exception as e:
        logging.error(f"Ошибка в handle_callback для пользователя {user_id}: {str(e)}")
        bot.send_message(call.message.chat.id, "Произошла ошибка при обработке кнопки. Попробуй ещё раз! 😅")

# Обработчик команды /activity и /activity@VProgulkeBot
@bot.message_handler(commands=['activity', 'activity@VProgulkeBot'])
def show_activity(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name
    chat_type = 'group' if message.chat.type in ['group', 'supergroup'] else 'private'

    logging.info(f"ACTION: Пользователь {user_id} (@{username}) запросил график активности")

    # Логируем активность
    log_user_activity(user_id, username, 'Команда /activity', chat_type)

    # Проверяем, отвечает ли пользователь на чужое сообщение
    if message.reply_to_message and message.reply_to_message.from_user:
        replied_user_id = str(message.reply_to_message.from_user.id)
        replied_username = message.reply_to_message.from_user.username or message.reply_to_message.from_user.first_name

        logging.info(f"ACTIVITY_REPLY: Пользователь {user_id} запросил график активности для пользователя {replied_user_id}")

        # Ищем профиль пользователя, на сообщение которого отвечают
        if replied_user_id not in users_data:
            bot.reply_to(message, f"Пользователь @{replied_username} не найден в базе данных ᴠᴨᴩᴏᴦʏᴧᴋᴇ 😔")
            return

        # Генерируем график активности для другого пользователя
        try:
            chart_buffer = generate_user_activity_chart(replied_user_id)
            if chart_buffer:
                user_data = users_data[replied_user_id]
                name = user_data.get('description', {}).get('name', replied_username)
                bot.send_photo(
                    message.chat.id,
                    photo=chart_buffer,
                    caption=f"📊 График активности пользователя {name} (@{replied_username})"
                )
            else:
                bot.reply_to(message, f"Не удалось создать график активности для @{replied_username}")
        except Exception as e:
            logging.error(f"Ошибка в show_activity для пользователя {replied_user_id}: {str(e)}")
            bot.reply_to(message, "Произошла ошибка при создании графика. Попробуй ещё раз! 😅")
        return

    # Показываем свой график активности
    if user_id not in users_data:
        bot.reply_to(message, "Пожалуйста, начни с /start. 😎")
        return

    try:
        chart_buffer = generate_user_activity_chart(user_id)
        if chart_buffer:
            bot.send_photo(
                message.chat.id,
                photo=chart_buffer,
                caption="📊 Твоя статистика активности"
            )
        else:
            bot.reply_to(message, "Не удалось создать график активности. У тебя пока нет активности для отображения 📊")
    except Exception as e:
        logging.error(f"Ошибка в show_activity для пользователя {user_id}: {str(e)}")
        bot.reply_to(message, "Произошла ошибка при создании графика. Попробуй ещё раз! 😅")

# Обработчик команды /stats и /stats@VProgulkeBot
@bot.message_handler(commands=['stats', 'stats@VProgulkeBot'])
def show_stats(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name

    logging.info(f"ADMIN_ACTION: Пользователь {user_id} (@{username}) запросил статистику")

    if message.from_user.id != ADMIN_ID:
        logging.warning(f"SECURITY: Неавторизованный доступ к статистике от пользователя {user_id}")
        bot.reply_to(message, "Эта команда только для админа ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 😎")
        return

    if not users_data:
        logging.info(f"STATS: База данных пуста")
        bot.reply_to(message, "Статистика пуста. 😔")
        return

    try:
        # Основная статистика
        total_users = len(users_data)
        complete_profiles = sum(1 for user in users_data.values() if is_description_complete(user))
        wants_link = sum(1 for user in users_data.values() if user.get('wants_link'))

        # Статистика по полу
        gender_stats = {}
        for user in users_data.values():
            gender = user.get('description', {}).get('gender')
            if gender:
                gender_stats[gender] = gender_stats.get(gender, 0) + 1

        # Статистика по возрасту
        ages = [user.get('description', {}).get('age') for user in users_data.values() 
                if user.get('description', {}).get('age')]
        avg_age = sum(ages) / len(ages) if ages else 0

        # Топ интересов
        all_interests = []
        for user in users_data.values():
            interests = user.get('description', {}).get('interests', [])
            all_interests.extend(interests)

        interest_count = {}
        for interest in all_interests:
            interest_count[interest] = interest_count.get(interest, 0) + 1

        top_interests = sorted(interest_count.items(), key=lambda x: x[1], reverse=True)[:10]

        # Статистика по метро
        metro_stats = {}
        for user in users_data.values():
            metro = user.get('description', {}).get('metro_station', [])
            if isinstance(metro, list):
                for station in metro:
                    metro_stats[station] = metro_stats.get(station, 0) + 1
            elif metro:
                metro_stats[metro] = metro_stats.get(metro, 0) + 1

        top_metro = sorted(metro_stats.items(), key=lambda x: x[1], reverse=True)[:10]

        # Статистика по источникам
        source_stats = {}
        for user in users_data.values():
            source = user.get('source')
            if source:
                source_stats[source] = source_stats.get(source, 0) + 1

        top_sources = sorted(source_stats.items(), key=lambda x: x[1], reverse=True)[:10]

        # Формируем ответ
        response = f"📊 **Статистика ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot**\n\n"
        response += f"👥 **Общая статистика:**\n"
        response += f"• Всего пользователей: {total_users}\n"
        response += f"• Завершённых профилей: {complete_profiles}\n"
        response += f"• Хотят ссылку: {wants_link}\n\n"

        if gender_stats:
            response += f"👨👩 **По полу:**\n"
            for gender, count in gender_stats.items():
                response += f"• {gender}: {count}\n"
            response += "\n"

        if ages:
            response += f"🎂**Возраст:**\n"
            response += f"• Средний возраст: {avg_age:.1f} лет\n"
            response += f"• Самый молодой: {min(ages)} лет\n"
            response += f"• Самый старший: {max(ages)} лет\n\n"

        if top_interests:
            response += f"🎉 **Топ-10 интересов:**\n"
            for i, (interest, count) in enumerate(top_interests, 1):
                response += f"{i}. {interest}: {count}\n"
            response += "\n"

        if top_metro:
            response += f"🚇 **Топ-10 станций метро:**\n"
            for i, (station, count) in enumerate(top_metro, 1):
                response += f"{i}. {station}: {count}\n"
            response += "\n"

        if top_sources:
            response += f"📢 **Топ-10 источников:**\n"
            for i, (source, count) in enumerate(top_sources, 1):
                response += f"{i}. {source}: {count}\n"

        # Разбиваем длинное сообщение на части
        if len(response) > 4000:
            parts = [response[i:i+4000] for i in range(0, len(response), 4000)]
            for part in parts:
                bot.send_message(message.chat.id, part)
        else:
            bot.reply_to(message, response)

    except Exception as e:
        logging.error(f"Ошибка в show_stats для админа: {str(e)}")
        bot.reply_to(message, "Произошла ошибка при получении статистики. Попробуй ещё раз! 😅")

# Обработчик команды /list_users и /list_users@VProgulkeBot
@bot.message_handler(commands=['list_users', 'list_users@VProgulkeBot'])
def list_users(message):
    if message.from_user.id != ADMIN_ID:
        bot.reply_to(message, "Эта команда только для админа ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 😎")
        return

    if not users_data:
        bot.reply_to(message, "Список пользователей пуст. 😔")
        return

    try:
        response = "📋 Список пользователей ᴠᴨᴩᴏᴦʏᴧᴋᴇ:\n\n"
        for uid, data in users_data.items():
            if data.get('wants_link'):
                response += (
                    f"ID: {uid}\n"
                    f"Имя: @{data['username']}\n"
                    f"Источник: {data['source']}\n"
                    f"Дата: {data['timestamp']}\n"
                    f"{format_profile(data)}\n"
                )
        bot.reply_to(message, response or "Нет пользователей, желающих получить ссылку. 😔")
    except Exception as e:
        logging.error(f"Ошибка в list_users для админа: {str(e)}")
        bot.reply_to(message, "Произошла ошибка при получении списка пользователей. Попробуй ещё раз! 😅")

# Обработчик команды /admin и /admin@VProgulkeBot
@bot.message_handler(commands=['admin', 'admin@VProgulkeBot'])
def admin_panel(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name

    logging.info(f"ADMIN_ACTION: Пользователь {user_id} (@{username}) запросил админ-панель")

    if message.from_user.id != ADMIN_ID:
        logging.warning(f"SECURITY: Неавторизованный доступ к админ-панели от пользователя {user_id}")
        bot.reply_to(message, "Эта команда только для админа ᴠᴨᴩᴏᴦʏᴧᴋᴇ! 😎")
        return

    logging.info(f"ADMIN_PANEL: Отображение админ-панели для {user_id}")
    bot.reply_to(message, "🔧 **Панель администратора ᴠᴨᴩᴏᴦʏᴧᴋᴇ**\n\nВыбери действие:", reply_markup=get_admin_keyboard())

# Обработчик команды /link

@bot.message_handler(commands=['link', 'link@VProgulkeBot'])
def send_chat_link(message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name

    logging.info(f"ACTION: Пользователь {user_id} (@{username}) запросил ссылку на чат")

    if user_id not in users_data:
        logging.warning(f"LINK_ERROR: Пользователь {user_id} не найден в базе данных")
        bot.reply_to(message, "Пожалуйста, начни с /start, чтобы получить доступ к чату! 😎")
        return    
    if not is_description_complete(users_data[user_id]):
        logging.warning(f"LINK_ERROR: Профиль пользователя {user_id} не заполнен")
        bot.reply_to(message, "Сначала заполни свой профиль через /start, чтобы получить ссылку на чат! 📝")
        return

    logging.info(f"LINK_SENT: Отправка ссылки на чат пользователю {user_id}")
    bot.reply_to(message, f"Актуальная ссылка на чат: {CHAT_LINK}")

# Обработчик всех сообщений в группах для отслеживания активности и приветствия новых пользователей
@bot.message_handler(func=lambda message: message.chat.type in ['group', 'supergroup'])
@bot.message_handler(func=lambda message: message.chat.type in ['group', 'supergroup'])
def track_group_activity(message):
    """Отслеживает активность пользователей в группах и приветствует новых пользователей"""
    user_id = str(message.from_user.id)
    username = message.from_user.username or message.from_user.first_name

    # Пропускаем сообщения от ботов
    if message.from_user.is_bot:
        return

    # Пропускаем команды, которые уже обрабатываются другими хендлерами
    if message.text and message.text.startswith('/'):
        return

    # Пропускаем сообщения "о себе", "профиль", "описание" и их синонимы - они обрабатываются отдельно
    if message.text and any(message.text.lower().startswith(cmd) for cmd in ['о себе', 'описание', 'профиль', 'био', 'кто я', 'кто ты', 'хто ты', 'хто я']):
        return

    # Проверяем, новый ли это пользователь
    if user_id not in users_data:
        # Создаём нового пользователя
        users_data[user_id] = {
            'id': user_id,
            'username': username,
            'source': None,
            'timestamp': None,
            'wants_link': False,
            'description': {
                'gender': None,
                'name': None,
                'age': None,
                'metro_station': None,
                'interests': [],
                'marital_status': None,
                'sexual_orientation': None,
                'telegram_channel': None,
                'extra_info': None
            },
            'awaiting': 'awaiting_source_response'  # Устанавливаем состояние ожидания ответа на вопрос об источнике
        }
        save_users_data(users_data)
        logging.info(f"NEW_USER_GROUP: Создан новый пользователь {user_id} (@{username}) в группе")

        # Отправляем приветственный вопрос в группе
        try:
            bot.reply_to(message, f"🌟 Привет, @{username}! Откуда ты узнал о нашем чате? 😎")
            logging.info(f"WELCOME_GROUP: Отправлен приветственный вопрос пользователю {user_id} в группе")
        except Exception as e:
            logging.error(f"Ошибка при отправке приветственного сообщения в группе для {user_id}: {e}")
        return

    # Проверяем состояние пользователя
    state = users_data[user_id].get('awaiting')
    if state == 'awaiting_source_response' and message.text:
        # Пользователь отвечает на вопрос об источнике в группе
        logging.info(f"USER_SOURCE_GROUP: Пользователь {user_id} указал источник в группе: '{message.text}'")
        users_data[user_id]['source'] = message.text
        users_data[user_id]['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        users_data[user_id]['awaiting'] = 'join_request'
        save_users_data(users_data)

        try:
            bot.reply_to(message, f"Спасибо! Хочешь присоединиться к нашему чату? Напиши мне в личку /start 🚀")
            logging.info(f"REDIRECT_TO_PM: Пользователю {user_id} предложено перейти в ЛС")
        except Exception as e:
            logging.error(f"Ошибка при отправке предложения о переходе в ЛС для {user_id}: {e}")
        return

    # Логируем активность
    log_user_activity(user_id, username, 'Сообщение в группе', 'group')


# Запуск бота и Flask
if __name__ == "__main__":
    logging.info("Запуск ᴠᴨᴩᴏᴦʏᴧᴋᴇ Bot 🚀")

    # Запускаем Flask в отдельном потоке
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    logging.info("Flask сервер запущен на порту 5000")

    # Запускаем Telegram бота с обработкой сетевых ошибок
    import time
    from requests.exceptions import ConnectionError, ReadTimeout
    from urllib3.exceptions import ProtocolError

    max_retries = 5
    retry_delay = 5

    while True:
        try:
            logging.info("Telegram бот запущен 🚀")
            bot.polling(none_stop=True, interval=0, timeout=20)
        except (ConnectionError, ReadTimeout, ProtocolError) as e:
            logging.warning(f"Сетевая ошибка: {e}. Переподключение через {retry_delay} секунд...")
            time.sleep(retry_delay)
            continue
        except Exception as e:
            logging.error(f"Критическая ошибка бота: {e}")
            try:
                bot.send_message(ADMIN_ID, f"Бот остановлен из-за критической ошибки: {e}")
            except:
                pass
            # Для критических ошибок также пытаемся переподключиться
            time.sleep(retry_delay)
            continue