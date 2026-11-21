/**
 * @fileoverview Текущая инфраструктура панели BotCraft в Railway без управления секретами.
 */
import { backendEnvironment, frontendEnvironment, runtimeEnvironment } from "./preserved-environment.ts";
import { postgresCacheCleaner } from "./postgres-cache-cleaner.ts";
import { bucket, defineRailway, github, group, postgres, preserve, project, redis, service, volume } from "railway/iac";

/** Создаёт описание существующего проекта Railway для сверки и будущих изменений. */
export default defineRailway(() => {
  const telegramBotBuilder = github("fedorabakumets/telegram-bot-builder", { branch: "main", checkSuites: false });

  /** Фиксирует версию PostgreSQL после штатного обновления рабочей базы в Railway. */
  const PostgresQrUo = postgres("Postgres-QrUo", { region: "europe-west4-drams3a", image: "ghcr.io/railwayapp-templates/postgres-ssl:18" });
  PostgresQrUo.networking = { privateNetworkEndpoint: "postgres-qruo" };
  const Redis = redis("Redis", { region: "europe-west4-drams3a" });
  Redis.deploy = { startCommand: "/bin/sh -c \"rm -rf $RAILWAY_VOLUME_MOUNT_PATH/lost+found/ && exec docker-entrypoint.sh redis-server --requirepass $REDIS_PASSWORD --save 60 1 --dir $RAILWAY_VOLUME_MOUNT_PATH\"" };
  Redis.networking = { privateNetworkEndpoint: "redis" };
  const postgresQruoVolume = volume("postgres-qruo-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "europe-west4-drams3a", sizeMB: 5000 });
  const telegramBotBuilder_e3uVolume = volume("telegram-bot-builder-_e3u-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "europe-west4-drams3a", sizeMB: 5000 });
  const redisVolume = volume("redis-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "europe-west4-drams3a", sizeMB: 5000 });
  /** Сохраняет локальную блокировку и журнал блокировок единственного владельца Telegram-сессий. */
  const telegramAccountsVolume = volume("telegram-accounts-volume", { region: "europe-west4-drams3a", sizeMB: 1000 });
  const tbbBotBuilds = bucket("tbb-bot-builds", { region: "ams" });
  const PostgresPITR = bucket("Postgres-PITR", { region: "ams" });
  const tbbUploads = bucket("tbb-uploads", { region: "ams" });
  /** Хранит приватные снимки истории версий проектов. */
  const tbbProjectVersions = bucket("tbb-project-versions", { region: "ams" });
  const botRuntime = service("bot runtime", {
    source: telegramBotBuilder,
    /** Принимает обновления в Node и лениво загружает общий Python для активных сценариев. */
    env: { ...runtimeEnvironment, RUNNER_PROCESS_POLLING: "node", RUNNER_PROCESS_HANDLER: "shared", RUNNER_PYTHON_HOST: "unified", RUNNER_WEBHOOK_PORT: "9080",
      /** Внутренние операции направляются API, а не публичному frontend. */
      PROJECT_TELEGRAM_API_BASE: "http://${{bot builder backend.RAILWAY_PRIVATE_DOMAIN}}:${{bot builder backend.PORT}}",
    },
    /** Исполнитель пересобирается только при изменении зависимостей управления ботами. */
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile.runner", watchPatterns: ["/server/runner/**", "/server/redis/**", "/server/bots/**", "/server/services/runtime-overlay.ts", "/server/utils/**", "/server/python/**", "/requirements.txt", "/package.json", "/package-lock.json", "/tsconfig.node.json", "/Dockerfile.runner", "/.railway/railway.ts"] },
    start: "node /app/runner.cjs",
    replicas: { "europe-west4-drams3a": 1 },
    /** Сохраняет действующие ограничения ресурсов исполнителя при добавлении брокера. */
    deploy: { drainingSeconds: 0, overlapSeconds: 0, limitOverride: { containers: { cpu: 24, memoryBytes: 500000000 } } },
    networking: { privateNetworkEndpoint: "bot-runtime" },
  });
  const botBuilderBackend = service("bot builder backend", {
    /** Секреты и подключения сохраняются на стороне Railway. */
    env: { ...backendEnvironment, RUNNER_WEBHOOK_URL: "http://${{bot runtime.RAILWAY_PRIVATE_DOMAIN}}:9080", RUNNER_WEBHOOK_SECRET: botRuntime.env.RUNNER_WEBHOOK_SECRET,
      /** Сохраняет действующие секреты и флаги; включение аккаунтов выполняется отдельным контролируемым переносом. */
      PROJECT_TELEGRAM_ACCOUNTS_ENABLED: preserve(), PROJECT_TELEGRAM_ACCOUNT_CUTOVER_ENABLED: preserve(),
      PROJECT_TELEGRAM_RUNNER_SECRET: preserve(), TELETHON_BROKER_SECRET: preserve(),
      PROJECT_TELEGRAM_API_BASE: "http://${{bot builder backend.RAILWAY_PRIVATE_DOMAIN}}:${{bot builder backend.PORT}}",
      TELETHON_BROKER_URL: "http://${{telegram-accounts.RAILWAY_PRIVATE_DOMAIN}}:8765",
    },
    source: telegramBotBuilder,
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile.backend", watchPatterns: ["/server/**", "/lib/**", "/shared/**", "/client/utils/**", "/client/components/editor/sidebar/parsePythonCodeToJson.ts", "/scripts/**", "/migrations/**", "/assets/**", "/requirements.txt", "/package.json", "/package-lock.json", "/.npmrc", "/.dockerignore", "/tsconfig*.json", "/drizzle.config.ts", "/version.json", "/Dockerfile.backend", "/railway.backend.toml"] },
    start: "node dist/server/index.js",
    healthcheck: "/api/health",
    healthcheckTimeout: 180,
    replicas: { "europe-west4-drams3a": 1 },
    deploy: { drainingSeconds: 30, overlapSeconds: 0 },
    networking: { privateNetworkEndpoint: "botcraft-backend" },
    volumeMounts: { "/app/uploads": telegramBotBuilder_e3uVolume },
  });
  /** Единственный приватный брокер обслуживает общие аккаунты всех ботов через API. */
  const telegramAccounts = service("telegram-accounts", {
    source: telegramBotBuilder,
    env: {
      /** Секрет хранится у существующего API; новый сервис получает только ссылку на него. */
      TELETHON_BROKER_SECRET: botBuilderBackend.env.TELETHON_BROKER_SECRET,
      REDIS_URL: Redis.env.REDIS_URL,
      TELETHON_BROKER_ALLOW_PRIVATE_NETWORK: "1", TELETHON_BROKER_HOST: "::",
      TELETHON_BROKER_PORT: "8765", PORT: "8765",
      TELETHON_BROKER_LOCK_FILE: "/var/lib/botcraft-telegram/broker.lock",
    },
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile.telegram-accounts",
      watchPatterns: ["/server/python/telethon_account_broker.py", "/server/python/telethon_broker_*.py", "/requirements.txt", "/Dockerfile.telegram-accounts", "/.dockerignore", "/.railway/**"],
    },
    /** Команда образа подготавливает права подключённого тома и понижает привилегии процесса. */
    healthcheck: "/healthz", healthcheckTimeout: 90,
    replicas: { "europe-west4-drams3a": 1 },
    /** Не допускает перекрытия владельцев и даёт завершиться активным операциям и отключению сессий. */
    deploy: { drainingSeconds: 75, overlapSeconds: 0 },
    networking: { privateNetworkEndpoint: "telegram-accounts" },
    volumeMounts: { "/var/lib/botcraft-telegram": telegramAccountsVolume },
  });
  const botBuilderFrontend = service("bot builder frontend", {
    /** Сохраняет действующий адрес API и настройки публикации. */
    env: frontendEnvironment,
    source: github("fedorabakumets/telegram-bot-builder", { branch: "main", checkSuites: false, upstreamUrl: "https://github.com/fedorabakumets/telegram-bot-builder" }),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile.frontend", watchPatterns: ["/client/**", "/frontend/**", "/shared/**", "/lib/**", "/assets/**", "/attached_assets/**", "/scripts/vite*.ts", "/package.json", "/package-lock.json", "/.npmrc", "/.dockerignore", "/vite.config.ts", "/tailwind.config.ts", "/postcss.config.js", "/tsconfig*.json", "/Dockerfile.frontend", "/railway.frontend.toml"] },
    start: "node frontend/index.mjs",
    healthcheck: "/api/health",
    healthcheckTimeout: 60,
    replicas: { "europe-west4-drams3a": 1 },
    networking: { privateNetworkEndpoint: "telegram-bot-builder-e3u" },
  });
  const awareEncouragement = group("aware-encouragement", [PostgresQrUo, botBuilderFrontend, PostgresPITR]);
  const fortunateAchievement = group("fortunate-achievement", [Redis]);

  return project("tbb-panel", {
    variables: { managed: true },
    resources: [botBuilderBackend, botRuntime, telegramAccounts, telegramAccountsVolume, postgresCacheCleaner, postgresQruoVolume, telegramBotBuilder_e3uVolume, redisVolume, tbbBotBuilds, tbbUploads, tbbProjectVersions, awareEncouragement, fortunateAchievement],
  });
});
