# 🔄 Как обновить проект с GitHub

Руководство по обновлению локальной копии проекта из удалённого репозитория GitHub.

---

## 📋 Быстрое обновление

Если вы **не вносили локальных изменений**, выполните:

```bash
cd путь/к/проекту
git pull origin main
```

---

## 📖 Подробная инструкция

### Шаг 1: Перейдите в папку проекта

**Linux/macOS:**
```bash
cd /путь/к/проекту/telegram-bot-builder
```

**Windows (PowerShell):**
```powershell
cd C:\projects\telegram-bot-builder
```

**Windows (cmd):**
```cmd
cd C:\projects\telegram-bot-builder
```

---

### Шаг 2: Проверьте текущую ветку

Узнайте, в какой ветке вы находитесь:

```bash
git branch
```

Текущая ветка будет отмечена звёздочкой `*`:
```
  develop
* main
  feature-branch
```

> 💡 По умолчанию используется ветка **`main`** (или `master`)

---

### Шаг 3: Проверьте статус репозитория

Убедитесь, что у вас нет незакоммиченных изменений:

```bash
git status
```

**Хороший результат:**
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

**Если есть изменения:**
```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   README.md
  modified:   src/index.ts
```

---

### Шаг 4: Обновите проект

#### Способ 1: Простое обновление (рекомендуется)

```bash
git pull origin main
```

Или для других веток:
```bash
git pull origin master
git pull origin develop
```

**Что делает эта команда:**
1. `git fetch` — загружает изменения из удалённого репозитория
2. `git merge` — применяет изменения к вашей локальной копии

---

#### Способ 2: Сначала посмотреть изменения

Если хотите сначала проверить, что изменилось:

```bash
# Загрузить изменения, но не применять
git fetch origin

# Посмотреть новые коммиты
git log HEAD..origin/main --oneline

# Посмотреть подробные изменения в файлах
git diff HEAD..origin/main
```

Если всё в порядке, примените изменения:
```bash
git pull origin main
```

---

## ⚠️ Возможные проблемы и решения

### ❌ Конфликты слияния

**Ошибка:**
```
CONFLICT (content): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

**Причина:** Вы вносили локальные изменения в те же файлы, что и в удалённом репозитории.

**Решение:**

1. **Открыть файлы с конфликтами** — Git пометит конфликтные места:
   ```
   <<<<<<< HEAD
   Ваш локальный код
   =======
   Код из репозитория
   >>>>>>> origin/main
   ```

2. **Вручную отредактировать файл** — оставьте нужную версию или объедините обе

3. **Закоммить результат:**
   ```bash
   git add README.md
   git commit -m "Resolve merge conflict"
   ```

---

### ❌ Отмена локальных изменений

> ⚠️ **Внимание!** Это удалит все незакоммиченные изменения!

Если хотите полностью сбросить локальные правки и получить чистую копию:

```bash
# Отменить все изменения в рабочих файлах
git reset --hard HEAD

# Удалить все не tracked файлы (осторожно!)
git clean -fd

# Обновить проект
git pull origin main
```

---

### ❌ Локальные коммиты, которых нет в репозитории

Если вы сделали локальные коммиты:

```bash
git status
```
```
Your branch is ahead of 'origin/main' by 2 commits.
```

**Варианты:**

1. **Сохранить коммиты и обновиться:**
   ```bash
   git pull --rebase origin main
   ```

2. **Отменить локальные коммиты:**
   ```bash
   git reset --hard origin/main
   ```

---

## 🔍 Полезные команды

| Команда | Описание |
|---------|----------|
| `git status` | Показать статус репозитория |
| `git branch` | Показать текущую ветку |
| `git log --oneline -10` | Последние 10 коммитов |
| `git fetch origin` | Загрузить изменения, не применяя |
| `git diff HEAD..origin/main` | Показать различия |
| `git pull origin main` | Обновить проект |
| `git reset --hard` | Сбросить локальные изменения |
| `git stash` | Временно сохранить изменения |

---

## 💡 Советы

1. **Регулярно обновляйтесь** — делайте `git pull` раз в несколько дней
2. **Коммитьте свои изменения** — перед обновлением сохраняйте свои правки
3. **Создавайте свои ветки** — для экспериментов используйте отдельные ветки:
   ```bash
   git checkout -b my-feature
   ```
4. **Используйте `git stash`** — если нужно временно спрятать изменения:
   ```bash
   git stash          # Спрятать изменения
   git pull origin main
   git stash pop      # Вернуть изменения
   ```

---

## 📞 Если что-то пошло не так

1. **Проверьте подключение к репозиторию:**
   ```bash
   git remote -v
   ```
   Должно показать:
   ```
   origin  https://github.com/fedorabakumets/telegram-bot-builder.git (fetch)
   origin  https://github.com/fedorabakumets/telegram-bot-builder.git (push)
   ```

2. **Если репозиторий не подключён:**
   ```bash
   git remote add origin https://github.com/fedorabakumets/telegram-bot-builder.git
   ```

3. **Попробуйте обновить список удалённых веток:**
   ```bash
   git remote update origin --prune
   ```

4. **Создайте Issue на GitHub** — если проблема не решается

---

## 📚 Дополнительные ресурсы

- [Официальная документация Git](https://git-scm.com/doc)
- [Git Pull](https://git-scm.com/docs/git-pull)
- [Разрешение конфликтов слияния](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts)
