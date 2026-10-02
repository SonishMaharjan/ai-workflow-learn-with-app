import type { Topic } from '../../types';

// AI-driven team delivery guide, part 4: conventions from a real team, and real-world scenarios.
export const teamChapters: Topic[] = [
/* ---------------------------------------------------------- */
{
id:'g-conventions', icon:'🏢', title:'14. Team Conventions from a Real Project', short:'14 · Team conventions',
why:'Chapters 0–13 show the tools. This chapter shows the habits a real product team (modelled on the FieldTime handout) uses to keep many developers and many agent sessions consistent: short prompts, a named skill chain, clear folder ownership, living docs where code wins, a frozen contract before parallel work, and guard rails on branches and PRs.',
steps:[
/* 0 */
{title:'Prompts stay short: name the skill, give task facts',
body:`<p>Once rules and skills are in the repo, <b>the agent already knows the stack</b>: the conventions, the error envelope, the tenancy rules, the commands. Repeating them in every prompt wastes context and causes drift, because two slightly different descriptions of the same rule compete.</p>
<table><tr><th>❌ Re-briefing prompt</th><th>✅ Team prompt</th></tr>
<tr><td>"We use Hono on Lambda with DynamoDB single-table, keys start with TENANT#, validate with zod from packages/shared, errors use {error:{code,...}}, write Vitest tests including isolation, then... add an endpoint to archive a post"</td>
<td><code>/implement-backend BLOG-61</code><br/>Contract: frozen in the ticket.<br/>Sibling: routes/posts.ts.</td></tr></table>
<h3>A short prompt contains only</h3>
<ul><li><b>Which skill</b> (the skill holds the checklist, so don't restate it).</li><li><b>Which ticket</b> or business ask.</li><li><b>Task-specific facts</b>: what changes, the sibling to copy, files you already know are involved, which doc to read first.</li></ul>
<div class="callout"><b>Exception</b>Long, detailed prompts are fine when you are <i>building</i> the setup: writing the first rules, skills and CLAUDE.md (chapters 1–4). After that, if you notice yourself typing the same explanation twice, it belongs in a rule or skill, not in the prompt.</div>`},

/* 1 */
{title:'The skill chain: how a feature moves',
body:`<p>Every stage has a <b>named, opt-in skill</b> (<code>disable-model-invocation: true</code>). A vague "make a PR" does not run <code>/pr</code>. The developer has to name the skill, which keeps side effects deliberate.</p>
<pre><code>optional prototype      /prototype        → docs/product/prototypes/&lt;slug&gt;/ on branch prototype/&lt;slug&gt;
        │
requirements            /requirements     → docs/product/requirements/&lt;feature&gt;/requirements.md
        │
optional stress-test    /grill-me         → conversation only
        │
tickets                 /create-tickets   → Jira stories (or GitHub issues)
        │
freeze contract         (in the ticket)   → method, path, body, errors, enums agreed
        │
implement               /implement-backend  /implement-frontend  /implement-ui
        │
living docs             /write-feature-docs → docs/product/as-built/&lt;feature&gt;/DOCS_*.md
        │
PR                      /pr               → PR from feat/... into dev, template filled</code></pre>
<h3>Cheat sheet</h3>
<table><tr><th>Skill</th><th>When</th><th>Writes</th></tr>
<tr><td><code>/prototype</code></td><td>Throwaway UI in the real app shell</td><td>prototype branch + folder</td></tr>
<tr><td><code>/requirements</code></td><td>Business ask → PM-reviewable spec (interviews you)</td><td>requirements.md</td></tr>
<tr><td><code>/grill-me</code></td><td>Stress-test a plan, one question at a time</td><td>nothing</td></tr>
<tr><td><code>/create-tickets</code></td><td>Stories/tasks from requirements</td><td>Jira issues</td></tr>
<tr><td><code>/create-bug</code>, <code>/verify-bug</code></td><td>Report a bug; reproduce it with evidence</td><td>Jira bug + comment</td></tr>
<tr><td><code>/write-test-plan</code>, <code>/update-test-plan</code></td><td>Playwright test plans with stable case IDs</td><td>e2e/plans/</td></tr>
<tr><td><code>/implement-backend</code></td><td>API work <b>after</b> the contract is frozen</td><td>apps/api/</td></tr>
<tr><td><code>/implement-frontend</code>, <code>/implement-ui</code></td><td>Data hooks and forms / UI screens and widgets</td><td>apps/web/</td></tr>
<tr><td><code>/timezone</code></td><td>Anything with local dates, schedules, DST</td><td>guidance, then code</td></tr>
<tr><td><code>/testing-linting</code></td><td>Run lint + tests exactly like CI and fix</td><td>fixes + output</td></tr>
<tr><td><code>/write-feature-docs</code></td><td>Behaviour changed → update living docs</td><td>DOCS_*.md</td></tr>
<tr><td><code>/pr</code>, <code>/explain-pr-comments</code>, <code>/multi-pass-review</code></td><td>Open PR; walk through review comments; review from several angles</td><td>PR / notes</td></tr></table>`},

/* 2 */
{title:'Folder ownership: don\'t mix the trees',
body:`<p>A real repo has several "documentation systems". Each has <b>one owner and one job</b>. When they get mixed, agents read the wrong thing (e.g. an old plan instead of current behaviour).</p>
<table><tr><th>System</th><th>Lives in</th><th>Job</th></tr>
<tr><td><b>Agent config</b></td><td><code>CLAUDE.md</code>, <code>.claude/rules</code>, <code>.claude/skills</code>, <code>.claude/agents</code></td><td><i>How</i> the agent writes code and runs workflows</td></tr>
<tr><td><b>Product docs</b></td><td><code>docs/product/</code> (requirements, prototypes, as-built)</td><td><i>What</i> the product does and what was agreed with the PM</td></tr>
<tr><td><b>Delivery spec track</b></td><td><code>docs/delivery/</code></td><td>Gated specs for big milestones (step 10)</td></tr>
<tr><td><b>Run notes</b></td><td><code>AGENTS.md</code> / the Commands part of CLAUDE.md</td><td>How to start the stack locally; gotchas</td></tr>
<tr><td><b>Human summary</b></td><td><code>docs/CONSTITUTION.md</code></td><td>Readable summary of all conventions for onboarding</td></tr></table>
<ul><li>Put a short <b>README</b> in each tree that says what belongs there and what doesn't.</li>
<li><b>Constitution vs rules</b>: people read the constitution; the agent follows the rule files. When you change a convention, update both in the same PR (or generate the constitution from the rules).</li>
<li>Delete references to folders that no longer exist. A README that points to a missing <code>prompts/</code> folder sends every new session down a dead end.</li></ul>`},

/* 3 */
{title:'"Code wins": living as-built docs',
body:`<p>Two kinds of documents, with different rules:</p>
<table><tr><th></th><th>Plan / PRD / ADR</th><th>As-built docs (DOCS_*.md)</th></tr>
<tr><td>Describes</td><td>What we <i>intended</i>, at one point in time</td><td>What the feature <b>does today</b></td></tr>
<tr><td>Updated?</td><td>No, it's history</td><td><b>Yes, in the same PR as every behaviour change</b></td></tr>
<tr><td>If it disagrees with code</td><td>Expected</td><td><b>The code is right</b>; fix the doc</td></tr></table>
<p>Two pieces make this work with an agent:</p>
<ol><li><b>A rule</b> (always on): "Before changing a feature, read its DOCS_*. After changing behaviour, update it."</li>
<li><b>A skill</b> <code>/write-feature-docs</code> that knows the template and checks the doc against the code, not against the plan.</li></ol>
<p>Reviewers then get a free check: if the PR changes behaviour but not the DOCS file, something is missing.</p>`,
code:`<!-- .claude/rules/feature-docs.md  (no paths = always on) -->
# Living feature docs
- Before changing a feature, read docs/product/as-built/<feature>/DOCS_*.md.
- After changing behaviour (API, rules, UI flow), update that file in the same change.
- Code wins: if the doc and the code disagree, the code is the truth - fix the doc,
  and mention the mismatch in your summary.
- Never edit files under docs/product/requirements/ or docs/adr/ to match new behaviour;
  those are history.

<!-- docs/product/as-built/scheduling/DOCS_SCHEDULING.md -->
# Scheduling (as built)            Last verified against code: 2026-09-29 (BLOG-42)
## Behaviour
- Authors schedule with localDateTime + IANA timezone; stored as publishAt (UTC) + publishTz.
- Times in the DST gap -> 400 TIME_NOT_IN_ZONE. Past times -> 400 SCHEDULE_IN_PAST.
- One EventBridge schedule per post, name post-<tenantId>-<postId>; deleted on unschedule.
## API
POST /api/posts/:id/schedule, DELETE /api/posts/:id/schedule   (see packages/shared/src/posts.ts)
## Code map
apps/api/src/routes/schedule.ts, apps/api/src/time.ts, apps/api/src/workers/publish.ts
## Known limits
Changing your profile timezone does not move existing schedules.`},

/* 4 */
{title:'Freeze the contract, then split front and back',
body:`<p>The most common way AI-assisted teams break things: backend and frontend sessions each "improve" the payload a little, and the two halves no longer match. The fix is procedural.</p>
<ol><li><b>Write the contract in the ticket</b>: method, path, auth, body, success shape, error codes, field names, enums (chapter 5 shows the block).</li>
<li><b>Get it agreed</b> by whoever builds each side, and mark it <b>frozen</b>.</li>
<li><b>Then split</b>: <code>/implement-backend</code> and <code>/implement-frontend</code> can run in parallel sessions or worktrees. The frontend uses mocks generated from the shared schemas.</li>
<li><b>Changes after the freeze</b> are a new decision: edit the ticket, tell both sides, then change both layers. The agent must stop and ask instead of changing the contract on its own.</li></ol>
<p>The same <b>response envelope</b> for every endpoint (success: the resource; error: <code>{ error: { code, message, details, requestId } }</code>) means the frontend handles errors once, in one place.</p>`,
code:`<!-- .claude/rules/api-contract.md -->
---
paths:
  - "apps/api/src/routes/**"
  - "apps/web/src/api/**"
  - "packages/shared/**"
---
# Frozen API contracts
- The contract in the ticket is frozen. Do not rename fields, change types, add
  required fields or change status codes. If the task seems to need that, STOP and
  explain what you would change and why.
- Errors always use ApiError from packages/shared/src/errors.ts. Never return
  ad-hoc shapes like { message } or { ok: false }.
- Frontend mocks come from the shared schemas (apps/web/src/mocks/), never hand-typed JSON.`},

/* 5 */
{title:'Copy the nearest sibling, make the smallest change',
body:`<p>Two always-on rules that stop most AI "creativity" problems:</p>
<h3>Copy the nearest sibling</h3>
<p>A new module should look like the closest existing one (same folders, naming, test layout, error handling), not like a fresh tutorial. In prompts, <b>name the sibling</b>: "match apps/api/src/routes/posts.ts" beats "make a Hono route".</p>
<h3>Smallest change that fixes the real flow</h3>
<p>Agents like to add helpers, options and abstractions "for the future". The rule: fix the actual user flow with the smallest diff. No new abstraction, dependency or config flag unless the ticket asks for it. Small diffs are easier to review and revert.</p>
<h3>Other always-on rules worth having</h3>
<ul><li><b>Coding guidelines</b>: early returns, braces always, no hardcoded secrets or URLs.</li>
<li><b>Verify the UI</b> in the browser after layout, routing or rendered-data changes. A green typecheck says nothing about the screen.</li>
<li><b>Lint and tests before review</b>, run exactly like CI does.</li>
<li><b>American (or British) English, consistently</b>, in code and UI copy.</li></ul>`,
code:`<!-- .claude/rules/core.md  (always on) -->
# Core
- Copy the nearest sibling. New code follows the closest existing module's structure,
  naming and tests. Say which sibling you copied in your summary.
- Smallest change that fixes the real flow. No new abstractions, dependencies, config
  options or refactors unless the task asks for them.
- User-visible text only through i18n (see locales rule). Errors use ApiError codes.
- After UI changes, check the screen in the browser (Playwright MCP) before saying done.
- Before saying done: pnpm lint && pnpm typecheck && pnpm test (the parts you touched).
- Don't commit unless asked. Never push.`},

/* 6 */
{title:'Requirements interview and /grill-me',
body:`<p><b>/requirements</b> turns a business ask into a spec a PM can review. The trick is that it <b>interviews</b> you: one question at a time, with short multiple-choice answers (in Claude Code, the agent's ask-question picker). It doesn't dump a 30-question questionnaire on you, and it doesn't invent answers.</p>
<p><b>/grill-me</b> stress-tests a plan <i>before</i> you build: the agent plays a sceptical senior engineer and asks one hard question at a time ("what happens if the schedule fires after the post was deleted?"). It writes nothing; the value is in the answers you didn't have.</p>`,
code:`<!-- .claude/skills/requirements/SKILL.md -->
---
name: requirements
description: Turn a business ask or Jira epic into a PM-reviewable requirements file.
  Usage: /requirements <JIRA-KEY or short ask>
disable-model-invocation: true
---
1. Read the ask ($ARGUMENTS), the Jira epic if a key is given, and any matching
   docs/product/as-built/ docs (what exists today).
2. Interview me. Ask ONE question at a time using the question picker, with 2-4 short
   options. Cover: users/roles, main flow, edge cases (timezones, tenants, permissions,
   empty/error states), non-goals, success measure. Stop after ~8 questions.
3. Write docs/product/requirements/<feature>/requirements.md using templates/requirements.md:
   problem, stories, Given/When/Then acceptance criteria, non-goals, open questions.
4. Never invent answers. Anything unanswered goes under "Open questions".

<!-- .claude/skills/grill-me/SKILL.md -->
---
name: grill-me
description: Stress-test the current plan or spec. Usage: /grill-me
disable-model-invocation: true
---
Act as a sceptical senior engineer. Ask me ONE hard question at a time about the plan
(failure modes, data consistency, tenancy, timezones, rollback, cost, what we are NOT
doing). Wait for my answer, then go deeper or move on. After ~6 questions, list the
decisions we made and the risks still open. Do not write or edit files.`},

/* 7 */
{title:'Prototype branches: throwaway on purpose',
body:`<ul><li>Prototypes live on <code>prototype/&lt;slug&gt;</code> branches, with notes in <code>docs/product/prototypes/&lt;slug&gt;/</code>.</li>
<li>They use the real app shell and real components, but fake data and no backend changes, so the PM clicks through something realistic.</li>
<li><b>Never ship from a prototype branch.</b> When the idea is approved, start a fresh branch (<code>feat/BLOG-XX-...</code>), copy the decisions (not the hacks), and build it properly with tests.</li>
<li>Enforce it: the <code>/pr</code> skill refuses a <code>prototype/*</code> head branch (step 12).</li>
<li>Delete old prototype branches after a few weeks. Keep the notes folder as a record of what was tried.</li></ul>`,
code:`<!-- .claude/skills/prototype/SKILL.md (excerpt) -->
---
name: prototype
description: Build a throwaway, clickable prototype inside the real web app shell.
  Usage: /prototype <slug> [mode: explore | validate against <requirements file>]
disable-model-invocation: true
---
1. git switch -c prototype/<slug> (refuse if the current branch is not main/dev).
2. Build screens under apps/web/src/prototypes/<slug>/ with fake data. No API,
   schema or infra changes. Reuse real components and tokens.
3. validate mode: walk every acceptance criterion and mark it OK / gap / unclear.
4. Write docs/product/prototypes/<slug>/NOTES.md: what we tried, decisions, open questions.
5. Never open a PR from this branch.`},

/* 8 */
{title:'Bug workflow: report, verify with evidence, fix with a regression test',
body:`<ol><li><b>/create-bug</b>: turn a messy report into a clean ticket: where (screen, role), environment, steps, expected vs actual, and severity. The agent asks for anything missing instead of guessing.</li>
<li><b>/verify-bug BLOG-123</b>: the agent tries to <b>reproduce</b> it (Playwright MCP against dev, or an API call), records evidence (screenshot, request/response, log lines with requestId) and comments on the ticket: reproduced / not reproduced / needs info.</li>
<li><b>Fix</b>: write a <b>failing regression test first</b> that reproduces the bug, then fix it with the smallest change, then update DOCS_* if behaviour changed.</li>
<li><b>QA</b>: re-run <code>/verify-bug</code> on the fixed build and attach the new evidence.</li></ol>`,
code:`# what you type
/create-bug
Role: author. Env: dev. Scheduling a post for tomorrow 09:00 shows "published" immediately.

/verify-bug BLOG-123

# what a good verify comment looks like (posted by the agent)
Reproduced on dev (build 4f2c1a), 2026-09-29 10:14 UTC.
Steps: login author@acme.test → Post "Q3" → Schedule 2026-09-30 09:00 Europe/Berlin.
Actual: status PUBLISHED. Expected: SCHEDULED.
Evidence: screenshot attached; POST /api/posts/…/schedule → 201 with publishAt "2026-09-29T07:00:00Z"
(requestId 7c1e…). Likely cause: date parsed in UTC instead of the author's zone.`},

/* 9 */
{title:'Test plans with stable case IDs',
body:`<p>Keep an e2e <b>test plan</b> per feature as markdown, where every case has an <b>ID that never changes</b> (<code>SCH-001</code>). The Playwright test titles include the ID. Then a QA report, a bug ticket and a failing CI job all point at the same case.</p>
<ul><li><code>/write-test-plan scheduling</code> creates the plan from the acceptance criteria.</li>
<li><code>/update-test-plan scheduling</code> refreshes it after a change: it <b>keeps existing IDs</b>, marks removed cases as retired (never reuses the ID) and appends new ones.</li></ul>`,
code:`<!-- e2e/plans/scheduling.md -->
| ID      | Case                                             | Priority | Automated          |
|---------|--------------------------------------------------|----------|--------------------|
| SCH-001 | Schedule tomorrow 09:00 in author tz             | P1       | scheduling.spec.ts |
| SCH-002 | Reader in another tz sees converted time         | P1       | scheduling.spec.ts |
| SCH-003 | Time in DST gap is rejected with message         | P2       | scheduling.spec.ts |
| SCH-004 | (retired 2026-09) Schedule from list view        | -        | -                  |
| SCH-005 | Unschedule removes the schedule                  | P1       | scheduling.spec.ts |

// e2e/scheduling.spec.ts
test('SCH-001 schedule tomorrow 09:00 in author tz', async ({ page }) => { /* ... */ });`},

/* 10 */
{title:'A gated spec track for big work (vs everyday flow)',
body:`<p>Not every change needs the same process. Many teams run <b>two tracks</b>:</p>
<table><tr><th></th><th>Everyday track</th><th>Gated spec track</th></tr>
<tr><td>For</td><td>Bugs, small features, UI tweaks</td><td>Milestones, cross-team work, risky changes (payments, data migrations, auth)</td></tr>
<tr><td>Flow</td><td>ticket → /implement-* → /pr</td><td>briefing → PRD → technical spec (TSD) → task cards → implement, with a <b>gate</b> (review/sign-off) between stages</td></tr>
<tr><td>Docs in</td><td>ticket + DOCS_*</td><td><code>docs/delivery/&lt;NNNN&gt;-&lt;kind&gt;-&lt;slug&gt;/</code></td></tr></table>
<ul><li>Each <b>task card</b> is small and self-contained: goal, contract, files, acceptance checks. That makes it a perfect unit of work for one agent session.</li>
<li><b>Gates</b> are where humans sign off (PM on the PRD, tech lead on the TSD) before the agent is allowed to continue.</li>
<li>Some teams use a CLI tool for this track (FieldTime's is called <b>LANE</b>; its binary and playbook are the source of truth there). The pattern matters more than the tool: <b>spec artifacts in the repo, explicit gates, small task cards.</b></li></ul>`},

/* 11 */
{title:'Locales and error catalogs',
body:`<p>If the product is (or will be) translated, the agent must never write user-visible text as string literals.</p>
<ul><li>All UI text goes through <code>t('key')</code> (react-i18next) with keys in <code>apps/web/src/locales/en/*.json</code>.</li>
<li><b>Validation messages</b> use keys from an errors catalog, not English inside zod or the API. The API returns an error <b>code</b>, and the UI maps it to a translated message.</li>
<li>Dates, numbers and plurals are formatted with <code>Intl</code> / i18n helpers, never string concatenation.</li>
<li>Add a lint rule (e.g. no literal strings in JSX) so the rule is enforced, not just requested.</li></ul>`,
code:`<!-- .claude/rules/locales.md -->
---
paths:
  - "apps/web/**/*.tsx"
  - "packages/shared/**"
---
# Locales
- No user-visible string literals in components. Use t('feature.key').
- New keys go in apps/web/src/locales/en/<feature>.json (other languages get the key
  with the English text and a TODO for translators).
- zod schemas use message keys: z.string().min(1, { message: 'errors.required' }).
- Map ApiError.code to errors.<code> in one place (src/api/errors.ts).

// apps/web/src/api/errors.ts
export const errorMessage = (t: TFunction, err: ApiError) => t('errors.' + err.error.code);`},

/* 12 */
{title:'Branch model, commit policy and PR guards',
body:`<h3>A common branch model</h3>
<ul><li><code>main</code> = production. <code>dev</code> = integration branch (deployed to the dev environment).</li>
<li>Work branches: <code>&lt;author&gt;/feat|fix|enhc/&lt;slug&gt;</code>, e.g. <code>sonish/feat/BLOG-42-schedule</code>. PRs go <b>into dev</b>. Releases go dev → main.</li>
<li>Prototype branches (<code>prototype/*</code>) never merge.</li></ul>
<h3>Commit policy: make it explicit</h3>
<p>Teams differ: some let the agent commit after each step, others say "<b>do not commit unless asked</b>" so the developer stays in control of history. Pick one and write it in CLAUDE.md. Either way, <b>pushing and opening PRs is always an explicit human request.</b></p>
<h3>Guards inside /pr</h3>
<p>The skill checks before it does anything, so a mistake can't reach the wrong branch:</p>`,
code:`<!-- .claude/skills/pr/SKILL.md (guard section) -->
## Guards - check these first and STOP with a clear message if any fails
- Current branch must NOT be dev, main, master or prototype/*.
- Branch must match <author>/(feat|fix|enhc)/<slug> and contain a Jira key.
- Base branch is dev unless I explicitly say otherwise.
- Working tree must be clean except for changes I asked you to commit.
- lint + typecheck + tests must pass (use /testing-linting).

## Then
- Fill .github/pull_request_template.md, push, gh pr create --base dev --draft.

# the same guard as a PreToolUse hook on Bash, for extra safety
CMD=$(jq -r '.tool_input.command // empty')
BRANCH=$(git branch --show-current)
if echo "$CMD" | grep -q 'gh pr create' && echo "$BRANCH" | grep -Eq '^(dev|main|master|prototype/)'; then
  echo "Refusing to open a PR from $BRANCH" >&2; exit 2
fi`},
],
questions:[
{q:'Why should prompts stay short in a mature AI-assisted repo?',lvl:2,points:['Stack/conventions already in rules and skills','Restating causes drift/conflicting instructions','Prompt = skill + ticket + task facts (+ sibling)','Repeated explanation → move into rule/skill','Long prompts only while building the setup'],
a:'Because the agent already has the stack and conventions from rules and skills. Restating them wastes context, and two slightly different descriptions of the same rule compete, which causes drift. A good prompt names the skill, the ticket and only the task-specific facts: what changes, which sibling to copy, which doc to read first. If I catch myself typing the same explanation twice, it goes into a rule or skill. Long detailed prompts are only normal while building the setup itself.'},
{q:'What does "code wins" mean for documentation, and how do you keep docs current with an agent?',lvl:2,points:['Plans/PRDs/ADRs = history, not updated','As-built docs describe behaviour today','Code is truth when they disagree','Rule: read before change, update after','Skill to update docs; reviewers check behaviour change ⇒ doc change'],
a:'There are two kinds of docs. Plans, PRDs and ADRs record what we intended at a point in time and are left as history. As-built docs describe what a feature does today. If an as-built doc disagrees with the code, the code is right and the doc gets fixed. With an agent I enforce this with an always-on rule (read the feature\'s as-built doc before changing it, update it in the same change) and a write-feature-docs skill that checks the doc against the code. In review, a behaviour change without a doc change is a missing piece.'},
{q:'How do you let backend and frontend work in parallel with AI agents without the contract drifting?',lvl:3,points:['Write contract fully: method, path, auth, body, success, errors, enums','Agree + freeze before code','Shared schemas; frontend mocks from them','One error envelope','Rule: agent must stop instead of changing contract; changes = explicit decision'],
a:'We freeze the contract first: method, path, auth, request body with field names and enums, success shape and status, and the error codes, all using one shared error envelope. It is written in the ticket and backed by shared zod schemas. Only then do backend and frontend start in parallel sessions. The frontend uses mocks generated from the same schemas. A path-scoped rule tells the agent the contract is frozen: if the task seems to need a change, it must stop and explain rather than quietly renaming a field. Changes after the freeze are an explicit decision recorded in the ticket and applied to both sides.'},
{q:'How do you handle a bug report end to end in an AI-assisted team?',lvl:2,points:['Structured bug ticket (role, env, steps, expected/actual)','Agent reproduces and records evidence','Failing regression test first','Smallest fix, docs updated','Re-verify with evidence on fixed build'],
a:'First a structured ticket: where, which role, which environment, steps, expected versus actual, and severity. The agent asks for anything missing. Then a verify step where the agent reproduces the bug, with Playwright or an API call against dev, and posts evidence on the ticket (screenshot, request and response, log lines with the requestId), or says it could not reproduce. The fix starts with a failing regression test, then the smallest change, then an as-built doc update if behaviour changed. QA re-runs the verification on the fixed build and attaches new evidence.'},
{q:'When would you use a heavier, gated spec process instead of the everyday ticket flow?',lvl:3,points:['Milestones, cross-team, risky areas (auth, payments, migrations)','Stages: briefing → PRD → technical spec → task cards','Human gates between stages','Task cards = ideal agent units','Everyday bugs/small features stay lightweight'],
a:'For work where a mistake is expensive or many people depend on it: a milestone feature, cross-team changes, or risky areas like auth, payments and data migrations. There I use a gated track: a briefing, then a PRD signed off by the PM, then a technical spec signed off by the tech lead, then small task cards, each with a goal, contract, files and acceptance checks, which are perfect units for an agent session. Everyday bugs and small features stay on the lightweight ticket flow, so the process does not slow down simple work.'},
]},

/* ---------------------------------------------------------- */
{
id:'g-scenarios', icon:'🌍', title:'15. Real-World Scenarios (and How to Handle Them with AI)', short:'15 · Real-world scenarios',
why:'Real work is rarely a clean new feature. It is legacy code, a 2 a.m. incident, a flaky test, an upgrade nobody wants, a secret pushed by mistake, a PM changing their mind mid-sprint. Each step here is a scenario you will meet, with a safe way to use the agent and the traps to avoid. These also make excellent interview answers.',
steps:[
/* 0 */
{title:'Joining a legacy or unfamiliar codebase',
body:`<p><b>Goal:</b> understand before you change. The agent is excellent at reading, and dangerous if it starts "cleaning up" code it doesn't understand yet.</p>
<ol><li>Start in <b>plan mode</b> (read-only). Ask for a map: entry points, main modules, data flow, how to run it, how tests run.</li>
<li>Use an explore subagent per area, in parallel, so the main session only gets summaries.</li>
<li>Get it running locally and run the tests <b>before</b> any change. Write down what failed.</li>
<li>Write the first <b>CLAUDE.md</b> from what you learned: commands, gotchas, "don't touch" areas. Grow it a little with each task.</li>
<li>First changes: small bug fixes with tests, and no refactors until you have tests around the area (characterisation tests).</li></ol>`,
code:`"Plan mode. Map this repo for a new developer: how to run it, the main modules and
 how a request flows through them, where tests live, and anything surprising. Use
 subagents per top-level folder. Don't change anything. End with 5 questions I should
 ask the team."`},

/* 1 */
{title:'Production incident and hotfix',
body:`<ol><li><b>Stabilise first</b>: roll back or turn off the feature flag. A fix can come later; stopping the damage comes now.</li>
<li><b>Investigate read-only</b>: the agent reads logs, metrics and recent deploys with a <b>read-only</b> profile and correlates them by requestId and tenantId. It proposes the cause; <b>it does not change production</b>.</li>
<li><b>Hotfix</b>: a branch from <code>main</code> (what is actually deployed), smallest fix plus a regression test, fast-track review (still 1 human approval), and a deploy through CI.</li>
<li><b>Back-merge</b> the hotfix into <code>dev</code> so it isn't lost in the next release.</li>
<li><b>Post-incident review</b> (blameless): timeline, cause, what detection missed. Then actions: alarm, test, and a rule or eval case if the AI was involved.</li></ol>`,
code:`"Incident: 5xx on POST /api/posts/:id/schedule since 14:05 UTC. Using the
 teamblog-prod-readonly profile, query CloudWatch Logs Insights for the api function
 14:00-14:30: errors grouped by message, tenantId, and the deploy that preceded them
 (gh run list). Give me the most likely cause and the smallest fix. Don't change anything."`},

/* 2 */
{title:'A flaky test',
body:`<p>A test that sometimes fails is worse than no test, because people learn to ignore red. <b>Never "fix" it with a retry or a longer timeout until you know the cause.</b></p>
<table><tr><th>Common cause</th><th>Typical fix</th></tr>
<tr><td>Time: real "now", timezone of the CI machine, DST dates</td><td>Freeze time (<code>vi.useFakeTimers</code>), pass explicit zones</td></tr>
<tr><td>Shared state between tests (same table, same user)</td><td>Unique ids / table per test file, clean up</td></tr>
<tr><td>Order dependence</td><td>Run in random order; make each test set up its own data</td></tr>
<tr><td>E2E timing (clicking before render)</td><td>Wait for a visible state (<code>expect(...).toBeVisible()</code>), not <code>sleep</code></td></tr>
<tr><td>Eventual consistency (GSI, SQS)</td><td>Poll for the condition with a deadline, or query the base table</td></tr></table>`,
code:`"This test fails about 1 in 10 runs: apps/api/test/schedule.int.test.ts > 'lists scheduled posts'.
 Run it 30 times in a loop and collect the failures. Find the root cause (check time,
 shared state, ordering, GSI eventual consistency). Don't add retries or bigger timeouts.
 Explain the cause before fixing it."`},

/* 3 */
{title:'Dependency or runtime upgrade',
body:`<p>For example Node 22 → 24, a major React Router version, or a major version of the AWS SDK. It's boring and risky, which makes it a good job for an agent if you keep it disciplined.</p>
<ol><li>Have the agent read the <b>official migration guide / changelog</b> (web or docs MCP) and list the breaking changes that apply to <i>this</i> repo (grep for the affected APIs).</li>
<li>Upgrade <b>one thing at a time</b>, one PR each. Use official codemods if they exist.</li>
<li>Run the full test suite, typecheck and a deploy to dev. Watch the metrics for a day.</li>
<li>Also update CI images, the Lambda runtime in CDK, <code>.nvmrc</code> and the CLAUDE.md commands.</li></ol>`,
code:`"We're upgrading Node 22 → 24. Read the official Node 24 release notes and list the
 breaking changes that affect this repo (search our code for each). Then propose the
 order of changes: .nvmrc, CI, CDK Lambda runtime, dependencies. One commit per step,
 tests after each. Stop and ask if a change needs a code redesign."`},

/* 4 */
{title:'A large refactor across many files',
body:`<ul><li><b>Tests first</b>: make sure the behaviour you're refactoring is covered. Add characterisation tests if not.</li>
<li><b>For mechanical changes</b> (rename an import across 300 files), have the agent <b>write a codemod script</b> and run it, instead of editing 300 files by hand. It's faster, reviewable and repeatable.</li>
<li><b>For judgment changes</b>, split the work into batches (per module). Parallel subagents or worktrees can each take one batch, with one PR per batch.</li>
<li><b>No behaviour change</b> in a refactor PR. Mixing refactor and feature makes review impossible.</li>
<li>Keep the old path working until everything has moved (expand → migrate → contract).</li></ul>`,
code:`"We're replacing our hand-written fetch wrapper with the generated API client in
 apps/web. First, write a codemod (ts-morph) that rewrites imports and call sites, and
 run it on src/pages/feed only. Show me the diff. If it's good, run it module by module,
 one commit per module, tests after each."`},

/* 5 */
{title:'Data migration or backfill (DynamoDB)',
body:`<p>For example, adding a new GSI for "posts by tag" needs a new attribute on every existing post.</p>
<ol><li><b>Expand</b>: deploy code that <i>writes</i> the new attribute for new and updated items, and still works without it.</li>
<li><b>Backfill</b>: a script that scans in pages, updates each item with a <b>conditional</b> update (skip if it's already set), and is <b>idempotent and resumable</b> (saves its last key). Run a <b>dry-run</b> first, then dev, then prod.</li>
<li><b>Switch</b> reads to the new GSI.</li>
<li><b>Contract</b>: remove the old code path.</li></ol>
<div class="callout warn"><b>Agent boundaries</b>The agent writes and tests the script against DynamoDB Local and dev. A human runs it against prod (or CI does, through an approved job), with the rate limited so it doesn't eat the table's capacity.</div>`},

/* 6 */
{title:'Breaking API change with existing clients',
body:`<p>Old web tabs, mobile apps and partner integrations keep calling the old API for weeks.</p>
<ul><li><b>Prefer additive changes</b>: new optional fields, new endpoints. Never rename or remove fields in place.</li>
<li>If you must break it, <b>version it</b> (<code>/v2/...</code> or a version header), run both versions, measure usage of the old one, announce a deprecation date, then remove it.</li>
<li>Contract tests in CI catch accidental breaking changes: compare the shared schemas against the last released version.</li>
<li>This is exactly where the "frozen contract" rule (chapter 14) protects you from an agent "improving" a field name.</li></ul>`},

/* 7 */
{title:'Security: leaked secret or vulnerability report',
body:`<h3>A secret was committed or pasted into a prompt</h3>
<ol><li><b>Rotate it immediately.</b> Assume it's compromised the moment it left your machine. Deleting the commit is not enough.</li>
<li>Then remove it from history if needed, check the logs for misuse, and add secret scanning (GitHub push protection, gitleaks in a pre-commit hook).</li>
<li>Prevent a repeat: <code>.env</code> is denied in agent permissions, and secrets come from Secrets Manager.</li></ol>
<h3>Dependency vulnerability (Dependabot / audit)</h3>
<ul><li>Have the agent check whether the vulnerable code path is actually used, upgrade to the fixed version, and run the tests.</li>
<li>Run <code>/security-review</code> on security-relevant PRs, but a human still owns the risk decision.</li></ul>`},

/* 8 */
{title:'Performance regression',
body:`<p><b>Measure, don't guess.</b> Agents will happily "optimise" the wrong thing.</p>
<ol><li>Find <b>where</b> it's slow: CloudWatch p95 per route, X-Ray traces, Lambda duration and cold starts, DynamoDB consumed capacity and throttles.</li>
<li>Form a hypothesis from the data: an N+1 query loop, a Scan instead of a Query, a big bundle, no pagination, a cold start from a huge package.</li>
<li>Reproduce it with a benchmark or load test, fix <b>one</b> thing, and measure again.</li>
<li>Add a guard: a budget test, a CloudWatch alarm on p95, a bundle-size check in CI.</li></ol>`,
code:`"GET /api/posts p95 went from 120 ms to 900 ms after last week's release. Using the
 dev read-only profile, compare X-Ray traces and DynamoDB metrics before/after, and
 list the changed code on that route (git log). Rank the likely causes with evidence.
 Don't change code yet."`},

/* 9 */
{title:'Requirements change mid-sprint',
body:`<ul><li>Stop implementation. Update the <b>requirements file</b> first (or run <code>/requirements</code> again), and run <code>/grill-me</code> if the change is big.</li>
<li>If the change touches a <b>frozen contract</b>, re-freeze explicitly and tell both backend and frontend.</li>
<li>Re-plan and re-estimate honestly. Offer a <b>scope cut</b> ("ship scheduling without edit-schedule this sprint") instead of silently squeezing it in.</li>
<li>Throw away agent work that no longer fits. It was cheap to produce, so don't let sunk cost keep it alive.</li></ul>`},

/* 10 */
{title:'Merge conflicts and long-lived branches',
body:`<ul><li><b>Prevent them</b>: small PRs, merge often, sync your branch with the base daily, and use feature flags instead of long-lived branches.</li>
<li><b>Resolve with understanding</b>: ask the agent to explain <i>both sides</i> of each conflict (what each change was trying to do) before choosing. Pure "take mine / take theirs" loses someone's work.</li>
<li>After resolving, <b>run the full test suite</b>. A clean merge can still be a broken build.</li>
<li>Lockfile conflicts: regenerate (<code>pnpm install</code>), don't hand-merge.</li></ul>`,
code:`"Merge dev into my branch. For each conflict, explain what my change and the other
 change were trying to do, propose a resolution that keeps both intents, and wait for my
 OK on anything non-trivial. Then run pnpm typecheck && pnpm test."`},

/* 11 */
{title:'When the AI is wrong, stuck or unavailable',
body:`<table><tr><th>Symptom</th><th>What to do</th></tr>
<tr><td>Loops: fixes one error, causes another, repeats</td><td>Stop (Esc). Rewind or <code>git restore</code>. Restart with a smaller step and the exact error.</td></tr>
<tr><td>Confident but invented API or AWS option</td><td>Ask for the doc link / check with a docs MCP. Typecheck and run it. Add a rule if it keeps happening.</td></tr>
<tr><td>Ignores a convention</td><td>Is the rule loaded for that path? Too vague? Contradicted elsewhere? Fix the rule, add an eval case.</td></tr>
<tr><td>Session got long and sloppy</td><td><code>/clear</code> and restart from the plan, or <code>/compact</code></td></tr>
<tr><td>Rate limit or outage</td><td>You're still a developer: continue by hand, or do review and planning work. Don't block the team on one tool.</td></tr></table>
<div class="callout"><b>Healthy mindset</b>Using an agent should never mean you <i>can't</i> do the work without it. You should always understand what it wrote well enough to own it.</div>`},

/* 12 */
{title:'Customer data, privacy and compliance',
body:`<ul><li><b>No customer data in prompts</b> unless your company's AI agreement allows it. Use seeded or anonymised data for debugging.</li>
<li><b>No PII in logs</b>: log ids (tenantId, userId, requestId), not emails, names or document content.</li>
<li><b>Delete a tenant's data on request</b> (GDPR): because every key starts with <code>TENANT#id</code> and every S3 key with <code>tenants/id/</code>, deletion is a clean, testable job. That's another benefit of the tenancy design.</li>
<li><b>Data residency</b>: some customers require that data stays in a region, and that includes where the AI API processes it. Check your provider's options.</li>
<li><b>Audit trail</b>: who changed what, and when. The PR template's "AI usage" section helps show how AI-written code was reviewed.</li></ul>`},

/* 13 */
{title:'Spikes and estimates',
body:`<p>"How long will PDF import take?" Nobody knows until someone tries. Use a <b>timeboxed spike</b>:</p>
<ol><li>Write the question the spike must answer ("Can pdfjs extract our customers' two-column PDFs well enough?").</li>
<li>Give it a timebox (half a day), on a throwaway <code>spike/*</code> branch. Agents make spikes very fast.</li>
<li>Output: a short <b>findings note</b> (what worked, what didn't, the risks, an estimate with a range), not production code.</li>
<li>Then write the real stories. The spike code is deleted or rewritten properly.</li></ol>`,
code:`"Spike (max 2 hours, branch spike/pdf-columns): test pdfjs text extraction on the 5 PDFs
 in samples/. For each, report text quality (1-5) and what breaks (columns, tables,
 headers). Try one fix for columns. Finish with a findings note and a 3-point estimate
 for the real feature. Don't touch apps/."`},

/* 14 */
{title:'Controlling AI cost and usage in the team',
body:`<ul><li><b>Development usage</b>: focused sessions, <code>/clear</code> between tasks, subagents for reading-heavy work (they keep the main context small), and cheaper models for simple subagent tasks.</li>
<li><b>Product usage</b> (the AI features you ship): log tokens <b>per tenant</b>, set quotas per plan, cache the stable system prompt, batch non-urgent jobs, and alarm on spend.</li>
<li><b>Model choice by evidence</b>: only move a feature to a cheaper model after the eval shows quality holds (chapter 9).</li>
<li>Review usage monthly like any other cloud cost, and share what worked in retro.</li></ul>`},
],
questions:[
{q:'You join a team with a large legacy codebase. How do you use an AI agent in your first two weeks?',lvl:2,points:['Read-only exploration first (plan mode, subagents)','Run it + tests before changing','Write/extend CLAUDE.md with findings','Small fixes with tests, no early refactors','Characterisation tests before refactoring'],
a:'At first I use it to read, not to write. In plan mode, with subagents per area, I ask for a map: how to run it, the main modules and data flow, where tests live, anything surprising, and questions for the team. I get it running and run the tests before changing anything. What I learn goes into CLAUDE.md: commands, gotchas, areas not to touch. My first changes are small bug fixes with tests. I avoid refactoring until the area has characterisation tests, because an agent cleaning up code nobody understands is how regressions happen.'},
{q:'Walk me through handling a production incident in a team that uses AI agents.',lvl:3,points:['Stabilise first: rollback / flag','Agent investigates read-only (logs, metrics, deploys)','Hotfix from main, smallest fix + regression test, fast review, CI deploy','Back-merge to dev','Blameless post-incident; alarms/tests/rules'],
a:'First stabilise: roll back or turn off the feature flag, and fix later. Then investigate. The agent can quickly query logs, metrics and recent deploys with a read-only profile, correlate by requestId and tenant, and propose a cause, but it never changes production. The hotfix branches from main, contains the smallest fix plus a regression test, gets a fast but real human review, and deploys through CI. Then I back-merge into dev. Afterwards comes a blameless review with the timeline and root cause, followed by actions such as a missing alarm, a test, and a rule or eval case if AI-written code was involved.'},
{q:'How do you run a data migration safely on DynamoDB?',lvl:3,points:['Expand/contract','Code handles both shapes first','Backfill: paged, conditional, idempotent, resumable, dry run','Dev before prod; rate-limited','Switch reads, then remove old path; humans/CI run prod'],
a:'Expand and contract. First I deploy code that writes the new attribute and still works without it. Then a backfill script pages through the items and uses conditional updates, so it is idempotent. It saves its progress so it can resume, and it runs as a dry-run, then on dev, then on prod with a rate limit so it does not consume the table\'s capacity. Once the backfill is complete, reads switch to the new attribute or GSI, and finally the old path is removed. The agent writes and tests the script locally and on dev. Prod runs are done by a person or an approved CI job.'},
{q:'A secret was accidentally committed and pushed. What do you do?',lvl:2,points:['Rotate immediately (assume compromised)','Then purge history if needed','Check for misuse in logs','Add secret scanning / push protection','Prevent: .env denied to agent, secrets manager'],
a:'Rotate it immediately. Once it has been pushed, or pasted into any external tool, I assume it is compromised, and deleting the commit does not change that. Then I check the provider\'s logs for misuse and remove it from git history if policy requires it. To prevent a repeat I enable push protection and secret scanning, add a pre-commit scanner, make sure .env files are denied in the agent\'s permissions, and load secrets from a secrets manager at runtime.'},
{q:'The AI keeps making the same mistake on your team. What do you do?',lvl:2,points:['Diagnose: rule missing, vague, not loaded, contradicted','Fix the instruction (rule/skill) not just the code','Enforce with hook/lint where possible','Add eval case to prove it stays fixed','Share in retro'],
a:'I treat it as a bug in our setup, not just in the code. Is there a rule for it? Is it too vague, not loaded for that path, or contradicted by another instruction or an old doc? I fix the rule or skill, and where possible enforce it deterministically with a lint rule or hook. I add an eval case, a task the agent runs headlessly and a check on the diff, so we can prove it stays fixed. Then I share it in the retro so everyone understands the change.'},
{q:'How do you estimate a feature when there is a lot of technical uncertainty?',lvl:1,points:['Timeboxed spike on throwaway branch','Clear question it must answer','Findings note + estimate range','AI makes spikes cheap','Real stories afterwards; spike code not shipped'],
a:'I run a timeboxed spike: a clear question it must answer, a strict timebox, and a throwaway branch. An agent makes spikes very cheap, since it can try pdfjs on five sample PDFs in an hour. The output is a findings note with what worked, what did not, the risks and an estimate range, not production code. Then we write the real stories from those findings, and the spike code is deleted or rewritten properly.'},
]},
];
