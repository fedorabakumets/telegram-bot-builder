// Terminal module exports
export { activeConnections } from './activeConnections';
export { getTerminalWss } from './getTerminalWss';
export { initializeTerminalWebSocket } from './initializeTerminalWebSocket';
export { sendMessage } from './sendMessage';
export { sendOutputToTerminals } from './sendOutputToTerminals';
export { sendStatusMessage } from './sendStatusMessage';
export { setTerminalWss } from './setTerminalWss';
export { setupBotProcessListeners } from './setupBotProcessListeners';
export { setupProcessOutputListener } from './setupProcessOutputListener';
export { globalWssContainer } from './terminal-websocket';
export type { TerminalMessage } from './TerminalMessage';