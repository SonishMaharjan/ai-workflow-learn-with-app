import type { Topic, Tool } from '../types';
import { coreTopics } from './topics/core';
import { awsTopics } from './topics/aws';
import { bonusTopics } from './topics/bonus';
import { blog } from './topics/blog';
import { capstone } from './topics/capstone';
import { guideTopics } from './guide';

const must = [...coreTopics, ...awsTopics].map((t) => ({ ...t, tier: 'must' as const }));
const nice = bonusTopics.map((t) => ({ ...t, tier: 'nice' as const }));

const guide = guideTopics.map((t) => ({ ...t, tier: 'guide' as const }));

export const TOPICS: Topic[] = [...must, ...nice, blog, capstone, ...guide];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);

/** Question id = topicId-index */
export const qid = (topicId: string, i: number) => topicId + '-' + i;
export const sid = (topicId: string, i: number) => topicId + ':' + i;

/** Suggested learning order, shown as a flow on the home page */
export const ROADMAP: { title: string; days: string; topics: string[]; goal: string }[] = [
  { title: '1. AI workflow first', days: 'Days 1–2', topics: ['ai'], goal: 'Set up Cursor, learn rules/skills/evals. Use AI for everything after this.' },
  { title: '2. Backend', days: 'Days 3–5', topics: ['nest', 'pg'], goal: 'NestJS modules, DI, lifecycle; TypeORM entities, migrations, transactions.' },
  { title: '3. Mobile', days: 'Days 6–7', topics: ['rn'], goal: 'Your React skills + RN primitives, Expo Router, EAS.' },
  { title: '4. Cloud', days: 'Days 8–10', topics: ['aws', 'dynamo'], goal: 'Lambda, SQS, S3, IAM, CDK; DynamoDB key design.' },
  { title: '5. Bonus skills', days: 'Days 11–12', topics: ['tz', 'mt', 'llm', 'pdf'], goal: 'The "better to have" list — great differentiators.' },
  { title: '6. Build & rehearse', days: 'Days 13–14+', topics: ['blog', 'capstone'], goal: 'Warm up with the blog example, then build InvoiceScan, run mock interviews, review weak answers.' },
];

export const TOOLS: Tool[] = [
  { id: 'cursor', group: 'AI tools', name: 'Cursor', why: 'The AI editor named in the job. Learn Tab, Cmd+K, Agent, @-mentions, rules.', install: 'Download from cursor.com, import VS Code settings' },
  { id: 'claude-code', group: 'AI tools', name: 'Claude Code / other agent CLI (optional)', why: 'Terminal-based coding agent; uses CLAUDE.md and skills. Good to know the concepts transfer.', install: 'See docs.claude.com' },
  { id: 'llm-key', group: 'AI tools', name: 'An LLM API key (Anthropic or OpenAI)', why: 'For building AI features in the capstone.', install: 'Create key in provider console → put in .env (never commit)' },
  { id: 'node', group: 'Basics', name: 'Node.js LTS + pnpm', why: 'Runs Nest, Expo tooling, CDK.', install: 'nvm install --lts && npm i -g pnpm' },
  { id: 'git', group: 'Basics', name: 'Git + GitHub', why: 'Small commits are your safety net with AI.', install: 'git config --global user.name "..."' },
  { id: 'docker', group: 'Basics', name: 'Docker Desktop', why: 'Run Postgres and LocalStack locally.', install: 'docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16' },
  { id: 'nestcli', group: 'Backend', name: 'Nest CLI', why: 'Scaffolding modules/resources.', install: 'npm i -g @nestjs/cli && nest new api' },
  { id: 'dbgui', group: 'Backend', name: 'DB GUI: TablePlus / DBeaver / pgAdmin', why: 'Inspect tables, run EXPLAIN ANALYZE.', install: 'Any one is fine' },
  { id: 'api-client', group: 'Backend', name: 'Postman / Bruno / Insomnia', why: 'Test your API endpoints.', install: 'Bruno is free & git-friendly' },
  { id: 'expo', group: 'Mobile', name: 'Expo CLI + Expo Go app on your phone', why: 'Fastest way to run RN on a real device.', install: 'npx create-expo-app@latest mobile && npx expo start' },
  { id: 'emulator', group: 'Mobile', name: 'Android Studio emulator (or Xcode on Mac)', why: 'Run dev builds without a phone.', install: 'Install Android Studio → Device Manager → create a device' },
  { id: 'eas', group: 'Mobile', name: 'EAS CLI', why: 'Cloud builds and OTA updates.', install: 'npm i -g eas-cli && eas login' },
  { id: 'aws-acc', group: 'AWS', name: 'AWS account (Free Tier) + billing alarm', why: 'Hands-on with real services. Set a budget alarm on day 1!', install: 'aws.amazon.com → Billing → Budgets' },
  { id: 'aws-cli', group: 'AWS', name: 'AWS CLI v2', why: 'Inspect S3, SQS, logs from the terminal.', install: 'aws configure sso   (or aws configure)' },
  { id: 'cdk', group: 'AWS', name: 'AWS CDK (TypeScript)', why: 'Infrastructure as code in the language you know.', install: 'npm i -g aws-cdk && cdk init app --language typescript' },
  { id: 'localstack', group: 'AWS', name: 'LocalStack', why: 'Emulate S3/SQS/DynamoDB/Lambda locally for free.', install: 'docker run -d -p 4566:4566 localstack/localstack' },
  { id: 'nosqlwb', group: 'AWS', name: 'NoSQL Workbench for DynamoDB', why: 'Visually model single-table designs.', install: 'Free download from AWS' },
  { id: 'luxon', group: 'Libraries', name: 'Luxon or date-fns-tz', why: 'Timezone-safe date math.', install: 'pnpm add luxon' },
  { id: 'pdflibs', group: 'Libraries', name: 'pdfjs-dist, pdf-lib', why: 'Extract and generate PDFs.', install: 'pnpm add pdfjs-dist pdf-lib' },
  { id: 'zod', group: 'Libraries', name: 'Zod', why: 'Validate AI outputs and env config.', install: 'pnpm add zod' },
];
