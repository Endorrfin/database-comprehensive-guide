import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Localized } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';
import { cx } from '../../lib/utils';

/*
 * ★ LSM-tree compaction stepper (M15, signature). A fixed write workload walks the
 * write-optimized path: each write appends to the WAL and lands in the in-memory
 * memtable; a full memtable is frozen and FLUSHED as one immutable, sorted SSTable;
 * piled-up SSTables are COMPACTED — merge-sorted, newest version wins, tombstones
 * purged, dead space reclaimed; then two READS show the Bloom-filter skip. A toggle
 * (Leveled vs Size-tiered) drives the read/write/space amplification meters — the
 * RUM-conjecture trade. Deterministic, no engine; play/pause/step + reduced-motion
 * fallback + ARIA, mirroring BTreeSim / QueryLifecycleSim.
 * Facts: O'Neil et al. 1996 (LSM-tree); RUM conjecture (Athanassoulis et al., EDBT 2016);
 * RocksDB/LevelDB leveled default vs Cassandra size-tiered.
 */
type Cell = { k: string; v: string; tomb?: boolean };
type SSTable = { id: string; cells: Cell[] };
type Highlight = 'memtable' | 'flush' | 'compact' | 'read';
type ReadTrace = { key: string; steps: Localized; hit: string | null };

type Frame = {
  phase: Localized;
  note: Localized;
  memtable: Cell[];
  l0: SSTable[];
  l1: SSTable[];
  highlight?: Highlight;
  read?: ReadTrace;
};

const c = (k: string, v: string, tomb = false): Cell => ({ k, v, tomb });

