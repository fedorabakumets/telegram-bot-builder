# Руководство по установке

**🇷🇺 Русский** | [🇬🇧 English](INSTALLATION.en.md)

## 📜 Пошаговая инструкция

<details>
<summary><strong>🐳 Быстрый старт: Docker (рекомендуется)</strong></summary>

**Требования:** Docker и Docker Compose

```bash
git clone https://github.com/fedorabakumets/telegram-bot-builder.git
cd telegram-bot-builder
docker compose up -d
docker compose logs -f
```

**Полезные команды:**

```bash
docker compose down        # Остановить
docker compose build --no-cache  # Пересобрать
docker compose logs -f     # Логи
```

✅ **Готово!** Приложение доступно по адресу: `http://localhost:5000`

</details>

---

### Ручная установка

### Требования
- **Node.js** ≥ 18.0.0
- **PostgreSQL** ≥ 17
- **Redis** ≥ 7
- **Python** ≥ 3.10 (рекомендуется 3.13, для сгенерированных ботов)
- **Git**
<details>
<summary><strong>Шаг 1: Установка Git</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux (Ubuntu/Debian)</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Способ 1: Через терминал (рекомендуется):**

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install -y git
```

**Fedora/CentOS:**
```bash
sudo dnf install -y git
```

**Arch Linux:**
```bash
sudo pacman -S git
```

**Способ 2: С сайта:**
- Перейдите на [git-scm.com/install/linux](https://git-scm.com/install/linux)
- Выберите ваш дистрибутив
- Следуйте инструкции по установке

**Проверка установки:**
```bash
git --version
```

</td>
<td valign="top">

**Способ 1: Через winget (рекомендуется):**
```powershell
winget install --id Git.Git -e --source winget
```

**Способ 2: Через установщик:**
- Скачайте с [git-scm.com/install/windows](https://git-scm.com/install/windows)
- Запустите `.exe` файл
- Оставьте настройки по умолчанию (нажимайте "Next")

**Проверка установки:**
Откройте PowerShell от имени администратора (`Win + X` → "Терминал (администратор)"):
```powershell
git --version
```

> Если версия не отображается, перезапустите PowerShell

</td>
<td valign="top">

**Способ 1: Через Homebrew (рекомендуется):**
```bash
# Установка Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установка Git
brew install git
```

**Способ 2: С сайта:**
- Перейдите на [git-scm.com/install/mac](https://git-scm.com/install/mac)
- Скачайте установщик для macOS (`.dmg`)
- Откройте `.dmg` файл и перетащите Git в Applications

**Проверка установки:**
```bash
git --version
```

> Homebrew — менеджер пакетов для macOS, упрощает установку программ

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Шаг 2: Установка Node.js LTS</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Способ 1: Через терминал (рекомендуется):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

**Способ 2: С сайта:**
- Перейдите на [nodejs.org](https://nodejs.org/)
- Скачайте `.deb` или `.rpm` пакет
- Установите: `sudo dpkg -i nodejs_*.deb`

</td>
<td valign="top">

**Способ 1: Через winget:**
```powershell
winget install OpenJS.NodeJS.LTS
node -v && npm -v
```

**Способ 2: С сайта:**
- Перейдите на [nodejs.org](https://nodejs.org/)
- Скачайте установщик (`.msi`)
- Запустите и следуйте инструкциям
- Проверьте установку:
```powershell
node -v
npm -v
```

</td>
<td valign="top">

**Способ 1: Через Homebrew:**
```bash
brew install node@lts
node -v && npm -v
```

**Способ 2: С сайта:**
- Перейдите на [nodejs.org](https://nodejs.org/)
- Скачайте установщик (`.pkg`)
- Запустите и следуйте инструкциям

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Шаг 3: Установка PostgreSQL</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Способ 1: Через терминал:**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**Способ 2: Официальный репозиторий:**
- Посетите [postgresql.org/download/linux](https://www.postgresql.org/download/linux/)
- Выберите дистрибутив
- Следуйте инструкции

</td>
<td valign="top">

**Способ 1: Через winget (рекомендуется):**
```powershell
winget install PostgreSQL.PostgreSQL.17
```

> При установке запомните пароль для пользователя `postgres` (по умолчанию: `postgres`). Порт: `5432`.

**Проверка установки:**
```powershell
psql -U postgres -c "SELECT version();"
```

**Способ 2: С сайта:**
- Перейдите на [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
- Скачайте установщик
- Запустите и запомните пароль `postgres`

</td>
<td valign="top">

**Способ 1: Через Homebrew:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Способ 2: С сайта:**
- Перейдите на [postgresql.org/download/macosx](https://www.postgresql.org/download/macosx/)
- Скачайте установщик
- Запустите и следуйте инструкциям

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Шаг 4: Установка Python 3</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Способ 1: Через терминал:**
```bash
sudo apt install -y python3 python3-venv python3-pip
python3 --version
```

**Способ 2: Официальный сайт:**
- Посетите [python.org/downloads](https://www.python.org/downloads/)
- Выберите версию для Linux
- Следуйте инструкции по компиляции

</td>
<td valign="top">

**Способ 1: Через winget:**
```powershell
winget install Python.Python.3.12
```

**Способ 2: С сайта:**
- Перейдите на [python.org/downloads](https://www.python.org/downloads/)
- Скачайте установщик
- При установке отметьте **"Add Python to PATH"**
- Проверьте установку:
```powershell
python --version
```

</td>
<td valign="top">

**Способ 1: Через Homebrew:**
```bash
brew install python
python3 --version
```

**Способ 2: С сайта:**
- Перейдите на [python.org/downloads](https://www.python.org/downloads/)
- Скачайте установщик для macOS (`.pkg`)
- Запустите и следуйте инструкциям

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Шаг 5: Установка Redis</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux (Ubuntu/Debian)</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Способ 1: Через терминал:**
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Проверка установки:**
```bash
redis-cli ping
```
> Должен ответить `PONG`

</td>
<td valign="top">

**Способ 1: Memurai (рекомендуется для Windows):**

Memurai — нативный Windows-порт, полностью совместимый с Redis 7.2+. Устанавливается как Windows-служба и работает без WSL.

```powershell
winget install Memurai.MemuraiDeveloper
```

После установки служба запускается автоматически. Управление:
```powershell
net start Memurai   # Запустить
net stop Memurai    # Остановить
```

**Способ 2: Через WSL2:**

Установите Redis внутри WSL:
```bash
sudo apt install -y redis-server
sudo service redis-server start
```

**Способ 3: Docker:**
```powershell
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Проверка установки:**
```powershell
redis-cli ping
```
> Должен ответить `PONG`

