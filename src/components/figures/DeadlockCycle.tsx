/*
 * Static diagram (M19, pre-built in S9 for S10): a deadlock as a wait-for cycle. T1 holds a lock on
 * row A and waits for row B; T2 holds row B and waits for row A. Neither can proceed — the wait-for
 * graph has a cycle. PostgreSQL waits deadlock_timeout (default 1s) before running the (expensive)
 * detector; when it finds the cycle it rolls back one transaction (the victim) with ERROR: deadlock
 * detected (SQLSTATE 40P01), and the application should retry. MVCC readers never block, so only
 * writers taking row locks in different orders deadlock. "holds" = commit-green; "waits for" =
 * danger-red dashed; the cycle badge is danger-red. Labels stay English.
 * Facts: postgresql.org/docs/current/explicit-locking.html (Deadlocks) + runtime-config-locks.html
 * (deadlock_timeout default 1s) + errcodes-appendix.html (40P01 deadlock_detected).
 */
export function DeadlockCycle() {
  return (
    <svg
      viewBox="0 0 660 330"
      width="100%"
      role="img"
      aria-label="A deadlock drawn as a wait-for cycle. Transaction T1 (top left) holds a lock on row A (bottom left) and waits for row B. Transaction T2 (top right) holds a lock on row B (bottom right) and waits for row A. The two 'waits for' arrows cross in the middle, forming a cycle in the wait-for graph that neither transaction can escape. A central badge reads DEADLOCK, wait-for cycle. The footer explains that PostgreSQL waits for deadlock_timeout, default one second, then the detector rolls back one transaction as the victim with the error deadlock detected, SQLSTATE 40P01, and the application should retry."
      style={{ maxWidth: 660 }}
    >
      <title>A deadlock is a cycle in the wait-for graph; PostgreSQL aborts one transaction (40P01)</title>

      <defs>
        <marker id="dl-holds" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-commit)" />
        </marker>
        <marker id="dl-waits" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-danger)" />
        </marker>
      </defs>

      {/* T1 / T2 transaction nodes */}
      <rect x={40} y={34} width={170} height={54} rx="9" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1.5" />
      <text x={125} y={58} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight={700} fill="var(--accent-bright)">
        T1
      </text>
      <text x={125} y={76} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx2)">
        UPDATE row A, then row B
      </text>

      <rect x={450} y={34} width={170} height={54} rx="9" fill="var(--c-dist-soft)" stroke="var(--c-dist)" strokeWidth="1.5" />
      <text x={535} y={58} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight={700} fill="var(--c-dist)">
        T2
      </text>
      <text x={535} y={76} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx2)">
        UPDATE row B, then row A
      </text>

      {/* row A / row B lock nodes */}
      <rect x={40} y={214} width={170} height={54} rx="9" fill="var(--surface)" stroke="var(--c-commit)" strokeWidth="1.3" />
      <text x={125} y={238} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill="var(--c-commit)">
        row A
      </text>
      <text x={125} y={255} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9" fill="var(--tx3)">
        row lock held by T1
      </text>

      <rect x={450} y={214} width={170} height={54} rx="9" fill="var(--surface)" stroke="var(--c-commit)" strokeWidth="1.3" />
      <text x={535} y={238} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fontWeight={700} fill="var(--c-commit)">
        row B
      </text>
      <text x={535} y={255} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9" fill="var(--tx3)">
        row lock held by T2
      </text>

      {/* holds (solid green, vertical) */}
      <line x1={90} y1={88} x2={90} y2={214} stroke="var(--c-commit)" strokeWidth="1.6" markerEnd="url(#dl-holds)" />
      <text x={82} y={155} textAnchor="end" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--c-commit)">
        holds
      </text>
      <line x1={570} y1={88} x2={570} y2={214} stroke="var(--c-commit)" strokeWidth="1.6" markerEnd="url(#dl-holds)" />
      <text x={578} y={155} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--c-commit)">
        holds
      </text>

      {/* waits for (dashed red, crossing diagonals → the cycle) */}
      <line x1={185} y1={88} x2={470} y2={214} stroke="var(--c-danger)" strokeWidth="1.6" strokeDasharray="5 3" markerEnd="url(#dl-waits)" />
      <line x1={475} y1={88} x2={190} y2={214} stroke="var(--c-danger)" strokeWidth="1.6" strokeDasharray="5 3" markerEnd="url(#dl-waits)" />
      <text x={214} y={120} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--c-danger)">
        waits for row B
      </text>
      <text x={446} y={120} textAnchor="end" fontFamily="var(--font-body)" fontSize="9.5" fill="var(--c-danger)">
        waits for row A
      </text>

      {/* center DEADLOCK badge (sits on the crossing of the two waits-for arrows) */}
      <rect x={262} y={130} width={136} height={42} rx="9" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.6" />
      <text x={330} y={148} textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight={700} fill="var(--c-danger)">
        DEADLOCK
      </text>
      <text x={330} y={163} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9" fill="var(--c-danger)">
        wait-for cycle
      </text>

      {/* footer resolution rule */}
      <rect x={40} y={284} width={580} height={42} rx="8" fill="var(--s2)" stroke="var(--line2)" />
      <text x={56} y={303} fontFamily="var(--font-body)" fontSize="10.5" fill="var(--tx2)">
        <tspan fill="var(--accent-bright)" fontWeight={700}>deadlock_timeout (default 1s)</tspan>
        <tspan> → the detector finds the cycle and rolls back one transaction (the victim):</tspan>
      </text>
      <text x={56} y={318} fontFamily="var(--font-mono)" fontSize="10" fill="var(--c-danger)">
        ERROR: deadlock detected
        <tspan fontFamily="var(--font-body)" fill="var(--tx3)"> (SQLSTATE 40P01) — the app should retry. Lock rows in a consistent order to avoid it.</tspan>
      </text>
    </svg>
  );
}