const FRAMES: Frame[] = [
  {
    phase: { en: 'Empty', uk: 'Порожньо' },
    note: {
      en: 'Nothing written yet. Writes will buffer in the in-memory memtable; the on-disk SSTables stay immutable.',
      uk: 'Ще нічого не записано. Записи буферизуються в memtable у памʼяті; SSTables на диску лишаються immutable.',
    },
    memtable: [],
    l0: [],
    l1: [],
  },
  {
    phase: { en: 'Buffer writes', uk: 'Буферизація записів' },
    note: {
      en: 'put a=1, c=3, b=2. Each write appends to the WAL (durability) and inserts into the memtable, which stays sorted by key. Pure sequential I/O — no random page writes.',
      uk: 'put a=1, c=3, b=2. Кожен запис додається у WAL (durability) і вставляється в memtable, що тримається відсортованим за ключем. Суто послідовний I/O — без випадкових записів pages.',
    },
    memtable: [c('a', '1'), c('b', '2'), c('c', '3')],
    l0: [],
    l1: [],
    highlight: 'memtable',
  },
  {
    phase: { en: 'Memtable full', uk: 'Memtable заповнений' },
    note: {
      en: 'put d=4 fills the memtable to its capacity. Time to get it out of memory before it grows unbounded — but never with random in-place writes.',
      uk: 'put d=4 заповнює memtable до місткості. Час винести його з памʼяті, доки не розрісся — але ніколи випадковими записами на місці.',
    },
    memtable: [c('a', '1'), c('b', '2'), c('c', '3'), c('d', '4')],
    l0: [],
    l1: [],
    highlight: 'memtable',
  },
  {
    phase: { en: 'Flush → SSTable', uk: 'Flush → SSTable' },
    note: {
      en: 'The full memtable is frozen and flushed as one immutable, sorted SSTable at L0 — a single big sequential write. The memtable is cleared; new writes start fresh. An SSTable is never updated in place.',
      uk: 'Повний memtable заморожується й скидається як один immutable, відсортований SSTable на L0 — один великий послідовний запис. Memtable очищається; нові записи починаються з чистого. SSTable ніколи не оновлюється на місці.',
    },
    memtable: [],
    l0: [{ id: 'L0·1', cells: [c('a', '1'), c('b', '2'), c('c', '3'), c('d', '4')] }],
    l1: [],
    highlight: 'flush',
  },
  {
    phase: { en: 'Update & delete', uk: 'Оновлення й видалення' },
    note: {
      en: 'put a=9, del c, put e=5. Nothing is changed in place: a=9 is a new version, and deleting c writes a tombstone (⊘). The old a=1 and c=3 still sit in SSTable L0·1 — stale, not yet reclaimed.',
      uk: 'put a=9, del c, put e=5. Нічого не змінюється на місці: a=9 — нова версія, а видалення c пише tombstone (⊘). Старі a=1 і c=3 досі лежать у SSTable L0·1 — застарілі, ще не звільнені.',
    },
    memtable: [c('a', '9'), c('c', '', true), c('e', '5')],
    l0: [{ id: 'L0·1', cells: [c('a', '1'), c('b', '2'), c('c', '3'), c('d', '4')] }],
    l1: [],
    highlight: 'memtable',
  },
  {
    phase: { en: 'Second flush', uk: 'Другий flush' },
    note: {
      en: 'put f=6 fills and flushes a second SSTable, L0·2. L0 now holds two SSTables whose key ranges overlap — a read for a key might have to check both. That overlap is read amplification building up.',
      uk: 'put f=6 заповнює й скидає другий SSTable, L0·2. На L0 тепер два SSTables із перекривними діапазонами ключів — читання ключа може мусити перевірити обидва. Це перекриття — read amplification, що накопичується.',
    },
    memtable: [],
    l0: [
      { id: 'L0·1', cells: [c('a', '1'), c('b', '2'), c('c', '3'), c('d', '4')] },
      { id: 'L0·2', cells: [c('a', '9'), c('c', '', true), c('e', '5'), c('f', '6')] },
    ],
    l1: [],
    highlight: 'flush',
  },
  {
    phase: { en: 'Compaction', uk: 'Compaction' },
    note: {
      en: 'Compaction merge-sorts L0·1 + L0·2 into one L1 SSTable: the newest version of each key wins (a=9), the c tombstone cancels c and is purged, and the space for the dead versions is reclaimed. This background rewrite is exactly where write amplification comes from.',
      uk: 'Compaction merge-sort-ить L0·1 + L0·2 в один SSTable на L1: найновіша версія кожного ключа перемагає (a=9), tombstone c скасовує c і вичищається, а місце мертвих версій звільняється. Цей фоновий перезапис — саме звідки береться write amplification.',
    },
    memtable: [],
    l0: [],
    l1: [{ id: 'L1·1', cells: [c('a', '9'), c('b', '2'), c('d', '4'), c('e', '5'), c('f', '6')] }],
    highlight: 'compact',
  },
  {
    phase: { en: 'Read a present key', uk: 'Читання наявного ключа' },
    note: {
      en: 'get(b): check the memtable first (miss), then SSTables newest-first. Each SSTable carries a Bloom filter — a probabilistic membership test that says "definitely not here" (skip, no disk read) or "maybe" (look inside). L1·1 says "maybe" → found b=2.',
      uk: 'get(b): спершу перевіряємо memtable (промах), тоді SSTables від найновіших. Кожен SSTable несе Bloom filter — імовірнісний тест належності, що каже «точно нема» (пропустити, без читання диска) або «можливо» (зазирнути). L1·1 каже «можливо» → знайдено b=2.',
    },
    memtable: [],
    l0: [],
    l1: [{ id: 'L1·1', cells: [c('a', '9'), c('b', '2'), c('d', '4'), c('e', '5'), c('f', '6')] }],
    highlight: 'read',
    read: {
      key: 'b',
      steps: {
        en: 'memtable: miss → L1·1 Bloom: maybe → read block → hit',
        uk: 'memtable: промах → L1·1 Bloom: можливо → читаємо блок → влучання',
      },
      hit: 'b = 2',
    },
  },
  {
    phase: { en: 'Read an absent key', uk: 'Читання відсутнього ключа' },
    note: {
      en: 'get(z): the memtable misses, and every SSTable Bloom filter answers "definitely not here", so the engine skips them all without a single disk read. Bloom filters turn the worst case — looking everywhere for a key that does not exist — into an instant miss. This is what makes LSM reads viable.',
      uk: 'get(z): memtable промахується, і кожен Bloom filter SSTable відповідає «точно нема», тож движок пропускає їх усі без жодного читання диска. Bloom filters перетворюють найгірший випадок — шукати всюди ключ, якого немає — на миттєвий промах. Саме це робить читання LSM життєздатним.',
    },
    memtable: [],
    l0: [],
    l1: [{ id: 'L1·1', cells: [c('a', '9'), c('b', '2'), c('d', '4'), c('e', '5'), c('f', '6')] }],
    highlight: 'read',
    read: {
      key: 'z',
      steps: {
        en: 'memtable: miss → L1·1 Bloom: no → skip → fast miss (0 disk reads)',
        uk: 'memtable: промах → L1·1 Bloom: ні → пропустити → швидкий промах (0 читань диска)',
      },
      hit: null,
    },
  },
];