</td>
<td valign="top">

**Способ 1: Через Homebrew:**
```bash
brew install redis
brew services start redis
```

**Проверка установки:**
```bash
redis-cli ping
```
> Должен ответить `PONG`

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Шаг 6: Настройка базы данных</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE telegram_bot_builder;
GRANT ALL PRIVILEGES ON DATABASE telegram_bot_builder TO postgres;
\q
```

> По умолчанию используется встроенный пользователь `postgres`. Пароль задаётся при установке PostgreSQL.

</td>
<td valign="top">

```powershell
psql -U postgres
```

```sql
CREATE DATABASE telegram_bot_builder;
GRANT ALL PRIVILEGES ON DATABASE telegram_bot_builder TO postgres;
\q
```

> Пароль `postgres` задаётся при установке. Если забыли — переустановите или измените через `ALTER USER postgres PASSWORD 'новый_пароль';`

</td>
<td valign="top">

```bash
psql postgres
```

```sql
CREATE DATABASE telegram_bot_builder;
GRANT ALL PRIVILEGES ON DATABASE telegram_bot_builder TO postgres;
\q
```

> На macOS пользователь `postgres` обычно создаётся без пароля при установке через Homebrew.

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Шаг 7: Клонирование проекта</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

```bash
cd /opt
sudo git clone https://github.com/fedorabakumets/telegram-bot-builder.git
sudo chown -R "$USER":"$USER" telegram-bot-builder
cd telegram-bot-builder
```

</td>
<td valign="top">

```powershell
mkdir C:\projects
cd C:\projects
git clone https://github.com/fedorabakumets/telegram-bot-builder.git
cd telegram-bot-builder
```

</td>
<td valign="top">

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/fedorabakumets/telegram-bot-builder.git
cd telegram-bot-builder
```

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Шаг 8: Настройка окружения</strong></summary>

