# AGENTS.md

Instructions for AI coding agents (Cursor, Claude Code, etc.) working on this repo.

## Stack
- React 18 + TypeScript (strict) + Vite. No UI library, no router library (see src/router.ts).
- Styling: plain CSS in src/index.css using the CSS variables in :root. Dark theme.

## Conventions
- Content lives ONLY in src/data/topics/*.ts and must match the types in src/types.ts.
- Lesson `body` is trusted static HTML. Avoid backticks and "${" inside content template literals.
- Question ids are derived from position (topicId-index). Append new questions at the END of a
  topic's list so existing saved answers don't shift.
- All persisted state goes through useProgress() in src/store/progress.tsx.
- Keep components small and typed; no `any` except where external data is parsed.

## Before finishing a task
- Run `npm run typecheck` and `npm run build`.
- Summarise what changed and anything the user should check manually.
