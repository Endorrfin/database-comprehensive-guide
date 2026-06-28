import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../../i18n/lang';

/*
 * ★ Vector / ANN search sim (M29, signature). A fixed 2-D "embedding space" with 12 document
 * points in 3 semantic clusters. Toggle Exact kNN (scans every point) vs HNSW (follows the
 * proximity graph). In HNSW mode a second ef toggle shows: ef=4 (narrow beam → imperfect
 * recall) vs ef=8 (wider beam → full recall) — teaching the speed/recall trade-off.
 * States are pre-defined and deterministic (no animation loop → inherently
 * prefers-reduced-motion safe). ARIA: radiogroups + live region. Technical terms stay English.
 */

// ── Data types ─────────────────────────────────────────────────────────────
type Cluster = 'tech' | 'sports' | 'food';
type PId = 'A1' | 'A2' | 'A3' | 'A4' | 'B1' | 'B2' | 'B3' | 'B4' | 'C1' | 'C2' | 'C3' | 'C4';
type Mode = 'exact' | 'hnsw';
type Ef = 'low' | 'high';

// ── Fixed geometry (SVG viewBox 0 0 420 272) ───────────────────────────────
const W = 420, H = 272;
const Q = { x: 322, y: 157 }; // query point — near food cluster

const POINTS: Record<PId, { x: number; y: number; cluster: Cluster }> = {
  // Technology cluster — upper left
  A1: { x: 58,  y: 56,  cluster: 'tech' },
  A2: { x: 82,  y: 72,  cluster: 'tech' },
  A3: { x: 64,  y: 90,  cluster: 'tech' },
  A4: { x: 90,  y: 52,  cluster: 'tech' },
  // Sports cluster — lower left
  B1: { x: 68,  y: 190, cluster: 'sports' },
  B2: { x: 96,  y: 206, cluster: 'sports' },
  B3: { x: 54,  y: 214, cluster: 'sports' },
  B4: { x: 84,  y: 233, cluster: 'sports' },
  // Food cluster — right
  C1: { x: 316, y: 153, cluster: 'food' },
  C2: { x: 337, y: 170, cluster: 'food' },
  C3: { x: 302, y: 172, cluster: 'food' },
  C4: { x: 342, y: 143, cluster: 'food' },
};

// Pre-computed: distances from Q(322,157)
// C1≈8.2  C2≈17.1  C4≈22.4  C3≈25.5  B2≈226  B4≈237  B1≈253  B3≈268  A4≈307  A2≈309 ...
const TRUE_TOP3: PId[] = ['C1', 'C2', 'C4']; // k=3 ground truth

// HNSW proximity graph edges (M=2 per node + 2 cross-cluster bridges)
const EDGES: [PId, PId][] = [
  ['A1', 'A2'], ['A1', 'A3'], ['A2', 'A4'], ['A3', 'A4'],   // tech
  ['B1', 'B2'], ['B1', 'B3'], ['B2', 'B4'], ['B3', 'B4'],   // sports
  ['C1', 'C2'], ['C1', 'C3'], ['C2', 'C4'], ['C3', 'C4'],   // food
  ['A2', 'B2'], // cross-cluster bridge 1 (tech↔sports)
  ['B4', 'C3'], // cross-cluster bridge 2 (sports↔food)
];

// ef=4 greedy path: entry A1, follow the edge that brings us closest to Q each hop
const PATH_LOW: PId[]  = ['A1', 'A2', 'B2', 'B4', 'C3', 'C1'];
// ef=8 extends: from C1 expand C2, from C2 expand C4
const PATH_HIGH: PId[] = ['A1', 'A2', 'B2', 'B4', 'C3', 'C1', 'C2', 'C4'];

// ef=4: visited 6 nodes → closest 3 from visited = {C1(8.2), C3(25.5), B4(237)}
//   → recall 1/3 (only C1 ∈ true top-3)
const APPROX_LOW:  PId[] = ['C1', 'C3', 'B4'];
// ef=8: visited 8 nodes → closest 3 from visited = {C1(8.2), C2(17.1), C4(22.4)}
//   → recall 3/3 (perfect)
const APPROX_HIGH: PId[] = ['C1', 'C2', 'C4'];

