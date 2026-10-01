# syntax=docker/dockerfile:1
# Исполнитель Cursor Cloud Agents (My Machines) для Railway: агент работает в клоне
# репозитория на томе /data. Подробно: docs/deployment/CURSOR_WORKER_RAILWAY.md
FROM node:22-bookworm

# git, Python для ботов, клиенты PostgreSQL 18 и Redis, gh и ripgrep для агента
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg git jq ripgrep \
      python3 python3-pip python3-venv redis-tools procps less \
 && install -d /usr/share/postgresql-common/pgdg \
 && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
 && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
 && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
 && echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client-18 gh \
 && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://cursor.com/install | bash
ENV PATH=/root/.local/bin:$PATH

COPY tools/cursor-worker/entrypoint.sh /usr/local/bin/cursor-worker-entrypoint
RUN chmod +x /usr/local/bin/cursor-worker-entrypoint

WORKDIR /data
CMD ["cursor-worker-entrypoint"]
