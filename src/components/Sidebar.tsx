import type { ReactNode } from 'react';
import { TOPICS } from '../data';
import { topicStats, useProgress } from '../store/progress';

export function Sidebar({ route }: { route: string[] }) {
  const { progress } = useProgress();
  const here = route.join('/');
  const link = (href: string, icon: string, label: string, active: boolean, extra?: ReactNode) => (
    <a href={'#/' + href} className={active ? 'active' : ''}><span className="ic">{icon}</span>{label}{extra}</a>
  );

  const group = (tier: string, title: string) => (
    <>
      <div className="nav-sec">{title}</div>
      {TOPICS.filter((t) => t.tier === tier).map((t) => {
        const s = topicStats(t, progress);
        return (
          <div key={t.id}>
            {link('topic/' + t.id + '/learn', t.icon, t.short, route[0] === 'topic' && route[1] === t.id, <span className="pct">{s.pct}%</span>)}
            <div className="mini-bar"><i style={{ width: s.pct + '%' }} /></div>
          </div>
        );
      })}
    </>
  );

  return (
    <aside>
      <div className="brand">🎯<div>Interview Prep<small>AI-driven full-stack</small></div></div>
      <nav className="nav">
        {link('', '🏠', 'Home & roadmap', here === 'home' || here === '')}
        {link('review', '🔁', 'Review queue', here === 'review')}
        {link('mock', '🎤', 'Mock interview', here === 'mock')}
        {link('tools', '🧰', 'Tools checklist', here === 'tools')}
        {link('guide', '🧭', 'AI Delivery Guide', here === 'guide')}
        {group('must', 'Required skills')}
        {group('nice', 'Better to have')}
        {group('project', 'Put it together')}
        {group('guide', 'AI delivery guide (Claude)')}
      </nav>
    </aside>
  );
}