// Cluster label positions (inside viewBox)
const LABELS: { cluster: Cluster; en: string; uk: string; x: number; y: number }[] = [
  { cluster: 'tech',   en: 'Technology', uk: 'Технології', x: 74,  y: 22  },
  { cluster: 'sports', en: 'Sports',     uk: 'Спорт',      x: 74,  y: 256 },
  { cluster: 'food',   en: 'Food',       uk: 'Їжа',        x: 312, y: 218 },
];

const CLUSTER_COLOR: Record<Cluster, string> = {
  tech:   'var(--accent)',      // blue — SQL/query
  sports: 'var(--c-commit)',    // green — success
  food:   'var(--c-analytics)', // amber — analytics
};

// Radius of the 3rd-nearest point from Q (C4, dist≈22.4) + small margin
const EXACT_RING_R = 27;

// ── Helpers ────────────────────────────────────────────────────────────────
function edgeMidArrow(a: PId, b: PId) {
  const pa = POINTS[a], pb = POINTS[b];
  const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
  const dx = pb.x - pa.x, dy = pb.y - pa.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, mx, my, nx: dx / len, ny: dy / len };
}

// ── Component ──────────────────────────────────────────────────────────────
export function VectorSim() {
  const { lang, t } = useLang();
  const [mode, setMode] = useState<Mode>('exact');
  const [ef, setEf] = useState<Ef>('low');
  const liveRef = useRef<HTMLParagraphElement>(null);

  const path    = ef === 'low' ? PATH_LOW  : PATH_HIGH;
  const approx  = ef === 'low' ? APPROX_LOW : APPROX_HIGH;
  const visited = useMemo(() => new Set<PId>(mode === 'hnsw' ? path : []), [mode, path]);

  // ── Derived stats ─────────────────────────────────────────────────────
  const scanned = mode === 'exact' ? 12 : path.length;
  const correctHits = useMemo(
    () => (mode === 'exact' ? TRUE_TOP3 : approx).filter(p => TRUE_TOP3.includes(p)).length,
    [mode, approx],
  );
  const speedLabel =
    mode === 'exact'
      ? t({ en: 'slow (O(n))', uk: 'повільно (O(n))' })
      : ef === 'low'
        ? t({ en: 'fast (O(log n))', uk: 'швидко (O(log n))' })
        : t({ en: 'moderate (O(log n))', uk: 'помірно (O(log n))' });

  const status = useMemo(
    () =>
      `${mode === 'exact' ? 'Exact kNN' : `HNSW ef=${ef === 'low' ? 4 : 8}`} — ${t({ en: 'scanned', uk: 'проскановано' })} ${scanned}/12, recall ${correctHits}/3`,
    [mode, ef, scanned, correctHits, t],
  );

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  // Determine highlight class for each point
  function pointRole(id: PId): 'result' | 'wrong' | 'visited' | 'none' {
    if (mode === 'exact') {
      return TRUE_TOP3.includes(id) ? 'result' : 'none';
    }
    const inApprox = approx.includes(id);
    const inTrue   = TRUE_TOP3.includes(id);
    if (inApprox && inTrue)  return 'result';  // correct hit  → gold
    if (inApprox && !inTrue) return 'wrong';   // false positive → red outline
    if (visited.has(id))     return 'visited'; // visited but not in result → dim teal
    return 'none';
  }

  // Path arrows (consecutive pairs in path)
  const pathArrows = useMemo(() => {
    if (mode !== 'hnsw') return [];
    return path.slice(0, -1).map((a, i) => {
      const b = path[i + 1];
      return edgeMidArrow(a as PId, b as PId);
    });
  }, [mode, path]);

  return (
    <section className="sim vec-sim" aria-label="Vector / ANN search simulator">
      {/* ── Mode & ef controls ── */}
      <div className="sim-bar vec-bar">
        <div className="seg" role="radiogroup" aria-label={t({ en: 'Search mode', uk: 'Режим пошуку' })}>
          {(['exact', 'hnsw'] as Mode[]).map(m => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              className={mode === m ? 'seg-on' : ''}
              onClick={() => setMode(m)}
            >
              {m === 'exact' ? 'Exact kNN' : 'HNSW'}
            </button>
          ))}
        </div>

        {mode === 'hnsw' && (
          <div className="seg vec-ef-seg" role="radiogroup" aria-label="ef (beam width)">
            {(['low', 'high'] as Ef[]).map(e => (
              <button
                key={e}
                role="radio"
                aria-checked={ef === e}
                className={ef === e ? 'seg-on' : ''}
                onClick={() => setEf(e)}
              >
                {e === 'low' ? 'ef=4' : 'ef=8'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── SVG canvas ── */}
      <div className="vec-canvas-wrap" aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} className="vec-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Arrow marker for path edges */}
            <marker id="vec-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 Z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* Cluster background blobs (soft ellipses) */}
          <ellipse cx="74"  cy="71"  rx="46" ry="28" fill="var(--accent)"      opacity="0.06" />
          <ellipse cx="74"  cy="212" rx="46" ry="28" fill="var(--c-commit)"    opacity="0.06" />
          <ellipse cx="320" cy="158" rx="48" ry="26" fill="var(--c-analytics)" opacity="0.06" />

          {/* Cluster labels */}
          {LABELS.map(l => (
            <text
              key={l.cluster}
              x={l.x} y={l.y}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-ui)"
              fill={CLUSTER_COLOR[l.cluster]}
              opacity="0.8"
              fontWeight="600"
            >
              {lang === 'uk' ? l.uk : l.en}
            </text>
          ))}

          {/* Exact mode: distance ring at r of 3rd nearest */}
          {mode === 'exact' && (
            <circle
              cx={Q.x} cy={Q.y} r={EXACT_RING_R}
              fill="none"
              stroke="var(--c-analytics)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.6"
            />
          )}

          {/* HNSW mode: graph edges */}
          {mode === 'hnsw' && EDGES.map(([a, b], i) => (
            <line
              key={i}
              x1={POINTS[a].x} y1={POINTS[a].y}
              x2={POINTS[b].x} y2={POINTS[b].y}
              stroke="var(--line2)"
              strokeWidth="0.8"
            />
          ))}

          {/* HNSW mode: navigation path arrows */}
          {pathArrows.map((seg, i) => (
            <line
              key={i}
              x1={seg.x1} y1={seg.y1}
              x2={seg.x2} y2={seg.y2}
              stroke="var(--accent)"
              strokeWidth="1.5"
              markerEnd="url(#vec-arrow)"
              opacity="0.85"
            />
          ))}

          {/* Document points */}
          {(Object.keys(POINTS) as PId[]).map(id => {
            const p = POINTS[id];
            const role = pointRole(id);
            const isEntry = mode === 'hnsw' && id === 'A1';
            const baseColor = CLUSTER_COLOR[p.cluster];
            return (
              <g key={id}>
                {/* Highlight ring for result / wrong / visited */}
                {role === 'result' && (
                  <circle cx={p.x} cy={p.y} r={9} fill="var(--c-analytics)" opacity="0.25" />
                )}
                {role === 'wrong' && (
                  <circle cx={p.x} cy={p.y} r={9} fill="var(--c-danger)" opacity="0.20" />
                )}
                {/* Point circle */}
                <circle
                  cx={p.x} cy={p.y} r={5}
                  fill={role === 'result' || role === 'visited' ? baseColor : baseColor}
                  opacity={
                    role === 'result' ? 1.0
                    : role === 'wrong'   ? 0.75
                    : role === 'visited' ? 0.65
                    : mode === 'exact'   ? 0.55
                    : 0.40
                  }
                  stroke={
                    role === 'result' ? 'var(--c-analytics)'
                    : role === 'wrong' ? 'var(--c-danger)'
                    : role === 'visited' ? 'var(--c-dist)'
                    : 'none'
                  }
                  strokeWidth={role === 'result' || role === 'wrong' ? 1.5 : 0}
                />
                {/* Entry point label */}
                {isEntry && (
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9"
                    fill="var(--tx3)" fontFamily="var(--font-code)">entry</text>
                )}
              </g>
            );
          })}

          {/* Query star */}
          <polygon
            points={starPoints(Q.x, Q.y, 8, 4, 5)}
            fill="var(--c-danger)"
            stroke="var(--surface)"
            strokeWidth="0.8"
            opacity="0.95"
          />
          <text
            x={Q.x + 12} y={Q.y + 4}
            fontSize="10" fontFamily="var(--font-code)"
            fill="var(--c-danger)" fontWeight="700"
          >
            query
          </text>
        </svg>
      </div>

      {/* ── Stats strip ── */}
      <div className="vec-stats">
        <span className="vec-stat">
          <span className="vec-stat-label">{t({ en: 'Scanned', uk: 'Проскановано' })}</span>
          <strong>{scanned}/12</strong>
        </span>
        <span className="vec-divider">·</span>
        <span className="vec-stat">
          <span className="vec-stat-label">Recall</span>
          <strong className={correctHits < 3 ? 'vec-miss' : 'vec-hit'}>{correctHits}/3</strong>
        </span>
        <span className="vec-divider">·</span>
        <span className="vec-stat">
          <span className="vec-stat-label">{t({ en: 'Speed', uk: 'Швидкість' })}</span>
          <span className="dim">{speedLabel}</span>
        </span>
      </div>

      {/* HNSW result annotation */}
      {mode === 'hnsw' && ef === 'low' && (
        <p className="vec-note vec-note--warn">
          {t({
            en: 'ef=4: beam too narrow — visited only 6/12 nodes, missed C2 (17th-nearest). The approximate result contains a false positive (C3 is 26 away; true 2nd is C2 at 17).',
            uk: 'ef=4: beam занадто вузький — відвідано лише 6/12 nodes, пропущено C2 (17-та найближча). Approximate result містить false positive (C3 на відстані 26; справжня 2-га — C2 на відстані 17).',
          })}
        </p>
      )}
      {mode === 'hnsw' && ef === 'high' && (
        <p className="vec-note vec-note--ok">
          {t({
            en: 'ef=8: beam wide enough to visit 8/12 nodes and find all 3 true nearest. More work than ef=4, but still far fewer comparisons than exact kNN (8 vs 12).',
            uk: 'ef=8: beam достатньо широкий для відвідування 8/12 nodes і знаходження всіх 3 справжніх найближчих. Більше роботи, ніж ef=4, але значно менше порівнянь, ніж exact kNN (8 проти 12).',
          })}
        </p>
      )}
      {mode === 'exact' && (
        <p className="vec-note">
          {t({
            en: 'Exact kNN computes the distance from the query to every document — O(n·d) per query. Guaranteed recall = 100%, but prohibitively slow at tens of millions of vectors.',
            uk: 'Exact kNN обчислює відстань від query до кожного документа — O(n·d) на запит. Гарантований recall = 100%, але неприйнятно повільно при десятках мільйонів vectors.',
          })}
        </p>
      )}

      {/* Legend */}
      <div className="sim-legend muted">
        <span><i className="dot" style={{ background: 'var(--c-analytics)' }} /> {t({ en: 'top-3 result', uk: 'топ-3 результат' })}</span>
        {mode === 'hnsw' && <span><i className="dot" style={{ background: 'var(--c-dist)' }} /> {t({ en: 'visited', uk: 'відвідано' })}</span>}
        {mode === 'hnsw' && <span><i className="dot" style={{ background: 'var(--c-danger)' }} /> {t({ en: 'false positive', uk: 'false positive' })}</span>}
        <span><i style={{ display:'inline-block', width:10, height:10, background:'var(--c-danger)', clipPath:'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }} />{' '}{t({ en: 'query', uk: 'query' })}</span>
      </div>

      <p className="sim-status sr-only" aria-live="polite" ref={liveRef}>{status}</p>
    </section>
  );
}

// ── Star polygon helper ────────────────────────────────────────────────────
function starPoints(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}