**1. Скопируйте шаблон:**

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

```bash
cp .env.example .env
nano .env
```

</td>
<td valign="top">

```powershell
copy .env.example .env
notepad .env
```

</td>
<td valign="top">

```bash
cp .env.example .env
nano .env
```

</td>
</tr>
</table>

**2. Минимальные переменные для локальной разработки:**

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_bot_builder

# Redis (Memurai на Windows, redis на Linux/macOS)
REDIS_URL=redis://localhost:6379

# Секрет для подписи сессий
SESSION_SECRET=любая-случайная-строка-для-локалки

# Ключ входа в /admin (OpenAPI и ops-панель)
ADMIN_API_KEY=любая-случайная-строка-для-локалки
```

> 🔐 **SESSION_SECRET — обязателен в production.** В режиме `development` можно указать любую строку (или вовсе опустить — будет dev-fallback с предупреждением). Но в `NODE_ENV=production` приложение **специально не запустится**, если `SESSION_SECRET` не задан: без него любой смог бы подделать cookie сессии и войти под чужим аккаунтом. Сгенерируйте надёжное случайное значение:
>
> ```bash
> # Linux/macOS (или Git Bash на Windows)
> openssl rand -hex 32
> # Любая ОС с Node.js
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
>
> При смене `SESSION_SECRET` все активные сессии становятся недействительными — пользователям нужно будет войти заново.

> 🔑 **ADMIN_API_KEY — обязателен в production** для доступа к админ-панели и OpenAPI-документации. В `development` переменную можно не задавать — будет использоваться небезопасный dev-fallback `dev-only-insecure-admin-key` (с предупреждением в лог). В production без `ADMIN_API_KEY` маршруты `/admin` и `/admin/docs` **не монтируются**. Сгенерируйте отдельное значение тем же способом, что и для `SESSION_SECRET`.

> 📖 **Документация API:**
>
> | Режим | Адрес | Доступ |
> |-------|-------|--------|
> | **Development** | `http://localhost:5000/docs` | Публично (удобно при разработке) |
> | **Development** | `http://localhost:5000/admin` | По ключу `ADMIN_API_KEY` (или dev-fallback) |
> | **Production** | `https://ваш-домен/admin/login` | Только по `ADMIN_API_KEY` |
> | **Production** | `https://ваш-домен/admin/docs` | После входа: Swagger, Scalar, Redoc, RapiDoc |
>
> Спецификация OpenAPI: `/docs-json` (dev) или `/admin/openapi.json` (prod, после входа).

> 💡 **Не хотите настраивать Telegram Login?** Добавьте `SKIP_AUTH=true` в `.env` — авторизация будет отключена в любом режиме (dev и production). Вместо Telegram виджета появится простая форма ввода ID.

> 💡 Telegram Login настраивается через Setup Wizard при первом запуске — вручную заполнять не нужно.

</details>

---

<details>
<summary><strong>Шаг 9: Установка зависимостей и запуск</strong></summary>

**1. Установка зависимостей Node.js:**
```bash
npm install
```

**2. Установка Python-зависимостей (для запуска ботов):**
```bash
pip install -r requirements.txt
```

**3. Запуск приложения:**

Для разработки достаточно одной команды:

```bash
npm run dev
```

Она запускает сервер и клиент одновременно с автоперезагрузкой — любые изменения в коде сразу применяются без перезапуска. Открывай в браузере `http://localhost:5000` и работай.

| Режим | Команда | Описание |
|-------|---------|----------|
| **🧪 Разработка** | `npm run dev` | Запуск с автоперезагрузкой при изменениях |
| **🚀 Продакшен** | `npm run build` → `npm run start` | Сборка и запуск готовой версии |

