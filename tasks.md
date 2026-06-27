# Open Paw — Tasks

> Execution checklist. Human-readable items first; technical notes as sub-bullets.
> Check items off as they ship. See [spec.md](spec.md) / [plan.md](plan.md).

## Wave: IDE surfaces + prompt analyzer

### Foundation — let the app read & write files
- [ ] Add the ability for the app to read a file, save a file, and list a folder
  - `readFile`/`writeFile`/`listDir` IPC: `shared/ipc.ts`, `host` (`files.ts`), `dispatch.ts`, `preload`, `web-client.ts`
  - `readFile` returns `{ content, truncated, binary }`; cap large files; detect binary
  - `listDir` returns `{ name, path, dir }[]`, sorted dirs-first

### Fix — clicking a spec/plan/tasks doc opens it in the app
- [ ] Clicking a doc (or its ↗) opens it in a built-in viewer pane, not the OS
  - `SpecPanel.tsx`: row click → `openFilePane(path)` instead of `openPath`
  - keep a separate "reveal in OS" affordance

### Built-in viewer: markdown + code + browser
- [ ] You can open a markdown or code file in a pane and read or edit it
  - new `WbPane.kind` `'file'`; `openFilePane` in `store.ts`; `FilePane.tsx`
  - `.md`: rendered (reuse `Markdown.tsx`) ⇄ source toggle; other: mono `<textarea>`
  - save button + Cmd/Ctrl-S → `writeFile`; dirty dot; binary/oversize notice
- [ ] You can open an integrated browser pane with a URL bar
  - new `WbPane.kind` `'browser'`; `openBrowserPane` in `store.ts`; `BrowserPane.tsx`
  - `<webview>` + URL bar (go/back/forward/reload/open-external); enable `webviewTag`

### Context inspector explains itself on hover
- [ ] Hovering a context section shows what it is and how to control it
  - `ContextInspector.tsx`: per-source explanation map; group-hover popover (ChatMetrics pattern)

### VS Code–style file/folder explorer
- [ ] A collapsible project file tree with file-type icons
  - `FileTree.tsx` (sidebar), lazy children via `listDir`
  - `fileIcons.ts` map (extension/filename → color/glyph) + `FileIcon` component
- [ ] Clicking a file opens it; edits save in-app
  - tree click → `openFilePane`; editing handled by FilePane

### Diff & approval (Devin-style)
- [ ] See every file the agent changed this session in one place
  - host `changes.ts`: snapshot original on first `write_file`/`edit_file` per session
  - `listChanges` IPC + `changesUpdated` event; "Changes" entry in the workbench
- [ ] Approve or revert changes per line, per file, or all at once
  - `DiffPane.tsx`: client-side line diff (small LCS), per-line keep/revert,
    per-file Approve/Revert, Approve-all/Revert-all
  - `revertChange`/`acceptChange`/`acceptAll` IPC

### Prompt analyzer in the composer
- [ ] As you type, the app identifies the parts of your prompt and flags weak spots
  - `promptAnalysis.ts` (pure, no LLM): part detection + lint rules + A–F score + model hint
  - composer UI: score + part checklist, expandable findings, inline underlines, toggle
- [ ] It suggests a model based on the prompt
  - complexity/context heuristic → frontier vs fast/cheap
- [ ] (Later) An opt-in "Improve prompt" button rewrites via the model
  - escalation to LLM; before/after diff; deferred

## Done this session
- (items move here as they land)
