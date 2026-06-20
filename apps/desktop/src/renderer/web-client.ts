import { IpcChannels, IpcEvents } from '@nekko/shared';
import type { AppSettings, AgentEvent, IndexStatus, NekkoApi } from '@nekko/shared';

/**
 * Browser transport for the web/Docker editions: implements the same NekkoApi
 * the Electron preload exposes, but over HTTP (`POST /api/:channel`) and a
 * WebSocket (`/api/events`). Installed only when no Electron preload bridge is
 * present, so the React UI is byte-for-byte identical across runtimes.
 */
function makeWebClient(): NekkoApi {
  // Token (only needed when the server is exposed beyond localhost). Accept it
  // from the URL once, then remember it for the session.
  const urlToken = new URLSearchParams(location.search).get('token');
  if (urlToken) sessionStorage.setItem('nekko_token', urlToken);
  const token = () => sessionStorage.getItem('nekko_token') ?? '';

  const call = async (channel: string, ...args: unknown[]): Promise<any> => {
    const res = await fetch(`/api/${channel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      },
      body: JSON.stringify({ args }),
    });
    if (!res.ok) throw new Error(`${channel}: HTTP ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

  // Event stream.
  const agentCbs = new Set<(e: AgentEvent) => void>();
  const indexCbs = new Set<(s: IndexStatus) => void>();
  let ws: WebSocket | null = null;
  const connect = () => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const q = token() ? `?token=${encodeURIComponent(token())}` : '';
    ws = new WebSocket(`${proto}://${location.host}/api/events${q}`);
    ws.onmessage = (ev) => {
      try {
        const { channel, payload } = JSON.parse(ev.data);
        if (channel === IpcEvents.agentEvent) agentCbs.forEach((cb) => cb(payload));
        else if (channel === IpcEvents.indexProgress) indexCbs.forEach((cb) => cb(payload));
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onclose = () => setTimeout(connect, 1000); // auto-reconnect
  };
  connect();

  return {
    getSettings: () => call(IpcChannels.settingsGet),
    updateSettings: (patch) => call(IpcChannels.settingsUpdate, patch),

    listProviders: () => call(IpcChannels.providersList),
    saveProvider: (p) => call(IpcChannels.providersSave, p),
    removeProvider: (id) => call(IpcChannels.providersRemove, id),
    discoverProviders: () => call(IpcChannels.providersDiscover),
    testProvider: (id) => call(IpcChannels.providersTest, id),

    listModels: (providerId) => call(IpcChannels.modelsList, providerId),
    pullModel: (providerId, model) => call(IpcChannels.modelPull, providerId, model),
    loadModel: (providerId, model) => call(IpcChannels.modelLoad, providerId, model),
    unloadModel: (providerId, model) => call(IpcChannels.modelUnload, providerId, model),

    listSessions: () => call(IpcChannels.sessionsList),
    createSession: (workspaceId) => call(IpcChannels.sessionCreate, workspaceId),
    getSession: (id) => call(IpcChannels.sessionGet, id),
    deleteSession: (id) => call(IpcChannels.sessionDelete, id),
    setSessionWorkspace: (sessionId, workspaceId) => call(IpcChannels.sessionSetWorkspace, sessionId, workspaceId),
    sendChat: (opts) => call(IpcChannels.chatSend, opts),
    abortChat: (sessionId) => call(IpcChannels.chatAbort, sessionId),
    approveTool: (sessionId, toolCallId, approved) => call(IpcChannels.toolApprove, sessionId, toolCallId, approved),

    previewContext: (sessionId, attachedPaths) => call(IpcChannels.contextPreview, sessionId, attachedPaths),
    toggleContextItem: (sessionId, itemId, included, pinned) =>
      call(IpcChannels.contextToggle, sessionId, itemId, included, pinned),
    setContextPrefs: (sessionId, prefs) => call(IpcChannels.contextSetPrefs, sessionId, prefs),

    listMemory: (scope, workspaceId) => call(IpcChannels.memoryList, scope, workspaceId),
    saveMemory: (entry) => call(IpcChannels.memorySave, entry),
    deleteMemory: (id) => call(IpcChannels.memoryDelete, id),

    listWorkspaces: () => call(IpcChannels.workspaceList),
    // No native folder picker in the browser — ask for a server-side path.
    addWorkspace: async () => {
      const p = window.prompt('Folder path on the server to add as a workspace:');
      return p ? call(IpcChannels.workspaceAddByPath, p) : call(IpcChannels.workspaceList);
    },
    addWorkspaceByPath: (path) => call(IpcChannels.workspaceAddByPath, path),
    removeWorkspace: (id) => call(IpcChannels.workspaceRemove, id),
    indexWorkspace: (id) => call(IpcChannels.workspaceIndex, id),
    getIndexStatus: (id) => call(IpcChannels.workspaceIndexStatus, id),
    searchWorkspace: (id, query) => call(IpcChannels.workspaceSearch, id, query),
    listFiles: (id) => call(IpcChannels.workspaceFiles, id),

    listConnectors: () => call(IpcChannels.connectorsList),
    connectConnector: (kind, t, settings) => call(IpcChannels.connectorConnect, kind, t, settings),
    disconnectConnector: (kind) => call(IpcChannels.connectorDisconnect, kind),
    fetchConnector: (kind, query) => call(IpcChannels.connectorFetch, kind, query),

    classifyCommand: (command) => call(IpcChannels.guardrailsClassify, command),
    saveGuardrail: async (rule) => {
      const settings: AppSettings = await call(IpcChannels.settingsGet);
      const guardrails = settings.guardrails.filter((g) => g.id !== rule.id);
      guardrails.push(rule);
      const updated: AppSettings = await call(IpcChannels.settingsUpdate, { guardrails });
      return updated.guardrails;
    },

    getUsageSummary: () => call(IpcChannels.usageSummary),

    onAgentEvent: (cb) => {
      agentCbs.add(cb);
      return () => agentCbs.delete(cb);
    },
    onIndexProgress: (cb) => {
      indexCbs.add(cb);
      return () => indexCbs.delete(cb);
    },
  };
}

/** Install the web client only if no Electron preload bridge already set window.nekko. */
export function ensureNekko(): void {
  if (!(window as any).nekko) {
    (window as any).nekko = makeWebClient();
  }
}
