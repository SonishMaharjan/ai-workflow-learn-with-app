import { Fragment, useRef } from 'react';
import { ROADMAP, topicById } from '../data';
import { overallStats, topicStats, useProgress } from '../store/progress';
import { ProgressBar } from '../components/ui';
import type { Progress } from '../types';

export function Home() {
  const { progress, replaceAll, reset } = useProgress();
  const s = overallStats(progress);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'interview-prep-progress.json';
    a.click();
  };
  const importJson = async (f: File) => {
    try { replaceAll(JSON.parse(await f.text()) as Progress); } catch { alert('Invalid file'); }
  };

  return (
    <>
      <h1>AI-Driven Full-Stack Interview Prep</h1>
      <p className="sub">From React + TypeScript to Expo, NestJS, Postgres, AWS serverless and AI-assisted development. Learn step by step, then practise answering real interview questions.</p>

      <div className="grid g4">
        <div className="card"><div className="stat">{s.pct}%</div><div className="stat-l">Overall progress</div><ProgressBar pct={s.pct} /></div>
        <div className="card"><div className="stat">{s.stepsDone}/{s.steps}</div><div className="stat-l">Lessons done</div></div>
        <div className="card"><div className="stat">{s.answered}/{s.qs}</div><div className="stat-l">Questions reviewed</div></div>
        <div className="card"><div className="stat" style={{ color: s.weak ? 'var(--warn)' : undefined }}>{s.weak}</div><div className="stat-l">Weak answers to revisit</div></div>
      </div>

      <h2>🗺️ Your learning flow</h2>
      <p className="muted">Follow left to right. Each phase links to its topics — the % shows how far you are.</p>
      <div className="flow">
        {ROADMAP.map((ph, i) => (
          <Fragment key={ph.title}>
            {i > 0 && <div className="arrow">→</div>}
            <div className="phase">
              <h4>{ph.title}</h4>
              <div className="days">{ph.days}</div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>{ph.goal}</div>
              {ph.topics.map((id) => {
                const t = topicById(id)!;
                const pct = topicStats(t, progress).pct;
                return <a key={id} className={'chip' + (pct === 100 ? ' ok' : '')} href={'#/topic/' + id + '/learn'}>{t.icon} {t.short} · {pct}%</a>;
              })}
            </div>
          </Fragment>
        ))}
      </div>

      <h2>🔄 How to use this app (daily loop)</h2>
      <div className="grid g3">
        <div className="card"><h3 style={{ marginTop: 0 }}>1 · Learn</h3><p className="muted">Open a topic → <b>Learn</b> tab. Read one step, study the code, then paste the <b>Cursor prompt</b> into Cursor on a sandbox project. Mark the step done.</p></div>
        <div className="card"><h3 style={{ marginTop: 0 }}>2 · Practise</h3><p className="muted"><b>Practice</b> tab: write your answer <i>before</i> revealing. Tick the key points you covered, compare with the model answer, rate yourself.</p></div>
        <div className="card"><h3 style={{ marginTop: 0 }}>3 · Review</h3><p className="muted">Answers rated Again/Hard land in the <b>Review queue</b>. Use <b>Copy AI review prompt</b> for detailed feedback from Claude. End the week with a <b>Mock interview</b>.</p></div>
      </div>

      <h2>💾 Your data</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>Progress and answers are saved in this browser (localStorage). Export a backup to move between computers.</p>
        <div className="row">
          <button className="btn" onClick={exportJson}>⬇ Export progress</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Import progress</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          <button className="btn bad" onClick={() => confirm('Delete all progress and answers?') && reset()}>Reset</button>
        </div>
      </div>
    </>
  );
}
