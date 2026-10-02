import type { Topic } from '../../types';

export const awsTopics: Topic[] = [
{
id:'aws', icon:'☁️', title:'AWS Serverless: Lambda, SQS, S3, IAM', short:'AWS Lambda / SQS / S3',
why:'Serverless AWS lets you run code and store files without managing servers. The classic pattern for this role: an app uploads a file to S3, an event goes to SQS, a Lambda processes it, results land in a database.',
steps:[
{title:'The big picture: event-driven architecture',
body:`<p>Most serverless systems are <b>events flowing between managed services</b>:</p>
<pre><code>Expo app ──presigned PUT──▶ S3 bucket
                              │ ObjectCreated event
                              ▼
                           SQS queue ──(DLQ for failures)
                              │ batch of messages
                              ▼
                           Lambda worker ──▶ Postgres / DynamoDB
                              │
                              ▼
                        CloudWatch logs & metrics</code></pre>
<table><tr><th>Service</th><th>One-line meaning</th></tr>
<tr><td><b>Lambda</b></td><td>Run a function on an event; pay per ms; max 15 min</td></tr>
<tr><td><b>SQS</b></td><td>A queue that buffers work so producers and consumers are decoupled</td></tr>
<tr><td><b>S3</b></td><td>Object (file) storage: buckets + keys</td></tr>
<tr><td><b>DynamoDB</b></td><td>Serverless key-value / document DB (own topic)</td></tr>
<tr><td><b>API Gateway</b></td><td>HTTP front door that can invoke Lambda</td></tr>
<tr><td><b>EventBridge</b></td><td>Event bus + scheduler (cron)</td></tr>
<tr><td><b>IAM</b></td><td>Who can do what on which resource</td></tr>
<tr><td><b>CloudWatch</b></td><td>Logs, metrics, alarms</td></tr></table>`,
prompt:`Explain, as a sequence diagram in text, how a PDF uploaded from a mobile app flows through S3, SQS and Lambda into Postgres. Point out every place a failure could happen and how to handle it.`},
{title:'Lambda fundamentals',
body:`<ul><li><b>Handler</b> receives an <code>event</code> (shape depends on the trigger) and a <code>context</code>.</li>
<li><b>Config</b>: memory (128 MB–10 GB; CPU scales with memory), timeout (max 15 min), env vars, ephemeral <code>/tmp</code> storage (up to 10 GB).</li>
<li><b>Cold start</b>: first invocation initialises a new container (download code, start runtime, run init code). Reduce with small bundles, init SDK clients <i>outside</i> the handler, provisioned concurrency, or SnapStart where supported.</li>
<li><b>Concurrency</b>: each concurrent request = separate instance. Reserved concurrency caps it (protects your DB!).</li>
<li><b>Stateless</b>: don't rely on memory between calls; store state in S3/DB.</li>
<li>For long jobs (&gt;15 min) or multi-step flows → <b>Step Functions</b> or ECS/Fargate.</li></ul>`,
code:`// handler.ts - Lambda triggered by API Gateway (HTTP API)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});            // created once per container (outside handler) -> reused

export const handler = async (event: { body?: string; requestContext: any }) => {
  const tenantId = event.requestContext.authorizer?.jwt?.claims?.tenant_id;
  const key = 'tenants/' + tenantId + '/uploads/' + randomUUID() + '.pdf';

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: process.env.BUCKET!, Key: key, ContentType: 'application/pdf' }),
    { expiresIn: 300 },                 // 5 minutes
  );

  return { statusCode: 200, body: JSON.stringify({ uploadUrl, key }) };
};`,
prompt:`Write a TypeScript Lambda handler (AWS SDK v3) that returns a presigned S3 PUT URL for a PDF, scoped to the tenant in the JWT claims. Add input validation and explain cold-start best practices you applied.`},
{title:'SQS: queues, visibility timeout, DLQ, idempotency',
body:`<ul><li><b>Standard queue</b>: near-unlimited throughput, <b>at-least-once</b> delivery, best-effort order → duplicates possible.</li>
<li><b>FIFO queue</b>: strict order per <code>MessageGroupId</code>, exactly-once processing within a dedup window, lower throughput.</li>
<li><b>Visibility timeout</b>: after a consumer receives a message it's hidden for N seconds. If not deleted in time, it reappears → processed again. Set it <b>longer than the Lambda timeout</b> (AWS recommends ~6×).</li>
<li><b>Dead-letter queue (DLQ)</b>: after <code>maxReceiveCount</code> failures the message moves to a DLQ for inspection → no poison message loops.</li>
<li><b>Partial batch failures</b>: return <code>batchItemFailures</code> so only failed messages retry.</li>
<li><b>Idempotency</b>: because duplicates happen, processing the same message twice must be safe (idempotency key, conditional write, unique constraint).</li></ul>`,
code:`// worker.ts - Lambda consuming SQS (with ReportBatchItemFailures enabled)
import type { SQSEvent, SQSBatchResponse } from 'aws-lambda';

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const failures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const msg = JSON.parse(record.body) as { documentId: string; tenantId: string };

      // Idempotency: skip if already processed
      if (await alreadyProcessed(msg.documentId)) continue;

      await processDocument(msg);
      await markProcessed(msg.documentId);
    } catch (err) {
      console.error('failed', record.messageId, err);
      failures.push({ itemIdentifier: record.messageId }); // only this one is retried
    }
  }
  return { batchItemFailures: failures };
};`},
{title:'S3: keys, presigned URLs, events',
body:`<ul><li>Buckets contain <b>objects</b> identified by <b>keys</b> (<code>tenants/t1/uploads/abc.pdf</code>). "Folders" are just key prefixes.</li>
<li><b>Presigned URLs</b>: backend signs a short-lived URL; client uploads/downloads <i>directly</i> to S3 → large files never pass through your API.</li>
<li><b>Event notifications</b>: <code>s3:ObjectCreated:*</code> → Lambda, SQS or EventBridge.</li>
<li><b>Security</b>: Block Public Access on, encryption at rest (SSE-S3/KMS), bucket policies, per-tenant prefixes.</li>
<li><b>Cost</b>: storage classes (Standard, IA, Glacier) + lifecycle rules to move/delete old files.</li>
<li>Large uploads: <b>multipart upload</b> (parallel parts, resumable).</li></ul>`},
{title:'IAM & Infrastructure as Code',
body:`<ul><li><b>Least privilege</b>: each Lambda gets its own role with only what it needs (e.g. <code>s3:GetObject</code> on one bucket prefix, <code>sqs:ReceiveMessage</code> on one queue).</li>
<li>Never hardcode credentials — Lambda gets temporary creds from its role; locally use <code>aws configure</code> / SSO profiles.</li>
<li><b>Secrets</b>: Secrets Manager or SSM Parameter Store, not env vars in git.</li>
<li><b>IaC</b>: define everything in code — AWS CDK (TypeScript!), SAM, Serverless Framework, or Terraform. Reviewable, repeatable, multi-env.</li>
<li><b>Local dev</b>: LocalStack emulates S3/SQS/DynamoDB/Lambda locally.</li></ul>`,
code:`// lib/pipeline-stack.ts - AWS CDK (TypeScript)
const bucket = new s3.Bucket(this, 'Docs', { blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, encryption: s3.BucketEncryption.S3_MANAGED });
const dlq    = new sqs.Queue(this, 'DocsDLQ');
const queue  = new sqs.Queue(this, 'DocsQueue', {
  visibilityTimeout: Duration.minutes(6),
  deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
});

bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.SqsDestination(queue), { prefix: 'tenants/' });

const worker = new lambdaNode.NodejsFunction(this, 'Worker', { entry: 'src/worker.ts', timeout: Duration.minutes(1), memorySize: 1024 });
worker.addEventSource(new SqsEventSource(queue, { batchSize: 5, reportBatchItemFailures: true }));

bucket.grantRead(worker);   // CDK generates a least-privilege IAM policy`,
prompt:`Write an AWS CDK stack in TypeScript for: S3 bucket -> SQS (with DLQ) -> Lambda worker. Use least-privilege grants and explain the visibility timeout you chose.`},
{title:'Observability & debugging',
body:`<ul><li><b>CloudWatch Logs</b>: structured JSON logs with <code>requestId</code>, <code>tenantId</code>.</li>
<li><b>Metrics & alarms</b>: Lambda errors, throttles, duration; SQS <code>ApproximateAgeOfOldestMessage</code>; DLQ depth &gt; 0 → alert.</li>
<li><b>X-Ray / OpenTelemetry</b>: trace a request across API → SQS → Lambda.</li>
<li>AWS Lambda Powertools (TypeScript) gives logger, metrics, tracer, idempotency helpers.</li></ul>`},
],
questions:[
{q:'What is a Lambda cold start and how do you reduce it?',lvl:1,points:['New execution environment initialised on first/scale-out invocation','Download code, start runtime, run init code','Smaller bundles (esbuild, tree-shaking), fewer deps','Create SDK clients outside handler (reused on warm starts)','Provisioned concurrency for latency-critical paths','More memory = more CPU = faster init'],
a:'A cold start happens when AWS creates a new execution environment: it downloads the code, starts the runtime and runs initialisation code before the handler. I keep bundles small with esbuild, initialise SDK clients and DB connections outside the handler so warm invocations reuse them, and increase memory since CPU scales with it. For latency-critical endpoints I use provisioned concurrency.'},
{q:'How do SQS visibility timeout and Lambda timeout relate? What happens when a message fails?',lvl:2,points:['Message hidden while being processed','Visibility timeout must exceed Lambda timeout (≈6× recommended)','Else message reappears and is processed twice','Failures retry until maxReceiveCount → DLQ','Partial batch response to retry only failed items','Alarm on DLQ'],
a:'When Lambda receives a message it becomes invisible for the visibility timeout. If that is shorter than the Lambda timeout, the message can reappear and be processed by another instance while the first is still running, so I set it well above the function timeout. On failure the message returns to the queue and is retried until maxReceiveCount, then moves to the dead-letter queue, where we alarm and investigate. I enable partial batch responses so one bad message doesn’t retry the whole batch.'},
{q:'SQS delivers messages at least once. How do you make processing idempotent?',lvl:2,points:['Duplicates are normal in standard queues','Idempotency key (messageId / business id)','Conditional write (DynamoDB attribute_not_exists) or unique constraint','Check-then-process with status column in a transaction','Make side effects (emails, payments) keyed & de-duplicated'],
a:'I assume every message can arrive twice. Each message carries a business idempotency key, like documentId. Before doing work I record it with a conditional write — attribute_not_exists in DynamoDB or a unique constraint in Postgres — and if it already exists I skip. Side effects like sending an email are keyed too, so a retry doesn’t send twice.'},
{q:'How would you let users upload large files from a mobile app?',lvl:1,points:['Presigned S3 URL from backend (auth + tenant check)','Client uploads directly to S3, not through API','Short expiry, content-type restriction, per-tenant key prefix','Multipart upload for very large files','S3 event triggers processing'],
a:'The app asks our API for a presigned URL. The API checks auth, builds a tenant-scoped key and signs a short-lived PUT URL restricted to the content type. The app uploads straight to S3, so big files never go through our servers. For very large files I’d use multipart upload. An S3 event then kicks off processing through SQS.'},
{q:'Standard vs FIFO SQS queue — when would you pick each?',lvl:1,points:['Standard: very high throughput, at-least-once, best-effort ordering','FIFO: ordered per message group, dedup, lower throughput','FIFO when order matters per entity (e.g. events per tenant/account)','Standard + idempotency for most background jobs'],
a:'Standard queues give near-unlimited throughput with at-least-once delivery and no strict ordering; with idempotent consumers that’s fine for most jobs like PDF processing. FIFO guarantees order within a message group and deduplicates, which I’d use when order matters, for example applying balance updates per account, using the account ID as the group ID.'},
{q:'A Lambda needs to run a 40-minute job. What do you do?',lvl:3,points:['Lambda max is 15 minutes','Split into smaller chunks via SQS fan-out','Step Functions to orchestrate steps / Map state','ECS Fargate / AWS Batch for long-running containers','Checkpoint progress'],
a:'Lambda caps at 15 minutes, so I’d first try to split the work — for example process a PDF page-range per message and fan out through SQS, orchestrated with Step Functions and a Map state. If it truly must run as one long process, I’d use a Fargate task or AWS Batch, triggered by the same event, and checkpoint progress so it can resume.'},
]},
{
id:'dynamo', icon:'⚡', title:'DynamoDB', short:'DynamoDB',
why:'DynamoDB is a serverless NoSQL database with single-digit-millisecond reads at any scale. The mind-shift from SQL: you design tables around your ACCESS PATTERNS, not around entities.',
steps:[
{title:'Core concepts: items, keys, partitions',
body:`<ul><li><b>Table</b> → <b>items</b> (rows) → <b>attributes</b>. Schemaless except the key.</li>
<li><b>Partition key (PK)</b>: hashed to decide which partition stores the item.</li>
<li><b>Sort key (SK)</b> (optional): orders items within a partition and allows range queries (<code>begins_with</code>, <code>between</code>).</li>
<li>Primary key = PK or PK+SK; must be unique.</li>
<li><b>Query</b> = efficient (needs PK). <b>Scan</b> = reads the whole table (slow & expensive) — avoid in hot paths.</li>
<li>Item size limit 400 KB → store big things in S3, keep the pointer.</li></ul>`},
{title:'Single-table design & access patterns',
body:`<p>List access patterns first, then design keys. Example for a multi-tenant invoicing app:</p>
<table><tr><th>Access pattern</th><th>Key condition</th></tr>
<tr><td>Get tenant profile</td><td>PK=<code>TENANT#t1</code>, SK=<code>PROFILE</code></td></tr>
<tr><td>List invoices of tenant, newest first</td><td>PK=<code>TENANT#t1</code>, SK begins_with <code>INVOICE#</code></td></tr>
<tr><td>Get one invoice</td><td>PK=<code>TENANT#t1</code>, SK=<code>INVOICE#2026-09-01#inv42</code></td></tr>
<tr><td>Invoices by status across tenant (GSI1)</td><td>GSI1PK=<code>TENANT#t1#STATUS#unpaid</code>, GSI1SK=dueAt</td></tr></table>
<p>Tenant ID as a PK prefix gives natural isolation (and lets IAM restrict by <code>dynamodb:LeadingKeys</code>).</p>`,
code:`import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// List latest 20 invoices for a tenant
const res = await db.send(new QueryCommand({
  TableName: 'App',
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: { ':pk': 'TENANT#' + tenantId, ':sk': 'INVOICE#' },
  ScanIndexForward: false,     // newest first
  Limit: 20,
  ExclusiveStartKey: cursor,   // pagination
}));

// Idempotent create: fail if it already exists
await db.send(new PutCommand({
  TableName: 'App',
  Item: { PK: 'TENANT#' + tenantId, SK: 'DOC#' + documentId, status: 'processing' },
  ConditionExpression: 'attribute_not_exists(PK)',
}));`,
prompt:`I have these access patterns: [list them]. Propose a DynamoDB single-table design with PK/SK and any GSIs needed, and show example items as JSON.`},
{title:'Indexes, capacity, TTL & streams',
body:`<ul><li><b>GSI</b> (Global Secondary Index): different PK/SK, eventually consistent, add any time. Use for alternate access patterns.</li>
<li><b>LSI</b>: same PK, different SK; must be created with the table.</li>
<li><b>Capacity</b>: On-Demand (pay per request, spiky traffic) vs Provisioned (+ auto scaling, predictable & cheaper at steady load).</li>
<li><b>Hot partitions</b>: one PK getting most traffic → spread with better keys / write sharding.</li>
<li><b>Conditional writes</b> and <b>transactions</b> (<code>TransactWriteItems</code>) for correctness.</li>
<li><b>TTL</b>: auto-delete expired items (sessions, idempotency keys).</li>
<li><b>Streams</b>: change feed → Lambda (e.g. update search index, send notifications).</li></ul>`},
{title:'DynamoDB vs Postgres: when to use which',
body:`<table><tr><th></th><th>DynamoDB</th><th>Postgres</th></tr>
<tr><td>Queries</td><td>Known access patterns, key-based</td><td>Ad-hoc queries, joins, reporting</td></tr>
<tr><td>Scale</td><td>Massive, automatic</td><td>Vertical + read replicas</td></tr>
<tr><td>Ops</td><td>Fully serverless</td><td>Manage instance/pooling (RDS/Aurora)</td></tr>
<tr><td>Consistency</td><td>Eventual by default, strong optional</td><td>ACID transactions</td></tr>
<tr><td>Good for</td><td>Sessions, idempotency, events, high-traffic lookups</td><td>Business data with relations: invoices, users, billing</td></tr></table>`},
],
questions:[
{q:'How do you design a DynamoDB table? What is single-table design?',lvl:2,points:['Start from access patterns','Choose PK for even distribution, SK for ranges/hierarchy','Overload keys with prefixes (TENANT#, INVOICE#)','Multiple entity types in one table, fetched with one Query','GSIs for secondary patterns','Trade-off: less flexible for new queries'],
a:'I list every access pattern first, then design keys to serve them with Query, not Scan. In single-table design different entities share one table with prefixed keys — PK TENANT#id, SK INVOICE#date#id — so related items can be fetched together in one query. Additional patterns get GSIs. The trade-off is flexibility: new ad-hoc queries may need new indexes or a separate analytics store.'},
{q:'Query vs Scan — why avoid Scan?',lvl:1,points:['Query uses partition key, reads only matching items','Scan reads the entire table then filters','FilterExpression doesn’t reduce consumed capacity','Scan is slow & expensive at scale'],
a:'Query goes straight to one partition by key and reads only matching items. Scan reads every item in the table and filters afterwards, so you pay for everything it reads. On a big table that’s slow and expensive, so hot paths should always be Queries, with GSIs if needed.'},
{q:'When would you choose DynamoDB over Postgres (or use both)?',lvl:2,points:['DynamoDB: predictable key access, huge scale, serverless, low latency','Postgres: relations, ad-hoc queries, strong transactions, reporting','Often both: Postgres for core business data, DynamoDB for sessions/idempotency/events','Consider team skills & query flexibility'],
a:'If access patterns are known and simple and we need massive scale with no ops — sessions, idempotency records, event logs — DynamoDB is great. For relational business data with reporting and complex transactions like invoices and billing I’d choose Postgres. In practice many systems use both: Postgres as the system of record, DynamoDB for high-throughput key-value needs.'},
{q:'What is a hot partition and how do you avoid it?',lvl:3,points:['Too much traffic on one partition key value','Throttling even if total capacity is fine','High-cardinality partition keys','Write sharding (suffix PK with random/calculated number)','Caching (DAX) for hot reads'],
a:'A hot partition is when one partition key value gets a disproportionate share of traffic, so requests throttle even though the table has spare capacity overall. I avoid it with high-cardinality keys, write sharding by adding a suffix to spread one logical key over several partitions, and caching hot reads, for example with DAX.'},
]},
];
