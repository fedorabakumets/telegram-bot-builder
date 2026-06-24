/**
 * @fileoverview Хуки данных вкладки «Агент»: список, создание и отзыв токенов MCP
 *
 * @module editor/agent/use-agent-tokens
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/queryClient";
import type {
  AgentTokenDto,
  CreateAgentTokenBody,
  CreateAgentTokenResponse,
} from "./agent-token-types";

/** Ключ кеша списка токенов агента */
const AGENT_TOKENS_KEY = "/api/agent-tokens";

/**
 * Загружает список персональных токенов агента текущего пользователя.
 * @returns Результат useQuery с массивом токенов
 */
export function useAgentTokens() {
  return useQuery<AgentTokenDto[]>({ queryKey: [AGENT_TOKENS_KEY] });
}

/**
 * Создаёт новый токен агента. После успеха обновляет список.
 * @returns Мутация создания токена
 */
export function useCreateAgentToken() {
  return useMutation<CreateAgentTokenResponse, Error, CreateAgentTokenBody>({
    mutationFn: (body) => apiRequest("POST", AGENT_TOKENS_KEY, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENT_TOKENS_KEY] });
    },
  });
}

/**
 * Отзывает токен агента по id. После успеха обновляет список.
 * @returns Мутация отзыва токена
 */
export function useRevokeAgentToken() {
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: (id) => apiRequest("DELETE", `${AGENT_TOKENS_KEY}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AGENT_TOKENS_KEY] });
    },
  });
}
