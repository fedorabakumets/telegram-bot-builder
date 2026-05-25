# Installation Guide

[🇷🇺 Русский](INSTALLATION.md) | **🇬🇧 English**

## 📜 Step-by-Step Guide

<details>
<summary><strong>🐳 Quick Start: Docker (recommended)</strong></summary>

**Requirements:** Docker and Docker Compose

```bash
git clone https://github.com/fedorabakumets/telegram-bot-builder.git
cd telegram-bot-builder
docker compose up -d
docker compose logs -f
```

**Useful commands:**

```bash
docker compose down        # Stop
docker compose build --no-cache  # Rebuild
docker compose logs -f     # Logs
```

✅ **Done!** App available at: `http://localhost:5000`

</details>

---

### Manual Installation

### Requirements
- **Node.js** ≥ 18.0.0
- **PostgreSQL** ≥ 17
- **Redis** ≥ 7
- **Python** ≥ 3.10 (3.13 recommended, for generated bots)
- **Git**
<details>
<summary><strong>Step 1: Install Git</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux (Ubuntu/Debian)</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Option 1: Via terminal (recommended):**

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

**Option 2: From website:**
- Go to [git-scm.com/install/linux](https://git-scm.com/install/linux)
- Select your distribution
- Follow the installation instructions

**Verify installation:**
```bash
git --version
```

</td>
<td valign="top">

**Option 1: Via winget (recommended):**
```powershell
winget install --id Git.Git -e --source winget
```

**Option 2: Via installer:**
- Download from [git-scm.com/install/windows](https://git-scm.com/install/windows)
- Run the `.exe` file
- Keep default settings (click "Next")

**Verify installation:**
Open PowerShell as administrator (`Win + X` → "Terminal (Admin)"):
```powershell
git --version
```

> If the version is not displayed, restart PowerShell

</td>
<td valign="top">

**Option 1: Via Homebrew (recommended):**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git
```

**Option 2: From website:**
- Go to [git-scm.com/install/mac](https://git-scm.com/install/mac)
- Download the macOS installer (`.dmg`)
- Open the `.dmg` file and drag Git to Applications

**Verify installation:**
```bash
git --version
```

> Homebrew is a package manager for macOS that simplifies software installation

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Step 2: Install Node.js LTS</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Option 1: Via terminal (recommended):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

**Option 2: From website:**
- Go to [nodejs.org](https://nodejs.org/)
- Download the `.deb` or `.rpm` package
- Install: `sudo dpkg -i nodejs_*.deb`

</td>
<td valign="top">

**Option 1: Via winget:**
```powershell
winget install OpenJS.NodeJS.LTS
node -v && npm -v
```

**Option 2: From website:**
- Go to [nodejs.org](https://nodejs.org/)
- Download the installer (`.msi`)
- Run and follow the instructions
- Verify installation:
```powershell
node -v
npm -v
```

</td>
<td valign="top">

**Option 1: Via Homebrew:**
```bash
brew install node@lts
node -v && npm -v
```

**Option 2: From website:**
- Go to [nodejs.org](https://nodejs.org/)
- Download the installer (`.pkg`)
- Run and follow the instructions

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Step 3: Install PostgreSQL</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Option 1: Via terminal:**
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**Option 2: Official repository:**
- Visit [postgresql.org/download/linux](https://www.postgresql.org/download/linux/)
- Select your distribution
- Follow the instructions

</td>
<td valign="top">

**Option 1: Via winget (recommended):**
```powershell
winget install PostgreSQL.PostgreSQL.17
```

> During installation, remember the password for the `postgres` user (default: `postgres`). Port: `5432`.

**Verify installation:**
```powershell
psql -U postgres -c "SELECT version();"
```

**Option 2: From website:**
- Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
- Download the installer
- Run and remember the `postgres` password

</td>
<td valign="top">

**Option 1: Via Homebrew:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Option 2: From website:**
- Go to [postgresql.org/download/macosx](https://www.postgresql.org/download/macosx/)
- Download the installer
- Run and follow the instructions

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Step 4: Install Python 3</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Option 1: Via terminal:**
```bash
sudo apt install -y python3 python3-venv python3-pip
python3 --version
```

**Option 2: Official website:**
- Visit [python.org/downloads](https://www.python.org/downloads/)
- Select the version for Linux
- Follow the compilation instructions

</td>
<td valign="top">

**Option 1: Via winget:**
```powershell
winget install Python.Python.3.12
```

**Option 2: From website:**
- Go to [python.org/downloads](https://www.python.org/downloads/)
- Download the installer
- During installation, check **"Add Python to PATH"**
- Verify installation:
```powershell
python --version
```

</td>
<td valign="top">

**Option 1: Via Homebrew:**
```bash
brew install python
python3 --version
```

**Option 2: From website:**
- Go to [python.org/downloads](https://www.python.org/downloads/)
- Download the macOS installer (`.pkg`)
- Run and follow the instructions

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Step 5: Install Redis</strong></summary>

<table>
<tr>
<th width="33%">🐧 Linux (Ubuntu/Debian)</th>
<th width="33%">🏁 Windows</th>
<th width="33%">🍎 macOS</th>
</tr>
<tr>
<td valign="top">

**Option 1: Via terminal:**
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Verify installation:**
```bash
redis-cli ping
```
> Should respond with `PONG`

</td>
<td valign="top">

**Option 1: Memurai (recommended for Windows):**

Memurai is a native Windows port, fully compatible with Redis 7.2+. It installs as a Windows service and works without WSL.

```powershell
winget install Memurai.MemuraiDeveloper
```

After installation, the service starts automatically. Management:
```powershell
net start Memurai   # Start
net stop Memurai    # Stop
```

**Option 2: Via WSL2:**

Install Redis inside WSL:
```bash
sudo apt install -y redis-server
sudo service redis-server start
```

**Option 3: Docker:**
```powershell
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Verify installation:**
```powershell
redis-cli ping
```
> Should respond with `PONG`

</td>
<td valign="top">

**Option 1: Via Homebrew:**
```bash
brew install redis
brew services start redis
```

**Verify installation:**
```bash
redis-cli ping
```
> Should respond with `PONG`

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Step 6: Database Setup</strong></summary>

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

> By default, the built-in `postgres` user is used. The password is set during PostgreSQL installation.

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

> The `postgres` password is set during installation. If you forgot it, reinstall or change it via `ALTER USER postgres PASSWORD 'new_password';`

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

> On macOS, the `postgres` user is usually created without a password when installed via Homebrew.

</td>
</tr>
</table>

</details>

---

<details>
<summary><strong>Step 7: Clone the Project</strong></summary>

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
<summary><strong>Step 8: Environment Setup</strong></summary>

**1. Copy the template:**

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

**2. Minimal variables for local development:**

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/telegram_bot_builder

# Redis (Memurai on Windows, redis on Linux/macOS)
REDIS_URL=redis://localhost:6379
```

> 💡 Telegram Login is configured via Setup Wizard on first launch — no manual setup needed.

</details>

---

<details>
<summary><strong>Step 9: Install Dependencies and Run</strong></summary>

**1. Install Node.js dependencies:**
```bash
npm install
```

**2. Install Python dependencies (for running bots):**
```bash
pip install -r requirements.txt
```

**3. Run the application:**

| Mode | Command | Description |
|------|---------|-------------|
| **🧪 Development** | `npm run dev` | Run with auto-reload on changes |
| **🚀 Production** | `npm run build` → `npm run start` | Build and run the production version |

✅ **Done!** App available at: `http://localhost:5000`

</details>

---

<details>
<summary><strong>Step 10: Telegram Login Setup (Setup Wizard)</strong></summary>

> ⚠️ **For local development (`NODE_ENV=development`) this step is optional** — the app works without authentication. Setup Wizard is only needed for production deployment.

On first launch in production, the Setup Wizard will appear — it will ask you to enter credentials for Telegram authentication.

**How to get credentials from BotFather:**

**1.** Open [@BotFather](https://t.me/BotFather) → select your bot → **Bot Settings** → **Login Widget**

![Login Widget](../../assets/images/botfather-login-widget.png)

**2.** Switch to OIDC:

![Switch to OIDC](../../assets/images/botfather-switch-to-oidc.png)

**3.** Confirm the switch:

![Confirm OIDC](../../assets/images/botfather-confirm-oidc.png)

**4.** Copy the **Client ID** and **Client Secret**:

![Client ID and Secret](../../assets/images/botfather-client-id-secret.png)

**5.** Set the Redirect URIs (your application address):

![Redirect URIs](../../assets/images/botfather-redirect-uris.png)

> For local development: `http://localhost:5000`

**6.** Enter the obtained credentials in the Setup Wizard:
- **Client ID** — numeric ID
- **Client Secret** — secret key
- **Bot Username** — bot name without @

✅ After saving, the application is ready to use!

</details>

> 💡 **Need to update the project?** See [🔄 How to Update from GitHub](HOW_TO_UPDATE.md)

---
