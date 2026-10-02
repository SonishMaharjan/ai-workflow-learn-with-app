import type { Topic } from '../../types';

// AI-driven team delivery guide, part 1: big picture, setup, Claude Code config, agents, MCP.
export const foundationChapters: Topic[] = [
/* ---------------------------------------------------------- */
{
id:'g-overview', icon:'🧭', title:'The Big Picture: AI-Driven Team Delivery', short:'0 · Big picture',
why:'Before installing anything, understand the whole journey: how a team takes an idea from a Jira ticket to production with an AI coding agent (Claude Code) doing most of the typing, while humans own the decisions, the reviews and the quality.',
steps:[
{title:'What "AI-driven development" means in a real team',
body:`<p>In a modern team the AI agent is part of <b>every stage</b>, not only "write code". Humans decide and review; the agent drafts, implements, tests and reports.</p>
<table><tr><th>Stage</th><th>Human does</th><th>Claude does</th><th>Output</th></tr>
<tr><td><b>1. Idea</b></td><td>PM writes the epic in Jira</td><td>Reads the epic, asks clarifying questions</td><td>Jira epic</td></tr>
<tr><td><b>2. Design</b></td><td>Designer makes Figma screens, team agrees on architecture</td><td>Drafts the PRD, architecture doc, ADRs, data model, API contract</td><td>docs/ + Figma</td></tr>
<tr><td><b>3. Plan</b></td><td>Tech lead approves the breakdown</td><td>Splits the epic into stories with acceptance criteria (via Jira MCP)</td><td>Jira stories</td></tr>
<tr><td><b>4. Build</b></td><td>Dev picks a story, reviews the plan</td><td>Plan mode → implements step by step, using rules + skills</td><td>Commits on a branch</td></tr>
<tr><td><b>5. Test</b></td><td>Checks tests are meaningful</td><td>Writes unit/integration/e2e tests, runs them, fixes failures</td><td>Green test suite</td></tr>
<tr><td><b>6. PR</b></td><td>Opens / owns the PR</td><td>Writes the PR description, links Jira, runs a reviewer subagent</td><td>Pull request</td></tr>
<tr><td><b>7. Review</b></td><td>Teammate approves (required)</td><td>Claude GitHub Action reviews, answers @claude comments</td><td>Approved PR</td></tr>
<tr><td><b>8. Deliver</b></td><td>Approves prod deploy</td><td>CI runs tests + evals, CDK deploys, writes release notes</td><td>Running feature</td></tr>
<tr><td><b>9. Learn</b></td><td>Retro</td><td>Turns repeated mistakes into new rules, skills, evals</td><td>Better AI setup</td></tr></table>
<div class="callout"><b>The one rule</b>The AI can write 90% of the code, but a <b>human is accountable</b> for every merged line. Nothing merges without a human reading it and CI passing.</div>`,
prompt:`Explain, in a table, how you (Claude Code) can help at each stage of our team's delivery process: idea, design, planning, implementation, testing, pull request, code review, deployment and retro. For each stage, list what a human must still own.`},

{title:'The project we will build: TeamBlog',
body:`<p><b>TeamBlog</b> is a blog for companies. Each company (a <b>tenant</b>) has its own private space where staff write posts and comment on them. It's small enough to build, but it covers <b>every requirement</b> from the job description:</p>
<table><tr><th>Feature</th><th>Requirement it proves</th></tr>
<tr><td>Posts + comments, React web app, Node/TS API</td><td>React + Node.js + TypeScript</td></tr>
<tr><td>API runs on Lambda, data in DynamoDB, images/PDFs in S3, background jobs via SQS</td><td><b>AWS (Lambda, DynamoDB, SQS, S3)</b></td></tr>
<tr><td>Each company sees only its own posts, isolation tests</td><td><b>Multi-tenancy</b></td></tr>
<tr><td>"Publish Monday 9:00 in my timezone", dates shown in the reader's timezone</td><td><b>Timezones</b></td></tr>
<tr><td>Upload a PDF → it becomes a draft post. Export any post as a PDF.</td><td><b>PDF processing</b></td></tr>
<tr><td>AI summary, tag suggestions, comment moderation, PDF → structured draft</td><td><b>AI integration</b></td></tr>
<tr><td>CLAUDE.md, rules, skills, subagents, hooks, evals for AI features and AI workflow</td><td><b>Rules, skills, evals</b></td></tr>
<tr><td>Every feature driven end-to-end by Claude Code, from Jira ticket to PR</td><td><b>Driving features end-to-end with an AI tool</b></td></tr></table>
<div class="callout ai"><b>Cursor vs Claude Code</b>This guide uses <b>Claude Code</b>. The ideas are the same in Cursor: CLAUDE.md ≈ AGENTS.md / .cursor/rules, skills ≈ Cursor skills, subagents ≈ background agents, MCP is the same standard. Knowing both helps in interviews.</div>`},

{title:'Architecture at a glance',
body:`<pre><code>                    ┌──────────────── Cognito (login, tenantId claim)
                    │
 Browser (React) ───┼──► API Gateway (HTTP API) ──► Lambda "api" (Hono, Node 22, TS)
 hosted on S3 +     │                                   │  reads/writes
 CloudFront         │                                   ▼
                    │                               DynamoDB (single table, PK = TENANT#id)
                    │
                    └──► S3 presigned PUT (PDF / images, key = tenants/&lt;id&gt;/...)
                                 │ ObjectCreated event
                                 ▼
                             SQS queue (+ DLQ) ──► Lambda "worker"
                                                     ├─ pdfjs: extract text
                                                     ├─ Claude API: structured draft + summary
                                                     └─ DynamoDB: save draft (idempotent)

 EventBridge Scheduler (one-time, in author's timezone) ──► Lambda "publish" ──► post.status = PUBLISHED</code></pre>
<ul><li><b>Why Lambda + DynamoDB?</b> Pay per request, no servers to patch, scales to zero. That makes it a good fit for a SaaS where most tenants are quiet.</li>
<li><b>Why SQS between S3 and the worker?</b> Retries, back-pressure and a dead-letter queue for PDFs that keep failing. The upload request stays fast.</li>
<li><b>Why EventBridge Scheduler?</b> It supports one-time schedules <b>with a timezone</b>, so "9:00 Europe/Berlin" survives DST changes.</li></ul>`,
prompt:`Here is our architecture: React on S3/CloudFront, API Gateway + Lambda (Hono), DynamoDB single table, S3 presigned uploads, S3 → SQS → worker Lambda (pdfjs + Claude API), EventBridge Scheduler for timezone-aware publishing, Cognito auth. Review it like a senior AWS architect: list risks, missing pieces (e.g. DLQ alarms, idempotency) and cost drivers. Don't write code.`},

{title:'The AI toolbox: what each piece is for',
body:`<p>These are the Claude Code building blocks you'll set up in chapters 2–4. Learn <b>when</b> to use each one; that's a favourite interview question.</p>
<table><tr><th>Piece</th><th>Where it lives</th><th>Use it for</th></tr>
<tr><td><b>CLAUDE.md</b></td><td><code>CLAUDE.md</code> (+ nested per folder)</td><td>Always-on project context: stack, commands, conventions</td></tr>
<tr><td><b>Rules</b></td><td><code>.claude/rules/*.md</code></td><td>Focused conventions, optionally only for matching paths (e.g. DynamoDB rules for <code>apps/api/**</code>)</td></tr>
<tr><td><b>Settings / permissions</b></td><td><code>.claude/settings.json</code></td><td>What Claude may run without asking; what it may never touch (<code>.env</code>, prod)</td></tr>
<tr><td><b>Hooks</b></td><td>settings.json → scripts</td><td>Guaranteed automation: format after every edit, block dangerous commands. Rules are advice; hooks are enforced.</td></tr>
<tr><td><b>Skills</b></td><td><code>.claude/skills/&lt;name&gt;/SKILL.md</code></td><td>Playbooks loaded on demand ("how we add an endpoint"), can include scripts and templates</td></tr>
<tr><td><b>Slash commands</b></td><td>skills you trigger by name, e.g. <code>/ticket BLOG-42</code></td><td>Repeatable team workflows started by a human</td></tr>
<tr><td><b>Subagents</b></td><td><code>.claude/agents/*.md</code></td><td>Specialists with their own context and limited tools: reviewer, test-writer, security auditor</td></tr>
<tr><td><b>MCP servers</b></td><td><code>.mcp.json</code></td><td>Connect to Jira, Figma, a browser, AWS docs</td></tr>
<tr><td><b>GitHub Action</b></td><td><code>.github/workflows/claude.yml</code></td><td>Claude reviews PRs and answers <code>@claude</code> in comments</td></tr>
<tr><td><b>Headless mode</b></td><td><code>claude -p "..."</code></td><td>Scripts, CI jobs, evals of your AI setup</td></tr></table>`,
code:`teamblog/
├─ CLAUDE.md                     # project memory for Claude (shared, in git)
├─ .mcp.json                     # shared MCP servers (Jira, Figma, Playwright)
├─ .claude/
│  ├─ settings.json              # team permissions + hooks (in git)
│  ├─ settings.local.json        # personal overrides (git-ignored)
│  ├─ rules/                     # tenancy.md, dynamodb.md, react.md, testing.md
│  ├─ skills/                    # add-endpoint/, dynamo-access-pattern/, ticket/, pr/
│  ├─ agents/                    # planner.md, code-reviewer.md, test-writer.md, security.md
│  └─ hooks/                     # format.sh, protect-files.sh
├─ apps/
│  ├─ web/                       # React + Vite + TS
│  └─ api/                       # Node + TS (Hono) → Lambda
├─ packages/shared/              # zod schemas + types used by web AND api
├─ infra/                        # AWS CDK (TypeScript)
├─ evals/                        # AI feature evals + AI-workflow evals
├─ docs/product/                 # requirements/, prototypes/, as-built/ (living docs)
├─ docs/delivery/                # gated spec track for big milestones (chapter 14)
├─ docs/adr/, docs/CONSTITUTION.md, docs/architecture.md
└─ .github/                      # workflows/, pull_request_template.md, CODEOWNERS`},
],
questions:[
{q:'Walk me through how your team takes a feature from idea to production using an AI coding agent.',lvl:2,points:['Jira epic/stories with acceptance criteria','Design: PRD, Figma, ADR, API contract','Plan mode before code, small steps','Rules/skills/subagents for consistency','Tests + AI review + required human review','CI with evals, automated deploy, feedback loop into rules'],
a:'It starts with a Jira epic. Claude reads it through the Jira MCP and drafts a PRD, an architecture note and the API contract, which the team reviews along with the Figma designs. The epic is broken into stories with acceptance criteria. For each story the developer runs Claude Code in plan mode, approves the plan and lets it implement in small steps, guided by CLAUDE.md, path-scoped rules and skills like "add-endpoint". Claude writes and runs the tests, then a reviewer subagent and the GitHub Action review the PR, but a human approval is required to merge. CI runs lint, types, tests and evals, and CDK deploys to dev automatically and to prod after approval. Mistakes found along the way become new rules or eval cases.'},
{q:'What is the difference between CLAUDE.md, rules, skills, hooks and subagents?',lvl:2,points:['CLAUDE.md: always-loaded project context','Rules: focused conventions, can be path-scoped','Skills: on-demand playbooks with files/scripts','Hooks: deterministic, enforced automation','Subagents: separate context + restricted tools for a specialist task'],
a:'CLAUDE.md is always loaded: the project overview, commands and key conventions. Rules are smaller focused instruction files, optionally scoped to paths, so DynamoDB rules only load when working in the API. Skills are playbooks with optional scripts and templates that load only when a task matches, which keeps context small. Hooks are shell commands the harness runs on events like "after every edit", so they are enforced, not just advice. Subagents are specialists with their own context window, prompt and restricted tools, for example a read-only code reviewer, so the main conversation stays focused.'},
]},

/* ---------------------------------------------------------- */
{
id:'g-setup', icon:'🧰', title:'1. Setup From Scratch: Tools, Repo, GitHub, AWS', short:'1 · Setup',
why:'A team setup is more than "npm init". You need the same tools on every machine, a monorepo with shared types, GitHub rules that force review, and AWS accounts that are safe to experiment in. Do this once, properly, and every later step is smoother.',
steps:[
{title:'Install the tools (every developer)',
body:`<table><tr><th>Tool</th><th>Why</th></tr>
<tr><td>Node.js 22 LTS + pnpm</td><td>Runtime for web, API, CDK. pnpm workspaces for the monorepo.</td></tr>
<tr><td>Git + GitHub CLI (<code>gh</code>)</td><td>Claude uses <code>gh</code> to open PRs, read reviews and check CI.</td></tr>
<tr><td>Docker Desktop</td><td>DynamoDB Local + LocalStack (S3, SQS) for offline dev.</td></tr>
<tr><td>AWS CLI v2 + AWS CDK</td><td>Deploy and inspect AWS resources.</td></tr>
<tr><td><b>Claude Code</b></td><td>The AI coding agent (terminal + VS Code/JetBrains extensions + desktop app).</td></tr>
<tr><td>jq</td><td>Used by hook scripts to read JSON.</td></tr></table>
<p>After installing, run <code>claude</code> in any folder and sign in with your Claude account (a Team/Enterprise plan lets the company manage seats, usage and policies centrally).</p>`,
code:`# macOS (Homebrew). Use your OS package manager on Linux/Windows.
brew install node@22 pnpm git gh jq awscli
brew install --cask docker
npm i -g aws-cdk

# Claude Code - native installer (or: npm i -g @anthropic-ai/claude-code)
curl -fsSL https://claude.ai/install.sh | bash

# verify
node -v && pnpm -v && gh --version && aws --version && cdk --version && claude --version
gh auth login          # so Claude can open PRs as you
claude                 # first run: sign in, then type /help`},

{title:'Create the monorepo',
body:`<p>One repository, several packages. The big win is that <code>packages/shared</code> holds <b>zod schemas</b> that both the API (validation) and the web app (types + forms) import, so the contract can't drift.</p>
<ol><li>Create the GitHub repo with <code>gh</code>.</li><li>Add pnpm workspaces.</li><li>Scaffold <code>apps/web</code> (Vite React TS), <code>apps/api</code> (Hono), <code>packages/shared</code>, <code>infra</code> (CDK).</li><li>Shared tooling at the root: TypeScript base config, ESLint, Prettier, Vitest.</li><li>First commit, before Claude writes anything.</li></ol>
<div class="callout ai"><b>Let Claude do the scaffolding</b>This is a good first task to hand over: boring, well known, and easy to verify. Give it the target folder tree and let it run the commands.</div>`,
code:`gh repo create acme/teamblog --private --clone && cd teamblog

# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
  - "infra"

# root package.json (scripts run in every workspace)
{
  "name": "teamblog",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "lint": "eslint .",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "format": "prettier --write ."
  }
}

pnpm create vite apps/web --template react-ts
mkdir -p apps/api/src packages/shared/src infra
cd infra && cdk init app --language typescript && cd ..
pnpm add -w -D typescript eslint prettier vitest @types/node`,
prompt:`Scaffold this monorepo with pnpm workspaces: apps/web (Vite + React + TS), apps/api (Node 22 + TS + Hono, runnable locally with tsx and deployable to Lambda), packages/shared (zod schemas, exported types), infra (AWS CDK TS). Add a root tsconfig.base.json (strict), ESLint + Prettier, and Vitest in each package. Show me the plan first, then run the commands and make sure pnpm typecheck passes.`},

{title:'GitHub team settings: make review mandatory',
body:`<p>These settings make the AI safe to use in a team: <b>no one, human or AI, can push straight to main</b>.</p>
<ul><li><b>Branch ruleset on <code>main</code></b>: require a PR, at least 1 approval, required status checks (lint, typecheck, test), up-to-date branches, no force-push.</li>
<li><b>CODEOWNERS</b>: auto-request the right reviewers. For example, infra changes always need the platform lead.</li>
<li><b>PR template</b>: every PR states the Jira key, what changed, how it was tested, and whether AI was used and how it was verified.</li>
<li><b>Secrets</b> live in GitHub Environments (<code>dev</code>, <code>prod</code>). Prod needs a manual approval.</li>
<li><b>Jira ↔ GitHub</b>: install the "GitHub for Jira" app so branches, commits and PRs containing <code>BLOG-42</code> show up on the ticket.</li></ul>`,
code:`# .github/CODEOWNERS
*                 @acme/teamblog-devs
/infra/           @acme/platform-leads
/.claude/         @acme/teamblog-leads     # changes to AI rules/skills get lead review
/evals/           @acme/teamblog-leads

# .github/pull_request_template.md
## Jira
BLOG-XXX

## What & why
<!-- 2-3 sentences -->

## How I tested it
- [ ] Unit / integration tests added or updated
- [ ] Ran locally, checked the unhappy paths
- [ ] Evals pass (if AI prompts changed)

## AI usage
<!-- e.g. "Implemented with Claude Code from an approved plan; I reviewed every file.
     Reviewer subagent flagged X, fixed in 3f2a1c." -->

## Risk / rollout
<!-- migrations, feature flag, anything to watch after deploy -->`},

{title:'AWS accounts, SSO and CDK bootstrap',
body:`<ol><li><b>Separate accounts per environment</b> (AWS Organizations): <code>teamblog-dev</code>, <code>teamblog-prod</code>. A mistake in dev can't touch prod data.</li>
<li><b>IAM Identity Center (SSO)</b> for humans. No long-lived access keys on laptops.</li>
<li><b>Budget alarm on day 1</b> in every account.</li>
<li><b>Bootstrap CDK</b> once per account/region.</li>
<li><b>GitHub OIDC role</b>: CI assumes an IAM role with short-lived credentials. No AWS keys stored in GitHub (chapter 12).</li></ol>
<div class="callout warn"><b>Guardrail for the AI</b>Claude only ever gets your <b>dev</b> profile. Deny <code>cdk deploy</code> and any <code>--profile prod</code> command in <code>.claude/settings.json</code> (chapter 2). Production deploys only happen from CI.</div>`,
code:`aws configure sso                       # create profiles: teamblog-dev, teamblog-prod
aws sso login --profile teamblog-dev
export AWS_PROFILE=teamblog-dev

cdk bootstrap aws://<DEV_ACCOUNT_ID>/eu-west-1

# budget alarm (or do it in the console: Billing → Budgets)
aws budgets create-budget --account-id <DEV_ACCOUNT_ID> \\
  --budget '{"BudgetName":"dev-monthly","BudgetLimit":{"Amount":"30","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}'`},

{title:'Local dev: run everything offline',
body:`<p>Fast feedback is what makes AI-driven development work: Claude changes code, runs it and sees the result in seconds. Emulate AWS locally:</p>
<ul><li><b>DynamoDB Local</b> for the table.</li><li><b>LocalStack</b> for S3 and SQS.</li><li><code>.env.example</code> checked in; real <code>.env</code> git-ignored <b>and</b> denied to Claude.</li><li>One command, <code>pnpm dev</code>, starts the API on :3000 and web on :5173.</li></ul>`,
code:`# docker-compose.yml
services:
  dynamodb:
    image: amazon/dynamodb-local
    ports: ["8000:8000"]
  localstack:
    image: localstack/localstack
    ports: ["4566:4566"]
    environment:
      SERVICES: s3,sqs

# .env.example
AWS_REGION=eu-west-1
DYNAMO_ENDPOINT=http://localhost:8000
AWS_ENDPOINT_URL_S3=http://localhost:4566
AWS_ENDPOINT_URL_SQS=http://localhost:4566
TABLE_NAME=teamblog-local
UPLOAD_BUCKET=teamblog-uploads-local
ANTHROPIC_API_KEY=               # each dev uses their own key, never committed

# scripts/bootstrap-local.sh creates the table, bucket and queue
docker compose up -d && pnpm tsx scripts/bootstrap-local.ts && pnpm dev`,
prompt:`Create docker-compose.yml (DynamoDB Local + LocalStack with s3,sqs), .env.example, and scripts/bootstrap-local.ts that creates the DynamoDB table (PK/SK strings + GSI1), the S3 bucket and the SQS queue with a DLQ, using AWS SDK v3 with the local endpoints. Make it safe to run twice.`},
],
questions:[
{q:'How do you set up a repository so an AI agent cannot break main or leak secrets?',lvl:2,points:['Branch ruleset: PR + approval + required checks, no force push','CODEOWNERS for sensitive paths (.claude/, infra/)','Secrets in env/GitHub Environments, .env git-ignored and denied to the agent','Agent only has dev credentials; prod deploy only from CI','Hooks/permissions deny dangerous commands'],
a:'Protect main with a ruleset: PRs only, at least one human approval, required status checks and no force-push, so every agent change goes through review and CI. CODEOWNERS routes changes to infra and to the AI configuration itself to leads. Secrets never live in the repo: .env is git-ignored and denied in the agent settings, and CI uses GitHub Environments plus OIDC instead of stored keys. The agent only gets a dev AWS profile, and prod deploys only run from CI after approval. Permissions and hooks block commands like cdk deploy or reading .env.'},
{q:'Why a monorepo with a shared package for this kind of project?',lvl:1,points:['One contract (zod schemas) for web and API','Atomic PRs across layers','Shared tooling/config','AI sees the whole system in one context'],
a:'The web app, API and infrastructure change together for most features, so one repo lets a single PR update all of them atomically. The shared package holds zod schemas that the API uses for validation and the web app uses for types and form validation, so the contract cannot drift. Tooling is configured once. It also helps the AI: Claude can read the schema, the handler and the UI in one session and keep them consistent.'},
]},

/* ---------------------------------------------------------- */
{
id:'g-claude', icon:'⚙️', title:'2. Configure Claude Code for the Team', short:'2 · Claude config',
why:'Out of the box Claude Code is a smart generalist. With a good CLAUDE.md, path-scoped rules, team permissions and hooks, it behaves like a teammate who knows your conventions and can\'t do dangerous things. All of this lives in git, so the whole team gets the same setup.',
steps:[
{title:'First session: modes and commands you must know',
body:`<table><tr><th>Thing</th><th>What it does</th></tr>
<tr><td><b>Plan mode</b> (Shift+Tab to cycle modes)</td><td>Claude researches and proposes a plan <b>without editing files</b>. Use it for anything bigger than a one-line fix.</td></tr>
<tr><td>Default / accept-edits modes</td><td>Default asks before edits and commands. Accept-edits auto-approves file edits but still asks for commands.</td></tr>
<tr><td><code>/init</code></td><td>Scans the repo and writes a first CLAUDE.md. You then edit it.</td></tr>
<tr><td><code>/clear</code>, <code>/compact</code>, <code>/context</code></td><td>Start fresh between tasks, summarise a long session, see what is using the context window.</td></tr>
<tr><td><code>/agents</code>, <code>/mcp</code>, <code>/memory</code>, <code>/permissions</code></td><td>Manage subagents, MCP servers, memory files and permission rules.</td></tr>
<tr><td><b>Esc</b> / <b>Esc Esc</b></td><td>Interrupt Claude / go back to an earlier point (rewind code and conversation).</td></tr>
<tr><td><code>@path/to/file</code></td><td>Put a file into context precisely.</td></tr>
<tr><td><code>!</code> prefix</td><td>Run a shell command yourself; output goes into context.</td></tr></table>
<div class="callout"><b>Habit</b>One task = one session. <code>/clear</code> when you switch tickets. Old, unrelated context makes answers worse.</div>`},

{title:'CLAUDE.md: the project memory',
body:`<p>Claude reads CLAUDE.md files automatically at the start of every session:</p>
<ul><li><code>./CLAUDE.md</code>: the <b>team</b> file, in git. Stack, commands, conventions, definition of done.</li>
<li><code>apps/api/CLAUDE.md</code>: nested files load when Claude works in that folder. Good for API-only details.</li>
<li><code>~/.claude/CLAUDE.md</code>: <b>your personal</b> preferences for all projects.</li>
<li>Import other docs with <code>@docs/architecture.md</code> instead of copying them in.</li></ul>
<h3>Keep it short and specific</h3>
<p>Aim for under ~150 lines. Every line should change behaviour. Include the <b>exact commands</b> (how to test, lint, run one test) and the <b>non-negotiables</b>. If Claude keeps getting something wrong, add one precise line.</p>`,
code:`# TeamBlog - CLAUDE.md

Multi-tenant blog SaaS. Companies (tenants) have private posts + comments.
Architecture: @docs/architecture.md   Product: @docs/product/requirements/teamblog.md

## Stack
- apps/web: React 18 + Vite + TS, TanStack Query, react-router. No UI kit; CSS modules.
- apps/api: Node 22 + TS + Hono on AWS Lambda. DynamoDB (single table), S3, SQS.
- packages/shared: zod schemas = the API contract. Import types from here, never redeclare.
- infra: AWS CDK v2 (TS).

## Commands
- pnpm dev                          # api :3000 + web :5173 (needs docker compose up -d)
- pnpm --filter api test -- posts   # run one test file
- pnpm typecheck && pnpm lint && pnpm test   # must pass before you say "done"

## Non-negotiables
- tenantId comes ONLY from the verified JWT (c.get('tenantId')). Never from body/query/params.
- Every DynamoDB key starts with TENANT#<tenantId>. Use the repo helpers in apps/api/src/db.
- Store instants as UTC ISO strings; store the user's IANA timezone separately.
- No secrets in code or logs. Never read or edit .env files.
- Money/AI cost numbers are integers (cents / tokens), never floats.

## Workflow
- For anything bigger than a small fix: plan first, wait for approval.
- Work in small steps; run the relevant tests after each step.
- Branch: feat/BLOG-123-short-name. Commit: "BLOG-123: imperative summary".
- Only commit when I ask. Never push, open a PR or change Jira unless I ask.
- Copy the nearest sibling (e.g. routes/posts.ts) instead of inventing a new layout.
- Read docs/product/as-built/<feature>/ before changing a feature; update it after.
- Smallest change that fixes the real flow. No new abstractions unless asked.
- Finish with: summary of changes, tests run, risks, anything to check manually.`,
prompt:`Run /init, then improve the generated CLAUDE.md for our team: keep it under 80 lines, add exact commands (dev, one test, full check), our non-negotiables (tenantId only from JWT, TENANT# key prefix, UTC + IANA timezone, no .env access) and the branch/commit convention. Remove anything generic that wouldn't change your behaviour.`},

{title:'Rules: focused, path-scoped instructions',
body:`<p>When CLAUDE.md gets long, split conventions into <code>.claude/rules/*.md</code>. A rule can have <code>paths</code> frontmatter so it <b>only loads when Claude touches matching files</b>, which keeps the context small and focused.</p>
<h3>What makes a good rule</h3>
<ul><li><b>Checkable</b>: "every handler validates input with the zod schema from @teamblog/shared", not "write clean code".</li>
<li><b>Says what NOT to do</b>, and why (one clause).</li>
<li><b>Points to a reference file</b>: "copy the pattern in apps/api/src/routes/posts.ts".</li>
<li><b>One topic per file</b>, so you can see in a PR exactly which convention changed.</li></ul>`,
code:`<!-- .claude/rules/tenancy.md -->
---
paths:
  - "apps/api/**/*.ts"
---
# Multi-tenancy rules (security critical)
- Read tenantId only via c.get('tenantId') (set by authMiddleware from the Cognito JWT).
- Never accept tenantId from request body, query string or path params.
- All DynamoDB access goes through apps/api/src/db/repo.ts helpers, which prefix keys
  with TENANT#<tenantId>. Do not call DynamoDBDocumentClient directly in routes.
- S3 keys must start with tenants/<tenantId>/.
- Every new endpoint needs an isolation test: tenant B gets 404 for tenant A's data.
  Reference: apps/api/test/isolation.test.ts

<!-- .claude/rules/react.md -->
---
paths:
  - "apps/web/**/*.tsx"
---
# React rules
- Server data only via TanStack Query hooks in src/api/hooks.ts. No fetch in components.
- Types come from @teamblog/shared. Forms validate with the same zod schema as the API.
- Every screen handles loading, error (with retry) and empty states.
- Show dates with <LocalTime iso=... /> (renders in the viewer's timezone). Never new Date().toString().`},

{title:'Permissions: what Claude may do without asking',
body:`<p><code>.claude/settings.json</code> (in git) holds the <b>team's</b> permission rules. <code>.claude/settings.local.json</code> (git-ignored) is for personal tweaks. Rules are <code>allow</code>, <code>ask</code> or <code>deny</code>, and <b>deny always wins</b>.</p>
<ul><li><b>Allow</b> safe, frequent commands (tests, lint, git status, gh pr view), so Claude isn't blocked all day.</li>
<li><b>Ask</b> for things with side effects (git push, gh pr create).</li>
<li><b>Deny</b> secrets and anything that touches production.</li></ul>
<div class="callout warn"><b>Why not just skip permissions?</b>Unrestricted mode is only acceptable inside a throwaway container or VM. On your laptop, with your SSO session and git credentials, a wrong command is real.</div>`,
code:`// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(pnpm test:*)", "Bash(pnpm --filter:*)", "Bash(pnpm typecheck)", "Bash(pnpm lint)",
      "Bash(git status)", "Bash(git diff:*)", "Bash(git log:*)", "Bash(git add:*)", "Bash(git commit:*)",
      "Bash(gh pr view:*)", "Bash(gh pr diff:*)", "Bash(gh pr checks:*)",
      "Bash(docker compose:*)", "Bash(cdk synth:*)", "Bash(cdk diff:*)"
    ],
    "ask": [
      "Bash(git push:*)", "Bash(gh pr create:*)", "Bash(gh pr merge:*)"
    ],
    "deny": [
      "Read(./.env)", "Read(./.env.*)", "Edit(./.env*)",
      "Bash(cdk deploy:*)", "Bash(*--profile teamblog-prod*)",
      "Bash(rm -rf:*)", "Bash(git push --force:*)"
    ]
  }
}`},

{title:'Hooks: automation that always runs',
body:`<p>A rule says "please format your code". A <b>hook guarantees</b> it. Hooks are shell commands Claude Code runs on events. The common ones:</p>
<table><tr><th>Event</th><th>Example use</th></tr>
<tr><td><code>PreToolUse</code></td><td>Block edits to protected files (lockfiles, migrations already merged, prod config). Exit code <b>2</b> blocks the action, and stderr is shown to Claude so it can adjust.</td></tr>
<tr><td><code>PostToolUse</code></td><td>Run Prettier + ESLint --fix on the file Claude just edited.</td></tr>
<tr><td><code>Stop</code></td><td>When Claude says it's done, run typecheck. If it fails, tell Claude to keep going.</td></tr>
<tr><td><code>SessionStart</code></td><td>Print the current branch + Jira ticket into context.</td></tr>
<tr><td><code>Notification</code></td><td>Desktop notification when Claude needs your input.</td></tr></table>
<p>Hooks receive JSON on stdin (tool name, input, file path). Keep them fast, and commit them so the whole team has them.</p>`,
code:`// .claude/settings.json (merged with the permissions above)
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": ".claude/hooks/protect-files.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": ".claude/hooks/format.sh" }] }
    ]
  }
}

# .claude/hooks/protect-files.sh
#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.file_path // empty')
case "$FILE" in
  *.env*|*pnpm-lock.yaml|*/infra/config/prod.ts)
    echo "Blocked: $FILE is protected. Ask a human to change it." >&2
    exit 2 ;;
esac
exit 0

# .claude/hooks/format.sh
#!/usr/bin/env bash
FILE=$(jq -r '.tool_input.file_path // empty')
case "$FILE" in
  *.ts|*.tsx) npx prettier --write "$FILE" >/dev/null && npx eslint --fix "$FILE" >/dev/null || true ;;
esac
exit 0`,
prompt:`Add two Claude Code hooks to .claude/settings.json: a PreToolUse hook on Edit|Write that blocks .env files, pnpm-lock.yaml and infra/config/prod.ts (exit 2 with a clear message), and a PostToolUse hook that runs prettier and eslint --fix on edited .ts/.tsx files. Put the scripts in .claude/hooks/, make them executable, and test both by trying to edit a protected file.`},
],
questions:[
{q:'What do you put in CLAUDE.md (or AGENTS.md), and what do you keep out?',lvl:1,points:['Stack + exact commands','Non-negotiable conventions','Workflow/definition of done','Keep it short; import docs instead of pasting','Leave out generic advice and things linters enforce'],
a:'I put in what changes the agent\'s behaviour: the stack, exact commands to run the app and a single test, non-negotiables like tenant scoping and time handling, and our workflow: plan first, small steps, what "done" means. I import longer docs like the architecture with an @ reference instead of pasting them. I leave out generic advice like "write clean code", anything a linter or hook already enforces, and personal preferences, which go in the user-level file. I keep it short, because every line costs context on every request.'},
{q:'When would you use a hook instead of a rule?',lvl:2,points:['Rules are guidance the model may miss','Hooks are deterministic, run every time','Use hooks for must-always: formatting, blocking protected files, running checks','Exit code 2 blocks and feeds reason back'],
a:'A rule is guidance. The model usually follows it but can miss it, especially in long sessions. A hook is deterministic: the harness runs it on every matching event. So anything that must always happen or must never happen belongs in a hook. Examples are formatting after each edit, blocking edits to .env or the lockfile, or running the typecheck when the agent claims it is finished. A PreToolUse hook that exits with code 2 blocks the action and shows the reason to Claude so it can pick another approach.'},
{q:'How do you configure permissions for an AI agent on a developer laptop?',lvl:2,points:['Allow safe frequent commands to avoid prompt fatigue','Ask for side effects (push, PR create)','Deny secrets and prod','Team settings in git, personal in local settings','Deny wins'],
a:'I use the shared project settings file in git so the whole team has the same baseline. Frequent safe commands like tests, lint, git diff and gh pr view are allowed so the agent is not constantly blocked. Commands with side effects such as git push or creating a PR are set to ask. Reading or editing .env files, cdk deploy, anything with the prod profile and force-push are denied, and deny always wins. Personal additions go in the git-ignored local settings. Unrestricted mode is only acceptable in a disposable container.'},
]},

/* ---------------------------------------------------------- */
{
id:'g-agents', icon:'🤖', title:'3. Skills, Slash Commands & Subagents', short:'3 · Skills & agents',
why:'Rules tell Claude how to behave. Skills teach it how to do a specific job your way, slash commands let humans start repeatable workflows, and subagents are specialists (reviewer, test-writer, security) that work in their own context. Together they turn "a chatbot that codes" into a team process.',
steps:[
{title:'Skills: reusable playbooks loaded on demand',
body:`<p>A skill is a folder with a <code>SKILL.md</code>: a <b>name</b>, a <b>description</b> (when to use it) and instructions. It can also hold templates, scripts and reference docs. Claude only sees the short description until a task matches. Then it loads the full skill, so you can have dozens without wasting context.</p>
<h3>Good first skills for TeamBlog</h3>
<ul><li><b>add-endpoint</b>: schema in shared → route → repo function → tests → client hook.</li>
<li><b>dynamo-access-pattern</b>: how to add a new query (keys, GSI, pagination) safely.</li>
<li><b>write-adr</b>: our ADR template and where to save it.</li></ul>
<div class="callout"><b>Skill vs rule</b>A rule is a short constraint that is always true ("tenantId only from JWT"). A skill is a <i>procedure</i> with steps and files ("how we add an endpoint").</div>`,
code:`<!-- .claude/skills/add-endpoint/SKILL.md -->
---
name: add-endpoint
description: Use when adding or changing a REST endpoint in apps/api. Covers the shared
  zod schema, Hono route, tenant-scoped repo function, tests and the web client hook.
---

# Add an API endpoint (TeamBlog way)

1. **Contract first**: add/extend the zod schema in packages/shared/src/<feature>.ts
   and export the inferred type. Run pnpm --filter shared build.
2. **Repo**: add a function in apps/api/src/db/<feature>.repo.ts using keys() from
   db/keys.ts. Never build PK strings by hand.
3. **Route**: in apps/api/src/routes/<feature>.ts use zValidator('json', Schema).
   Read tenantId with c.get('tenantId'). Return 404 (not 403) for other tenants' ids.
4. **Tests**: copy templates/route.test.ts. Must include: happy path, 400 on invalid
   body, 404 cross-tenant (isolation), 401 without token.
5. **Client**: add a hook in apps/web/src/api/hooks.ts using the shared type.
6. Run: pnpm --filter api test && pnpm typecheck. Summarise files changed.

Reference implementation: apps/api/src/routes/posts.ts`,
prompt:`Create a Claude Code skill at .claude/skills/add-endpoint/ with a SKILL.md (name, a precise "use when" description, numbered steps) and a templates/route.test.ts file. Base the steps on how apps/api/src/routes/posts.ts and its tests are written. Then list which parts of the skill you're unsure about.`},

{title:'Slash commands: team workflows a human starts',
body:`<p>Some workflows should only run when a person asks, for example "start this Jira ticket" or "open the PR". Make them skills that you trigger by name. <code>$ARGUMENTS</code> is replaced with whatever you type after the command. Set <code>disable-model-invocation: true</code> so Claude never starts them by itself.</p>
<table><tr><th>Command</th><th>What it does</th></tr>
<tr><td><code>/ticket BLOG-42</code></td><td>Reads the Jira story (MCP), creates the branch, writes a plan, waits for approval</td></tr>
<tr><td><code>/pr</code></td><td>Runs checks, writes the PR description from the template, opens it with gh, moves Jira to "In Review"</td></tr>
<tr><td><code>/review-local</code></td><td>Runs the code-reviewer subagent on the current diff before you push</td></tr>
<tr><td><code>/fix-review 123</code></td><td>Reads review comments on PR 123 and addresses them one by one</td></tr></table>`,
code:`<!-- .claude/skills/ticket/SKILL.md -->
---
name: ticket
description: Start work on a Jira ticket. Usage: /ticket BLOG-42
disable-model-invocation: true
---

Start work on Jira ticket $ARGUMENTS.

1. Use the Atlassian MCP to read $ARGUMENTS: summary, description, acceptance
   criteria, linked designs, comments. If acceptance criteria are missing or vague,
   STOP and list the questions I should ask the PM.
2. git switch main && git pull, then create branch feat/$ARGUMENTS-<short-kebab-name>.
3. Read the relevant code (use the planner subagent for anything non-trivial).
4. Write a plan: files to change, tests to add, risks, what you'll verify manually.
   Map each acceptance criterion to a test.
5. Wait for my approval. Then transition the ticket to "In Progress" and add a
   Jira comment with the approved plan.`},

{title:'Subagents: specialists with their own context',
body:`<p>A subagent is a separate Claude instance with its own <b>system prompt</b>, its own <b>context window</b>, a <b>restricted tool list</b> and optionally a different <b>model</b>. The main agent delegates a task to it and gets back only the summary. That gives you:</p>
<ul><li><b>Clean context</b>: a code review reads 30 files, but the main session only receives the 10 findings.</li>
<li><b>Least privilege</b>: the reviewer is <b>read-only</b>, so it can't "fix" things behind your back.</li>
<li><b>Specialisation</b>: a focused prompt ("you are a security reviewer for multi-tenant SaaS") beats a general one.</li>
<li><b>Parallelism</b>: several subagents can explore different areas at once.</li></ul>
<p>Create them with <code>/agents</code> or as files in <code>.claude/agents/</code> (shared with the team via git).</p>`,
code:`<!-- .claude/agents/code-reviewer.md -->
---
name: code-reviewer
description: Reviews the current diff for bugs, tenancy leaks, missing tests and
  convention violations. Use proactively after implementing a feature, before a PR.
tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*)
model: sonnet
---
You are a senior reviewer on a multi-tenant TypeScript/AWS codebase.
Review ONLY the changes in "git diff main...HEAD". For each finding give:
file:line, severity (blocker / should-fix / nit), the problem, a concrete fix.

Check in this order:
1. Tenancy: tenantId only from c.get('tenantId'); keys via db/keys.ts; S3 prefix.
2. Correctness: error paths, pagination, timezone handling (UTC + IANA), idempotency.
3. Tests: each acceptance criterion covered? isolation test for new endpoints?
4. Security: input validation, secrets in logs, IAM wider than needed.
5. Conventions from CLAUDE.md and .claude/rules.
Do not rewrite code. If everything is fine, say so in one line.

<!-- .claude/agents/test-writer.md -->
---
name: test-writer
description: Writes and runs Vitest tests for a given module or acceptance criteria.
tools: Read, Grep, Glob, Edit, Write, Bash(pnpm --filter:*)
---
Write focused tests first, run them, and report which fail and why.
Never weaken an assertion or delete a test to make it pass.`},

{title:'Orchestration: planner → builder → reviewer, in parallel',
body:`<h3>A reliable pattern for one feature</h3>
<ol><li><b>Explore</b>: "use the planner subagent to find everything related to post publishing." It's read-only, and you get a summary.</li>
<li><b>Plan</b> (plan mode): the main agent writes the plan and you approve it.</li>
<li><b>Implement</b> in small steps. After each step, run the tests.</li>
<li><b>Test</b>: the test-writer subagent covers the acceptance criteria.</li>
<li><b>Review</b>: the code-reviewer subagent checks the diff, and the main agent fixes the blockers.</li></ol>
<h3>Parallel work on several tickets</h3>
<p>Use <b>git worktrees</b>: each ticket gets its own folder and branch, with its own Claude session. The sessions can't overwrite each other's files.</p>
<h3>Headless mode for automation</h3>
<p><code>claude -p "prompt"</code> runs non-interactively. Use it in scripts, CI, and to <b>evaluate your own rules and skills</b> (chapter 9).</p>`,
code:`# parallel tickets with worktrees
git worktree add ../teamblog-BLOG-42 -b feat/BLOG-42-scheduled-publish
git worktree add ../teamblog-BLOG-43 -b feat/BLOG-43-pdf-export
cd ../teamblog-BLOG-42 && claude          # session 1
cd ../teamblog-BLOG-43 && claude          # session 2 (another terminal)
git worktree remove ../teamblog-BLOG-42   # after merge

# prompt that orchestrates subagents
"Use the planner subagent to map how posts are created and published today.
 Then, in plan mode, propose how to add scheduled publishing (BLOG-42).
 After I approve: implement step by step, use the test-writer subagent for the
 acceptance criteria, and finally run the code-reviewer subagent and fix blockers."

# headless: e.g. nightly "find TODOs that have a Jira key and summarise"
claude -p "List TODO comments that mention a BLOG- key, grouped by key" --output-format json`},
],
questions:[
{q:'What is a skill, and how is it different from a rule or a subagent?',lvl:2,points:['Skill = SKILL.md playbook + optional files/scripts','Loaded on demand by description match (progressive disclosure)','Rule = short always/path-scoped constraint','Subagent = separate context + tools, returns summary','Example of each from your project'],
a:'A skill is a folder with a SKILL.md containing a name, a "use when" description and step-by-step instructions, plus optional templates or scripts. The agent sees only the description until a task matches, then loads the rest, so you can have many skills cheaply. A rule is a short constraint that is always true, such as "tenantId only from the JWT". A subagent is a different thing: a separate agent with its own context window, prompt and restricted tools that does a task and returns a summary. In TeamBlog, add-endpoint is a skill, tenancy.md is a rule and code-reviewer is a read-only subagent.'},
{q:'Why would you give a subagent fewer tools than the main agent?',lvl:2,points:['Least privilege','A reviewer should not edit code','Predictable behaviour / easier to trust','Cheaper model possible for narrow tasks'],
a:'For least privilege and predictability. A reviewer that can only read files and run git diff cannot quietly "fix" code, so its output is an honest review I can act on. A narrow tool list also stops the subagent drifting into work it was not asked to do. Narrow tasks often run fine on a faster, cheaper model, which I set in the subagent frontmatter.'},
{q:'How do you run AI agents on several tickets in parallel without them conflicting?',lvl:3,points:['git worktrees: separate folder + branch per ticket','One session per worktree','Separate local ports/tables if needed','Merge via PRs as usual','Know the limit: reviewing is the bottleneck'],
a:'I use git worktrees: each ticket gets its own directory and branch from the same repository, and I run a separate Claude Code session in each, so they never edit the same files. If they need to run the app at the same time, I give each a different port or local table name. Each one ends in its own PR with the normal review. The real limit is human review capacity, so I usually keep it to two or three parallel streams.'},
]},

/* ---------------------------------------------------------- */
{
id:'g-mcp', icon:'🔌', title:'4. Connect Jira, GitHub, Figma & AWS (MCP)', short:'4 · MCP & integrations',
why:'An agent that can only see code is half blind. With MCP (Model Context Protocol) servers Claude can read the Jira ticket, look at the Figma frame, drive a browser to check the UI and search AWS docs, all without you copy-pasting context.',
steps:[
{title:'MCP basics: scopes, auth and safety',
body:`<p>An MCP server exposes <b>tools</b> (like "get Jira issue") to Claude. You add servers with <code>claude mcp add</code>:</p>
<table><tr><th>Scope</th><th>Stored in</th><th>Use for</th></tr>
<tr><td><code>local</code> (default)</td><td>your user config, this project only</td><td>Experiments, personal servers</td></tr>
<tr><td><code>project</code></td><td><code>.mcp.json</code> in the repo</td><td><b>Team</b> servers everyone should have (Jira, Figma, Playwright)</td></tr>
<tr><td><code>user</code></td><td>your user config, all projects</td><td>Personal tools you use everywhere</td></tr></table>
<ul><li>Remote servers usually use <b>OAuth</b>: run <code>/mcp</code> inside Claude Code and sign in. Each person authenticates as themselves, so there are no shared tokens in git.</li>
<li><b>Only install servers you trust.</b> A tool's output goes into the model's context, so a malicious server or a poisoned ticket description can try to inject instructions.</li>
<li>Prefer <b>read-only</b> access where possible, and keep write actions (create issue, transition) behind "ask" permissions.</li></ul>`,
code:`// .mcp.json - shared with the team (no secrets in here)
{
  "mcpServers": {
    "atlassian":  { "type": "http",  "url": "https://mcp.atlassian.com/v1/mcp" },
    "figma":      { "type": "http",  "url": "https://mcp.figma.com/mcp" },
    "playwright": { "type": "stdio", "command": "npx", "args": ["@playwright/mcp@latest"] }
  }
}

# or add them from the CLI
claude mcp add --scope project --transport http atlassian https://mcp.atlassian.com/v1/mcp
claude mcp add --scope project playwright -- npx @playwright/mcp@latest
claude mcp list
# then inside Claude Code: /mcp  → authenticate each server`},

{title:'Jira: read tickets, create stories, move status',
body:`<p>Atlassian's remote MCP server (Rovo MCP) gives Claude access to Jira and Confluence <b>with your own permissions</b>. (Check Atlassian's docs for the current endpoint URL.) What a team uses it for:</p>
<ul><li><b>Start a ticket</b>: read summary, acceptance criteria, comments and links.</li>
<li><b>Break down an epic</b>: create stories with acceptance criteria and estimates, after you've reviewed the list.</li>
<li><b>Keep Jira up to date</b>: transition to In Progress / In Review, and comment with the plan and the PR link.</li>
<li><b>Read Confluence</b>: the PRD or architecture page, as context.</li></ul>
<p>Separately, the <b>GitHub for Jira</b> app links branches, commits and PRs automatically when they contain the key (<code>BLOG-42</code>). Always put the key in the branch name and commit messages.</p>
<div class="callout warn"><b>Treat ticket text as data</b>Anyone can write in a Jira description. Claude should follow <i>your</i> instructions, not commands found inside a ticket. Keep write actions on "ask".</div>`,
code:`# prompts that use the Jira MCP
"Read BLOG-42 and its comments. List the acceptance criteria as a checklist and
 tell me anything ambiguous before we plan."

"Read epic BLOG-40 and the PRD at docs/product/requirements/scheduled-publishing.md. Propose 4-7
 stories, each with a user-story sentence, acceptance criteria (Given/When/Then)
 and a T-shirt size. Show me the list - don't create anything yet."

"Create the approved stories under BLOG-40, link them in order (blocks / is blocked by),
 and add the label 'ai-drafted'."

"Move BLOG-42 to In Review and comment with the PR link."`},

{title:'GitHub: the gh CLI (and optionally GitHub MCP)',
body:`<p>The simplest and most reliable integration is the <b>GitHub CLI</b>. Claude Code already knows <code>gh</code> well, and it uses your own login. With it Claude can:</p>
<ul><li>Open a PR: <code>gh pr create --title ... --body-file ...</code></li>
<li>Read review comments: <code>gh pr view 123 --comments</code>, <code>gh api repos/:owner/:repo/pulls/123/comments</code></li>
<li>Check CI: <code>gh pr checks 123</code>, <code>gh run view --log-failed</code></li>
<li>Work with issues if your team uses GitHub Issues instead of Jira.</li></ul>
<p>The <b>GitHub MCP server</b> is an alternative when you want structured tools instead of shell commands, for example in a hosted agent. For a laptop setup, <code>gh</code> plus permission rules is enough.</p>`,
code:`# typical things you ask
"CI failed on my PR. Use gh to read the failing job log, find the cause, fix it,
 and push a new commit."

"Read all unresolved review comments on PR 57. For each one: agree and fix, or
 explain why not. Show me the list before pushing."`},

{title:'Figma: design to code',
body:`<p>The <b>Figma MCP server</b> lets Claude read a selected frame or a Figma link: layout, components, variables (colours, spacing, typography) and a screenshot. That's much better than guessing from an exported image.</p>
<ol><li>The designer shares a frame link from Figma (Dev Mode).</li><li>You ask Claude to implement it <b>using your existing components and CSS variables</b>. Otherwise it will invent new ones.</li><li>Claude takes a screenshot of the result (Playwright MCP) and compares it with the design.</li></ol>
<p><b>No Figma?</b> Ask Claude to build a quick clickable HTML prototype from the PRD for early feedback. It's a throwaway, not production code.</p>`,
code:`"Implement the 'Post editor' frame from <figma-link> in apps/web/src/pages/PostEditor.tsx.
 Reuse our Button, TextField and Card components and the CSS variables in
 src/styles/tokens.css - don't add new colours. Map Figma variables to our tokens and
 list any that don't exist. When done, open http://localhost:5173/posts/new with the
 Playwright MCP, take a screenshot and compare it with the design."`},

{title:'Browser and AWS helpers',
body:`<ul><li><b>Playwright MCP</b>: Claude can open your local app, click through a flow, read console errors and take screenshots. That closes the loop on UI work: it <i>sees</i> the bug instead of guessing.</li>
<li><b>AWS MCP servers</b> (from awslabs): search the official AWS documentation, or read resources in your <b>dev</b> account. Useful for "what's the right IAM action for X?" without hallucinated answers.</li>
<li><b>Your own MCP server</b>: if your team has an internal API (feature flags, admin tools), a small MCP server makes it available to every agent.</li></ul>
<div class="callout"><b>Rule of thumb</b>Add an MCP server when you notice yourself copy-pasting the same kind of context into the chat again and again.</div>`,
code:`# AWS documentation MCP (runs locally via uv)
claude mcp add aws-docs -- uvx awslabs.aws-documentation-mcp-server@latest

# example prompts
"Using the aws-docs server, find the IAM actions and condition keys needed so a Lambda
 can only read DynamoDB items whose partition key starts with its tenant prefix."

"With Playwright: log in as the seeded user, create a post, add a comment, and report
 any console errors or failed network requests."`},
],
questions:[
{q:'What is MCP and how would you use it in a team?',lvl:1,points:['Open protocol to connect agents to tools/data','Servers expose tools; client (Claude Code) calls them','Examples: Jira, Figma, Playwright, AWS docs','Project-scoped .mcp.json shared in git, per-user OAuth','Trust & least privilege'],
a:'MCP, the Model Context Protocol, is an open standard for connecting AI agents to external tools and data. A server exposes tools such as "get Jira issue" or "take a browser screenshot", and the agent can call them. In a team we commit a project-scoped .mcp.json with the shared servers (Jira, Figma, Playwright) and no secrets. Each developer signs in through OAuth, so actions run with their own permissions. We only add trusted servers, prefer read-only access, and keep write actions behind approval.'},
{q:'What are the security risks of connecting an agent to Jira, GitHub or a browser?',lvl:3,points:['Prompt injection via ticket/page content','Over-privileged tokens','Data exfiltration through tool calls','Mitigations: trusted servers, read-only, ask on writes, human review, no prod creds'],
a:'The main risk is prompt injection. A ticket description, PR comment or web page can contain text that tries to make the agent do something else, such as leak a secret or run a command. Over-privileged tokens make that worse, and any tool that can send data out is an exfiltration path. I mitigate this by only using trusted servers with per-user OAuth and least privilege, and keeping write or outbound actions on "ask". Secrets and prod credentials never enter the agent environment. Everything the agent produces still goes through human review and CI.'},
]},
];
