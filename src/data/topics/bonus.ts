import type { Topic } from '../../types';

// "Better to have" topics
export const bonusTopics: Topic[] = [
{
id:'tz', icon:'🌍', title:'Timezones & Dates', short:'Timezones',
why:'Timezone bugs are subtle and common: reminders firing at 3am, reports missing a day, DST shifting meetings by an hour. Interviewers ask this to see if you have been burned before — show that you know the rules.',
steps:[
{title:'Golden rules',
body:`<ol><li><b>Store instants in UTC</b> — Postgres <code>timestamptz</code>, ISO strings with <code>Z</code>, epoch ms.</li>
<li><b>Convert at the edges</b> — only when displaying to a user or parsing their input.</li>
<li><b>Store the user's / tenant's IANA zone</b> (<code>Asia/Kathmandu</code>, <code>America/New_York</code>), not an offset like <code>+05:45</code> — offsets change with DST, zones don't.</li>
<li><b>Know the three kinds of "time"</b>:
<table><tr><th>Kind</th><th>Example</th><th>Store as</th></tr>
<tr><td>Instant</td><td>Payment made at…</td><td><code>timestamptz</code> (UTC)</td></tr>
<tr><td>Local date/time + zone</td><td>"Meeting every Monday 9:00 New York time"</td><td>local time + IANA zone</td></tr>
<tr><td>Date only</td><td>Birthday, invoice due <i>date</i></td><td><code>date</code> (no time, no zone)</td></tr></table></li>
<li><b>Never do date math by adding 24h</b> for "tomorrow" in local time — DST days are 23 or 25 hours.</li></ol>
<div class="callout"><b>Fun fact for interviews</b>Nepal is UTC+05:45 — a great example of why you can't assume whole-hour offsets.</div>`},
{title:'DST pitfalls',
body:`<ul><li><b>Gap (spring forward)</b>: in New York on DST start, 02:30 local <i>doesn't exist</i>. A reminder scheduled for 02:30 must be moved (usually to 03:00).</li>
<li><b>Overlap (fall back)</b>: 01:30 happens <i>twice</i>. Which one did the user mean? Pick a policy (usually the first).</li>
<li><b>Recurring events</b>: "9:00 every day in London" = 09:00 UTC in winter, 08:00 UTC in summer. Store the rule in local time, compute the next UTC instant each time.</li>
<li><b>Day boundaries</b>: "today's sales" for a Sydney tenant is a different UTC range than for a London tenant.</li></ul>`,
code:`// Luxon examples (npm i luxon) - date-fns-tz and the Temporal API work similarly
import { DateTime } from 'luxon';

// 1. Display a UTC instant in the user's zone
DateTime.fromISO('2026-09-29T03:15:00Z').setZone('Asia/Kathmandu').toFormat('fff');
// -> 29 September 2026 at 9:00 AM GMT+5:45

// 2. User picks "9:00 tomorrow" in New York -> store as UTC
const local = DateTime.fromObject({ year: 2026, month: 11, day: 1, hour: 9 }, { zone: 'America/New_York' });
local.toUTC().toISO();

// 3. "Tomorrow" in local time (DST-safe): add a calendar day, not 24 hours
local.plus({ days: 1 });

// 4. Start/end of "today" for a tenant, as a UTC range for SQL
const now = DateTime.now().setZone('Australia/Sydney');
const from = now.startOf('day').toUTC().toISO();
const to   = now.endOf('day').toUTC().toISO();`},
{title:'Scheduling per-user local times (the classic task)',
body:`<p><b>Requirement:</b> "Send each user a reminder at 9:00 in <i>their</i> timezone."</p>
<ol><li>Store <code>reminder_local_time = '09:00'</code> and <code>timezone = 'Europe/London'</code>.</li>
<li>Compute and store <code>next_run_at</code> (UTC <code>timestamptz</code>) with a tz library.</li>
<li>A scheduler (EventBridge every 5 min → Lambda) selects <code>WHERE next_run_at &lt;= now()</code>, sends to SQS.</li>
<li>After sending, recompute <code>next_run_at</code> from the local rule (handles DST automatically).</li>
<li>Index on <code>next_run_at</code>; make sending idempotent.</li></ol>`,
code:`// Postgres
SELECT now() AT TIME ZONE 'Asia/Kathmandu';          -- local wall-clock time
SELECT '2026-09-29 09:00'::timestamp AT TIME ZONE 'Europe/London'; -- local -> timestamptz

-- timestamp  (without time zone) = wall-clock, no zone info  -> avoid for instants
-- timestamptz                    = instant, stored as UTC    -> use this`,
prompt:`Implement computeNextRunAt(localTime: string, zone: string, from: Date) with Luxon that returns the next UTC instant, handling DST gaps by moving forward. Write Jest tests for New York DST start and end.`},
{title:'Testing timezone code',
body:`<ul><li>Run tests with a non-UTC zone: <code>TZ=America/New_York jest</code> — catches hidden reliance on server time.</li>
<li>Freeze time (<code>jest.useFakeTimers().setSystemTime(...)</code>).</li>
<li>Test DST transition dates, month/year ends, leap day, and half-hour zones (India +5:30, Nepal +5:45).</li>
<li>Servers should run in UTC; never rely on <code>new Date().getHours()</code> on the backend.</li></ul>`},
],
questions:[
{q:'How do you store and display dates for users in different timezones?',lvl:1,points:['Store instants in UTC (timestamptz)','Store user/tenant IANA zone, not offset','Convert on display / input','Date-only values as date type','Use a tz library (Luxon, date-fns-tz, Temporal)'],
a:'I store instants in UTC using timestamptz and store each user’s or tenant’s IANA zone name. Conversion happens only at the edges: when rendering, and when parsing user input. Date-only values like due dates or birthdays are stored as plain dates, since they don’t represent a moment. I use a library like Luxon or date-fns-tz rather than manual offset math.'},
{q:'Design a feature that sends a daily 9am reminder in each user’s local time.',lvl:2,points:['Store local time + IANA zone','Precompute next_run_at in UTC','Scheduler (EventBridge cron) picks due rows → SQS → worker','Recompute next run from the local rule (DST-safe)','Handle DST gap/overlap policy','Idempotent sends, index on next_run_at'],
a:'Each user has a local reminder time and an IANA zone. I compute next_run_at in UTC and index it. EventBridge triggers a Lambda every few minutes that selects due rows and queues them on SQS; workers send the reminder idempotently and recompute next_run_at from the local rule, which automatically handles DST. For a nonexistent local time on DST start, I shift forward to the next valid time.'},
{q:'What’s the difference between timestamp and timestamptz in Postgres?',lvl:1,points:['timestamp = wall-clock with no zone info','timestamptz = absolute instant, stored as UTC, displayed in session zone','Use timestamptz for events','AT TIME ZONE to convert'],
a:'timestamp without time zone is just a wall-clock value with no zone, so the same value can mean different instants. timestamptz represents an absolute instant: Postgres converts input to UTC and shows it in the session’s zone. For anything that happened at a moment, use timestamptz. AT TIME ZONE converts between them.'},
{q:'Tell me about a DST bug and how you’d prevent it.',lvl:2,points:['Adding 24h instead of 1 calendar day','Recurring event shifting by an hour','Non-existent / ambiguous local times','Tests with TZ env and transition dates','Server in UTC'],
a:'A classic one: code adds 24 hours to get “same time tomorrow”, so on DST days a recurring meeting moves by an hour. The fix is to do calendar arithmetic in the user’s zone — plus one day in Luxon — then convert to UTC. I prevent it with tests that run under a non-UTC TZ and cover DST start and end dates, plus half-hour zones.'},
]},
{
id:'mt', icon:'🏢', title:'Multi-tenancy', short:'Multi-tenancy',
why:'SaaS apps serve many customers (tenants) from one system. The #1 rule: a tenant must NEVER see another tenant\'s data. Interviewers want to hear about isolation models and how you enforce them everywhere.',
steps:[
{title:'Isolation models',
body:`<table><tr><th>Model</th><th>How</th><th>Pros</th><th>Cons</th></tr>
<tr><td><b>Database per tenant</b></td><td>Separate DB each</td><td>Strongest isolation, easy per-tenant backup/restore</td><td>Costly, hard to migrate 1000s of DBs</td></tr>
<tr><td><b>Schema per tenant</b></td><td>Postgres schema each</td><td>Good isolation, one server</td><td>Migrations × N schemas, connection juggling</td></tr>
<tr><td><b>Shared tables (pool)</b></td><td><code>tenant_id</code> column on every row</td><td>Cheap, simple ops, scales to many tenants</td><td>One missed WHERE = data leak → need strong enforcement</td></tr></table>
<p>Common answer: <b>shared tables + tenant_id + Postgres Row-Level Security</b>, with the option to move big/enterprise tenants to dedicated DBs ("hybrid").</p>`},
{title:'Resolving the tenant on each request',
body:`<ul><li><b>From the JWT</b> (most secure): <code>tenant_id</code> claim set at login.</li>
<li><b>Subdomain</b>: <code>acme.app.com</code> → look up tenant (still verify the user belongs to it!).</li>
<li><b>Header</b> <code>X-Tenant-Id</code>: only if validated against the user's memberships.</li></ul>
<p>Store it in request context so every layer can read it without passing it through every function — in NestJS use <b>AsyncLocalStorage</b> (e.g. <code>nestjs-cls</code>).</p>`,
code:`// tenant.middleware.ts (NestJS + nestjs-cls)
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}
  use(req: Request & { user?: any }, _res: Response, next: () => void) {
    const tenantId = req.user?.tenantId;           // set by JWT auth
    if (!tenantId) throw new UnauthorizedException('No tenant');
    this.cls.set('tenantId', tenantId);
    next();
  }
}

// invoices.service.ts - every query is scoped
@Injectable()
export class InvoicesService {
  constructor(@InjectRepository(Invoice) private repo: Repository<Invoice>, private cls: ClsService) {}

  private get tenantId() { return this.cls.get<string>('tenantId'); }

  findAll() {
    return this.repo.find({ where: { tenantId: this.tenantId }, order: { createdAt: 'DESC' } });
  }
  async findOne(id: string) {
    const inv = await this.repo.findOne({ where: { id, tenantId: this.tenantId } });
    if (!inv) throw new NotFoundException();       // 404, not 403: don't reveal it exists
    return inv;
  }
}`,
prompt:`Add tenant isolation to @src: a middleware storing tenantId from the JWT in nestjs-cls, and update every repository call in @src/invoices to filter by tenantId. List any query you couldn't scope.`},
{title:'Defence in depth: Row-Level Security',
body:`<p>App-level filters can be forgotten. <b>Postgres RLS</b> enforces isolation in the database itself: set the tenant per transaction/connection, and policies filter rows automatically.</p>
<p>For DynamoDB: tenant prefix in the partition key + IAM condition <code>dynamodb:LeadingKeys</code>. For S3: per-tenant key prefix + scoped policies.</p>`,
code:`ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- In each request/transaction (app DB user must NOT be the table owner / superuser):
SET LOCAL app.tenant_id = '8f1c...';
SELECT * FROM invoices;   -- only this tenant's rows, even without WHERE`},
{title:'Everything else that must be tenant-aware',
body:`<ul><li><b>Caches</b>: include tenant in the key (<code>t1:invoices:list</code>).</li>
<li><b>Queues/jobs</b>: every message carries <code>tenantId</code>; workers set context before processing.</li>
<li><b>Files</b>: <code>tenants/{id}/...</code> prefixes; presigned URLs only for the caller's tenant.</li>
<li><b>Unique constraints</b>: <code>UNIQUE (tenant_id, invoice_number)</code>, not globally.</li>
<li><b>Per-tenant config</b>: timezone, currency, feature flags, plan limits.</li>
<li><b>Noisy neighbours</b>: rate limit per tenant, per-tenant queues/concurrency for heavy tenants.</li>
<li><b>AI features</b>: never mix tenants' documents in prompts or vector search — filter by tenant.</li>
<li><b>Tests</b>: create two tenants and assert tenant A can't read/update/delete tenant B's data.</li></ul>`},
],
questions:[
{q:'What multi-tenancy models do you know, and which would you choose?',lvl:1,points:['DB per tenant, schema per tenant, shared tables with tenant_id','Trade-offs: isolation vs cost vs operational complexity','Shared + RLS as common default','Hybrid: dedicated DB for large/enterprise tenants'],
a:'There are three main models: a database per tenant, a schema per tenant, and shared tables with a tenant_id column. Separate databases give the strongest isolation but are expensive and hard to migrate at scale. For most SaaS I’d start with shared tables plus Postgres row-level security for defence in depth, and allow moving large or regulated tenants to a dedicated database later.'},
{q:'How do you guarantee one tenant can never access another tenant’s data?',lvl:2,points:['Tenant from trusted source (JWT), verified membership','Request context (AsyncLocalStorage) — no manual passing','Every query scoped; base repository/global filter','DB-level RLS as a second layer','Tenant-aware caches, queues, files, search/vector','Automated cross-tenant tests; return 404 not 403'],
a:'The tenant comes from a trusted source — the JWT — and is stored in request context. Every data access goes through a repository layer that always adds the tenant filter, and Postgres RLS enforces it again at the database level. Caches, queue messages, S3 keys and vector searches include the tenant too. We have automated tests that create two tenants and try cross-tenant reads and writes, and we return 404 for other tenants’ resources so we don’t leak their existence.'},
{q:'How do you handle a "noisy neighbour" tenant?',lvl:3,points:['Per-tenant rate limits / quotas','Separate queues or message groups per tenant tier','Lambda reserved concurrency per workload','Monitoring per-tenant metrics','Move big tenant to dedicated resources'],
a:'First make it visible with per-tenant metrics. Then protect others with per-tenant rate limits and quotas, and fair scheduling of background work — separate queues or priority lanes for heavy tenants, with concurrency limits. If one tenant consistently dominates, we move them to dedicated resources, which the hybrid model allows.'},
{q:'How do you run migrations in a schema-per-tenant setup?',lvl:3,points:['Loop over tenant schemas and run migration for each','Track migration version per schema','Idempotent & backwards compatible migrations','Batching / parallelism, monitoring failures','Reason many teams prefer shared tables'],
a:'A migration runner iterates over every tenant schema, sets the search_path and applies pending migrations, tracking the version per schema. Migrations must be backwards compatible because tenants are migrated gradually, and failures need to be retried and reported. The operational cost of this at thousands of tenants is exactly why many teams prefer shared tables.'},
]},
{
id:'llm', icon:'✨', title:'AI Integration (LLMs in your product)', short:'AI Integration',
why:'Different from AI-assisted coding: this is building AI features INTO the product — e.g. extracting data from invoices, summarising documents, chat over tenant data.',
steps:[
{title:'Calling an LLM API',
body:`<p>You send a list of <b>messages</b> plus a <b>system prompt</b>, you get back text (or tool calls). Key knobs: <b>model</b>, <b>max tokens</b>, <b>temperature</b> (lower = more deterministic).</p>
<ul><li>Keep the API key on the <b>backend</b> only (never in the Expo app).</li>
<li>Cost and latency scale with tokens (input + output).</li>
<li>Always set timeouts, retries with backoff (429/5xx), and log usage per tenant.</li></ul>`,
code:`// NestJS service using the Anthropic TypeScript SDK (npm i @anthropic-ai/sdk)
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private client = new Anthropic();   // reads ANTHROPIC_API_KEY from env

  async summarize(text: string) {
    const msg = await this.client.messages.create({
      model: process.env.AI_MODEL!,   // pick a current model id from the provider docs
      max_tokens: 500,
      system: 'You summarise business documents in 3 bullet points. Be factual.',
      messages: [{ role: 'user', content: text }],
    });
    const block = msg.content[0];
    return block.type === 'text' ? block.text : '';
  }
}`},
{title:'Structured output & tool calling',
body:`<p>For product features you usually want <b>JSON</b>, not prose. Approaches:</p>
<ul><li>Ask for JSON matching a schema and <b>validate it</b> (Zod). Retry or fail gracefully if invalid.</li>
<li><b>Tool / function calling</b>: you describe tools with JSON Schema; the model returns a call like <code>save_invoice({...})</code>; your code runs it. Many providers also offer strict structured-output modes.</li></ul>`,
code:`import { z } from 'zod';

const InvoiceSchema = z.object({
  invoiceNumber: z.string(),
  total: z.number(),
  currency: z.string().length(3),
  dueDate: z.string().nullable(),       // ISO date or null
});

const tools = [{
  name: 'save_invoice',
  description: 'Save the fields extracted from an invoice',
  input_schema: {
    type: 'object',
    properties: {
      invoiceNumber: { type: 'string' },
      total: { type: 'number' },
      currency: { type: 'string', description: 'ISO 4217 code' },
      dueDate: { type: ['string', 'null'] },
    },
    required: ['invoiceNumber', 'total', 'currency', 'dueDate'],
  },
}];

// ...call the API with tools + tool_choice forcing save_invoice, then:
const parsed = InvoiceSchema.safeParse(toolUseBlock.input);
if (!parsed.success) { /* retry once, else mark "needs human review" */ }`,
prompt:`Create an AiService.extractInvoice(text) method that uses tool calling to return typed invoice fields, validates them with Zod, retries once on invalid output, and logs token usage with tenantId.`},
{title:'RAG: answering questions from your own data',
body:`<p><b>Retrieval-Augmented Generation</b> = find relevant chunks of your data, put them in the prompt, ask the model to answer <i>only</i> from them.</p>
<ol><li><b>Ingest</b>: extract text → split into chunks (~500–1000 tokens, some overlap) → create <b>embeddings</b> (vectors).</li>
<li><b>Store</b>: vector DB — Postgres <b>pgvector</b> works great (and keeps tenant_id filtering!).</li>
<li><b>Retrieve</b>: embed the question → nearest-neighbour search (filtered by tenant) → top-k chunks.</li>
<li><b>Generate</b>: prompt with chunks + question, ask for citations.</li></ol>`,
code:`-- pgvector
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE doc_chunks (
  id uuid PRIMARY KEY, tenant_id uuid NOT NULL, document_id uuid NOT NULL,
  content text NOT NULL, embedding vector(1024)
);

-- top 5 most similar chunks FOR THIS TENANT ONLY
SELECT content FROM doc_chunks
WHERE tenant_id = $1
ORDER BY embedding <=> $2      -- cosine distance
LIMIT 5;`},
{title:'Production concerns',
body:`<ul><li><b>Streaming</b>: stream tokens to the UI (SSE) so users see progress.</li>
<li><b>Async jobs</b>: long AI tasks (PDF extraction) go through SQS workers, not HTTP requests.</li>
<li><b>Guardrails</b>: validate outputs, handle prompt injection (document text is <i>data</i>, not instructions), never let the model access other tenants' data.</li>
<li><b>Cost control</b>: per-tenant quotas, caching, smaller models for easy tasks, prompt caching.</li>
<li><b>Human in the loop</b>: confidence thresholds → "needs review" state.</li>
<li><b>Evals</b>: a labelled dataset of real documents; rerun when you change prompt/model (see AI-Assisted Dev topic).</li>
<li><b>Privacy</b>: know what data you send to the provider; data retention agreements.</li></ul>`},
],
questions:[
{q:'How would you add an AI feature that extracts fields from uploaded invoices?',lvl:2,points:['Async pipeline: S3 → SQS → worker','Extract text (or send PDF directly if model supports it)','Structured output / tool calling + schema validation','Confidence / needs-review state, human correction','Store results (JSONB) with tenant scoping','Evals on labelled invoices; cost & latency tracking'],
a:'Upload goes to S3 via a presigned URL, an event puts a job on SQS, and a worker extracts text or sends the PDF to a model that accepts documents. I use tool calling with a JSON schema, validate the result with Zod, and store it as JSONB on the tenant’s document. Low-confidence or invalid results go to a “needs review” state where users correct them, and those corrections feed our eval set, which we rerun whenever we change prompts or models.'},
{q:'What is RAG and when would you use it instead of fine-tuning?',lvl:2,points:['Retrieve relevant chunks, add to prompt, generate grounded answer','Embeddings + vector search (pgvector)','Good for private/changing data; citations','Fine-tuning for style/format/behaviour, not fresh facts','Tenant filtering in retrieval'],
a:'RAG retrieves the most relevant chunks of your own data using embeddings and vector search, puts them in the prompt, and asks the model to answer from them with citations. It’s the right choice when the knowledge is private or changes often — the data stays fresh without retraining. Fine-tuning is more about teaching style or format. In a multi-tenant app the retrieval query must filter by tenant.'},
{q:'How do you handle unreliable or invalid LLM output in production?',lvl:1,points:['Schema validation (Zod), strict tool schemas','Retry with error feedback, limited attempts','Fallback: needs human review','Low temperature for extraction','Monitoring + evals'],
a:'I never trust the raw output. I request structured output via tool calling, validate with a schema, and if it fails I retry once with the validation error in the prompt. After that it falls back to a human-review state rather than saving bad data. I use low temperature for extraction tasks and track failure rates and eval scores over time.'},
{q:'What is prompt injection and how do you mitigate it?',lvl:3,points:['Untrusted content (PDF, user input) containing instructions','Separate instructions (system) from data; label data clearly','Least privilege tools; no dangerous actions without confirmation','Validate outputs; tenant-scoped data access','Monitor & test with adversarial eval cases'],
a:'Prompt injection is when untrusted content — say, text inside an uploaded PDF — contains instructions like “ignore previous instructions and…”. I keep instructions in the system prompt, clearly mark document content as data, give the model only the minimal tools it needs, and require confirmation for impactful actions. Outputs are validated, data access is tenant-scoped in code rather than by the model, and I add adversarial cases to our evals.'},
]},
{
id:'pdf', icon:'📄', title:'PDF Processing', short:'PDF Processing',
why:'Many business apps ingest PDFs (invoices, contracts) or generate them (reports, receipts). Know extraction vs OCR vs generation, and how to run it at scale on AWS.',
steps:[
{title:'Two kinds of PDFs',
body:`<ul><li><b>Digital / text-based</b>: text is embedded → extract directly (fast, accurate).</li>
<li><b>Scanned / image-based</b>: pages are pictures → need <b>OCR</b>.</li></ul>
<p>Detect: try text extraction; if almost no text per page → treat as scanned.</p>
<table><tr><th>Task</th><th>Node / TS tools</th><th>Others</th></tr>
<tr><td>Extract text</td><td><code>pdfjs-dist</code>, <code>pdf-parse</code></td><td>Python pdfplumber, PyMuPDF</td></tr>
<tr><td>OCR / forms / tables</td><td>AWS Textract (API), Tesseract.js</td><td>Google Document AI</td></tr>
<tr><td>Understand content</td><td>LLM with document/vision input</td><td></td></tr>
<tr><td>Create / edit PDFs</td><td><code>pdf-lib</code>, PDFKit, Puppeteer/Playwright (HTML → PDF)</td><td></td></tr>
<tr><td>Merge / split</td><td><code>pdf-lib</code></td><td>qpdf</td></tr></table>`},
{title:'Extracting text in Node',
body:`<p>Extract per page so you can reference page numbers and chunk for AI.</p>`,
code:`import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function extractPages(data: Uint8Array): Promise<string[]> {
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it: any) => it.str).join(' '));
  }
  return pages;
}

// Heuristic: scanned if average < 20 chars per page
export const looksScanned = (pages: string[]) =>
  pages.reduce((n, p) => n + p.trim().length, 0) / pages.length < 20;`},
{title:'Generating PDFs',
body:`<ul><li><b>HTML → PDF</b> with headless Chromium (Puppeteer/Playwright): easiest for rich layouts; reuse your HTML/CSS templates. Heavy for Lambda (use a Chromium layer or a container image).</li>
<li><b>pdf-lib</b>: programmatic, lightweight — fill templates, stamp text, merge.</li>
<li>Remember timezone & locale when printing dates and currency on invoices!</li></ul>`,
code:`import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function makeReceipt(no: string, total: string, paidAtLocal: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);             // A4 in points
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText('Receipt ' + no, { x: 50, y: 780, size: 20, font });
  page.drawText('Total: ' + total, { x: 50, y: 740, size: 12, font });
  page.drawText('Paid: ' + paidAtLocal, { x: 50, y: 720, size: 12, font });
  return pdf.save();                                 // Uint8Array -> upload to S3
}`},
{title:'A scalable PDF pipeline on AWS',
body:`<pre><code>1. App → presigned PUT → S3  tenants/{t}/raw/{docId}.pdf
2. S3 event → SQS → Lambda "extract"
     - validate: size, page count, real PDF (magic bytes %PDF), not encrypted
     - text-based? pdfjs : Textract (async API for multi-page)
     - save pages text → S3  tenants/{t}/text/{docId}.json
3. → SQS → Lambda "ai-extract"  (tool calling → validated JSON)
4. Save to Postgres (documents.status, extracted JSONB)
5. Notify app (push notification / websocket / polling status)</code></pre>
<ul><li>Status machine: <code>uploaded → extracting → extracted → analysing → done | failed | needs_review</code>.</li>
<li>Limits: Lambda memory & 15 min, /tmp size, payload sizes — pass S3 keys between steps, never file bytes.</li>
<li>Security: malware scanning, never render untrusted PDFs server-side with JS enabled, tenant-scoped keys.</li></ul>`,
prompt:`Design the TypeORM Document entity and status state machine for this PDF pipeline, and write the "extract" Lambda that reads from S3, detects scanned PDFs, and writes page text back to S3.`},
],
questions:[
{q:'How would you extract data from both digital and scanned PDFs?',lvl:2,points:['Try text extraction first (pdfjs/pdf-parse)','Detect scanned via low text density','OCR for scanned: Textract / Tesseract','LLM for understanding & structured fields','Validate & needs-review fallback'],
a:'I first try direct text extraction with pdfjs, page by page. If there’s almost no text, it’s probably scanned, so I send it to OCR such as AWS Textract, which also detects tables and forms. Then an LLM with a schema turns the text into structured fields, which I validate; anything uncertain goes to human review.'},
{q:'How do you process large PDFs reliably at scale?',lvl:3,points:['Async: S3 → SQS → workers, not in HTTP request','Pass S3 keys not bytes','Split by page ranges / fan-out, Step Functions','Status tracking, retries, DLQ, idempotency','Limits: Lambda memory/timeout, file size validation'],
a:'Never in the request cycle. Upload to S3, then an event enqueues a job, and workers process it. Steps pass S3 keys rather than file bytes. Very large documents are split by page ranges and fanned out, possibly orchestrated with Step Functions. Every document has a status, jobs are idempotent with retries and a DLQ, and I validate size and page count upfront to stay within Lambda limits.'},
{q:'What options do you have for generating PDFs (e.g. invoices)?',lvl:1,points:['HTML → PDF via headless Chromium (Puppeteer/Playwright)','pdf-lib / PDFKit programmatic','Trade-offs: layout richness vs weight','Store in S3, serve via presigned GET','Correct timezone/locale formatting'],
a:'For rich layouts I render an HTML template with headless Chromium, which lets designers use normal CSS, but it’s heavy on Lambda, so I’d use a container image. For simpler documents or stamping existing templates, pdf-lib is lightweight. Generated files go to S3 and users download them through presigned URLs. Dates and amounts are formatted in the tenant’s timezone and locale.'},
]},
];
