# AI-Driven Full-Stack Interview Prep

An interactive study app (React + TypeScript + Vite) for preparing for a role using:
Expo / React Native · NestJS + Postgres/TypeORM · AWS (Lambda, SQS, S3, DynamoDB) ·
AI-assisted development (Cursor, rules, skills, evals) · plus timezones, multi-tenancy,
AI integration and PDF processing.

## Run it

```bash
npm install        # or pnpm install
npm run dev        # open the URL Vite prints (usually http://localhost:5173)
```

Other scripts: `npm run build`, `npm run preview`, `npm run typecheck`.

## What's inside

| Page | What it does |
|------|--------------|
| Home & roadmap | Overall progress, the 6-phase learning flow, export/import of your data |
| Topic → Learn | Step-by-step lessons with code examples and a **Cursor prompt** per step |
| Topic → Interview practice | Write your answer → reveal key points → tick what you covered → rate yourself |
| Review queue | Answers rated Again/Hard stay here; Good/Easy come back after 3/7 days |
| Mock interview | Random questions, timer per question, review at the end |
| Tools checklist | Everything to install and try once |

Progress is saved in your browser's localStorage. Use **Export** on the Home page for backups.

**🤖 Copy AI review prompt** on each question copies a ready prompt (question + key points +
your answer) to paste into Claude/ChatGPT/Cursor chat for detailed feedback.

## Project structure

```
src/
  types.ts                 Topic / Step / Question / Progress types
  data/
    index.ts               TOPICS list, ROADMAP, TOOLS
    topics/core.ts         AI-assisted dev, Expo/RN, NestJS, Postgres+TypeORM
    topics/aws.ts          Lambda/SQS/S3/IAM, DynamoDB
    topics/bonus.ts        Timezones, Multi-tenancy, AI integration, PDF processing
    topics/capstone.ts     The "InvoiceScan" practice project
  store/progress.tsx       React context + localStorage persistence
  router.ts                Tiny hash router (no dependency)
  components/              Sidebar, QuestionCard, CodeBlock, UI bits
  pages/                   Home, TopicPage, Review, Mock, Tools
```

## Practise AI-driven development ON this app

This repo includes `AGENTS.md` and `.cursor/rules/` — open it in Cursor and try:

1. `Add a new topic "Testing (Jest + Supertest)" to src/data/topics with 4 steps and 4 questions, following the existing format.`
2. `Add a dark/light theme toggle stored in localStorage.`
3. `Add a "Notes" textarea per lesson step, saved in Progress.`
4. `Write Vitest tests for topicStats and overallStats in src/store/progress.tsx.`

Review each diff before accepting — that's exactly the skill interviewers are looking for.