type Strategy = 'leveled' | 'tiered';
type Amp = { write: number; read: number; space: number };
const PROFILE: Record<Strategy, Amp> = {
  leveled: { write: 85, read: 35, space: 22 },
  tiered: { write: 32, read: 62, space: 72 },
};
function ampWord(v: number): Localized {
  if (v < 40) return { en: 'low', uk: 'низька' };
  if (v < 70) return { en: 'medium', uk: 'середня' };
  return { en: 'high', uk: 'висока' };
}

function MemCell({ cell }: { cell: Cell }) {
  return (
    <span className={cx('lsm-cell', cell.tomb && 'lsm-cell--tomb')}>
      {cell.k}
      {cell.tomb ? ' ⊘' : `:${cell.v}`}
    </span>
  );
}

export function LsmSim() {
  const { t } = useLang();
  const [idx, setIdx] = useState(0);
  const [strategy, setStrategy] = useState<Strategy>('leveled');
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const atEnd = idx >= FRAMES.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setIdx((i) => Math.min(i + 1, FRAMES.length - 1)), 1500);
    return () => window.clearTimeout(id);
  }, [playing, atEnd, idx]);

  const step = useCallback(() => setIdx((i) => Math.min(i + 1, FRAMES.length - 1)), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIdx(0);
  }, []);

  const frame = FRAMES[idx];
  const amp = PROFILE[strategy];

  const status = useMemo(() => {
    return `${idx + 1}/${FRAMES.length} · ${t(frame.phase)} — ${t(frame.note)}`;
  }, [idx, frame, t]);

  useEffect(() => {
    if (liveRef.current) liveRef.current.textContent = status;
  }, [status]);

  const ampRows: { label: Localized; value: number; tone: string }[] = [
    { label: { en: 'Write amplification', uk: 'Write amplification' }, value: amp.write, tone: 'var(--c-danger)' },
    { label: { en: 'Read amplification', uk: 'Read amplification' }, value: amp.read, tone: 'var(--c-query)' },
    { label: { en: 'Space amplification', uk: 'Space amplification' }, value: amp.space, tone: 'var(--c-analytics)' },
  ];

  return (
    <section className="sim lsm" aria-label="LSM-tree compaction stepper">
      <div className="sim-bar">
        <div className="seg" role="tablist" aria-label="Compaction strategy">
          <button
            role="tab"
            aria-selected={strategy === 'leveled'}
            className={strategy === 'leveled' ? 'seg-on' : ''}
            onClick={() => setStrategy('leveled')}
          >
            {t({ en: 'Leveled', uk: 'Leveled' })}
          </button>
          <button
            role="tab"
            aria-selected={strategy === 'tiered'}
            className={strategy === 'tiered' ? 'seg-on' : ''}
            onClick={() => setStrategy('tiered')}
          >
            {t({ en: 'Size-tiered', uk: 'Size-tiered' })}
          </button>
        </div>

        <div className="sim-inline" role="group" aria-label="Playback">
          {!reduced && (
            <button className="btn" type="button" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
              {playing ? t(ui.pause) : t(ui.play)}
            </button>
          )}
          <button className="btn" type="button" onClick={step} disabled={atEnd}>
            {t(ui.showStep)} ({idx + 1}/{FRAMES.length})
          </button>
          <button className="btn btn-ghost" type="button" onClick={reset}>
            {t(ui.reset)}
          </button>
        </div>
      </div>

      <div className="lsm-body">
        <div className="lsm-store">
          {/* Memtable (RAM) */}
          <div className={cx('lsm-lane', frame.highlight === 'memtable' && 'lsm-lane--hot')}>
            <div className="lsm-lane-head">
              <span className="lsm-lane-name" style={{ color: 'var(--c-query)' }}>
                {t({ en: 'memtable', uk: 'memtable' })}
              </span>
              <span className="lsm-lane-tag dim">{t({ en: 'in RAM · sorted · mutable', uk: 'у RAM · сортований · змінний' })}</span>
            </div>
            <div className="lsm-mem" style={{ ['--lane' as string]: 'var(--c-query)' }}>
              {frame.memtable.length === 0 ? (
                <span className="lsm-empty dim">{t({ en: 'empty', uk: 'порожньо' })}</span>
              ) : (
                frame.memtable.map((cell) => <MemCell key={cell.k} cell={cell} />)
              )}
            </div>
          </div>

          {/* Disk: L0 + L1 */}
          <div className={cx('lsm-lane', (frame.highlight === 'flush' || frame.highlight === 'compact') && 'lsm-lane--hot')}>
            <div className="lsm-lane-head">
              <span className="lsm-lane-name" style={{ color: 'var(--c-storage)' }}>
                {t({ en: 'SSTables on disk', uk: 'SSTables на диску' })}
              </span>
              <span className="lsm-lane-tag dim">{t({ en: 'immutable · sorted · Bloom-filtered', uk: 'immutable · сортовані · з Bloom-filter' })}</span>
            </div>
            <div className="lsm-levels">
              <div className="lsm-level">
                <span className="lsm-level-name mono">L0</span>
                <div className="lsm-tables">
                  {frame.l0.length === 0 ? (
                    <span className="lsm-empty dim">—</span>
                  ) : (
                    frame.l0.map((s) => (
                      <div key={s.id} className="lsm-sst" style={{ ['--lane' as string]: 'var(--c-storage)' }}>
                        <span className="lsm-sst-id mono">{s.id}</span>
                        <span className="lsm-sst-cells">
                          {s.cells.map((cell) => (
                            <MemCell key={cell.k} cell={cell} />
                          ))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="lsm-level">
                <span className="lsm-level-name mono">L1</span>
                <div className="lsm-tables">
                  {frame.l1.length === 0 ? (
                    <span className="lsm-empty dim">—</span>
                  ) : (
                    frame.l1.map((s) => (
                      <div key={s.id} className="lsm-sst lsm-sst--merged" style={{ ['--lane' as string]: 'var(--c-storage)' }}>
                        <span className="lsm-sst-id mono">{s.id}</span>
                        <span className="lsm-sst-cells">
                          {s.cells.map((cell) => (
                            <MemCell key={cell.k} cell={cell} />
                          ))}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Read trace */}
          {frame.read && (
            <div className="lsm-read" role="status">
              <span className="lsm-read-q mono">get({frame.read.key})</span>
              <span className="lsm-read-steps mono dim">{t(frame.read.steps)}</span>
              <span className={cx('lsm-read-out mono', frame.read.hit ? 'ok' : 'miss')}>
                {frame.read.hit ?? t({ en: 'not found', uk: 'не знайдено' })}
              </span>
            </div>
          )}
        </div>

        {/* Amplification triangle */}
        <aside className="lsm-amp" aria-label="Amplification profile">
          <div className="lsm-amp-head dim">
            {t({ en: 'Amplification — pick two', uk: 'Amplification — оберіть дві' })}
          </div>
          {ampRows.map((r) => (
            <div className="lsm-amp-row" key={r.label.en}>
              <div className="lsm-amp-label">
                <span>{t(r.label)}</span>
                <span className="lsm-amp-word" style={{ color: r.tone }}>
                  {t(ampWord(r.value))}
                </span>
              </div>
              <div className="lsm-amp-track" aria-hidden="true">
                <div className="lsm-amp-fill" style={{ width: `${r.value}%`, background: r.tone }} />
              </div>
            </div>
          ))}
          <p className="lsm-amp-foot dim">
            {strategy === 'leveled'
              ? t({
                  en: 'Leveled (RocksDB/LevelDB default): rewrites data down the levels → high write cost, but tight space and predictable reads.',
                  uk: 'Leveled (дефолт RocksDB/LevelDB): переписує дані вниз по рівнях → висока вартість запису, зате щільне сховище й передбачувані читання.',
                })
              : t({
                  en: "Size-tiered (Cassandra's default): merges only when similar-sized SSTables pile up → cheap writes, but more overlapping tables to read and dead versions kept longer.",
                  uk: 'Size-tiered (дефолт Cassandra): зливає лише коли назбирується кілька SSTables схожого розміру → дешеві записи, зате більше перекривних таблиць для читання й довше живуть мертві версії.',
                })}
          </p>
        </aside>
      </div>

      <p className="sim-status" aria-live="polite" ref={liveRef}>
        {status}
      </p>

      <div className="sim-legend muted">
        <span>
          <span className="lsm-key">⊘</span> {t({ en: 'tombstone (delete marker)', uk: 'tombstone (маркер видалення)' })}
        </span>
        <span className="dim">
          {t({ en: 'click Step to advance the workload', uk: 'натискайте Крок, щоб просувати навантаження' })}
        </span>
      </div>
    </section>
  );
}
