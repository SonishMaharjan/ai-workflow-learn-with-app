import { TOOLS } from '../data';
import { useProgress } from '../store/progress';
import { ProgressBar } from '../components/ui';

export function Tools() {
  const { progress, toggleTool } = useProgress();
  const groups = [...new Set(TOOLS.map((t) => t.group))];
  const done = TOOLS.filter((t) => progress.tools[t.id]).length;

  return (
    <>
      <h1>🧰 Tools checklist</h1>
      <p className="sub">Install and try each one at least once, so you can talk about them confidently.</p>
      <div className="row" style={{ maxWidth: 400, marginBottom: 18 }}>
        <div style={{ flex: 1 }}><ProgressBar pct={Math.round((done / TOOLS.length) * 100)} /></div>
        <span className="muted">{done}/{TOOLS.length}</span>
      </div>
      <div className="grid g2">
        {groups.map((g) => (
          <div key={g} className="card">
            <h3 style={{ marginTop: 0 }}>{g}</h3>
            {TOOLS.filter((t) => t.group === g).map((t) => (
              <label key={t.id} className="tool">
                <input type="checkbox" checked={!!progress.tools[t.id]} onChange={() => toggleTool(t.id)} />
                <div>
                  <b>{t.name}</b>
                  <div className="muted" style={{ fontSize: 13 }}>{t.why}</div>
                  <code style={{ fontSize: 12, color: '#ffd58a' }}>{t.install}</code>
                </div>
              </label>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
