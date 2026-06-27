# Open Paw — Spec

> **What & why.** This file captures the vision, the users, and the requirements for
> the current wave of work. The matching **How** lives in [plan.md](plan.md) and the
> concrete, checkable work items live in [tasks.md](tasks.md).

## Vision

Open Paw is a local-first AI coding & cowork desktop app (Electron + React). The aim
of this wave is to close the gap with full agentic IDEs (Cursor, Devin, cmux, Claude
Code) on the surfaces that matter for *staying in the app*: viewing and editing files,
reviewing AI-made changes, browsing a live preview, and writing better prompts — all
without leaving the calm single-window experience.

## Working process (applies to all future work)

- **Plan before building.** Every new piece of work starts by adding a human-readable
  execution checklist to [tasks.md](tasks.md) *before* code is written.
- **Human-readable first.** Checklist items read like plain product statements. Any
  technical detail goes as **indented sub-bullets** under the friendly item — never as
  the top-line.
- Keep [spec.md](spec.md) / [plan.md](plan.md) / [tasks.md](tasks.md) in sync as work
  lands; check items off in tasks.md as they ship.

## Users

- **Solo developers** running local or cloud models who want one window for chat,
  terminals, files, diffs, and a browser preview.
- **Prompt-conscious users** who want help writing stronger prompts and picking the
  right model — a differentiator we can market.

## Features in this wave

### 1. Built-in file viewer (fix: clicking a spec doc does nothing)
- Clicking a spec/plan/tasks row (or its ↗) must open the file **inside the app**, not
  hand off to the OS (`shell.openPath` silently fails when no app is registered for
  `.md`).
- A file opens as a **pane** in the workbench (alongside chats and terminals), so it can
  be split side-by-side. Markdown renders; code shows as text; both are viewable and
  editable.

### 2. Split viewing: markdown, code, and an integrated browser
- The workbench gains two new pane kinds: a **file pane** (markdown preview / code
  editor) and a **browser pane** (an integrated Chromium view with a URL bar).
- Inspired by Claude Code / cmux / Cursor: code-left, preview/browser-right is the
  default mental model; any pane can be split out.

### 3. Hoverable context inspector
- Each section of the Context Inspector explains itself on mouse-over (what the source
  is, why it's included, how to control it) — turning the provenance panel into a
  teaching surface.

### 4. VS Code–style file/folder explorer (not a full IDE)
- A collapsible file tree for each project with **file-type icons** (color-coded by
  extension, special-cased filenames like `package.json`, `Dockerfile`).
- Click to open in a file pane; **edit and save in-app** so users don't have to leave.

### 5. Diff & approval system for file changes (Devin-style)
- When the agent changes files, the user can **review a diff** and **approve (keep)** or
  **reject (revert)** changes at **line**, **file**, or **all-files** granularity.
- A "Changes" panel lists every file the agent touched this session.

### 6. Prompt analyzer (marketing edge)
- A live, zero-latency analyzer in the composer that **identifies the parts** of a prompt
  (role, task, context, examples, output format, constraints…), **underlines weak spots**
  inline, gives a **health score**, and suggests improvements + a **model recommendation**.
- Modeled on PromptLint's diagnostics approach (client-side, no API cost), with an
  optional LLM-powered "Improve" escalation later.

## Decisions & rationale (made autonomously; revisit if desired)

- **Open files in-app instead of the OS.** Matches the "stay in the app" goal and fixes
  the dead click. The OS hand-off (`openPath`) is kept only as a fallback / "reveal".
- **Browser pane uses Electron `<webview>`** for v1 (DOM-flow, simplest to place inside
  splittable panes). `WebContentsView` is more robust but requires main-process bounds
  syncing across split groups — deferred. (See plan.md.)
- **Editor is a lightweight textarea** (mono, save-on-demand), not CodeMirror/Monaco —
  honors the "simple, not a full IDE" goal and the project's small-dependency footprint.
  Markdown gets a rendered preview via the existing zero-dep `Markdown` renderer.
- **Diff/approve works by snapshotting** a file's original content the first time the
  agent modifies it in a session, then diffing current-vs-original. Writes still happen
  immediately (no disruption to the agent loop); "reject" reverts. This avoids gating the
  blocking tool loop while still giving a full review/revert UX.
- **Prompt analyzer is fully client-side** (regex/structural heuristics) so it's instant,
  offline, and free — the marketable "always-on" feel. LLM rewrite is a later opt-in.
- **File icons** use a single tinted glyph + a small curated category set, mapped by a
  JSON `{filename/extension → {icon,color}}` table (react-file-icon / Material Icon Theme
  model) — tiny asset footprint.

## Non-goals
- Not a full IDE (no language servers, no debugger, no Monaco).
- No multi-cursor / refactoring tooling.
- Browser pane is a preview/utility surface, not a hardened general web browser.
