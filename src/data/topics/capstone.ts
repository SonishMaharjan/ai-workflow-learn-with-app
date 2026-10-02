import type { Topic } from '../../types';

export const capstone: Topic = {
id:'capstone', icon:'🚀', title:'Capstone: Build "InvoiceScan" with Cursor', short:'Capstone project', tier:'project',
why:'One small project that touches EVERY requirement. Building it (AI-first, with Cursor) gives you real stories for "tell me about a time you…" questions. Keep it small — a working slice beats a perfect plan.',
steps:[
{title:'The project',
body:`<p><b>InvoiceScan</b> — a multi-tenant app where a company's staff snap/upload invoice PDFs on their phone; AI extracts the fields; the team gets reminders before due dates in their own timezone.</p>
<table><tr><th>Requirement</th><th>Where it shows up</th></tr>
<tr><td>Expo / React Native</td><td>Mobile app: login, upload PDF, invoice list/detail</td></tr>
<tr><td>NestJS + Postgres/TypeORM</td><td>API: auth, tenants, invoices, migrations</td></tr>
<tr><td>AWS Lambda / SQS / S3</td><td>Upload → queue → extraction worker</td></tr>
<tr><td>DynamoDB</td><td>Idempotency records for the worker</td></tr>
<tr><td>Rules / skills / evals</td><td><code>.cursor/rules</code>, one skill, an extraction eval</td></tr>
<tr><td>Timezones</td><td>Due-date reminders at 9:00 tenant-local</td></tr>
<tr><td>Multi-tenancy</td><td>tenant_id + RLS, tenant-scoped S3 keys</td></tr>
<tr><td>AI integration</td><td>LLM extracts invoice fields with tool calling</td></tr>
<tr><td>PDF processing</td><td>pdfjs text extraction, receipt generation</td></tr></table>`},
{title:'Week plan (≈1–2 h/day)',
body:`<ol>
<li><b>Day 1</b> — Monorepo (pnpm workspaces): <code>apps/api</code> (Nest), <code>apps/mobile</code> (Expo), <code>infra</code> (CDK). Docker Postgres. Write <code>AGENTS.md</code> + first rules.</li>
<li><b>Day 2</b> — Tenants, users, JWT auth, tenant middleware. Two-tenant isolation test.</li>
<li><b>Day 3</b> — Invoice entity + migration, CRUD, cursor pagination.</li>
<li><b>Day 4</b> — Expo app: login, invoice list (FlatList), detail screen with Expo Router.</li>
<li><b>Day 5</b> — Presigned upload + document picker. LocalStack S3 + SQS.</li>
<li><b>Day 6</b> — Worker: extract text (pdfjs) → LLM tool calling → save JSONB. Idempotency in DynamoDB.</li>
<li><b>Day 7</b> — Eval set of 10 sample invoices, reminders scheduler with Luxon, polish + README with architecture diagram.</li></ol>
<div class="callout ai"><b>Make it AI-driven</b>For every day: spec → plan mode → implement in steps → review diffs → commit. Keep a <code>LEARNINGS.md</code> of what the AI got wrong and the rule you added — that's gold for interviews.</div>`},
{title:'Starter AGENTS.md / rules for the project',
body:`<p>Put this at the repo root. Cursor, Claude Code and other agents will read it.</p>`,
code:`# AGENTS.md - InvoiceScan

## Stack
- apps/api: NestJS 10, TypeORM, Postgres 16. apps/mobile: Expo (Router), TanStack Query.
- infra: AWS CDK (TypeScript). Local AWS via LocalStack.

## Non-negotiables
- Every DB query is tenant-scoped (tenantId from ClsService). Never trust tenantId from the body.
- Timestamps are timestamptz in UTC. Tenant timezone lives in tenants.timezone (IANA).
- Money is numeric(12,2), never float.
- No TypeORM synchronize. Schema changes = migration.
- Workers must be idempotent (DynamoDB conditional put on documentId).
- Secrets only from env / Secrets Manager. Never in mobile code.

## Workflow
- Propose a plan before multi-file changes.
- Add/adjust tests with every change; run pnpm test before finishing.
- Keep PRs small; summarise changes + risks at the end.`},
{title:'Your interview story (STAR)',
body:`<p>Practise telling it in 2 minutes:</p>
<ul><li><b>Situation</b>: "I wanted hands-on experience with the full stack you use, so I built InvoiceScan…"</li>
<li><b>Task</b>: "multi-tenant, mobile upload, async AI extraction, timezone-aware reminders."</li>
<li><b>Action</b>: "I drove it with Cursor: specs, plan mode, rules for tenant scoping, a skill for migrations, and an eval set for extraction. Architecture: S3 → SQS → Lambda → Postgres…"</li>
<li><b>Result</b>: "extraction eval went from 6/10 to 9/10 after I improved the schema and prompt; caught a cross-tenant bug with my isolation tests; learned X about DST…"</li></ul>`},
],
questions:[
{q:'Tell me about a project where you used AI tools to build a feature end-to-end.',lvl:2,points:['Context & goal','How you used Cursor (spec, plan, @context, agent)','Rules/skills/evals you created','A mistake the AI made and how you caught it','Measurable result / what you learned'],
a:'Use your InvoiceScan story in STAR format: the goal, the architecture, how you steered the AI (spec → plan → steps → review), one concrete AI mistake (e.g. a query missing the tenant filter, caught by an isolation test) and the rule/eval you added, and a result such as eval score improvement.'},
{q:'Draw the architecture of a system that ingests invoice PDFs from mobile and extracts data with AI.',lvl:3,points:['Expo → API presign → S3 direct upload','S3 event → SQS (+DLQ) → Lambda worker','Text extraction/OCR → LLM tool calling → validation','Postgres (tenant-scoped, JSONB), status machine','Idempotency, retries, observability','Notifications back to app; timezone-aware reminders'],
a:'Mobile gets a presigned URL from the Nest API and uploads directly to S3 under a tenant prefix. The object-created event goes to SQS with a DLQ; a Lambda worker, idempotent via a DynamoDB conditional put, extracts text with pdfjs or Textract, calls the LLM with a tool schema, validates the result and writes it to Postgres as JSONB with a status. The app polls or gets a push notification. Reminders are computed from the tenant’s timezone and sent by an EventBridge-scheduled job. Everything is logged with tenant and document IDs.'},
]};
