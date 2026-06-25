/**
 * @fileoverview Экспорт компонентов, хуков и типов вкладки «Агент» (токены MCP)
 *
 * @module editor/agent
 */

export { AgentTokensPanel } from "./AgentTokensPanel";
export { AgentTokensTable } from "./AgentTokensTable";
export { CreateTokenDialog } from "./CreateTokenDialog";
export { RevealTokenDialog } from "./RevealTokenDialog";
export { RevokeTokenAlert } from "./RevokeTokenAlert";
export { McpConfigSnippet } from "./McpConfigSnippet";
export { useAgentTokens, useCreateAgentToken, useRevokeAgentToken } from "./use-agent-tokens";
export type {
  AgentTokenDto,
  CreateAgentTokenBody,
  CreateAgentTokenResponse,
} from "./agent-token-types";
