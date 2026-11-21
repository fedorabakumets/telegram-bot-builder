/** @fileoverview Сохраняет существующий плановый сервис освобождения файлового кеша PostgreSQL. */
import { image, preserve, service } from "railway/iac";

/** Действующие реквизиты остаются в Railway без выгрузки в репозиторий. */
export const postgresCacheCleaner = service("postgres-cache-cleaner", {
  source: image("postgres:18-alpine"),
  env: {
    PGAPPNAME: preserve(), PGCONNECT_TIMEOUT: preserve(), PGDATABASE: preserve(),
    PGHOST: preserve(), PGOPTIONS: preserve(), PGPASSWORD: preserve(),
    PGPORT: preserve(), PGUSER: preserve(),
  },
  start: 'psql -X -v ON_ERROR_STOP=1 -At -c "SELECT tbb_cache_maintenance.release_os_file_cache();"',
  replicas: { "europe-west4-drams3a": 1 },
  /** Сохраняет периодичность и ресурсы существующего однократного задания. */
  deploy: {
    cronSchedule: "*/5 * * * *", restartPolicyType: "NEVER",
    limitOverride: { containers: { cpu: 0.1, memoryBytes: 100000000 } },
  },
});
