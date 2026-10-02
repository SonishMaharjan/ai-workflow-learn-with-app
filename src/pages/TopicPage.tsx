import { useState } from 'react';
import { qid, sid, topicById } from '../data';
import { topicStats, useProgress } from '../store/progress';
import { CodeBlock, Html, ProgressBar } from '../components/ui';
import { QuestionCard } from '../components/QuestionCard';
import { go } from '../router';
import { guideTopics } from '../data/guide';

type Filter = 'all' | 'new' | 'weak';

export function TopicPage({ id, tab }: { id: string; tab: string }) {
  const topic = topicById(id);
  const { progress, toggleStep } = useProgress();
  const [stepIdx, setStepIdx] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');

  if (!topic) return <p>Topic not found. <a href="#/">Go home</a></p>;
  const stats = topicStats(topic, progress);
  const step = topic.steps[Math.min(stepIdx, topic.steps.length - 1)];
  const isDone = !!progress.steps[sid(topic.id, stepIdx)];
  const last = stepIdx === topic.steps.length - 1;

  const completeAndNext = () => {
    toggleStep(topic.id, stepIdx, true);
    if (last) go('topic/' + topic.id + '/practice');
    else { setStepIdx(stepIdx + 1); window.scrollTo(0, 0); }
  };

  // Guide chapters get a breadcrumb and a link to the next chapter
  const gIdx = guideTopics.findIndex((t) => t.id === topic.id);
  const nextChapter = gIdx >= 0 ? guideTopics[gIdx + 1] : undefined;

  const questions = topic.questions
    .map((q, i) => ({ q, id: qid(topic.id, i) }))
    .filter(({ id }) => {
      const r = progress.answers[id]?.rating;
      if (filter === 'new') return !r;
      if (filter === 'weak') return r === 'again' || r === 'hard';
      return true;
    });

  return (
    <>
      {gIdx >= 0 && (
        <div className="crumb"><a href="#/guide">🧭 AI Delivery Guide</a> · Chapter {gIdx} of {guideTopics.length - 1}</div>
      )}
      <h1>{topic.icon} {topic.title}</h1>
      <p className="sub">{topic.why}</p>
      <div className="row" style={{ maxWidth: 420 }}>
        <div style={{ flex: 1 }}><ProgressBar pct={stats.pct} /></div>
        <span className="muted" style={{ fontSize: 13 }}>{stats.stepsDone}/{topic.steps.length} lessons · {stats.answered}/{topic.questions.length} questions</span>
      </div>

      <div className="tabs">
        <a href={'#/topic/' + topic.id + '/learn'} className={tab !== 'practice' ? 'active' : ''}>📘 Learn ({topic.steps.length} steps)</a>
        <a href={'#/topic/' + topic.id + '/practice'} className={tab === 'practice' ? 'active' : ''}>🎯 Interview practice ({topic.questions.length})</a>
      </div>

      {tab !== 'practice' ? (
        <div className="learn">
          <div className="steps">
            {topic.steps.map((s, i) => (
              <a key={i} href="#" onClick={(e) => { e.preventDefault(); setStepIdx(i); }}
                className={(i === stepIdx ? 'active ' : '') + (progress.steps[sid(topic.id, i)] ? 'done' : '')}>
                <span className="dot">{progress.steps[sid(topic.id, i)] ? '✓' : i + 1}</span>{s.title}
              </a>
            ))}
          </div>
          <div className="card lesson">
            <div className="muted" style={{ fontSize: 12 }}>Step {stepIdx + 1} of {topic.steps.length}</div>
            <h2 style={{ marginTop: 4 }}>{step.title}</h2>
            <Html html={step.body} />
            {step.code && <CodeBlock code={step.code} label="Example" />}
            {step.prompt && (
              <div className="callout ai">
                <b>🤖 Practise it AI-first — paste into {topic.tier === 'guide' ? 'Claude Code' : 'Cursor (Agent/Chat)'}</b>
                <CodeBlock code={step.prompt} />
                <span className="muted" style={{ fontSize: 13 }}>Then review the diff critically: what did the AI get right, what would you change?</span>
              </div>
            )}
            <div className="row" style={{ marginTop: 20, justifyContent: 'space-between' }}>
              <button className="btn" disabled={stepIdx === 0} onClick={() => setStepIdx(stepIdx - 1)}>← Previous</button>
              <div className="row">
                {isDone && <button className="btn sm" onClick={() => toggleStep(topic.id, stepIdx, false)}>Mark not done</button>}
                <button className="btn primary" onClick={completeAndNext}>
                  {last ? 'Done → Start interview practice' : isDone ? 'Next step →' : 'Mark done & next →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="row filter">
            {(['all', 'new', 'weak'] as Filter[]).map((f) => (
              <button key={f} className={'btn sm' + (filter === f ? ' sel' : '')} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'new' ? 'Not reviewed' : 'Needs review'}
              </button>
            ))}
          </div>
          {questions.length === 0 && <p className="muted">Nothing here 🎉</p>}
          {questions.map(({ q, id }) => <QuestionCard key={id} id={id} q={q} />)}
          {nextChapter && (
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <a className="btn primary" href={'#/topic/' + nextChapter.id + '/learn'}>Next chapter: {nextChapter.icon} {nextChapter.short} →</a>
            </div>
          )}
        </>
      )}
    </>
  );
}
