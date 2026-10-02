import { TOPICS, qid } from '../data';
import { useProgress } from '../store/progress';
import { QuestionCard } from '../components/QuestionCard';

const DAY = 24 * 60 * 60 * 1000;

/** Simple spaced repetition: how many days until a rated question is due again */
const INTERVAL = { again: 0, hard: 0, good: 3, easy: 7 } as const;

export function Review() {
  const { progress } = useProgress();
  const now = Date.now();

  const items = TOPICS.flatMap((t) =>
    t.questions.map((q, i) => ({ t, q, id: qid(t.id, i), st: progress.answers[qid(t.id, i)] })),
  ).filter((x) => x.st?.rating)
   .map((x) => ({ ...x, due: (x.st!.reviewedAt ?? 0) + INTERVAL[x.st!.rating!] * DAY }))
   // Weak answers (again/hard) always stay in the queue; good/easy come back when due
   .filter((x) => x.st!.rating === 'again' || x.st!.rating === 'hard' || x.due <= now)
   .sort((a, b) => a.due - b.due);

  return (
    <>
      <h1>🔁 Review queue</h1>
      <p className="sub">Answers you rated <b>Again</b> or <b>Hard</b> stay here until you improve them. <b>Good</b> answers come back after 3 days and <b>Easy</b> after 7 (spaced repetition). Re-answer from memory, then rate again.</p>
      {items.length === 0 ? (
        <div className="card">Nothing due right now. Rate more questions in each topic's <b>Interview practice</b> tab, or try a <a href="#/mock">mock interview</a>.</div>
      ) : items.map(({ t, q, id }) => <QuestionCard key={id} id={id} q={q} topicLabel={t.icon + ' ' + t.short} />)}
    </>
  );
}
