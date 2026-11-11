/**
 * @fileoverview Текущая инфраструктура панели BotCraft в Railway без управления секретами.
 */
import { bucket, defineRailway, github, group, postgres, project, redis, service, volume } from "railway/iac";

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
  const tbbBotBuilds = bucket("tbb-bot-builds", { region: "ams" });
  const PostgresPITR = bucket("Postgres-PITR", { region: "ams" });
  const tbbUploads = bucket("tbb-uploads", { region: "ams" });
  const tbbBackups = bucket("tbb-backups", { region: "ams" });
  const botBuilderBackend = service("bot builder backend", {
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
  const botRuntime = service("bot runtime", {
    source: telegramBotBuilder,
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "Dockerfile.runner", watchPatterns: ["/server/runner/**", "/server/redis/**", "/server/bots/**", "/server/routes/botIntegration/**", "/server/database/**", "/server/storages/**", "/server/storage/**", "/server/terminal/**", "/server/analytics/**", "/server/auth/agent/**", "/server/services/runtime-overlay.ts", "/server/utils/**", "/server/python/**", "/shared/**", "/requirements.txt", "/package.json", "/package-lock.json", "/tsconfig.node.json", "/Dockerfile.runner", "/railway.runtime.toml"] },
    start: "node /app/runner.cjs",
    replicas: { "europe-west4-drams3a": 1 },
    deploy: { drainingSeconds: 0, overlapSeconds: 0 },
    networking: { privateNetworkEndpoint: "bot-runtime" },
  });
  const botBuilderFrontend = service("bot builder frontend", {
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
    variables: { managed: false },
    resources: [botBuilderBackend, botRuntime, postgresQruoVolume, telegramBotBuilder_e3uVolume, redisVolume, tbbBotBuilds, tbbUploads, tbbBackups, awareEncouragement, fortunateAchievement],
  });
});
