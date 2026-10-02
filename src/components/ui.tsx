import { useState } from 'react';
import type { Level, Rating } from '../types';

/** Renders trusted, static lesson HTML from /src/data */
export const Html = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />;

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* ignore */ }
  };
  return (
    <div>
      {label && <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>{label}</div>}
      <pre>
        <button className="btn sm copy" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export const ProgressBar = ({ pct }: { pct: number }) => (
  <div className="progress"><i style={{ width: pct + '%' }} /></div>
);

const LEVELS: Record<Level, string> = { 1: 'Basic', 2: 'Mid', 3: 'Senior' };
export const LevelBadge = ({ lvl }: { lvl: Level }) => <span className={'badge b' + lvl}>{LEVELS[lvl]}</span>;

export const RatingPill = ({ r }: { r?: Rating }) =>
  r ? <span className={'rating r-' + r}>{r}</span> : <span className="badge">new</span>;
