/**
 * @fileoverview Запрос к GraphQL API Railway с токеном: общий для исполнителей
 * из `.env` панели и для площадок, которые пользователь создаёт своим токеном.
 * @module server/sites/railway/railwayGraphql
 */

/** Адрес публичного API Railway */
const RAILWAY_API_URL = "https://backboard.railway.com/graphql/v2";

/** Таймаут одного запроса к API по умолчанию */
const REQUEST_TIMEOUT_MS = 30_000;

/** Доступ к API Railway */
export interface RailwayAuth {
  /** Токен аккаунта, workspace или проекта */
  token: string;
  /** Токен проекта: передаётся в заголовке Project-Access-Token */
  projectToken?: boolean;
}

/** Ошибка ответа Railway API с исходными сообщениями GraphQL */
export class RailwayApiError extends Error {
  /** Сообщения GraphQL или HTTP-статус */
  readonly reasons: string[];

  /**
   * @param reasons - Сообщения об ошибке от Railway
   */
  constructor(reasons: string[]) {
    super(`Railway API: ${reasons.join("; ")}`);
    this.name = "RailwayApiError";
    this.reasons = reasons;
  }
}

/**
 * Выполняет запрос к API Railway
 * @param auth - Токен
 * @param query - Текст GraphQL
 * @param variables - Переменные запроса
 * @param timeoutMs - Таймаут запроса
 * @returns поле data ответа
 * @throws RailwayApiError при ошибке GraphQL или HTTP
 */
export async function railwayGraphql<T>(
  auth: RailwayAuth,
  query: string,
  variables: Record<string, unknown> = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const header: Record<string, string> = auth.projectToken
    ? { "Project-Access-Token": auth.token }
    : { Authorization: `Bearer ${auth.token}` };
  const response = await fetch(RAILWAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...header },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = (await response.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] };
  if (!response.ok || body.errors?.length || !body.data) {
    throw new RailwayApiError(body.errors?.map((e) => e.message) ?? [`HTTP ${response.status}`]);
  }
  return body.data;
}
