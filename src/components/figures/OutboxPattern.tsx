/*
 * Static diagram (M20): the transactional outbox. The dual-write problem — a service must update its
 * database AND publish an event, with no shared transaction — is solved by writing the business row
 * and an event row into an OUTBOX table in the SAME local transaction (atomic by construction). A
 * separate message relay then publishes the outbox rows to the broker, either by polling the table or
 * by tailing the WAL via logical decoding (CDC, e.g. Debezium). Because the relay can publish more
 * than once (at-least-once), the consumer must be idempotent. LISTEN/NOTIFY is transient and not a
 * durable substitute. business row = storage violet; outbox/event = commit green; relay/broker =
 * dist cyan; consumer = query blue. Labels English.
 * Facts: microservices.io Transactional Outbox / Polling Publisher / Transaction Log Tailing.
 */
export function OutboxPattern() {
  return (
    <svg
      viewBox="0 0 700 320"
      width="100%"
      role="img"
      aria-label="The transactional outbox pattern. On the left, a tall box: Service plus PostgreSQL. Inside it, one local transaction, drawn as a BEGIN-to-COMMIT bracket, contains two row chips written together: an 'orders' business row in storage violet and an 'outbox' event row in commit green. A label reads: step one, one local transaction, atomic. On the right, a vertical pipeline of three boxes in cyan and blue: a Message Relay at top (reads the outbox by polling, or tails the WAL via logical decoding / CDC such as Debezium); below it a Message broker, Kafka; and below that a Consumer that is idempotent and deduplicates by key. A cyan arrow runs from the outbox row to the relay (step two, read outbox or tail WAL), then down to the broker (step three, publish, at-least-once), then to the consumer (step four, deliver). A footer notes: the event is committed in the same transaction as the data, so it exists if and only if the data does; the relay delivers at-least-once, so the consumer must be idempotent; LISTEN/NOTIFY is not a durable substitute."
      style={{ maxWidth: 700 }}
    >
      <title>The transactional outbox: write the event in the same local transaction, then relay it</title>

      <defs>
        <marker id="ob-cyan" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--c-dist)" />
        </marker>
      </defs>

      {/* Service + PostgreSQL (left, tall) */}
      <rect x={20} y={36} width={262} height={232} rx="10" fill="var(--surface)" stroke="var(--line2)" strokeWidth="1.4" />
      <text x={151} y={58} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11.5" fontWeight={700} fill="var(--tx)">
        Service + PostgreSQL
      </text>

      {/* one local transaction bracket */}
      <rect x={38} y={72} width={226} height={180} rx="8" fill="var(--c-commit-soft)" stroke="var(--c-commit)" strokeWidth="1.4" />
      <text x={151} y={90} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight={700} fill="var(--c-commit)">
        ① ONE local transaction (atomic)
      </text>
      <text x={52} y={108} fontFamily="var(--font-mono)" fontSize="9" fill="var(--tx3)">
        BEGIN;
      </text>

      {/* business row chip */}
      <rect x={52} y={118} width={198} height={42} rx="6" fill="var(--bg)" stroke="var(--c-storage)" strokeWidth="1.3" />
      <text x={64} y={136} fontFamily="var(--font-mono)" fontSize="10" fontWeight={700} fill="var(--c-storage)">
        orders
      </text>
      <text x={64} y={150} fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        business row (the real change)
      </text>

      {/* outbox row chip */}
      <rect x={52} y={166} width={198} height={42} rx="6" fill="var(--bg)" stroke="var(--c-commit)" strokeWidth="1.3" />
      <text x={64} y={184} fontFamily="var(--font-mono)" fontSize="10" fontWeight={700} fill="var(--c-commit)">
        outbox
      </text>
      <text x={64} y={198} fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        event row (to be published)
      </text>

      <text x={52} y={228} fontFamily="var(--font-mono)" fontSize="9" fill="var(--tx3)">
        COMMIT;
      </text>
      <text x={151} y={245} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--c-commit)">
        both rows commit together — or neither does
      </text>

      {/* Right pipeline: relay, broker, consumer */}
      <rect x={420} y={36} width={250} height={62} rx="9" fill="var(--c-dist-soft)" stroke="var(--c-dist)" strokeWidth="1.4" />
      <text x={545} y={58} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight={700} fill="var(--c-dist)">
        Message Relay
      </text>
      <text x={545} y={74} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.3" fill="var(--tx3)">
        poll outbox, or tail the WAL
      </text>
      <text x={545} y={86} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.3" fill="var(--tx3)">
        (logical decoding / CDC · Debezium)
      </text>

      <rect x={420} y={128} width={250} height={52} rx="9" fill="var(--c-dist-soft)" stroke="var(--c-dist)" strokeWidth="1.4" />
      <text x={545} y={150} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight={700} fill="var(--c-dist)">
        Message broker (Kafka)
      </text>
      <text x={545} y={166} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        at-least-once delivery
      </text>

      <rect x={420} y={210} width={250} height={58} rx="9" fill="var(--c-query-soft)" stroke="var(--c-query)" strokeWidth="1.4" />
      <text x={545} y={232} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight={700} fill="var(--accent-bright)">
        Consumer — idempotent
      </text>
      <text x={545} y={249} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        dedup by idempotency key
      </text>
      <text x={545} y={261} textAnchor="middle" fontFamily="var(--font-body)" fontSize="8.5" fill="var(--tx3)">
        (safe to receive twice)
      </text>

      {/* arrows */}
      <line x1={250} y1={187} x2={417} y2={70} stroke="var(--c-dist)" strokeWidth="1.7" markerEnd="url(#ob-cyan)" />
      <rect x={286} y={112} width={104} height="16" rx="4" fill="var(--bg)" />
      <text x={290} y={124} fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--c-dist)">
        ② read outbox
      </text>

      <line x1={545} y1={98} x2={545} y2={126} stroke="var(--c-dist)" strokeWidth="1.7" markerEnd="url(#ob-cyan)" />
      <text x={552} y={116} fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--c-dist)">
        ③ publish
      </text>

      <line x1={545} y1={180} x2={545} y2={208} stroke="var(--c-dist)" strokeWidth="1.7" markerEnd="url(#ob-cyan)" />
      <text x={552} y={198} fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--c-dist)">
        ④ deliver
      </text>

      {/* Footer */}
      <rect x={20} y={282} width={650} height={32} rx="8" fill="var(--s2)" stroke="var(--line2)" />
      <text x={36} y={302} fontFamily="var(--font-body)" fontSize="9.3" fill="var(--tx2)">
        The event is committed in the SAME transaction as the data → no phantom, no lost event. Relay is at-least-once → consumer dedups. LISTEN/NOTIFY is not durable.
      </text>
    </svg>
  );
}
