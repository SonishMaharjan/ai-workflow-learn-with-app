import { foundationChapters } from './foundation';
import { buildChapters } from './build';
import { shipChapters } from './ship';
import { teamChapters } from './team';

/** All chapters of the "AI-Driven Team Delivery" guide, in reading order */
export const guideTopics = [...foundationChapters, ...buildChapters, ...shipChapters, ...teamChapters];

/** Phases shown as a flow on the guide page */
export const GUIDE_PHASES: { title: string; goal: string; chapters: string[] }[] = [
  { title: 'A. Foundations', goal: 'Understand the flow, set up tools, repo, GitHub and AWS.', chapters: ['g-overview', 'g-setup'] },
  { title: 'B. AI setup', goal: 'CLAUDE.md, rules, permissions, hooks, skills, subagents, MCP.', chapters: ['g-claude', 'g-agents', 'g-mcp'] },
  { title: 'C. Design', goal: 'Jira epic → PRD → Figma → ADRs → data model → stories.', chapters: ['g-design'] },
  { title: 'D. Build', goal: 'Node/TS on Lambda, DynamoDB, S3, SQS, CDK, React, plus tenancy, timezones, PDF, AI.', chapters: ['g-backend', 'g-frontend', 'g-features'] },
  { title: 'E. Quality', goal: 'Evals for AI features and your AI setup; tests the agent can\'t cheat.', chapters: ['g-evals', 'g-testing'] },
  { title: 'F. Ship', goal: 'PRs, AI + human review, CI/CD with OIDC, monitoring, the team playbook.', chapters: ['g-pr', 'g-delivery', 'g-playbook'] },
  { title: 'G. Real team', goal: 'Conventions a real team uses (short prompts, skill chain, living docs, frozen contracts) and the messy scenarios you will meet.', chapters: ['g-conventions', 'g-scenarios'] },
];

/** Job requirement → chapters that cover it */
export const REQUIREMENT_MAP: { req: string; tier: 'must' | 'nice'; chapters: string[] }[] = [
  { req: 'React + Node.js + TypeScript', tier: 'must', chapters: ['g-setup', 'g-backend', 'g-frontend'] },
  { req: 'AWS: Lambda, DynamoDB, SQS, S3', tier: 'must', chapters: ['g-design', 'g-backend', 'g-delivery'] },
  { req: 'Writing rules, skills, evals for AI workflows', tier: 'must', chapters: ['g-claude', 'g-agents', 'g-evals', 'g-conventions'] },
  { req: 'Driving end-to-end features with an AI coding tool', tier: 'must', chapters: ['g-mcp', 'g-pr', 'g-playbook', 'g-conventions', 'g-scenarios'] },
  { req: 'Timezone-related work', tier: 'nice', chapters: ['g-features', 'g-testing'] },
  { req: 'Multi-tenancy', tier: 'nice', chapters: ['g-design', 'g-features', 'g-scenarios'] },
  { req: 'AI integration', tier: 'nice', chapters: ['g-features', 'g-evals'] },
  { req: 'PDF processing', tier: 'nice', chapters: ['g-backend', 'g-features'] },
  { req: 'Working in a real team: conventions, bugs, incidents, upgrades', tier: 'nice', chapters: ['g-conventions', 'g-scenarios'] },
];
