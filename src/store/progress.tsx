import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AnswerState, Progress, Topic } from '../types';
import { TOPICS, qid, sid } from '../data';

const KEY = 'ai-interview-prep:v1';
const empty: Progress = { steps: {}, answers: {}, tools: {} };

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

interface Ctx {
  progress: Progress;
  toggleStep: (topicId: string, i: number, value?: boolean) => void;
  setAnswer: (id: string, patch: Partial<AnswerState>) => void;
  toggleTool: (id: string) => void;
  replaceAll: (p: Progress) => void;
  reset: () => void;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* storage unavailable */ }
  }, [progress]);

  const toggleStep = useCallback((topicId: string, i: number, value?: boolean) => {
    setProgress((p) => {
      const k = sid(topicId, i);
      return { ...p, steps: { ...p.steps, [k]: value ?? !p.steps[k] } };
    });
  }, []);

  const setAnswer = useCallback((id: string, patch: Partial<AnswerState>) => {
    setProgress((p) => {
      const prev: AnswerState = p.answers[id] ?? { text: '', covered: [], revealed: false };
      return { ...p, answers: { ...p.answers, [id]: { ...prev, ...patch } } };
    });
  }, []);

  const toggleTool = useCallback((id: string) => {
    setProgress((p) => ({ ...p, tools: { ...p.tools, [id]: !p.tools[id] } }));
  }, []);

  const value = useMemo<Ctx>(() => ({
    progress, toggleStep, setAnswer, toggleTool,
    replaceAll: (p) => setProgress({ ...empty, ...p }),
    reset: () => setProgress(empty),
  }), [progress, toggleStep, setAnswer, toggleTool]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

/** Percentage of steps done + questions rated, for one topic */
export function topicStats(t: Topic, p: Progress) {
  const stepsDone = t.steps.filter((_, i) => p.steps[sid(t.id, i)]).length;
  const answered = t.questions.filter((_, i) => p.answers[qid(t.id, i)]?.rating).length;
  const total = t.steps.length + t.questions.length;
  return { stepsDone, answered, pct: total ? Math.round(((stepsDone + answered) / total) * 100) : 0 };
}

export function overallStats(p: Progress) {
  let steps = 0, stepsDone = 0, qs = 0, answered = 0, weak = 0;
  for (const t of TOPICS) {
    steps += t.steps.length;
    qs += t.questions.length;
    const s = topicStats(t, p);
    stepsDone += s.stepsDone;
    answered += s.answered;
    t.questions.forEach((_, i) => {
      const r = p.answers[qid(t.id, i)]?.rating;
      if (r === 'again' || r === 'hard') weak++;
    });
  }
  return { steps, stepsDone, qs, answered, weak, pct: Math.round(((stepsDone + answered) / (steps + qs)) * 100) };
}
