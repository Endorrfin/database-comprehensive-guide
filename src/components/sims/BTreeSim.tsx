import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import type { BNode, Mode } from '../../lib/btree';
import {
  BOX_H,
  KEY_W,
  MAX,
  PAD,
  build,
  collectLeafLinks,
  collectNodes,
  firstLeaf,
  layout,
  leavesInOrder,
  searchPath,
  searchPathToLeaf,
  treeHeight,
} from '../../lib/btree';

/*
 * ★ B-Tree / B+Tree visualizer (golden centerpiece, M13).
 * The engine lives in src/lib/btree.ts (pure + unit-tested). This component drives it:
 * insert · search · range scan · play/pause/step · reduced-motion fallback · ARIA.
 */
const DEMO = [50, 30, 70, 20, 40, 60, 80, 35, 10, 45, 25, 65, 15, 55, 75];

const MSG: Record<string, Localized> = {
  empty: { en: 'Insert keys to build the index.', uk: 'Вставляйте ключі, щоб побудувати index.' },
  inserted: { en: 'Inserted', uk: 'Вставлено' },
  splitGrew: {
    en: '— its leaf was full, so it split and the tree grew a level.',
    uk: '— його leaf був повний, тож стався split і дерево виросло на level.',
  },
  split: { en: '— its leaf was full, so it split.', uk: '— його leaf був повний, тож стався split.' },
  placed: { en: '— placed with room to spare.', uk: '— розміщено, місце ще було.' },
  duplicate: { en: 'is already in the index (ignored).', uk: 'уже в index (проігноровано).' },
  found: { en: 'found — followed the path to its leaf.', uk: 'знайдено — пройдено шлях до його leaf.' },
  missing: { en: 'is not in the index.', uk: 'відсутній в index.' },
  rangeBplus: {
    en: 'Range scan: found the start leaf, then walked the linked leaves in order.',
    uk: 'Range scan: знайдено стартовий leaf, далі прохід звʼязаними leaves по порядку.',
  },
  rangeBtree: {
    en: 'Range scan in a B-Tree must re-traverse the tree — no leaf links to follow.',
    uk: 'Range scan у B-Tree мусить переобходити дерево — немає leaf links, щоб іти ними.',
  },
};

type Action =
  | { type: 'none' }
  | { type: 'insert'; key: number; outcome: 'grew' | 'split' | 'placed' | 'dup' }
  | { type: 'search'; key: number; found: boolean }
  | { type: 'range'; from: number; to: number };

