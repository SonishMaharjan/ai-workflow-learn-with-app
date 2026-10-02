import { useState } from 'react';
import type { Question, Rating } from '../types';
import { useProgress } from '../store/progress';
import { LevelBadge, RatingPill } from './ui';

const RATINGS: { r: Rating; label: string; cls: string; hint: string }[] = [
  { r: 'again', label: 'Again', cls: 'bad', hint: "Couldn't answer" },
  { r: 'hard', label: 'Hard', cls: 'warn', hint: 'Partial answer' },
  { r: 'good', label: 'Good', cls: 'good', hint: 'Mostly right' },
  { r: 'easy', label: 'Easy', cls: '', hint: 'Nailed it' },
];

function reviewPrompt(q: Question, answer: string) {
  return [
    'You are a senior interviewer for a full-stack role (Expo/React Native, NestJS, Postgres/TypeORM, AWS serverless, AI-assisted development).',
    'Review my interview answer. Give: 1) a score out of 10, 2) what was good, 3) what was missing or wrong, 4) an improved 60-second version in my voice, 5) one follow-up question an interviewer might ask.',
    '',
    'Question: ' + q.q,
    'Key points a strong answer covers: ' + q.points.join('; '),
    '',
    'My answer:',
    answer || '(empty)',
  ].join('\n');
}

interface Props {
  id: string;
  q: Question;
  topicLabel?: string;
  defaultOpen?: boolean;
  /** Mock mode hides the header toggle and keeps the card open */
  mock?: boolean;
}

export function QuestionCard({ id, q, topicLabel, defaultOpen, mock }: Props) {
  const { progress, setAnswer } = useProgress();
  const st = progress.answers[id] ?? { text: '', covered: [], revealed: false };
  const [open, setOpen] = useState(!!defaultOpen || !!mock);
  const [copied, setCopied] = useState(false);

  const toggleCovered = (i: number) => {
    const covered = st.covered.includes(i) ? st.covered.filter((x) => x !== i) : [...st.covered, i];
    setAnswer(id, { covered });
  };
  const score = Math.round((st.covered.length / q.points.length) * 100);

  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(reviewPrompt(q, st.text)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className={'q' + (open ? ' open' : '')}>
      <div className="q-h" onClick={() => !mock && setOpen(!open)}>
        <LevelBadge lvl={q.lvl} />
        <div className="t">{q.q}{topicLabel && <div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{topicLabel}</div>}</div>
        <RatingPill r={st.rating} />
      </div>
      <div className="q-b">
        <p className="muted" style={{ marginTop: 0 }}>Write your answer as if you were speaking to the interviewer (aim for 45–90 seconds).</p>
        <textarea
          value={st.text}
          placeholder="Type your answer here… it saves automatically."
          onChange={(e) => setAnswer(id, { text: e.target.value })}
        />
        <div className="row" style={{ marginTop: 10 }}>
          {!st.revealed
            ? <button className="btn primary" onClick={() => setAnswer(id, { revealed: true })}>Reveal key points & model answer</button>
            : <button className="btn" onClick={() => setAnswer(id, { revealed: false })}>Hide answer</button>}
          <button className="btn" onClick={copyPrompt} title="Paste into Claude / ChatGPT / Cursor chat for detailed feedback">
            {copied ? 'Copied ✓' : '🤖 Copy AI review prompt'}
          </button>
          <span className="muted" style={{ fontSize: 12 }}>{st.text.trim() ? st.text.trim().split(/\s+/).length + ' words' : ''}</span>
        </div>

        {st.revealed && (
          <div className="qa" style={{ marginTop: 16 }}>
            <h3>✅ Self-review: tick the points you covered <span className="muted" style={{ fontWeight: 400 }}>({score}%)</span></h3>
            <div className="points">
              {q.points.map((p, i) => (
                <label key={i}><input type="checkbox" checked={st.covered.includes(i)} onChange={() => toggleCovered(i)} />{p}</label>
              ))}
            </div>
            <h3>💡 Model answer</h3>
            <div className="callout" style={{ marginTop: 0 }}>{q.a}</div>
            <h3>How did it go?</h3>
            <div className="row">
              {RATINGS.map(({ r, label, cls, hint }) => (
                <button key={r} title={hint}
                  className={'btn ' + cls + (st.rating === r ? ' sel' : '')}
                  onClick={() => setAnswer(id, { rating: r, reviewedAt: Date.now() })}>
                  {label}
                </button>
              ))}
              <span className="muted" style={{ fontSize: 12 }}>"Again" and "Hard" go to your Review queue.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
