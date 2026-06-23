/* Static diagram: anatomy of a single B-Tree node (keys as separators + child pointers). */
export function BTreeNodeAnatomy() {
  const keys = [17, 35, 64];
  const slots = keys.length + 1; // child pointers
  const nodeX = 70;
  const nodeY = 36;
  const nodeW = 420;
  const nodeH = 56;
  const cellW = nodeW / slots;

  // child pointer x positions sit on the cell boundaries / centers
  const childXs = Array.from({ length: slots }, (_, i) => nodeX + cellW * (i + 0.5));

  return (
    <svg
      viewBox="0 0 560 230"
      width="100%"
      role="img"
      aria-label="A B-Tree node holds sorted keys that act as separators between child pointers."
      style={{ maxWidth: 560 }}
    >
      <title>Anatomy of a B-Tree node</title>

      {/* the node box */}
      <rect
        x={nodeX}
        y={nodeY}
        width={nodeW}
        height={nodeH}
        rx="8"
        fill="var(--c-storage-soft)"
        stroke="var(--c-storage)"
        strokeWidth="1.5"
      />

      {/* key cells & separators */}
      {keys.map((k, i) => {
        const cx = nodeX + cellW * (i + 1);
        return (
          <g key={k}>
            <line
              x1={cx}
              y1={nodeY}
              x2={cx}
              y2={nodeY + nodeH}
              stroke="var(--c-storage)"
              strokeWidth="1.2"
              strokeOpacity="0.7"
            />
            <text
              x={cx}
              y={nodeY + nodeH / 2 + 5}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="16"
              fill="var(--tx)"
            >
              {k}
            </text>
          </g>
        );
      })}

      {/* child pointers */}
      {childXs.map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={nodeY + nodeH} r="4" fill="var(--accent)" />
          <line
            x1={cx}
            y1={nodeY + nodeH}
            x2={cx}
            y2={nodeY + nodeH + 46}
            stroke="var(--accent)"
            strokeWidth="1.6"
          />
          <rect
            x={cx - 26}
            y={nodeY + nodeH + 46}
            width="52"
            height="26"
            rx="5"
            fill="var(--s2)"
            stroke="var(--line2)"
          />
          <text
            x={cx}
            y={nodeY + nodeH + 63}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="12"
            fill="var(--tx2)"
          >
            p{i}
          </text>
        </g>
      ))}

      {/* labels */}
      <text x={nodeX} y={26} fontFamily="var(--font-body)" fontSize="12.5" fill="var(--c-storage)">
        sorted keys = separators
      </text>
      <text
        x={nodeX}
        y={nodeY + nodeH + 96}
        fontFamily="var(--font-body)"
        fontSize="12.5"
        fill="var(--accent)"
      >
        n keys → n+1 child pointers (one per key interval)
      </text>

      {/* interval hint */}
      <text
        x={childXs[0]}
        y={nodeY + nodeH + 92}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        fill="var(--tx3)"
      >
        &lt;17
      </text>
      <text
        x={childXs[childXs.length - 1]}
        y={nodeY + nodeH + 92}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        fill="var(--tx3)"
      >
        &gt;64
      </text>
    </svg>
  );
}
