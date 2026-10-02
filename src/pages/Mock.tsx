import { useEffect, useState } from 'react';
import { TOPICS, qid } from '../data';
import { QuestionCard } from '../components/QuestionCard';
import { useProgress } from '../store/progress';

interface Session { ids: { id: string; topic: string; tIdx: number; qIdx: number }[]; idx: number; seconds: number }

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

export function Mock() {
  const { progress, setAnswer } = useProgress();
  const [selected, setSelected] = useState<string[]>(TOPICS.filter((t) => t.tier === 'must').map((t) => t.id));
  const [count, setCount] = useState(5);
  const [perQ, setPerQ] = useState(120);
  const [session, setSession] = useState<Session | null>(null);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!session || done) return;
    setLeft(session.seconds);
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [session?.idx, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    const pool = TOPICS.flatMap((t, tIdx) => selected.includes(t.id)
      ? t.questions.map((_, qIdx) => ({ id: qid(t.id, qIdx), topic: t.icon + ' ' + t.short, tIdx, qIdx })) : []);
    const ids = shuffle(pool).slice(0, count);
    // Start each mock answer fresh (hidden) so you answer from memory
    ids.forEach(({ id }) => setAnswer(id, { revealed: false }));
    setDone(false);
    setSession({ ids, idx: 0, seconds: perQ });
  };

  if (!session) {
    return (
      <>
        <h1>🎤 Mock interview</h1>
        <p className="sub">Random questions, one at a time, with a timer. Answer out loud first, then type your key points. Tip: record yourself on your phone.</p>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Topics</h3>
          <div className="row">
            {TOPICS.map((t) => (
              <label key={t.id} className="chip" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.includes(t.id)}
                  onChange={() => setSelected((s) => s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id])} />
                {t.icon} {t.short}
              </label>
            ))}
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <label>Questions <select value={count} onChange={(e) => setCount(+e.target.value)}>{[3, 5, 8, 10, 15].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label>Time per question <select value={perQ} onChange={(e) => setPerQ(+e.target.value)}>
              <option value={60}>1 min</option><option value={120}>2 min</option><option value={180}>3 min</option></select></label>
            <button className="btn primary" disabled={!selected.length} onClick={start}>Start mock interview</button>
          </div>
        </div>
      </>
    );
  }

  if (done) {
    const rated = session.ids.map(({ id }) => progress.answers[id]?.rating);
    return (
      <>
        <h1>🎉 Mock complete</h1>
        <p className="sub">Reveal each answer, tick covered points and rate yourself. Weak ones go to your Review queue.</p>
        <div className="row" style={{ marginBottom: 16 }}>
          <span className="badge">Rated: {rated.filter(Boolean).length}/{rated.length}</span>
          <button className="btn" onClick={() => setSession(null)}>New mock</button>
        </div>
        {session.ids.map(({ id, topic, tIdx, qIdx }) => (
          <QuestionCard key={id} id={id} q={TOPICS[tIdx].questions[qIdx]} topicLabel={topic} defaultOpen />
        ))}
      </>
    );
  }

  const cur = session.ids[session.idx];
  const mm = String(Math.floor(left / 60)).padStart(1, '0') + ':' + String(left % 60).padStart(2, '0');
  const next = () => session.idx + 1 >= session.ids.length ? setDone(true) : setSession({ ...session, idx: session.idx + 1 });

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Question {session.idx + 1} / {session.ids.length}</h1>
        <div className="timer" style={{ color: left === 0 ? 'var(--bad)' : left < 20 ? 'var(--warn)' : undefined }}>{mm}</div>
      </div>
      <p className="sub">{cur.topic}{left === 0 && ' — time is up! Wrap up your answer.'}</p>
      <QuestionCard key={cur.id} id={cur.id} q={TOPICS[cur.tIdx].questions[cur.qIdx]} mock />
      <div className="row">
        <button className="btn primary" onClick={next}>{session.idx + 1 >= session.ids.length ? 'Finish & review' : 'Next question →'}</button>
        <button className="btn" onClick={() => setDone(true)}>End early</button>
      </div>
    </>
  );
}