export function BTreeSim() {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('bplus');
  const [keys, setKeys] = useState<number[]>([]);
  const [action, setAction] = useState<Action>({ type: 'none' });
  const [playing, setPlaying] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [reduced, setReduced] = useState(false);

  const [insertVal, setInsertVal] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [fromVal, setFromVal] = useState('25');
  const [toVal, setToVal] = useState('55');

  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const tree = useMemo(() => build(keys, mode), [keys, mode]);

  const doInsert = useCallback(
    (raw: number) => {
      if (!Number.isFinite(raw)) return;
      const key = Math.round(raw);
      setKeys((prev) => {
        if (prev.includes(key)) {
          setAction({ type: 'insert', key, outcome: 'dup' });
          return prev;
        }
        const before = build(prev, mode).root;
        const leaf = searchPathToLeaf(before, key);
        const willSplit = leaf.keys.length >= MAX;
        const next = [...prev, key];
        const grew = treeHeight(build(next, mode).root) > treeHeight(before);
        setAction({
          type: 'insert',
          key,
          outcome: willSplit ? (grew ? 'grew' : 'split') : 'placed',
        });
        return next;
      });
    },
    [mode],
  );

  useEffect(() => {
    if (!playing) return;
    if (demoIdx >= DEMO.length) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => {
      doInsert(DEMO[demoIdx]);
      setDemoIdx((i) => i + 1);
    }, 1050);
    return () => window.clearTimeout(id);
  }, [playing, demoIdx, doInsert]);

  const stepDemo = useCallback(() => {
    if (demoIdx >= DEMO.length) return;
    doInsert(DEMO[demoIdx]);
    setDemoIdx((i) => i + 1);
  }, [demoIdx, doInsert]);

  const reset = useCallback(() => {
    setPlaying(false);
    setDemoIdx(0);
    setKeys([]);
    setAction({ type: 'none' });
  }, []);

  const view = useMemo(() => {
    const pathIds = new Set<number>();
    const rangeLeafIds = new Set<number>();
    const rangeKeys = new Set<number>();
    if (action.type === 'insert' && action.outcome !== 'dup') {
      searchPath(tree.root, action.key, mode).path.forEach((id) => pathIds.add(id));
    } else if (action.type === 'search') {
      searchPath(tree.root, action.key, mode).path.forEach((id) => pathIds.add(id));
    } else if (action.type === 'range') {
      const { from, to } = action;
      const ordered = leavesInOrder(tree.root);
      if (mode === 'bplus') {
        let leaf: BNode | null = firstLeaf(tree.root);
        for (const lf of ordered) {
          const max = lf.keys[lf.keys.length - 1];
          if (max !== undefined && max >= from) {
            leaf = lf;
            break;
          }
        }
        while (leaf) {
          if (leaf.keys[0] !== undefined && leaf.keys[0] > to) break;
          rangeLeafIds.add(leaf.id);
          leaf.keys.forEach((k) => k >= from && k <= to && rangeKeys.add(k));
          leaf = leaf.next;
        }
      } else {
        for (const lf of ordered) {
          const lo = lf.keys[0];
          const hi = lf.keys[lf.keys.length - 1];
          if (lo !== undefined && hi !== undefined && hi >= from && lo <= to) {
            rangeLeafIds.add(lf.id);
            lf.keys.forEach((k) => k >= from && k <= to && rangeKeys.add(k));
          }
        }
      }
    }
    return { pathIds, rangeLeafIds, rangeKeys };
  }, [action, tree, mode]);

  const { pos, width, height } = useMemo(() => layout(tree.root), [tree]);
  const nodes = useMemo(() => collectNodes(tree.root), [tree]);
  const leafLinks = useMemo(
    () => (mode === 'bplus' ? collectLeafLinks(tree.root) : []),
    [tree, mode],
  );
  const status = useMemo(() => buildStatus(action, mode, t), [action, mode, t]);

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  return (
    <section className="sim btree-sim" aria-label="B-Tree and B+Tree visualizer">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Index type">
          <button
            role="tab"
            aria-selected={mode === 'btree'}
            className={mode === 'btree' ? 'seg-on' : ''}
            onClick={() => setMode('btree')}
          >
            B-Tree
          </button>
          <button
            role="tab"
            aria-selected={mode === 'bplus'}
            className={mode === 'bplus' ? 'seg-on' : ''}
            onClick={() => setMode('bplus')}
          >
            B+Tree
          </button>
        </div>

        <form
          className="sim-inline"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(insertVal);
            if (insertVal.trim() !== '' && Number.isFinite(n)) doInsert(n);
            setInsertVal('');
          }}
        >
          <input
            className="sim-num"
            inputMode="numeric"
            placeholder="key"
            aria-label="Key to insert"
            value={insertVal}
            onChange={(e) => setInsertVal(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Insert
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => doInsert(Math.floor(Math.random() * 99) + 1)}
          >
            Random
          </button>
        </form>
      </div>

      <div className="sim-bar">
        <div className="sim-inline" role="group" aria-label="Demo controls">
          {!reduced && (
            <button
              className="btn"
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={demoIdx >= DEMO.length}
            >
              {playing ? t(ui.pause) : t(ui.play)}
            </button>
          )}
          <button className="btn" type="button" onClick={stepDemo} disabled={demoIdx >= DEMO.length}>
            {t(ui.showStep)} ({Math.min(demoIdx + 1, DEMO.length)}/{DEMO.length})
          </button>
          <button className="btn btn-ghost" type="button" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>

        <form
          className="sim-inline"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(searchVal);
            if (searchVal.trim() !== '' && Number.isFinite(n)) {
              const r = searchPath(tree.root, Math.round(n), mode);
              setAction({ type: 'search', key: Math.round(n), found: r.found });
            }
          }}
        >
          <input
            className="sim-num"
            inputMode="numeric"
            placeholder="find"
            aria-label="Key to search"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          <button className="btn" type="submit">
            Find
          </button>
        </form>

        <form
          className="sim-inline"
          onSubmit={(e) => {
            e.preventDefault();
            const from = Number(fromVal);
            const to = Number(toVal);
            if (Number.isFinite(from) && Number.isFinite(to)) {
              setAction({ type: 'range', from: Math.min(from, to), to: Math.max(from, to) });
            }
          }}
        >
          <input
            className="sim-num sim-num--sm"
            inputMode="numeric"
            aria-label="Range from"
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
          />
          <span className="dim">→</span>
          <input
            className="sim-num sim-num--sm"
            inputMode="numeric"
            aria-label="Range to"
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
          />
          <button className="btn" type="submit">
            Range scan
          </button>
        </form>
      </div>

      <div className="sim-stage-wrap">
        {keys.length === 0 ? (
          <div className="sim-empty muted">{t(MSG.empty)}</div>
        ) : (
          <svg
            className="btree-svg"
            viewBox={`0 0 ${Math.max(width, 320)} ${height}`}
            width={Math.max(width, 320)}
            role="img"
            aria-label={`${mode === 'bplus' ? 'B+Tree' : 'B-Tree'}, ${keys.length} keys, height ${treeHeight(tree.root)}`}
          >
            {nodes.map((n) =>
              n.leaf
                ? null
                : n.children.map((c) => {
                    const p = pos.get(n.id);
                    const cp = pos.get(c.id);
                    if (!p || !cp) return null;
                    return (
                      <line
                        key={`${n.id}-${c.id}`}
                        x1={p.x}
                        y1={p.y + BOX_H}
                        x2={cp.x}
                        y2={cp.y}
                        stroke="var(--line2)"
                        strokeWidth="1.4"
                      />
                    );
                  }),
            )}

            {leafLinks.map(([a, b]) => {
              const pa = pos.get(a);
              const pb = pos.get(b);
              if (!pa || !pb) return null;
              return (
                <line
                  key={`lnk-${a}-${b}`}
                  x1={pa.x + pa.w / 2}
                  y1={pa.y + BOX_H / 2}
                  x2={pb.x - pb.w / 2}
                  y2={pb.y + BOX_H / 2}
                  stroke="var(--c-dist)"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                  markerEnd="url(#arrow)"
                />
              );
            })}
            <defs>
              <marker id="arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-dist)" />
              </marker>
            </defs>

            {nodes.map((n) => {
              const p = pos.get(n.id);
              if (!p) return null;
              const onPath = view.pathIds.has(n.id);
              const inRange = view.rangeLeafIds.has(n.id);
              const stroke = inRange
                ? 'var(--c-dist)'
                : onPath
                  ? 'var(--accent-bright)'
                  : n.leaf
                    ? 'var(--c-storage)'
                    : 'var(--line2)';
              const fill = inRange
                ? 'var(--c-dist-soft)'
                : n.leaf
                  ? 'var(--c-storage-soft)'
                  : 'var(--surface)';
              return (
                <g key={n.id}>
                  <rect
                    x={p.x - p.w / 2}
                    y={p.y}
                    width={p.w}
                    height={BOX_H}
                    rx="6"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={onPath || inRange ? 2.4 : 1.4}
                  />
                  {n.keys.map((k, i) => {
                    const kx = p.x - p.w / 2 + PAD + i * KEY_W + KEY_W / 2;
                    const hot = view.rangeKeys.has(k);
                    return (
                      <g key={k}>
                        {i > 0 && (
                          <line
                            x1={p.x - p.w / 2 + PAD + i * KEY_W}
                            y1={p.y + 5}
                            x2={p.x - p.w / 2 + PAD + i * KEY_W}
                            y2={p.y + BOX_H - 5}
                            stroke="var(--line)"
                            strokeWidth="1"
                          />
                        )}
                        <text
                          x={kx}
                          y={p.y + BOX_H / 2 + 4.5}
                          textAnchor="middle"
                          fontFamily="var(--font-mono)"
                          fontSize="13"
                          fontWeight={hot ? 700 : 400}
                          fill={hot ? 'var(--c-dist)' : 'var(--tx)'}
                        >
                          {k}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span>
          <i className="dot dot-leaf" /> leaf
        </span>
        <span>
          <i className="dot dot-internal" /> internal
        </span>
        <span>
          <i className="dot dot-path" /> search path
        </span>
        <span>
          <i className="dot dot-range" /> range scan
        </span>
        <span className="dim">max {MAX} keys / node</span>
      </div>
    </section>
  );
}

function buildStatus(action: Action, mode: Mode, t: (v: Localized) => string): string {
  switch (action.type) {
    case 'none':
      return t(MSG.empty);
    case 'insert':
      if (action.outcome === 'dup') return `${action.key} ${t(MSG.duplicate)}`;
      return `${t(MSG.inserted)} ${action.key} ${t(
        action.outcome === 'grew' ? MSG.splitGrew : action.outcome === 'split' ? MSG.split : MSG.placed,
      )}`;
    case 'search':
      return `${action.key}: ${action.found ? t(MSG.found) : `${action.key} ${t(MSG.missing)}`}`;
    case 'range':
      return `${action.from} → ${action.to}: ${t(mode === 'bplus' ? MSG.rangeBplus : MSG.rangeBtree)}`;
    default:
      return '';
  }
}
