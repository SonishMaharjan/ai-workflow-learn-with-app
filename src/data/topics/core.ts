import type { Topic } from '../../types';

// AI-assisted dev, Expo/React Native, NestJS, Postgres + TypeORM
export const coreTopics: Topic[] = [
/* ---------------------------------------------------------- */
{
id:'ai', icon:'🤖', title:'AI-Assisted Dev (Cursor, Rules, Skills, Evals)', short:'AI-Assisted Dev',
why:'This is the headline skill of the role. Interviewers want to see that you can steer an AI tool like a senior engineer: give it context, constrain it with rules, verify its output, and measure quality with evals.',
steps:[
{title:'The mental model: you are the tech lead, AI is the fast junior',
body:`<p>AI-driven development is not "type a wish, accept the output". It is a loop you control:</p>
<table><tr><th>Stage</th><th>What you do</th></tr>
<tr><td><b>1. Spec</b></td><td>Write what "done" means: inputs, outputs, edge cases, acceptance criteria.</td></tr>
<tr><td><b>2. Context</b></td><td>Point the AI at the right files, docs and conventions (<code>@file</code>, rules).</td></tr>
<tr><td><b>3. Plan</b></td><td>Ask for a plan first. Review it before any code is written.</td></tr>
<tr><td><b>4. Generate</b></td><td>Let it implement in small steps (one module / one layer at a time).</td></tr>
<tr><td><b>5. Verify</b></td><td>Read the diff, run tests, lint, type-check, try it manually.</td></tr>
<tr><td><b>6. Commit</b></td><td>Small commits so you can roll back a bad AI step.</td></tr></table>
<div class="callout"><b>Interview soundbite</b>"I treat the AI like a fast junior developer: I give it a clear spec and context, make it plan before coding, and I own the review. Nothing merges that I haven't read and tested."</div>`,
prompt:`Before writing any code, read @src and produce a step-by-step plan for adding a "health check" endpoint. List files you will create/modify, and the tests you will write. Wait for my approval.`},
{title:'Cursor essentials you must know',
body:`<table><tr><th>Feature</th><th>Use it for</th></tr>
<tr><td><b>Tab</b> (autocomplete)</td><td>Multi-line predictions while you type. Great for boilerplate.</td></tr>
<tr><td><b>Cmd/Ctrl + K</b> (inline edit)</td><td>Select code → describe a change → accept/reject the diff. Small, local edits.</td></tr>
<tr><td><b>Chat / Agent</b> (Cmd/Ctrl + L, Cmd/Ctrl + I)</td><td><i>Ask</i> mode answers questions without editing. <i>Agent</i> mode edits many files, runs terminal commands, and iterates on errors.</td></tr>
<tr><td><b>@ mentions</b></td><td><code>@file</code>, <code>@folder</code>, <code>@codebase</code>, <code>@docs</code>, <code>@web</code>, <code>@git</code> — give precise context instead of hoping it finds it.</td></tr>
<tr><td><b>Checkpoints / restore</b></td><td>Roll back when an agent run goes wrong.</td></tr>
<tr><td><b>Rules</b></td><td>Persistent instructions (next step).</td></tr>
<tr><td><b>MCP servers</b></td><td>Connect tools: databases, Jira, Figma, browsers, AWS docs.</td></tr></table>
<div class="callout warn"><b>Common mistake</b>Giving one giant prompt ("build the whole app"). Break work into reviewable chunks; start a fresh chat when context gets long or confused.</div>`,
prompt:`@src/users Explain how a request flows through this module, from controller to database. Don't change any files.`},
{title:'Writing rules (project instructions)',
body:`<p>Rules are markdown instructions the AI reads automatically, so you stop repeating yourself. In Cursor they live in <code>.cursor/rules/*.mdc</code>. Many tools also read an <code>AGENTS.md</code> (Claude Code uses <code>CLAUDE.md</code>).</p>
<p>A rule has <b>frontmatter</b> that controls when it's applied:</p>
<ul><li><code>alwaysApply: true</code> → every request</li><li><code>globs</code> → auto-attached when matching files are in context</li><li><code>description</code> → the agent decides to pull it in when relevant</li></ul>
<h3>Good rules are</h3><ul><li><b>Specific & checkable</b> ("use <code>class-validator</code> DTOs for every body") not vague ("write clean code")</li><li><b>Short</b> — one concern per rule file</li><li><b>Include an example</b> of the pattern you want</li><li><b>Say what NOT to do</b> (e.g. "never use <code>synchronize: true</code>")</li></ul>`,
code:`---
description: Conventions for NestJS API modules
globs: apps/api/src/**/*.ts
alwaysApply: false
---

# NestJS module rules
- One feature = one module folder: module, controller, service, dto/, entities/.
- Every request body uses a DTO with class-validator decorators.
- Services never return TypeORM entities directly; map to a response DTO.
- All queries MUST be scoped by tenantId (see @tenant-context.ts).
- Never enable TypeORM "synchronize" - always create a migration.
- Write a unit test for every service method (*.spec.ts next to the file).

## Example
@src/invoices/invoices.service.ts is the reference implementation.`,
prompt:`Read @apps/api/src and write a .cursor/rules/nestjs.mdc rule file that captures the conventions you can see (folder structure, DTOs, error handling). Keep it under 30 lines and include one example file reference.`},
{title:'Skills: reusable, on-demand playbooks',
body:`<p>A <b>skill</b> is a folder containing a <code>SKILL.md</code> (name + description + instructions) plus optional scripts, templates or reference docs. The agent only sees the short description up front and <b>loads the full skill when the task matches</b> — so you can have many skills without bloating context.</p>
<table><tr><th></th><th>Rules</th><th>Skills</th><th>MCP</th></tr>
<tr><td>What</td><td>Always/auto-attached guidance</td><td>Task playbook + files, loaded on demand</td><td>Connection to an external tool/API</td></tr>
<tr><td>Example</td><td>"Use DTOs"</td><td>"How we create a new DB migration" with script</td><td>Postgres MCP to query the dev DB</td></tr></table>`,
code:`# .cursor/skills/create-migration/SKILL.md  (or .claude/skills/...)
---
name: create-migration
description: Use when the user asks to add/change a database column,
  table or index in the API. Creates a safe TypeORM migration.
---

## Steps
1. Update the entity in apps/api/src/<feature>/entities.
2. Run: pnpm --filter api migration:generate src/migrations/<Name>
3. Open the generated file and check:
   - no DROP COLUMN on columns still read by old code (zero-downtime)
   - new NOT NULL columns have a DEFAULT or a backfill step
4. Run pnpm --filter api migration:run against the local DB.
5. Add/adjust tests, then summarise the change for the PR.

## Reference
See references/zero-downtime.md for the expand/contract pattern.`,
prompt:`Create a skill folder "add-endpoint" with a SKILL.md that teaches an agent how to add a new REST endpoint in this repo (DTO, controller, service, test). Base it on @src/users.`},
{title:'Evals: measuring whether your AI setup actually works',
body:`<p>An <b>eval</b> is a test suite for AI behaviour. When you change a prompt, rule, skill or model, you rerun the evals to see if quality went up or down — instead of guessing from one example.</p>
<ol><li><b>Collect cases</b>: realistic inputs (start with 10–30), including edge cases and past failures.</li>
<li><b>Define success</b> per case: expected output or a rubric.</li>
<li><b>Choose graders</b>:<ul><li><i>Code-based</i>: exact match, JSON schema valid, regex, "tests pass", "file contains tenantId filter"</li><li><i>LLM-as-judge</i>: another model scores against a rubric (good for tone/quality)</li><li><i>Human review</i>: for a sample, to calibrate the judge</li></ul></li>
<li><b>Run & track</b> pass rate over time; add every new bug as a new case.</li></ol>
<div class="callout"><b>Example</b>You wrote a rule "all queries must be tenant-scoped". Eval: give the agent 10 tasks like "add endpoint to list invoices"; grader checks the generated code contains <code>where: { tenantId</code>. Pass rate 6/10 → improve the rule → 10/10.</div>`,
code:`// evals/invoice-extraction.eval.ts - a tiny eval runner
type Case = { id: string; input: string; expected: { total: number; currency: string } };

const cases: Case[] = [
  { id: 'simple',   input: 'Invoice total: $120.50',          expected: { total: 120.5, currency: 'USD' } },
  { id: 'euro',     input: 'Gesamtbetrag 99,00 EUR',          expected: { total: 99,    currency: 'EUR' } },
  { id: 'no-total', input: 'Thanks for your business!',        expected: { total: 0,     currency: 'UNKNOWN' } },
];

async function run() {
  let passed = 0;
  for (const c of cases) {
    const out = await extractInvoice(c.input); // your AI function
    const ok = out.total === c.expected.total && out.currency === c.expected.currency;
    if (ok) passed++;
    console.log((ok ? 'PASS ' : 'FAIL ') + c.id, ok ? '' : JSON.stringify(out));
  }
  console.log('Score: ' + passed + '/' + cases.length);
}
run();`,
prompt:`Write an eval file with 8 test cases for @src/ai/summarize.ts. Include 3 edge cases (empty input, very long input, non-English). Use a code-based grader where possible and an LLM-judge rubric for summary quality.`},
{title:'Driving a feature end-to-end with AI',
body:`<p>Practise telling this story — interviewers will ask "walk me through how you'd build X with Cursor".</p>
<ol><li><b>Spec</b> in a markdown file: user story, API shape, DB changes, edge cases, acceptance criteria.</li>
<li><b>Plan</b>: Agent in plan/ask mode, <code>@spec.md @relevant-folders</code> → review plan, correct it.</li>
<li><b>Data layer first</b>: entity + migration. Review, run migration.</li>
<li><b>Tests first (or alongside)</b>: ask for failing tests from acceptance criteria.</li>
<li><b>Implement</b> service → controller → client UI, one step per prompt. Let the agent run tests and fix errors.</li>
<li><b>Verify</b>: read every diff, run lint/typecheck/tests, manual test, check security (auth, tenant scoping, input validation).</li>
<li><b>Polish</b>: ask for review of its own diff ("find bugs, missing edge cases"), then PR description.</li>
<li><b>Improve the system</b>: if AI made the same mistake twice → add a rule/skill/eval.</li></ol>
<div class="callout ai"><b>Key phrase</b>"When the AI repeats a mistake, I don't just fix the code, I fix the instructions — add a rule, and an eval case so it stays fixed."</div>`,
prompt:`@docs/specs/invoice-reminders.md Create a plan to implement this feature across the NestJS API and Expo app. Split it into 6-8 small steps, each independently testable. Do not code yet.`},
],
questions:[
{q:'How do you make sure AI-generated code is correct and safe to merge?',lvl:1,points:['Read every diff; never accept blindly','Run tests, lint and type-check (ideally the agent runs them too)','Ask for tests from acceptance criteria / write tests first','Check security: auth, input validation, tenant isolation, secrets','Small commits / checkpoints to roll back','Watch for hallucinated APIs or packages — verify against docs'],
a:'I treat AI output like a PR from a junior dev. I review each diff, make sure tests exist and pass, run the linter and type-checker, and manually test the feature. I pay special attention to security-sensitive areas like authorization and tenant scoping, and I verify any library APIs it uses against the docs, because hallucinated methods are common. I keep commits small so a bad step is easy to revert.'},
{q:'What is the difference between rules, skills and MCP servers?',lvl:2,points:['Rules: persistent instructions/conventions attached always, by glob or by description','Skills: task-specific playbooks (SKILL.md + scripts/refs) loaded on demand','Skills keep context small because only the description is loaded upfront','MCP: protocol connecting the AI to external tools/data (DB, Jira, Figma)','Example of each'],
a:'Rules are standing instructions — coding conventions that apply always or to matching files. Skills are packaged playbooks for a specific task, like "create a migration", with a SKILL.md and optional scripts; the agent loads them only when the task matches, which saves context. MCP is a protocol that gives the AI tools — for example querying our Postgres DB or reading a Jira ticket. Rules shape how it writes code, skills teach it how to do a procedure, MCP lets it act on external systems.'},
{q:'How would you write an eval for an AI feature or an AI coding workflow?',lvl:2,points:['Collect realistic test cases incl. edge cases and past failures','Define expected output or rubric per case','Code-based graders where possible (schema, exact match, tests pass)','LLM-as-judge for subjective quality, calibrated with human review','Track score over time; rerun on every prompt/model/rule change','Turn production bugs into new eval cases'],
a:'I start with 20 or so real inputs, including edge cases and known failures, and define what a good output looks like for each. Where possible I use deterministic graders — JSON schema validation, exact field matches, or "do the generated tests pass". For subjective things I use an LLM judge with a clear rubric and spot-check it against human ratings. I run the suite whenever the prompt, rule or model changes and track the pass rate, and every bug we find becomes a new case.'},
{q:'Walk me through building a feature end-to-end with Cursor.',lvl:2,points:['Write a spec with acceptance criteria','Ask for a plan first and review it','Give precise context with @ mentions','Implement in small layers (DB → service → API → UI)','Tests alongside; agent runs & fixes','Review diffs, manual test, self-review prompt','Update rules/skills when mistakes repeat'],
a:'Say I need invoice reminders. I write a short spec with acceptance criteria, then ask the agent in plan mode, with the spec and relevant folders mentioned, to propose steps. I correct the plan, then implement layer by layer: entity and migration, then service with unit tests, then controller, then the Expo screen. After each step I review the diff and run tests. At the end I ask the AI to review its own diff for bugs and missing edge cases, then write the PR description. If it made a repeated mistake, I add a rule.'},
{q:'The AI keeps using a deprecated library API or inventing functions. What do you do?',lvl:1,points:['Give it the correct docs (@docs, @web, paste the API)','Pin versions in context (package.json)','Add a rule stating correct usage / banned APIs','Let type-checker/tests catch it','Add eval case to prevent regression'],
a:'First I give it correct context: the official docs via @docs or @web, and the package.json so it knows the version. Then I add a rule that says which API to use and which is deprecated. The type-checker and tests act as a safety net. If it matters, I add an eval case so we notice if a future model or rule change brings it back.'},
{q:'How do you manage context in a large codebase so the AI gives good answers?',lvl:3,points:['Mention exact files/folders instead of the whole codebase','Keep rules short and scoped with globs','Start fresh chats for new tasks','Keep a spec/plan file the agent can re-read','Good project structure & naming helps retrieval','Use skills for procedures instead of giant always-on rules'],
a:'I keep context precise: mention the exact files and a reference implementation rather than the whole repo. Rules are small and scoped by glob so irrelevant ones don’t load. For long tasks I keep a plan file the agent updates, so I can start a fresh chat without losing state. Procedures live in skills so they only load when needed.'},
]},
/* ---------------------------------------------------------- */
{
id:'rn', icon:'📱', title:'Expo & React Native', short:'Expo / React Native',
why:'You know React — React Native is React with different building blocks (no DOM, no CSS files) and a native build pipeline. Expo is the standard toolkit that makes RN easy to build, ship and update.',
steps:[
{title:'React web → React Native: what changes',
body:`<table><tr><th>React web</th><th>React Native</th></tr>
<tr><td><code>&lt;div&gt;</code></td><td><code>&lt;View&gt;</code></td></tr>
<tr><td><code>&lt;p&gt;, &lt;span&gt;</code></td><td><code>&lt;Text&gt;</code> (all text MUST be inside Text)</td></tr>
<tr><td><code>&lt;img&gt;</code></td><td><code>&lt;Image&gt;</code> / <code>expo-image</code></td></tr>
<tr><td><code>&lt;button onClick&gt;</code></td><td><code>&lt;Pressable onPress&gt;</code></td></tr>
<tr><td><code>&lt;input&gt;</code></td><td><code>&lt;TextInput onChangeText&gt;</code></td></tr>
<tr><td>CSS / className</td><td><code>StyleSheet.create</code> (JS objects) or NativeWind (Tailwind)</td></tr>
<tr><td>Flexbox default row</td><td>Flexbox default <b>column</b></td></tr>
<tr><td>Browser scroll</td><td><code>ScrollView</code> / <code>FlatList</code></td></tr></table>
<p>Hooks, state, context, TypeScript, React Query — all the same. 🎉</p>`,
code:`import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

export default function Greeting() {
  const [name, setName] = useState('');
  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Your name" onChangeText={setName} />
      <Pressable style={styles.btn} onPress={() => alert('Hi ' + name)}>
        <Text style={styles.btnText}>Say hi</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  btn: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '600' },
});`,
prompt:`Convert this React web component to React Native using View, Text, Pressable and StyleSheet. Explain each change: [paste a small component of yours]`},
{title:'Expo: Expo Go, dev builds, EAS',
body:`<ul><li><b>Create</b>: <code>npx create-expo-app@latest my-app</code> → <code>npx expo start</code> → scan QR with <b>Expo Go</b> on your phone.</li>
<li><b>Expo Go</b>: a prebuilt app with common native modules. Fast to start, but you can't add custom native code.</li>
<li><b>Development build</b> (<code>expo-dev-client</code>): your own debug app containing <i>your</i> native modules. Needed for things like custom SDKs, some payments/maps libraries.</li>
<li><b>Prebuild / CNG</b>: Expo generates the <code>ios/</code> and <code>android/</code> folders from <code>app.json</code> + <b>config plugins</b>, so you rarely touch native code.</li>
<li><b>EAS Build</b>: cloud builds for iOS/Android (<code>eas build --profile production</code>).</li>
<li><b>EAS Submit</b>: upload to App Store / Play Store.</li>
<li><b>EAS Update</b>: over-the-air (OTA) updates of the <i>JavaScript bundle</i> — fix bugs without store review. Native changes still need a new build (managed via <code>runtimeVersion</code>).</li></ul>`,
code:`// eas.json - build profiles
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal", "channel": "preview" },
    "production":  { "channel": "production", "autoIncrement": true }
  }
}`,
prompt:`Explain the difference between Expo Go, a development build and a production build for my app. When would I be forced to leave Expo Go?`},
{title:'Expo Router: file-based navigation',
body:`<p>Just like Next.js: files in <code>app/</code> become screens.</p>
<pre><code>app/
  _layout.tsx          ← root layout (Stack)
  (auth)/login.tsx     ← group, doesn't appear in URL
  (tabs)/_layout.tsx   ← tab bar
  (tabs)/index.tsx     ← "/"
  (tabs)/invoices.tsx  ← "/invoices"
  invoice/[id].tsx     ← "/invoice/123" (dynamic)</code></pre>
<p>Deep links (<code>myapp://invoice/123</code>) work automatically because routes are URLs.</p>`,
code:`// app/invoice/[id].tsx
import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ padding: 20 }}>
      <Text>Invoice {id}</Text>
      <Pressable onPress={() => router.back()}><Text>Back</Text></Pressable>
    </View>
  );
}

// Navigate from anywhere:
// <Link href="/invoice/42">Open</Link>   or   router.push('/invoice/42')`,
prompt:`Set up Expo Router with a (tabs) group containing Home and Invoices tabs, an (auth)/login screen, and a dynamic invoice/[id] screen. Redirect to login if there's no token.`},
{title:'Lists, performance & the new architecture',
body:`<ul><li>Never <code>.map()</code> a long list inside ScrollView → use <b><code>FlatList</code></b> (virtualised) or Shopify <b>FlashList</b>.</li>
<li>Give a stable <code>keyExtractor</code>, memoise row components (<code>React.memo</code>), avoid inline heavy functions.</li>
<li>Animations: <b>Reanimated</b> runs on the UI thread → smooth even when JS is busy.</li>
<li><b>New Architecture</b> (default in modern Expo SDKs): <b>JSI</b> lets JS call native directly (no async JSON bridge), <b>Fabric</b> is the new renderer, <b>TurboModules</b> load native modules lazily. <b>Hermes</b> is the JS engine optimised for RN.</li></ul>`,
code:`import { FlatList, Text, View } from 'react-native';
import { memo } from 'react';

const Row = memo(({ item }: { item: Invoice }) => (
  <View style={{ padding: 16 }}><Text>{item.number} - {item.total}</Text></View>
));

<FlatList
  data={invoices}
  keyExtractor={(i) => i.id}
  renderItem={({ item }) => <Row item={item} />}
  onEndReached={fetchNextPage}      // infinite scroll
  onEndReachedThreshold={0.5}
  refreshing={isRefetching}
  onRefresh={refetch}               // pull to refresh
/>`,
prompt:`My FlatList with 2000 items is laggy. Review @components/InvoiceList.tsx and suggest performance fixes, explaining why each one helps.`},
{title:'Data, auth tokens & native features',
body:`<ul><li><b>Server state</b>: TanStack Query (same as web) — caching, retries, offline-friendly.</li>
<li><b>Secrets/tokens</b>: <code>expo-secure-store</code> (Keychain / Keystore). <b>Not</b> AsyncStorage (unencrypted).</li>
<li><b>Simple storage</b>: AsyncStorage or MMKV (fast).</li>
<li><b>Native APIs</b>: <code>expo-camera</code>, <code>expo-image-picker</code>, <code>expo-document-picker</code> (pick PDFs!), <code>expo-notifications</code>, <code>expo-file-system</code>. Always request permissions and handle "denied".</li>
<li><b>Platform code</b>: <code>Platform.OS === 'ios'</code> or files <code>Button.ios.tsx</code> / <code>Button.android.tsx</code>.</li>
<li><b>Env vars</b>: <code>EXPO_PUBLIC_API_URL</code> (visible in the bundle — never put secrets there!).</li></ul>`,
code:`import * as SecureStore from 'expo-secure-store';
import * as DocumentPicker from 'expo-document-picker';

export const saveToken = (t: string) => SecureStore.setItemAsync('token', t);
export const getToken  = () => SecureStore.getItemAsync('token');

// Pick a PDF and upload it to S3 using a presigned URL from our API
export async function pickAndUploadPdf() {
  const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
  if (res.canceled) return;
  const file = res.assets[0];

  const { uploadUrl, key } = await api.post('/uploads/presign', { contentType: 'application/pdf' });
  const blob = await (await fetch(file.uri)).blob();
  await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'application/pdf' } });
  return key;
}`,
prompt:`Create an Expo screen that lets a user pick a PDF, shows its name and size, then uploads it using a presigned URL from POST /uploads/presign. Handle cancel and errors.`},
],
questions:[
{q:'What is the difference between Expo Go and a development build?',lvl:1,points:['Expo Go = prebuilt sandbox app with a fixed set of native modules','Dev build = your own app binary with your native deps + dev client','Need dev build for custom native modules / config plugins','Both support fast refresh'],
a:'Expo Go is a generic app from the store with a fixed set of native modules, so it’s great for getting started. A development build is your own debug binary built with expo-dev-client that includes whatever native libraries and config plugins your app needs. As soon as you need a native module not in Expo Go, you switch to a dev build.'},
{q:'How does React Native render UI, and what is the New Architecture?',lvl:3,points:['JS runs in an engine (Hermes); UI is real native views, not a WebView','Old: async JSON bridge between JS and native','New: JSI — direct sync calls to C++/native','Fabric renderer, TurboModules (lazy native modules)','Benefits: faster, less overhead, sync layout'],
a:'Your React code runs in a JS engine, usually Hermes, and React Native translates the component tree into real native views. The old architecture sent serialized messages over an asynchronous bridge. The New Architecture uses JSI so JS can hold references to and call native objects directly, Fabric as the new renderer, and TurboModules which load native modules lazily. That reduces overhead and enables synchronous work where needed.'},
{q:'How would you optimise a slow, long list in React Native?',lvl:2,points:['FlatList/FlashList instead of ScrollView + map','Stable keyExtractor','Memoised row components, stable callbacks','getItemLayout / fixed heights','Avoid heavy work in render; paginate data','Optimised images (expo-image, caching)'],
a:'First make sure it’s virtualised: FlatList or FlashList, not a mapped ScrollView. Give it stable keys, memoise row components and callbacks so rows don’t re-render, and use getItemLayout if heights are fixed. Paginate from the API with onEndReached, and use a caching image component. Then profile with the React DevTools profiler to confirm.'},
{q:'Where do you store an auth token in a mobile app and why?',lvl:1,points:['expo-secure-store (iOS Keychain / Android Keystore)','Not AsyncStorage — unencrypted','Short-lived access token + refresh token','Clear on logout','Never embed secrets in EXPO_PUBLIC_ env'],
a:'In expo-secure-store, which uses the iOS Keychain and Android Keystore, so it’s encrypted. AsyncStorage is plain storage and shouldn’t hold secrets. I’d use a short-lived access token with a refresh token, clear both on logout, and never put secrets in EXPO_PUBLIC variables because those ship in the bundle.'},
{q:'What can and can’t you ship with an OTA update (EAS Update)?',lvl:2,points:['Can: JS/TS code and assets','Can’t: native code changes, new native modules, permissions changes','runtimeVersion ties updates to compatible binaries','Channels (preview/production) and rollbacks','Store guidelines: no changing core app purpose'],
a:'OTA updates replace the JavaScript bundle and assets, so bug fixes and UI changes can go out instantly. Anything native — new native modules, SDK upgrades, permission changes — needs a new store build. runtimeVersion makes sure an update only goes to binaries with a compatible native layer, and channels let us ship to preview first and roll back if needed.'},
{q:'How do you handle navigation and deep links in Expo?',lvl:2,points:['Expo Router: file-based routes in app/','Layouts: Stack, Tabs; groups with (name)','Dynamic routes [id].tsx + useLocalSearchParams','Scheme in app.json → deep links map to routes automatically','Auth guard via redirect in layout'],
a:'With Expo Router, each file in app/ is a route, layouts define stacks and tabs, and dynamic segments like [id].tsx read params with useLocalSearchParams. Because every screen has a URL, setting a scheme in app.json gives deep links for free — myapp://invoice/42 opens that screen. I protect routes by checking auth in a layout and redirecting to the login group.'},
]},
/* ---------------------------------------------------------- */
{
id:'nest', icon:'🐱', title:'NestJS (Backend Framework)', short:'NestJS',
why:'NestJS is a structured Node.js framework (Angular-style) built on Express/Fastify. It uses TypeScript decorators, modules and dependency injection, so large backends stay organised.',
steps:[
{title:'Building blocks: Module, Controller, Provider',
body:`<ul><li><b>Module</b> (<code>@Module</code>) — groups a feature: its controllers, providers, imports and exports.</li>
<li><b>Controller</b> (<code>@Controller</code>) — handles HTTP routes; thin, delegates to services.</li>
<li><b>Provider / Service</b> (<code>@Injectable</code>) — business logic, injected by Nest's DI container.</li></ul>
<p>Generate with the CLI: <code>npm i -g @nestjs/cli</code> → <code>nest new api</code> → <code>nest g resource invoices</code> (creates module, controller, service, DTOs).</p>`,
code:`// invoices.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],          // other modules can inject it
})
export class InvoicesModule {}

// invoices.controller.ts
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {} // DI!

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoices.create(dto);
  }
}`,
prompt:`Using the Nest CLI conventions, create an "invoices" resource with CRUD endpoints, DTOs, and a service backed by a TypeORM repository. Explain what each file does.`},
{title:'Dependency Injection (the core idea)',
body:`<p>Instead of <code>new InvoicesService(new Repo(), new Mailer())</code>, you declare dependencies in the constructor and Nest's <b>IoC container</b> creates and shares instances.</p>
<ul><li>Default scope is <b>singleton</b> (one instance for the app) — fast.</li>
<li><code>Scope.REQUEST</code> — new instance per request (useful for tenant context, but slower: bubbles up the chain).</li>
<li><b>Why it matters</b>: easy testing (swap real deps for mocks), loose coupling.</li>
<li>Custom providers: <code>useValue</code>, <code>useClass</code>, <code>useFactory</code> (e.g. create S3 client from config).</li>
<li>Circular dependency → <code>forwardRef(() =&gt; X)</code>, but usually a sign to refactor.</li></ul>`,
code:`// Factory provider: build an AWS S3 client from config
export const S3_CLIENT = 'S3_CLIENT';

@Module({
  providers: [{
    provide: S3_CLIENT,
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      new S3Client({ region: config.get('AWS_REGION') }),
  }],
  exports: [S3_CLIENT],
})
export class AwsModule {}

// usage
constructor(@Inject(S3_CLIENT) private readonly s3: S3Client) {}`},
{title:'Request lifecycle: middleware, guards, interceptors, pipes, filters',
body:`<p>A very common interview question. Order of execution:</p>
<p><b>Middleware → Guards → Interceptors (before) → Pipes → Controller handler → Interceptors (after) → Exception filters</b> (if something throws)</p>
<table><tr><th>Piece</th><th>Job</th><th>Example</th></tr>
<tr><td>Middleware</td><td>Raw req/res, before routing</td><td>logging, resolve tenant from subdomain</td></tr>
<tr><td>Guard</td><td>Can this request proceed? (true/false)</td><td>JWT auth, roles</td></tr>
<tr><td>Interceptor</td><td>Wrap handler (RxJS) before & after</td><td>timing, transform response, caching</td></tr>
<tr><td>Pipe</td><td>Validate/transform input</td><td><code>ValidationPipe</code>, <code>ParseIntPipe</code></td></tr>
<tr><td>Exception filter</td><td>Turn errors into HTTP responses</td><td>map DB errors to 409</td></tr></table>`,
code:`// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());
    if (!roles) return true;
    const user = ctx.switchToHttp().getRequest().user;
    return roles.includes(user.role);
  }
}

// logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(tap(() => console.log('took ' + (Date.now() - start) + 'ms')));
  }
}`,
prompt:`Draw (in text) the NestJS request lifecycle and show where authentication, tenant resolution, validation, logging and error mapping should live in @src.`},
{title:'DTOs & validation',
body:`<p>Never trust input. Use <b>DTO classes</b> + <code>class-validator</code> + a global <code>ValidationPipe</code>.</p>
<ul><li><code>whitelist: true</code> strips unknown properties (prevents mass-assignment).</li>
<li><code>forbidNonWhitelisted: true</code> rejects them with 400.</li>
<li><code>transform: true</code> converts payloads to DTO class instances / types.</li></ul>`,
code:`// create-invoice.dto.ts
export class CreateInvoiceDto {
  @IsString() @Length(1, 50)
  number: string;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  total: number;

  @IsISO8601()
  dueDate: string;                // ISO string, stored as timestamptz

  @IsOptional() @IsEmail()
  customerEmail?: string;
}

// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));`},
{title:'Testing in NestJS',
body:`<ul><li><b>Unit tests</b>: <code>Test.createTestingModule</code>, mock dependencies with <code>useValue</code>.</li>
<li><b>E2E tests</b>: spin up the app + <code>supertest</code>, hit real routes against a test DB (Docker/Testcontainers).</li></ul>`,
code:`describe('InvoicesService', () => {
  let service: InvoicesService;
  const repo = { findOne: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useValue: repo },
      ],
    }).compile();
    service = module.get(InvoicesService);
  });

  it('throws NotFound when invoice is missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });
});`,
prompt:`Write unit tests for @src/invoices/invoices.service.ts covering happy path, not found, and tenant mismatch. Mock the repository.`},
],
questions:[
{q:'Explain dependency injection in NestJS and why it’s useful.',lvl:1,points:['IoC container creates and wires instances','Constructor injection with @Injectable','Default singleton scope; request/transient scopes','Easy to mock in tests','Custom providers: useValue/useClass/useFactory'],
a:'Classes declare what they need in the constructor and Nest’s IoC container creates and injects those instances. Providers are singletons by default. It decouples code — the controller doesn’t know how the service is built — and makes testing easy because I can swap a repository for a mock with useValue. For things like SDK clients I use factory providers.'},
{q:'What is the order of the NestJS request lifecycle? Guard vs middleware vs interceptor?',lvl:2,points:['Middleware → Guards → Interceptors → Pipes → Handler → Interceptors → Filters','Middleware: raw req, no knowledge of handler','Guard: authorization decision, has ExecutionContext','Interceptor: wraps before/after (logging, transform)','Pipe: validation/transformation','Filter: error → response'],
a:'Middleware runs first, then guards, then interceptors before the handler, then pipes, then the handler, then interceptors on the way out, and exception filters if anything throws. Middleware works on the raw request and doesn’t know which handler will run. Guards have the execution context so they’re ideal for auth and role checks. Interceptors wrap the handler for cross-cutting things like logging or response mapping. Pipes validate and transform input.'},
{q:'How do you handle validation and errors consistently across an API?',lvl:1,points:['DTOs with class-validator','Global ValidationPipe whitelist/forbidNonWhitelisted/transform','Throw built-in HttpExceptions (NotFound, Conflict...)','Global exception filter for consistent error shape + mapping DB errors','Log with correlation/request id'],
a:'Every input goes through a DTO with class-validator decorators and a global ValidationPipe with whitelist enabled. In services I throw Nest’s HTTP exceptions like NotFoundException. A global exception filter formats every error the same way and maps things like Postgres unique violations to 409. Errors are logged with a request ID.'},
{q:'When would you use a request-scoped provider and what’s the downside?',lvl:3,points:['Per-request state e.g. tenant/user context','Scope bubbles up: dependants become request-scoped too','Performance cost: instances created per request','Alternative: AsyncLocalStorage (nestjs-cls)'],
a:'When a provider needs per-request data, like the current tenant. The downside is that request scope bubbles up the injection chain, so everything depending on it is also recreated per request, which hurts performance. I usually prefer AsyncLocalStorage, for example via nestjs-cls, to hold request context while keeping services singleton.'},
{q:'How would you structure a large NestJS application?',lvl:2,points:['Feature modules (invoices, users, tenants)','Shared/common module (guards, filters, utils)','Config module with validated env','Thin controllers, logic in services, data access in repositories','Background jobs/queues separate (SQS consumers)','Monorepo (Nx/Turbo) if sharing types with Expo app'],
a:'By feature modules — invoices, users, tenants — each owning its controller, service, DTOs and entities. A common module holds guards, filters and interceptors, and a config module validates env vars at startup. Controllers stay thin. Background consumers like SQS workers are their own modules or Lambdas. If there’s an Expo app I’d use a monorepo so API types can be shared.'},
]},
/* ---------------------------------------------------------- */
{
id:'pg', icon:'🐘', title:'Postgres & TypeORM', short:'Postgres + TypeORM',
why:'Postgres is the relational database; TypeORM maps TypeScript classes to tables. Expect questions about relations, migrations, transactions, indexes and performance.',
steps:[
{title:'Entities & relations',
body:`<p>An <b>entity</b> is a class mapped to a table. Relations: <code>@ManyToOne</code>, <code>@OneToMany</code>, <code>@ManyToMany</code>, <code>@OneToOne</code>.</p>
<div class="callout warn"><b>Always use timestamptz</b>for moments in time — it stores UTC and converts correctly. (More in the Timezones topic.)</div>`,
code:`@Entity('invoices')
@Index(['tenantId', 'createdAt'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() tenantId: string;

  @Column({ length: 50 }) number: string;

  @Column('numeric', { precision: 12, scale: 2 }) total: string; // numeric -> string to avoid float issues

  @Column({ type: 'timestamptz' }) dueAt: Date;

  @Column({ type: 'jsonb', nullable: true }) extracted: Record<string, unknown> | null;

  @ManyToOne(() => Customer, (c) => c.invoices, { onDelete: 'CASCADE' })
  customer: Customer;

  @VersionColumn() version: number;         // optimistic locking
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}`},
{title:'Querying: Repository vs QueryBuilder, and N+1',
body:`<ul><li><b>Repository</b> for simple CRUD: <code>find</code>, <code>findOne</code>, <code>save</code>.</li>
<li><b>QueryBuilder</b> for joins, aggregates, complex filters.</li>
<li><b>N+1 problem</b>: loading 100 invoices then 1 query per invoice for its customer = 101 queries. Fix: join (<code>relations</code> / <code>leftJoinAndSelect</code>) or batch load (DataLoader).</li>
<li>Pagination: <code>OFFSET</code> gets slow on big tables → <b>cursor/keyset</b> pagination (<code>WHERE created_at &lt; :cursor</code>).</li></ul>`,
code:`// Simple
const inv = await repo.find({ where: { tenantId }, relations: { customer: true }, take: 20 });

// QueryBuilder: overdue totals per customer
const rows = await repo.createQueryBuilder('i')
  .select('c.name', 'customer')
  .addSelect('SUM(i.total)', 'overdue')
  .innerJoin('i.customer', 'c')
  .where('i.tenantId = :tenantId', { tenantId })
  .andWhere('i.dueAt < now()')
  .groupBy('c.name')
  .getRawMany();

// Keyset pagination
repo.createQueryBuilder('i')
  .where('i.tenantId = :t AND i.createdAt < :cursor', { t: tenantId, cursor })
  .orderBy('i.createdAt', 'DESC').limit(20).getMany();`,
prompt:`Find any N+1 query problems in @src/invoices and fix them. Show the SQL before and after (enable TypeORM logging).`},
{title:'Migrations (never synchronize in production)',
body:`<p><code>synchronize: true</code> auto-alters tables from entities — convenient locally, dangerous in prod (can drop data). Use migrations:</p>
<pre><code>npx typeorm migration:generate src/migrations/AddDueAt -d src/data-source.ts
npx typeorm migration:run -d src/data-source.ts
npx typeorm migration:revert -d src/data-source.ts</code></pre>
<h3>Zero-downtime (expand → migrate → contract)</h3>
<ol><li>Add the new nullable column (old code still works)</li><li>Deploy code writing both; backfill data</li><li>Switch reads to new column</li><li>Later migration: drop old column</li></ol>`},
{title:'Transactions & locking',
body:`<p>Use a transaction when several writes must succeed or fail together.</p>
<ul><li>Isolation levels: <b>Read Committed</b> (Postgres default), Repeatable Read, Serializable.</li>
<li><b>Optimistic locking</b>: <code>@VersionColumn</code> — update fails if someone else changed the row.</li>
<li><b>Pessimistic locking</b>: <code>SELECT ... FOR UPDATE</code> (<code>lock: { mode: 'pessimistic_write' }</code>).</li></ul>`,
code:`await this.dataSource.transaction(async (manager) => {
  const invoice = await manager.findOne(Invoice, {
    where: { id, tenantId },
    lock: { mode: 'pessimistic_write' },
  });
  if (!invoice) throw new NotFoundException();

  invoice.status = 'paid';
  await manager.save(invoice);
  await manager.save(Payment, { invoiceId: id, amount: invoice.total, tenantId });
}); // any throw -> ROLLBACK`},
{title:'Indexes & performance',
body:`<ul><li><b>B-tree</b> (default): equality and range. Composite index order matters: <code>(tenant_id, created_at)</code> helps <code>WHERE tenant_id = ? ORDER BY created_at</code>.</li>
<li><b>GIN</b>: JSONB, arrays, full-text search.</li>
<li><b>Partial index</b>: <code>WHERE status = 'unpaid'</code>.</li>
<li>Diagnose with <code>EXPLAIN ANALYZE</code> — look for Seq Scan on large tables.</li>
<li>Indexes speed reads but slow writes and use space.</li>
<li>Connection pooling (pgBouncer / RDS Proxy), especially with Lambda.</li></ul>`,
code:`EXPLAIN ANALYZE
SELECT * FROM invoices
WHERE tenant_id = 't1' AND status = 'unpaid'
ORDER BY due_at LIMIT 20;

CREATE INDEX CONCURRENTLY idx_invoices_unpaid
  ON invoices (tenant_id, due_at) WHERE status = 'unpaid';`},
],
questions:[
{q:'What is the N+1 query problem and how do you fix it in TypeORM?',lvl:1,points:['1 query for list + N queries for related rows','Caused by lazy loading / loops','Fix: relations / leftJoinAndSelect','Or batch with DataLoader / IN query','Detect via query logging'],
a:'It’s when you load a list with one query, then run another query per row to load a relation — 1 plus N queries. In TypeORM I fix it by joining with relations or leftJoinAndSelect, or by batching the IDs into one IN query, for example with DataLoader. I detect it by enabling query logging.'},
{q:'Why shouldn’t you use synchronize: true in production? How do you do safe migrations?',lvl:1,points:['synchronize can drop/alter columns and lose data','No review or history','Migrations: versioned, reviewed, reversible','Expand-contract for zero downtime','Run migrations in CI/CD before deploy'],
a:'synchronize alters the schema automatically from entities, which can drop columns and lose data, with no review or history. In production I use generated migrations that are reviewed and run in the deploy pipeline. For zero downtime I use expand-and-contract: add the new column, backfill, switch the code, and only later drop the old one.'},
{q:'Explain transactions and isolation levels. How do you prevent two users paying the same invoice twice?',lvl:3,points:['ACID; all-or-nothing','Read Committed default; Repeatable Read; Serializable','Pessimistic lock SELECT FOR UPDATE','Optimistic lock with version column','Unique constraint / idempotency key as a safety net'],
a:'A transaction makes several writes atomic. Postgres defaults to Read Committed; Repeatable Read and Serializable give stronger guarantees with more conflicts. For double payment I’d lock the invoice row with SELECT FOR UPDATE inside the transaction and check status, or use optimistic locking with a version column. I’d also add a unique constraint or idempotency key on the payment so a retry can’t create a duplicate.'},
{q:'How do you decide which indexes to add?',lvl:2,points:['Based on real query patterns (WHERE, JOIN, ORDER BY)','EXPLAIN ANALYZE to confirm','Composite index column order','Partial / GIN indexes for special cases','Trade-off: write cost & storage','CREATE INDEX CONCURRENTLY in prod'],
a:'From the actual queries: columns in WHERE, JOIN and ORDER BY. I check EXPLAIN ANALYZE for sequential scans on large tables. For multi-tenant tables a composite index starting with tenant_id is common. I use partial indexes for hot subsets and GIN for JSONB. Every index costs write performance, so I don’t add them blindly, and I create them concurrently in production.'},
{q:'When would you use JSONB in Postgres vs normal columns?',lvl:2,points:['JSONB for flexible / semi-structured data (e.g. AI-extracted PDF fields, tenant settings)','Normal columns for data you filter, join, constrain','GIN index for JSONB queries','Loses type safety & constraints'],
a:'JSONB is good for semi-structured data whose shape varies, like fields extracted from a PDF or per-tenant settings. Anything I filter or join on often, or need constraints on, should be a real column. JSONB can be indexed with GIN, but you lose type checking and foreign keys.'},
]}
];
