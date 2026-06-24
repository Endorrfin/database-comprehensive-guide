/*
 * Static diagram (M20): a saga with compensation. A long transaction is split into a sequence of
 * local transactions T1 → T2 → T3, each committing in its own service (forward path, commit green).
 * If a later step fails (T3, danger red ✕), the saga runs COMPENSATING transactions backward — C2,
 * then C1 (amber) — to semantically undo the committed steps. A compensation is not a rollback: the
 * original step already committed and was visible, so the compensation is a NEW business action (a
 * refund, a cancellation) that must itself be idempotent. Forward = commit green; failure = danger
 * red; compensation = analytics amber. Labels English.
 * Facts: Garcia-Molina & Salem, "Sagas", ACM SIGMOD 1987; microservices.io Saga pattern.
 */
export function SagaCompensation() {
  return (
    <svg
      viewBox="0 0 700 330"
      width="100%"
      role="img"
      aria-label="A saga with compensation. Across the top, three local-transaction boxes in commit green: T1 reserve, then T2 charge, then T3 ship, joined by forward arrows. T3 carries a danger-red badge meaning the step fails. Below, two amber compensation boxes: under T2, C2 refund; under T1, C1 release. Amber dashed arrows run backward from the failure, C2 then C1, undoing the committed steps in reverse order. A footer explains: the forward path commits each local transaction; on failure, compensations run backward; a compensation is a new business action like a refund, not a rollback, and every step and compensation must be idempotent. Orchestration uses a central coordinator; choreography uses events."
      style={{ maxWidth: 700 }}
    >
      <title>A saga: local transactions forward, compensating transactions backward on failure</title>

      <defs>
        <marker id="sg-green" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-commit)" />
        </marker>
        <marker id="sg-amber" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-analytics)" />
        </marker>
      </defs>

      {/* Forward path — T1, T2, T3 */}
      {[
        { x: 30, t: 'T1', sub: 'reserve', svc: 'Order svc' },
        { x: 270, t: 'T2', sub: 'charge', svc: 'Payment svc' },
        { x: 510, t: 'T3', sub: 'ship', svc: 'Shipping svc' },
      ].map((s, i) => (
        <g key={s.t}>
          <rect
            x={s.x}
            y={48}
            width={160}
            height={64}
            rx="9"
            fill="var(--c-commit-soft)"
            stroke={i === 2 ? 'var(--c-danger)' : 'var(--c-commit)'}
            strokeWidth="1.5"
          />
          <text x={s.x + 80} y={72} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight={700} fill={i === 2 ? 'var(--c-danger)' : 'var(--c-commit)'}>
            {s.t} · {s.sub}
          </text>
          <text x={s.x + 80} y={92} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9" fill="var(--tx3)">
            local txn — {s.svc}
          </text>
        </g>
      ))}

      {/* forward arrows (green) */}
      <line x1={190} y1={80} x2={268} y2={80} stroke="var(--c-commit)" strokeWidth="1.7" markerEnd="url(#sg-green)" />
      <line x1={430} y1={80} x2={508} y2={80} stroke="var(--c-commit)" strokeWidth="1.7" markerEnd="url(#sg-green)" />
      <text x={229} y={72} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        event / command
      </text>
      <text x={469} y={72} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        event / command
      </text>

      {/* failure badge on T3 */}
      <rect x={556} y={26} width={68} height={20} rx="6" fill="var(--c-danger-soft)" stroke="var(--c-danger)" strokeWidth="1.2" />
      <text x={590} y={40} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9.5" fontWeight={700} fill="var(--c-danger)">
        ✕ fails
      </text>

      {/* vertical connectors T1↕C1, T2↕C2 */}
      <line x1={110} y1={112} x2={110} y2={186} stroke="var(--line2)" strokeWidth="1.2" strokeDasharray="3 3" />
      <line x1={350} y1={112} x2={350} y2={186} stroke="var(--line2)" strokeWidth="1.2" strokeDasharray="3 3" />

      {/* Compensation path — C2, C1 (amber) */}
      {[
        { x: 30, t: 'C1', sub: 'release', svc: 'undo reserve' },
        { x: 270, t: 'C2', sub: 'refund', svc: 'undo charge' },
      ].map((s) => (
        <g key={s.t}>
          <rect x={s.x} y={188} width={160} height={62} rx="9" fill="var(--c-analytics-soft)" stroke="var(--c-analytics)" strokeWidth="1.4" strokeDasharray="5 3" />
          <text x={s.x + 80} y={212} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12.5" fontWeight={700} fill="var(--c-analytics)">
            {s.t} · {s.sub}
          </text>
          <text x={s.x + 80} y={231} textAnchor="middle" fontFamily="var(--font-body)" fontSize="9" fill="var(--tx3)">
            compensate — {s.svc}
          </text>
        </g>
      ))}

      {/* compensation arrows backward (amber): from failure → C2 → C1 */}
      <line x1={540} y1={219} x2={432} y2={219} stroke="var(--c-analytics)" strokeWidth="1.7" strokeDasharray="5 3" markerEnd="url(#sg-amber)" />
      <line x1={268} y1={219} x2={192} y2={219} stroke="var(--c-analytics)" strokeWidth="1.7" strokeDasharray="5 3" markerEnd="url(#sg-amber)" />
      <text x={500} y={211} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--c-analytics)">
        compensate backward
      </text>

      {/* Footer */}
      <rect x={30} y={268} width={640} height={46} rx="8" fill="var(--s2)" stroke="var(--line2)" />
      <text x={46} y={286} fontFamily="var(--font-body)" fontSize="10" fill="var(--tx2)">
        <tspan fill="var(--c-commit)" fontWeight={700}>Forward:</tspan>
        <tspan> each local txn commits. </tspan>
        <tspan fill="var(--c-analytics)" fontWeight={700}>On failure:</tspan>
        <tspan> run compensations backward — a refund, not a rollback (the step was already visible).</tspan>
      </text>
      <text x={46} y={302} fontFamily="var(--font-body)" fontSize="9.5" fill="var(--tx3)">
        No isolation — others can see intermediate state (use semantic locks). Every step &amp; compensation must be idempotent.
      </text>
    </svg>
  );
}
