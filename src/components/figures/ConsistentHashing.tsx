// CHANGED (S11): M22 — Consistent hashing ring figure (static EN labels like all existing figures).
export function ConsistentHashing() {
  // Ring geometry
  const cx = 200, cy = 160, r = 110;
  // Node positions (angles: 0 = top, clockwise)
  const nodes = [
    { angle: 0,   label: 'N1', color: 'var(--c-query)' },
    { angle: 120, label: 'N2', color: 'var(--c-cyan)' },
    { angle: 240, label: 'N3', color: 'var(--c-commit)' },
  ];
  // Keys between nodes, owned by next clockwise node
  const keys = [
    { angle: 40,  label: 'K1', owner: 1 },
    { angle: 80,  label: 'K2', owner: 1 },
    { angle: 150, label: 'K3', owner: 2 },
    { angle: 195, label: 'K4', owner: 2 },
    { angle: 270, label: 'K5', owner: 0 },
    { angle: 330, label: 'K6', owner: 0 },
  ];

  function polarXY(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const nodeColors = nodes.map(n => n.color);

  return (
    <svg
      viewBox="0 0 580 330"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Consistent hashing ring: N1, N2, N3 placed on a circle. Keys K1-K6 are assigned to the nearest clockwise node. An inset shows adding N4 moves only the keys in its clockwise arc."
      role="img"
      className="fig-svg"
    >
      <title>Consistent hashing ring — minimal key movement when adding a node</title>

      {/* ── Ring ─────────────────────────────────────────────────────── */}
      <circle cx={cx} cy={cy} r={r}
        fill="none" stroke="var(--line2)" strokeWidth="2" />

      {/* ── Key dots & labels ─────────────────────────────────────────── */}
      {keys.map(k => {
        const pos = polarXY(k.angle, r);
        const lPos = polarXY(k.angle, r + 18);
        const nodeColor = nodeColors[k.owner];
        return (
          <g key={k.label}>
            <circle cx={pos.x} cy={pos.y} r="5" fill={nodeColor} opacity="0.6" />
            <text x={lPos.x} y={lPos.y + 4} textAnchor="middle"
              fill={nodeColor} fontSize="10" fontFamily="var(--font-mono)"
              opacity="0.85">{k.label}</text>
          </g>
        );
      })}

      {/* ── Ownership arcs (colored sectors per owner) ────────────────── */}
      {nodes.map((node, ni) => {
        const nextNi = (ni + 1) % nodes.length;
        const startAngle = node.angle;
        const endAngle = nodes[nextNi].angle;
        const spanDeg = ((endAngle - startAngle) + 360) % 360;
        const arcR = r - 18;

        const startRad = ((startAngle - 90) * Math.PI) / 180;
        const endRad = ((startAngle + spanDeg - 90) * Math.PI) / 180;

        const x1 = cx + arcR * Math.cos(startRad);
        const y1 = cy + arcR * Math.sin(startRad);
        const x2 = cx + arcR * Math.cos(endRad);
        const y2 = cy + arcR * Math.sin(endRad);

        const largeArc = spanDeg > 180 ? 1 : 0;
        const ownerColor = nodeColors[nextNi];

        return (
          <path
            key={ni}
            d={`M${x1},${y1} A${arcR},${arcR} 0 ${largeArc},1 ${x2},${y2}`}
            fill="none"
            stroke={ownerColor}
            strokeWidth="6"
            strokeOpacity="0.22"
          />
        );
      })}

      {/* ── Node circles ─────────────────────────────────────────────── */}
      {nodes.map(n => {
        const pos = polarXY(n.angle, r);
        return (
          <g key={n.label}>
            <circle cx={pos.x} cy={pos.y} r="18"
              fill="var(--s2)" stroke={n.color} strokeWidth="2.5" />
            <text x={pos.x} y={pos.y + 5} textAnchor="middle"
              fill={n.color} fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">
              {n.label}
            </text>
          </g>
        );
      })}

      {/* ── Centre label ─────────────────────────────────────────────── */}
      <text x={cx} y={cy - 8} textAnchor="middle"
        fill="var(--tx3)" fontSize="11" fontFamily="var(--font-sans)">
        hash ring
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        fill="var(--tx3)" fontSize="10" fontFamily="var(--font-sans)">
        key → nearest clockwise node
      </text>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <text x="28" y="295" fill="var(--tx3)" fontSize="10" fontFamily="var(--font-sans)">
        Colored dot = key  ·  Color = owner node
      </text>

      {/* ── Inset: Adding N4 ──────────────────────────────────────────── */}
      <rect x="420" y="20" width="150" height="200" rx="8"
        fill="var(--surface)" stroke="var(--c-amber)" strokeWidth="1.5" />
      <text x="495" y="40" textAnchor="middle"
        fill="var(--c-amber)" fontSize="11" fontWeight="700" fontFamily="var(--font-sans)">
        Add N4 (at 60°)
      </text>

      {/* Small ring in inset */}
      <circle cx="495" cy="130" r="55"
        fill="none" stroke="var(--line2)" strokeWidth="1.5" />

      {(() => {
        const icx = 495, icy = 130, ir = 40;
        function ixy(a: number) {
          const rad = ((a - 90) * Math.PI) / 180;
          return { x: icx + ir * Math.cos(rad), y: icy + ir * Math.sin(rad) };
        }

        const n4r = ((60 - 90) * Math.PI) / 180;
        const n2r = ((120 - 90) * Math.PI) / 180;
        const n1r = ((0 - 90) * Math.PI) / 180;
        const n3r = ((240 - 90) * Math.PI) / 180;

        const n4x = icx + ir * Math.cos(n4r), n4y = icy + ir * Math.sin(n4r);
        const n2x = icx + ir * Math.cos(n2r), n2y = icy + ir * Math.sin(n2r);
        const n1x = icx + ir * Math.cos(n1r), n1y = icy + ir * Math.sin(n1r);
        const n3x = icx + ir * Math.cos(n3r), n3y = icy + ir * Math.sin(n3r);

        return (
          <g>
            {/* Existing full arcs (dimmed) */}
            <path d={`M${n1x},${n1y} A${ir},${ir} 0 0,1 ${n2x},${n2y}`}
              fill="none" stroke="var(--c-commit)" strokeWidth="5" strokeOpacity="0.25" />
            <path d={`M${n2x},${n2y} A${ir},${ir} 0 0,1 ${n3x},${n3y}`}
              fill="none" stroke="var(--c-cyan)" strokeWidth="5" strokeOpacity="0.25" />
            <path d={`M${n3x},${n3y} A${ir},${ir} 0 1,1 ${n1x},${n1y}`}
              fill="none" stroke="var(--c-query)" strokeWidth="5" strokeOpacity="0.25" />

            {/* Affected arc N4→N2 (amber — keys that move to N4) */}
            <path d={`M${n4x},${n4y} A${ir},${ir} 0 0,1 ${n2x},${n2y}`}
              fill="none" stroke="var(--c-amber)" strokeWidth="6" strokeOpacity="0.7" />

            {/* Existing nodes */}
            {[{a:0,l:'N1',c:'var(--c-query)'},{a:120,l:'N2',c:'var(--c-cyan)'},{a:240,l:'N3',c:'var(--c-commit)'}].map(n => {
              const { x: px, y: py } = ixy(n.a);
              return (
                <g key={n.l}>
                  <circle cx={px} cy={py} r="12" fill="var(--s2)" stroke={n.c} strokeWidth="2" />
                  <text x={px} y={py + 4} textAnchor="middle"
                    fill={n.c} fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                    {n.l}
                  </text>
                </g>
              );
            })}

            {/* N4 (new) */}
            <circle cx={n4x} cy={n4y} r="12"
              fill="var(--s2)" stroke="var(--c-amber)" strokeWidth="2.5" />
            <text x={n4x} y={n4y + 4} textAnchor="middle"
              fill="var(--c-amber)" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
              N4
            </text>
          </g>
        );
      })()}

      {/* Inset legend */}
      <rect x="432" y="188" width="126" height="26" rx="4"
        fill="var(--c-amber)" fillOpacity="0.12" />
      <text x="495" y="202" textAnchor="middle"
        fill="var(--c-amber)" fontSize="10" fontFamily="var(--font-sans)">
        only K/N keys move
      </text>
      <text x="495" y="213" textAnchor="middle"
        fill="var(--tx3)" fontSize="9.5" fontFamily="var(--font-sans)">
        (amber arc keys → N4)
      </text>

      <text x="495" y="232" textAnchor="middle"
        fill="var(--tx3)" fontSize="10" fontFamily="var(--font-sans)">
        vs mod N: ~75% move
      </text>
    </svg>
  );
}
