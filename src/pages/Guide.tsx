import { Fragment } from 'react';
import { topicById } from '../data';
import { GUIDE_PHASES, REQUIREMENT_MAP, guideTopics } from '../data/guide';
import { topicStats, useProgress } from '../store/progress';
import { ProgressBar } from '../components/ui';

export function Guide() {
  const { progress } = useProgress();
  const stats = guideTopics.map((t) => topicStats(t, progress));
  const steps = guideTopics.reduce((n, t) => n + t.steps.length, 0);
  const stepsDone = stats.reduce((n, s) => n + s.stepsDone, 0);
  const pct = steps ? Math.round((stepsDone / steps) * 100) : 0;

  const chip = (id: string) => {
    const t = topicById(id);
    if (!t) return null;
    const p = topicStats(t, progress).pct;
    return <a key={id} className={'chip' + (p === 100 ? ' ok' : '')} href={'#/topic/' + id + '/learn'}>{t.icon} {t.short} · {p}%</a>;
  };

  return (
    <>
      <h1>🧭 AI-Driven Team Delivery (with Claude Code)</h1>
      <p className="sub">
        A step-by-step guide to how a real team ships software with an AI agent: from a Jira ticket and a Figma design
        to a reviewed PR and a production deploy. You build one project, <b>TeamBlog</b>, a multi-tenant blog with posts
        and comments on React + Node/TS + AWS, and every job requirement is covered along the way.
      </p>

      <div className="grid g3">
        <div className="card"><div className="stat">{pct}%</div><div className="stat-l">Guide progress</div><ProgressBar pct={pct} /></div>
        <div className="card"><div className="stat">{stepsDone}/{steps}</div><div className="stat-l">Lessons done</div></div>
        <div className="card"><div className="stat">{guideTopics.length}</div><div className="stat-l">Chapters</div></div>
      </div>

      <h2>🗺️ The path</h2>
      <p className="muted">Go left to right. Each phase builds on the previous one, and every chapter has lessons plus interview questions.</p>
      <div className="flow">
        {GUIDE_PHASES.map((ph, i) => (
          <Fragment key={ph.title}>
            {i > 0 && <div className="arrow">→</div>}
            <div className="phase">
              <h4>{ph.title}</h4>
              <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>{ph.goal}</div>
              {ph.chapters.map(chip)}
            </div>
          </Fragment>
        ))}
      </div>

      <h2>📚 Chapters</h2>
      <div className="grid g2">
        {guideTopics.map((t, i) => (
          <a key={t.id} href={'#/topic/' + t.id + '/learn'} className="card guide-card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{t.icon} {t.title}</b>
              <span className="muted" style={{ fontSize: 12 }}>{stats[i].pct}%</span>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: '6px 0 10px' }}>{t.why}</p>
            <div className="muted" style={{ fontSize: 12 }}>{t.steps.length} lessons · {t.questions.length} questions</div>
            <div className="mini-bar" style={{ margin: '6px 0 0' }}><i style={{ width: stats[i].pct + '%' }} /></div>
          </a>
        ))}
      </div>

      <h2>✅ Job requirements → where you learn them</h2>
      <div className="card">
        <table>
          <thead><tr><th>Requirement</th><th>Type</th><th>Chapters</th></tr></thead>
          <tbody>
            {REQUIREMENT_MAP.map((r) => (
              <tr key={r.req}>
                <td>{r.req}</td>
                <td><span className={'badge ' + (r.tier === 'must' ? 'b3' : 'b2')}>{r.tier === 'must' ? 'Required' : 'Better to have'}</span></td>
                <td>{r.chapters.map(chip)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