✅ **Готово!** Приложение доступно по адресу: `http://localhost:5000`

После запуска также доступны:
- **Редактор:** `http://localhost:5000`
- **OpenAPI (dev):** `http://localhost:5000/docs` — hub с выбором UI
- **Админка:** `http://localhost:5000/admin/login` — ключ из `ADMIN_API_KEY` (или `dev-only-insecure-admin-key`, если переменная не задана)

</details>

---

<details>
<summary><strong>Шаг 10: Настройка Telegram Login (Setup Wizard)</strong></summary>

> ⚠️ **Для локальной разработки (`NODE_ENV=development`) этот шаг необязателен** — приложение работает без авторизации. Setup Wizard нужен только при деплое в продакшен.

> 💡 **Если вы не хотите настраивать Telegram Login вообще** — добавьте `SKIP_AUTH=true` в `.env`. Авторизация будет отключена в любом режиме, вход по Telegram ID без верификации.

При первом открытии приложения в продакшене появится Setup Wizard — он попросит ввести данные для авторизации через Telegram.

**Как получить данные из BotFather:**

**1.** Откройте [@BotFather](https://t.me/BotFather) → выберите бота → **Bot Settings** → **Login Widget**

![Login Widget](../../assets/images/botfather-login-widget.png)

**2.** Переключитесь на OIDC:

![Switch to OIDC](../../assets/images/botfather-switch-to-oidc.png)

**3.** Подтвердите переключение:

![Confirm OIDC](../../assets/images/botfather-confirm-oidc.png)

**4.** Скопируйте **Client ID** и **Client Secret**:

![Client ID and Secret](../../assets/images/botfather-client-id-secret.png)

**5.** Укажите Redirect URIs (адрес вашего приложения):

![Redirect URIs](../../assets/images/botfather-redirect-uris.png)

> Для локальной разработки: `http://localhost:5000`

**6.** Введите полученные данные в Setup Wizard:
- **Client ID** — числовой ID
- **Client Secret** — секретный ключ
- **Bot Username** — имя бота без @

✅ После сохранения приложение готово к работе!

</details>

---

<details>
<summary><strong>Шаг 11: Подключение ИИ-агента через MCP (опционально)</strong></summary>

> 💡 Этот шаг нужен, только если вы хотите подключить ИИ-агента (Kiro / Cursor / Claude Desktop) для редактирования ботов на холсте в реальном времени. Для обычной работы он не требуется.

MCP-агент идентифицируется по персональному токену (PAT) — как API-ключ у GitHub/n8n. Токен привязан к вашему аккаунту и даёт доступ только к вашим проектам.

**1.** Откройте проект → вкладка **«Агент»** → кнопка **«Создать токен»**.

**2.** Задайте название (например «Kiro на ноуте») → **«Создать»**.

**3.** Полный токен `mcp_…` показывается **ровно один раз** — сразу скопируйте его. В базе хранится только sha-256 хеш, повторно секрет не отобразится.

**4.** Там же скопируйте готовый сниппет для `mcp.json` — значения уже подставлены. Вставьте его в конфиг вашего MCP-клиента:

```json
{
  "mcpServers": {
    "botcraft-builder": {
      "command": "npm",
      "args": ["run", "mcp:bot-builder"],
      "cwd": "<путь к каталогу проекта>",
      "env": {
        "API_BASE_URL": "http://localhost:5000",
        "MCP_AGENT_TOKEN": "mcp_..."
      }
    }
  }
}
```

> - `API_BASE_URL` — адрес сервера приложения (локально `http://localhost:5000`, на проде — ваш `https://`-домен).
> - `MCP_AGENT_TOKEN` — токен из шага 3. Храните его как пароль, в публичные репозитории не коммитьте (он не нужен в `.env` основного приложения — только в конфиге MCP-клиента).
> - Токен можно **мгновенно отозвать** на вкладке «Агент» кнопкой «Отозвать» — после этого он сразу перестаёт работать.

</details>

> 💡 **Нужно обновить проект?** См. [🔄 Как обновить проект с GitHub](HOW_TO_UPDATE.md)

---

