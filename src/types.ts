/** A single lesson inside a topic. `body` is trusted, static HTML authored in /src/data. */
export interface Step {
  title: string;
  body: string;
  /** Optional code example shown under the lesson */
  code?: string;
  /** A prompt you can paste into Cursor to practise this step AI-first */
  prompt?: string;
}

/** 1 = junior/basic, 2 = mid, 3 = senior/deep-dive */
export type Level = 1 | 2 | 3;

export interface Question {
  q: string;
  lvl: Level;
  /** Key points a strong answer should mention (used for self-review) */
  points: string[];
  /** A model answer to compare against */
  a: string;
}

export interface Topic {
  id: string;
  icon: string;
  title: string;
  short: string;
  why: string;
  steps: Step[];
  questions: Question[];
  /** "must" = listed in the job requirements, "nice" = better to have */
  /** "guide" = chapter of the AI-Driven Team Delivery guide */
  tier?: 'must' | 'nice' | 'project' | 'guide';
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface AnswerState {
  text: string;
  covered: number[];
  revealed: boolean;
  rating?: Rating;
  reviewedAt?: number;
}

export interface Progress {
  steps: Record<string, boolean>;
  answers: Record<string, AnswerState>;
  tools: Record<string, boolean>;
}

export interface Tool {
  id: string;
  name: string;
  group: string;
  why: string;
  install: string;
}
