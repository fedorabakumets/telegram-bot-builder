## 📜 Пошаговая инструкция
### Требования
- **Node.js** ≥ 18.0.0
- **PostgreSQL** ≥ 15
- **Redis** ≥ 7
- **Python** ≥ 3.10 (рекомендуется 3.13, для сгенерированных ботов)
- **Git**
<details>
<summary><strong>Шаг 1: Обновление системы и установка зависимостей</strong></summary>

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

**Способ 1: Через winget:**
```powershell
winget install PostgreSQL.PostgreSQL
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
CREATE USER tbb WITH PASSWORD 'builder2025!' LOGIN;
CREATE DATABASE telegram_bot_builder OWNER tbb;
GRANT ALL PRIVILEGES ON DATABASE telegram_bot_builder TO tbb;
GRANT ALL ON SCHEMA public TO tbb;
\q
```

</td>
<td valign="top">

```powershell
psql -U postgres
```

```sql
CREATE USER tbb WITH PASSWORD 'builder2025!' LOGIN;
CREATE DATABASE telegram_bot_builder OWNER tbb;
GRANT ALL PRIVILEGES ON DATABASE telegram_bot_builder TO tbb;
GRANT ALL ON SCHEMA public TO tbb;
\q
```

</td>
<td valign="top">

```bash
psql postgres
```

```sql
CREATE USER tbb WITH PASSWORD 'builder2025!' LOGIN;
CREATE DATABASE telegram_bot_builder OWNER tbb;
GRANT ALL PRIVILEGES ON DATABASE telegram_bot_builder TO tbb;
GRANT ALL ON SCHEMA public TO tbb;
\q
```

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

**Пример `.env` для всех систем:**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://tbb:builder2025!@localhost:5432/telegram_bot_builder
```

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

</details>

---

<details>
<summary><strong>Шаг 9: Установка зависимостей и запуск</strong></summary>

**1. Установка зависимостей:**
```bash
npm install
```

**2. Запуск приложения:**

| Режим | Команда | Описание |
|-------|---------|----------|
| **🧪 Разработка** | `npm run dev` | Запуск с автоперезагрузкой при изменениях |
| **🚀 Продакшен** | `npm run build` → `npm run start` | Сборка и запуск готовой версии |

✅ **Готово!** Приложение доступно по адресу: `http://localhost:5000`

</details>

---

<details>
<summary><strong>🐳 Альтернатива: Docker (любая ОС)</strong></summary>

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

> 💡 **Нужно обновить проект?** См. [🔄 Как обновить проект с GitHub](HOW_TO_UPDATE.md)

---

