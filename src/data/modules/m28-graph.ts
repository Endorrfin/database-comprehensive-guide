import type { Module } from '../types';

/*
 * M28 · Graph databases — Section VI (S14). Authored EN first, UA second; technical terms
 * stay English in both. Facts web-verified 2026-06-26 (see `sources`).
 *
 * Neo4j version facts (verified 2026-06-26 via neo4j.com + github.com/neo4j/neo4j):
 *  - CalVer track: Neo4j 2026.05.0 (released May 28, 2026).
 *  - LTS track: Neo4j 5.26.x; latest patch 5.26.27 (June 9, 2026); supported through June 2028.
 *  - Community Edition: GPLv3 (NOT AGPLv3 — that was Enterprise before Nov 2018).
 *  - Enterprise Edition: closed-source commercial (open-core model since November 2018).
 *
 * Property graph model (verified 2026-06-26 via neo4j.com docs + Wikipedia property graph):
 *  - Nodes: carry one or more labels (:Person, :Movie) and store properties (key-value pairs).
 *  - Relationships: directed, carry exactly one type (ACTED_IN), can carry properties,
 *    are first-class entities (not just rows in a join table).
 *  - Formally a directed multigraph: multiple same-type relationships between the same
 *    two nodes are distinct.
 *
 * RDF vs LPG (verified 2026-06-26 via neo4j.com/blog + memgraph.com docs):
 *  - RDF: subject-predicate-object triples (URI-identified); SPARQL query language;
 *    predicates are not objects so NO properties on edges without verbose reification;
 *    first-class ontology/inference support (OWL/RDFS).
 *  - LPG: nodes + directed typed relationships with their own properties; Cypher/GQL;
 *    no built-in ontology but richer edge semantics.
 *  - The critical structural difference: RDF cannot attach properties to edges natively;
 *    LPG makes relationships first-class entities with their own property maps.
 *
 * Cypher and openCypher (verified 2026-06-26 via opencypher.org + neo4j.com/blog):
 *  - Cypher created at Neo4j in 2010; first shipped publicly with Neo4j 1.4 (2011).
 *  - Declarative, ASCII-art-inspired pattern syntax: (n:Person)-[:KNOWS]->(m:Person).
 *  - Core clauses: MATCH, WHERE, RETURN, CREATE, MERGE, SET, DELETE, WITH.
 *  - openCypher: open spec launched by Neo4j in October 2015; governed by the
 *    openCypher Implementers Group; adopted by multiple vendors.
 *  - GQL: ISO/IEC 39075:2024, published April 12, 2024. Cypher (2011) →
 *    openCypher (2015) → GQL ISO standard (2024). Direct descendant.
 *
 * Index-free adjacency and native graph storage
 * (verified 2026-06-26 via neo4j.com/blog native-vs-non-native):
 *  - Native graph: each node record physically stores pointers to its relationship list;
 *    following a relationship is a single memory pointer dereference — O(1) per hop.
 *  - Non-native (graph layer over relational): nodes = table rows, edges = join-table rows.
 *    Each hop = an index lookup → O(log n) per hop. At k hops costs compound.
 *  - Traversal cost: native = O(k × avg_degree); non-native = O(k × log n × n).
 *    At depth 4–5 the difference becomes orders of magnitude.
 *
 * Graph algorithms (verified 2026-06-26 via neo4j.com/blog + GDS docs):
 *  - Shortest Path (BFS/Dijkstra): logistics, fraud ring tracing, degrees of separation.
 *  - PageRank: weights node by importance of neighbors; fraud/AML prioritization, recommendations.
 *  - Community Detection / Louvain (2008): optimizes modularity; fraud ring detection,
 *    customer segmentation.
 *  - Centrality (betweenness, degree, closeness): identifies bridge nodes / influencers.
 *
 * Apache AGE (verified 2026-06-26 via age.apache.org + github.com/apache/age):
 *  - PostgreSQL extension adding openCypher graph queries (cypher() wrapper).
 *  - Graduated from Apache Incubator to Top-Level Apache Project in May 2022.
 *  - Current version: v1.7.0 for PG18 (released January 21, 2026); supports PG 11–18.
 *
 * Other graph DBs (verified 2026-06-26):
 *  - Amazon Neptune: engine 1.4.7.0 (March 2026); supports Gremlin, openCypher, SPARQL.
 *  - ArangoDB (rebranded "Arango"): 3.12.9; multi-model (graph + document + key-value);
 *    from v3.12.5 Community free for non-commercial only.
 *  - NebulaGraph: v3.8.0 (May 2025), Apache License 2.0.
 *
 * Non-signature module: figures-only per locked plan (§6). Figure: 'property-graph'.
 */
export const m28: Module = {
  id: 'm28-graph',
  num: 28,
  section: 's6-nosql',
  order: 4,
  level: 'senior',
  signature: false,
  title: { en: 'Graph databases', uk: 'Graph databases' },
  tagline: {
    en: 'Property graph vs RDF, index-free adjacency, Cypher & GQL, when relationships ARE the data.',
    uk: 'Property graph проти RDF, index-free adjacency, Cypher і GQL, коли relationships — це і є дані.',
  },
  readMins: 14,
  mentalModel: {
    en: 'When the relationships between things are as important as the things themselves — use a graph.',
    uk: "Коли звʼязки між речами так само важливі, як і самі речі — використовуй graph.",
  },
  topics: [
    // ── Topic 1: The property graph model ─────────────────────────────
    {
      id: 'property-graph-model',
      title: {
        en: 'The labeled property graph — nodes, relationships, properties',
        uk: 'Labeled property graph — nodes, relationships, properties',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "A **graph database** stores data as a network of **nodes** (entities) connected by **relationships** (edges). The dominant model is the **Labeled Property Graph (LPG)**, used by Neo4j (latest stable: **2026.05.0**, CalVer; LTS: **5.26.x** through June 2028), Amazon Neptune, and others.\n\nThe three building blocks of an LPG:\n\n1. **Nodes** carry one or more **labels** (`:Person`, `:Movie`) that categorize the entity, and a set of **properties** — arbitrary key-value pairs (`name: 'Alice'`, `age: 31`).\n2. **Relationships** always have a **direction** (Alice *knows* Bob, not the other way around) and exactly one **type** (`KNOWS`, `ACTED_IN`, `LIVES_IN`). Crucially, relationships are **first-class entities**: they can hold their own properties (`since: 2020`, `role: 'Ariadne'`). This is what fundamentally separates the property graph from a join table in a relational database — in a join table, the relationship row has no intrinsic identity and must carry its context as foreign-key columns.\n3. **Properties** (on both nodes and relationships) are typed key-value pairs — strings, numbers, booleans, date/time, spatial, arrays.",
            uk: "**Graph database** зберігає дані як мережу **nodes** (сутностей), зʼєднаних **relationships** (ребрами). Домінантна модель — **Labeled Property Graph (LPG)**, що використовується Neo4j (найновіша стабільна: **2026.05.0**, CalVer; LTS: **5.26.x** до червня 2028), Amazon Neptune та іншими.\n\nТри будівельні блоки LPG:\n\n1. **Nodes** мають один або кілька **labels** (`:Person`, `:Movie`), що категоризують сутність, і набір **properties** — довільних пар ключ-значення (`name: 'Alice'`, `age: 31`).\n2. **Relationships** завжди мають **напрямок** (Alice *знає* Bob, не навпаки) і рівно один **тип** (`KNOWS`, `ACTED_IN`, `LIVES_IN`). Ключово: relationships є **першокласними сутностями** — вони можуть мати власні properties (`since: 2020`, `role: 'Ariadne'`). Це те, що принципово відрізняє property graph від join table в реляційній базі — у join table рядок relationship не має внутрішньої ідентичності і повинен нести свій контекст як стовпчики foreign key.\n3. **Properties** (на обох nodes і relationships) — типізовані пари ключ-значення: рядки, числа, булеві, дата/час, просторові, масиви.",
          },
        },
        {
          kind: 'figure',
          fig: 'property-graph',
          caption: {
            en: 'A labeled property graph with four nodes and four relationships. Alice and Bob are :Person nodes; Inception is a :Movie node; Kyiv is a :City node. Relationships carry their own type, direction, and optional properties — they are not join-table rows.',
            uk: 'Labeled property graph з чотирма nodes і чотирма relationships. Alice і Bob — :Person nodes; Inception — :Movie node; Kyiv — :City node. Relationships несуть власний тип, напрямок і опціональні properties — вони не є рядками join table.',
          },
        },
        {
          kind: 'compare',
          a: { en: 'LPG (property graph)', uk: 'LPG (property graph)' },
          b: { en: 'RDF (triple store)', uk: 'RDF (triple store)' },
          rows: [
            [
              { en: 'Data unit', uk: 'Одиниця даних' },
              { en: 'Node + Relationship (both have properties)', uk: 'Node + Relationship (обидва мають properties)' },
              { en: 'Triple: subject–predicate–object (URI-identified)', uk: 'Triple: subject–predicate–object (ідентифікується URI)' },
            ],
            [
              { en: 'Properties on edges?', uk: 'Properties на ребрах?' },
              { en: 'Yes — relationships are first-class with a property map', uk: 'Yes — relationships є першокласними з property map' },
              { en: 'No — predicates are not objects; edge properties require reification', uk: 'Ні — предикати не є обʼєктами; edge properties потребують reification' },
            ],
            [
              { en: 'Query language', uk: 'Query language' },
              { en: 'Cypher / GQL (ISO 2024)', uk: 'Cypher / GQL (ISO 2024)' },
              { en: 'SPARQL 1.1', uk: 'SPARQL 1.1' },
            ],
            [
              { en: 'Ontology / inference', uk: 'Ontology / inference' },
              { en: 'Not built-in (optional plugins)', uk: 'Не вбудовано (опціональні плагіни)' },
              { en: 'First-class: OWL / RDFS reasoning', uk: 'Першокласна: OWL / RDFS reasoning' },
            ],
            [
              { en: 'Best for', uk: 'Найкраще для' },
              { en: 'Fraud detection, social, recommendations, network topology', uk: 'Fraud detection, соціальні мережі, рекомендації, мережева топологія' },
              { en: 'Knowledge representation, linked open data, semantic web', uk: 'Представлення знань, linked open data, semantic web' },
            ],
          ],
        },
      ],
    },

    // ── Topic 2: Index-free adjacency & native graph storage ──────────
    {
      id: 'index-free-adjacency',
      title: {
        en: 'Index-free adjacency — why graph traversal is fast',
        uk: 'Index-free adjacency — чому graph traversal швидкий',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "The defining performance characteristic of a **native graph database** is **index-free adjacency**: each node record physically stores a direct pointer to its list of relationships. Following a relationship is a single memory dereference — **O(1) per hop**, regardless of how many total nodes are in the graph.\n\nContrast this with a relational database modeling the same network:\n- Friends are stored as rows in a `friendships` table with two foreign-key columns.\n- Each hop requires an **index lookup** — O(log n) — on the foreign key.\n- A 4-hop traversal (friends-of-friends-of-friends-of-friends) requires 4 nested index scans whose intermediate result sets can grow exponentially with average degree.\n\nAt shallow depth (1–2 hops) the performance difference is small. At depth 4–5, a native graph executes the same traversal **orders of magnitude faster** because it follows pointers rather than repeating index lookups.\n\nNon-native graph layers (e.g. a graph query API built on top of a relational or document store) lose this property: nodes and edges are still rows in tables, so each hop still costs O(log n).",
            uk: "Визначальна характеристика продуктивності **native graph database** — **index-free adjacency**: кожен запис node фізично зберігає прямий вказівник на свій список relationships. Слідування за relationship — це одна операція доступу до памʼяті — **O(1) на hop**, незалежно від того, скільки всього nodes у графі.\n\nПорівняйте це з реляційною базою даних, що моделює ту саму мережу:\n- Друзі зберігаються як рядки в таблиці `friendships` з двома стовпчиками foreign key.\n- Кожен hop потребує **index lookup** — O(log n) — на foreign key.\n- 4-hop traversal (друзі-друзів-друзів-друзів) потребує 4 вкладених index scans, чиї проміжні result sets можуть зростати експоненційно із середнім ступенем.\n\nПри малій глибині (1–2 hops) різниця у продуктивності невелика. При глибині 4–5, native graph виконує той самий traversal **на порядки швидше**, оскільки слідує за вказівниками, а не повторює index lookups.\n\nНе-native graph шари (наприклад, graph query API, побудований поверх реляційного або document сховища) втрачають цю властивість: nodes і edges все ще є рядками в таблицях, тому кожен hop все ще коштує O(log n).",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Native graph traversal vs relational JOIN at increasing depth (friends-of-friends)',
            uk: 'Native graph traversal проти реляційного JOIN при збільшенні глибини (друзі-друзів)',
          },
          head: [
            { en: 'Depth (hops)', uk: 'Глибина (hops)' },
            { en: 'Native graph (index-free adjacency)', uk: 'Native graph (index-free adjacency)' },
            { en: 'Relational (self-JOIN on friendships)', uk: 'Реляційний (self-JOIN на friendships)' },
          ],
          rows: [
            [
              { en: '1', uk: '1' },
              { en: 'O(degree) — pointer chase through neighbour list', uk: 'O(degree) — pointer chase через список сусідів' },
              { en: 'O(log n) — single index lookup', uk: 'O(log n) — один index lookup' },
            ],
            [
              { en: '2', uk: '2' },
              { en: 'O(degree²) — two levels of pointer chasing', uk: 'O(degree²) — два рівні pointer chasing' },
              { en: 'O(n × log n) — two nested index scans', uk: 'O(n × log n) — два вкладених index scan' },
            ],
            [
              { en: '4', uk: '4' },
              { en: 'O(degree⁴) — still pointer chasing, no index overhead', uk: 'O(degree⁴) — все ще pointer chasing, без накладних витрат index' },
              { en: 'O(n³ × log n) — exponentially larger intermediate sets', uk: 'O(n³ × log n) — експоненційно більші проміжні набори' },
            ],
            [
              { en: '5 (e.g. LinkedIn degrees)', uk: '5 (напр. LinkedIn degrees)' },
              { en: 'ms-range on billions of nodes (Neo4j benchmarks)', uk: 'мс-діапазон на мільярдах nodes (Neo4j benchmarks)' },
              { en: 'Seconds to minutes; often query timeout', uk: 'Секунди до хвилин; часто query timeout' },
            ],
          ],
        },
      ],
    },

    // ── Topic 3: Cypher, openCypher & GQL ─────────────────────────────
    {
      id: 'cypher-gql',
      title: {
        en: 'Cypher, openCypher & GQL',
        uk: 'Cypher, openCypher і GQL',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "**Cypher** was created at Neo4j in 2010 and first shipped publicly with Neo4j 1.4 (2011). It is a declarative, ASCII-art-inspired pattern-matching language — you describe the *shape* of the subgraph you want and let the query engine find it.\n\nCore syntax:\n```cypher\n-- Find friends-of-friends of Alice who acted in a movie rated > 8.0\nMATCH (alice:Person {name: 'Alice'})\n      -[:KNOWS]->(friend:Person)\n      -[:ACTED_IN]->(m:Movie)\nWHERE m.rating > 8.0\nRETURN friend.name, m.title, m.rating\nORDER BY m.rating DESC;\n\n-- Create a relationship\nMATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})\nMERGE (a)-[:KNOWS {since: 2020}]->(b);\n```\n\n**openCypher** (launched October 2015 by Neo4j) is an open specification with reference tests and grammar, enabling other vendors to implement Cypher-compatible query interfaces. It directly fed into the ISO standard.\n\n**GQL (ISO/IEC 39075:2024)** was published April 12, 2024 — the first ISO graph query language standard. It was proposed in 2016 (by Neo4j) and formally approved by ISO in 2019. Cypher → openCypher → GQL is a direct lineage. GQL also subsumes **SQL/PGQ** (SQL Part 16: Property Graph Queries), bringing graph queries into the SQL standard family. Apache AGE (**v1.7.0 for PostgreSQL 18**, released January 2026) is an example of this convergence — it runs Cypher queries directly inside PostgreSQL.",
            uk: "**Cypher** створений у Neo4j у 2010 р. і вперше публічно випущений з Neo4j 1.4 (2011 р.). Це декларативна, ASCII-art-натхненна мова пошуку патернів — ви описуєте *форму* підграфу, який хочете знайти, і дозволяєте query engine знайти його.\n\nОсновний синтаксис:\n```cypher\n-- Знайти friends-of-friends Alice, які знімались у фільмі з рейтингом > 8.0\nMATCH (alice:Person {name: 'Alice'})\n      -[:KNOWS]->(friend:Person)\n      -[:ACTED_IN]->(m:Movie)\nWHERE m.rating > 8.0\nRETURN friend.name, m.title, m.rating\nORDER BY m.rating DESC;\n\n-- Створити relationship\nMATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})\nMERGE (a)-[:KNOWS {since: 2020}]->(b);\n```\n\n**openCypher** (запущено у жовтні 2015 р. Neo4j) — це відкрита специфікація з довідковими тестами і граматикою, що дозволяє іншим постачальникам реалізовувати Cypher-сумісні query-інтерфейси. Він безпосередньо вплинув на ISO стандарт.\n\n**GQL (ISO/IEC 39075:2024)** опублікований 12 квітня 2024 р. — перший ISO стандарт мови graph-запитів. Запропонований у 2016 р. (Neo4j) і офіційно затверджений ISO у 2019 р. Cypher → openCypher → GQL — пряма лінія спадщини. GQL також включає **SQL/PGQ** (SQL Part 16: Property Graph Queries), привносячи graph-запити у сімейство SQL стандартів. Apache AGE (**v1.7.0 для PostgreSQL 18**, випущений у січні 2026 р.) — приклад цієї конвергенції — він запускає Cypher-запити безпосередньо всередині PostgreSQL.",
          },
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'MERGE — match or create', uk: 'MERGE — match or create' },
          md: {
            en: '`MERGE` is Cypher\'s idempotent upsert: it matches the pattern if it exists, or creates it if it does not. It is the standard way to build a graph incrementally from streaming data without creating duplicate nodes or relationships.',
            uk: "`MERGE` — це ідемпотентний upsert Cypher: він знаходить патерн, якщо він існує, або створює його, якщо ні. Це стандартний спосіб поступово будувати граф зі streaming даних без створення дублікатів nodes або relationships.",
          },
        },
      ],
    },

    // ── Topic 4: Graph algorithms & use cases ─────────────────────────
    {
      id: 'graph-algorithms-use-cases',
      title: {
        en: 'Graph algorithms & canonical use cases',
        uk: 'Graph algorithms і канонічні випадки використання',
      },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: "Graph databases unlock a class of algorithms that are impractical or impossible on tabular data at depth. Neo4j exposes these through its **Graph Data Science (GDS)** library; most graph DBs offer similar capabilities.",
            uk: "Graph databases відкривають клас алгоритмів, які є непрактичними або неможливими на таблицях при глибокому traversal. Neo4j надає їх через бібліотеку **Graph Data Science (GDS)**; більшість graph DBs пропонують аналогічні можливості.",
          },
        },
        {
          kind: 'table',
          caption: {
            en: 'Core graph algorithms and their use cases',
            uk: 'Основні graph algorithms та їх випадки використання',
          },
          head: [
            { en: 'Algorithm', uk: 'Алгоритм' },
            { en: 'What it computes', uk: 'Що обчислює' },
            { en: 'Canonical use cases', uk: 'Канонічні випадки використання' },
          ],
          rows: [
            [
              { en: 'Shortest Path (BFS / Dijkstra)', uk: 'Shortest Path (BFS / Dijkstra)' },
              { en: 'Minimum-cost path between two nodes', uk: 'Шлях мінімальної вартості між двома nodes' },
              { en: 'Logistics routing, degrees-of-separation, AML money-flow tracing', uk: 'Логістичний маршрутинг, degrees-of-separation, AML трасування грошового потоку' },
            ],
            [
              { en: 'PageRank', uk: 'PageRank' },
              { en: 'Node importance weighted by importance of neighbours', uk: 'Важливість node, зважена важливістю сусідів' },
              { en: 'Fraud ring prioritization, recommendation ranking, influencer scoring', uk: 'Пріоритизація fraud ring, ранжування рекомендацій, оцінка інфлюенсерів' },
            ],
            [
              { en: 'Community Detection (Louvain)', uk: 'Community Detection (Louvain)' },
              { en: 'Clusters of densely connected nodes (maximise modularity)', uk: 'Кластери щільно зʼєднаних nodes (максимізація modularity)' },
              { en: 'Fraud ring detection, customer segmentation, protein interaction networks', uk: 'Виявлення fraud ring, сегментація клієнтів, мережі взаємодії білків' },
            ],
            [
              { en: 'Betweenness Centrality', uk: 'Betweenness Centrality' },
              { en: 'Nodes that lie on many shortest paths (bridges)', uk: 'Nodes, що лежать на багатьох найкоротших шляхах (мости)' },
              { en: 'Critical infrastructure identification, money-mule detection, influencer ranking', uk: 'Ідентифікація критичної інфраструктури, виявлення money-mule, ранжування інфлюенсерів' },
            ],
            [
              { en: 'Triangle Count / Clustering Coefficient', uk: 'Triangle Count / Clustering Coefficient' },
              { en: 'How tightly-knit a node\'s neighbourhood is', uk: "Наскільки тісно повʼязане оточення node" },
              { en: 'Social cohesion analysis, spam/bot detection, trust scoring', uk: 'Аналіз соціальної згуртованості, виявлення spam/bot, оцінка довіри' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'When relationships ARE the data', uk: "Коли relationships — це і є дані" },
          md: {
            en: 'The heuristic for choosing a graph database: **if your most important questions are about the connections between things, not the things themselves, use a graph.** Fraud detection (circular payment flows, shared identities), social networks (friends-of-friends, community detection), recommendation engines (users-who-bought-X also bought Y), knowledge graphs (entities + typed relationships for semantic search and RAG context), and network topology (if server A fails, which services are affected?) are all relationship-first problems where relational JOINs become untenably deep.',
            uk: "Евристика для вибору graph database: **якщо ваші найважливіші питання стосуються зʼєднань між речами, а не самих речей — використовуйте граф.** Fraud detection (кругові платіжні потоки, спільні ідентичності), соціальні мережі (friends-of-friends, community detection), recommendation engines (users-who-bought-X also bought Y), knowledge graphs (сутності + типізовані relationships для semantic search і RAG context) та мережева топологія (якщо сервер A відмовляє, які сервіси постраждають?) — всі це relationship-first проблеми, де реляційні JOINs стають нестерпно глибокими.",
          },
        },
      ],
    },

    // ── Topic 5: When to use (and not use) a graph DB ─────────────────
    {
      id: 'graph-when-to-use',
      title: {
        en: 'When graphs shine — and when they do not',
        uk: 'Коли graphs блищать — і коли ні',
      },
      blocks: [
        {
          kind: 'table',
          caption: {
            en: 'Graph databases: good fits vs poor fits',
            uk: 'Graph databases: добрі підходи проти поганих',
          },
          head: [
            { en: 'Good fit ✓', uk: 'Добрий підхід ✓' },
            { en: 'Why', uk: 'Чому' },
          ],
          rows: [
            [
              { en: 'Fraud detection & AML', uk: 'Fraud detection і AML' },
              { en: 'Circular payment flows, shared account details, and fraud rings are graph patterns found with variable-length path queries', uk: 'Кругові платіжні потоки, спільні деталі акаунту та fraud rings — це graph патерни, що знаходяться за допомогою variable-length path запитів' },
            ],
            [
              { en: 'Social networks & recommendations', uk: 'Соціальні мережі і рекомендації' },
              { en: 'Friends-of-friends, mutual connections, and collaborative filtering are 2–4 hop traversals', uk: 'Friends-of-friends, взаємні зʼєднання та collaborative filtering — це 2–4 hop traversals' },
            ],
            [
              { en: 'Knowledge graphs & AI/RAG', uk: 'Knowledge graphs і AI/RAG' },
              { en: 'Entities + typed relationships enable semantic search, multi-hop Q&A, and context enrichment for LLM retrieval', uk: 'Сутності + типізовані relationships дозволяють semantic search, multi-hop Q&A та збагачення контексту для LLM retrieval' },
            ],
            [
              { en: 'Network / IT topology', uk: 'Мережева / IT топологія' },
              { en: 'Impact analysis ("which services depend on this router?") is a reachability query — trivial in a graph, painful with JOINs', uk: 'Аналіз впливу ("які сервіси залежать від цього роутера?") — це запит досяжності: тривіальний у графі, болісний з JOINs' },
            ],
            [
              { en: 'Access control / RBAC', uk: 'Access control / RBAC' },
              { en: 'Hierarchical role inheritance and permission propagation are natural graph traversals', uk: 'Ієрархічне успадкування ролей і поширення дозволів — це природні graph traversals' },
            ],
          ],
        },
        {
          kind: 'table',
          caption: {
            en: 'Poor fits for graph databases',
            uk: 'Погані підходи для graph databases',
          },
          head: [
            { en: 'Poor fit ✗', uk: 'Поганий підхід ✗' },
            { en: 'Why — better alternative', uk: 'Чому — краща альтернатива' },
          ],
          rows: [
            [
              { en: 'Simple CRUD / tabular data', uk: 'Простий CRUD / табличні дані' },
              { en: 'No relationship depth = no graph advantage; a relational DB is simpler and has richer tooling', uk: 'Жодної глибини relationship = жодної переваги графу; реляційна БД простіша і має кращий набір інструментів' },
            ],
            [
              { en: 'Large-scale analytics / aggregations', uk: 'Крупномасштабна аналітика / агрегації' },
              { en: 'Graph DBs are not columnar; GROUP BY over billions of rows is a job for ClickHouse/DuckDB, not Neo4j', uk: 'Graph DBs не є columnar; GROUP BY по мільярдах рядків — завдання для ClickHouse/DuckDB, не Neo4j' },
            ],
            [
              { en: 'Write-heavy, high-throughput ingestion', uk: 'Write-heavy, high-throughput ingestion' },
              { en: 'Graph index updates on every write are expensive; LSM-tree stores (Cassandra, ScyllaDB) handle high-ingest better', uk: 'Оновлення graph index на кожному записі дорогі; LSM-tree сховища (Cassandra, ScyllaDB) краще справляються з high-ingest' },
            ],
            [
              { en: 'Shallow, fixed-schema relationships (1 hop)', uk: 'Shallow, fixed-schema relationships (1 hop)' },
              { en: 'A foreign-key JOIN in PostgreSQL is just as fast at depth 1 and needs no extra infrastructure', uk: 'Foreign-key JOIN у PostgreSQL так само швидкий при глибині 1 і не потребує додаткової інфраструктури' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Start with pgvector + Apache AGE', uk: 'Починайте з pgvector + Apache AGE' },
          md: {
            en: 'If you already run PostgreSQL and only have moderate graph requirements (depth ≤ 3, millions — not billions — of nodes), **Apache AGE** (v1.7.0, PG18-compatible, Apache License 2.0) lets you run openCypher queries alongside your SQL tables. Avoid the operational complexity of a separate graph server until you hit clear limitations.',
            uk: 'Якщо ви вже запускаєте PostgreSQL і маєте лише помірні graph-вимоги (глибина ≤ 3, мільйони — не мільярди — nodes), **Apache AGE** (v1.7.0, PG18-сумісний, Apache License 2.0) дозволяє запускати openCypher-запити поряд з вашими SQL-таблицями. Уникайте операційної складності окремого graph-сервера, поки не зіткнетесь з чіткими обмеженнями.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'Neo4j Community Edition is GPLv3', uk: 'Neo4j Community Edition — GPLv3' },
          md: {
            en: 'Neo4j Community Edition is licensed under **GPLv3** (not AGPL — a common misconception). Enterprise Edition is closed-source commercial. GPLv3 requires that applications *distributing* Neo4j Community must also be GPLv3 — check the license before embedding it in a proprietary product.',
            uk: "Neo4j Community Edition ліцензований під **GPLv3** (не AGPL — поширена помилка). Enterprise Edition — закритий комерційний. GPLv3 вимагає, щоб застосунки, що *розповсюджують* Neo4j Community, також були GPLv3 — перевірте ліцензію перед вбудовуванням у пропрієтарний продукт.",
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'In a labeled property graph, relationships are first-class entities with their own type, direction, and properties — not rows in a join table.',
      uk: "У labeled property graph, relationships є першокласними сутностями з власним типом, напрямком і properties — не рядками в join table.",
    },
    {
      en: 'Index-free adjacency makes multi-hop traversal O(k × degree) in a native graph vs O(k × log n) per hop in a relational DB — the gap grows exponentially with depth.',
      uk: "Index-free adjacency робить multi-hop traversal O(k × degree) у native graph проти O(k × log n) на hop у реляційній БД — розрив зростає експоненційно із глибиною.",
    },
    {
      en: 'Cypher (2011) → openCypher (2015) → GQL ISO/IEC 39075:2024: graph query languages now have an international standard. Apache AGE brings Cypher to PostgreSQL.',
      uk: 'Cypher (2011) → openCypher (2015) → GQL ISO/IEC 39075:2024: graph query мови тепер мають міжнародний стандарт. Apache AGE привносить Cypher до PostgreSQL.',
    },
    {
      en: 'Graph algorithms (shortest path, PageRank, community detection, centrality) solve a class of problems that are impractical with SQL self-JOINs at depth 4+.',
      uk: 'Graph algorithms (shortest path, PageRank, community detection, centrality) вирішують клас проблем, що є непрактичними з SQL self-JOINs при глибині 4+.',
    },
    {
      en: 'Use a graph when the connections between things are as important as the things themselves: fraud, social, recommendations, knowledge graphs, network topology.',
      uk: "Використовуйте граф, коли зʼєднання між речами так само важливі, як і самі речі: fraud, соціальні, рекомендації, knowledge graphs, мережева топологія.",
    },
  ],

  pitfalls: [
    {
      title: { en: 'Reaching for a graph for tabular data', uk: 'Вибір graph для табличних даних' },
      body: {
        en: 'Not every problem benefits from graph structure. If your data has shallow, fixed relationships (one hop: user has orders) a foreign-key + JOIN in PostgreSQL is simpler, faster to operate, and supported by a vastly richer ecosystem. The graph advantage only materialises at multi-hop depth.',
        uk: "Не кожна проблема виграє від graph-структури. Якщо ваші дані мають shallow, фіксовані relationships (один hop: user має orders), foreign-key + JOIN у PostgreSQL простіший, швидший в операції та підтримується значно багатшою екосистемою. Перевага graph матеріалізується лише при multi-hop глибині.",
      },
    },
    {
      title: { en: 'Supernode problem (extremely high-degree nodes)', uk: 'Проблема supernode (вузли з надзвичайно високим ступенем)' },
      body: {
        en: 'A node with millions of relationships (e.g. a celebrity in a social graph, a root category in a product hierarchy) becomes a traversal bottleneck — following its full relationship list costs O(millions). Mitigate with relationship-type filters, degree-based sampling, or partitioning the supernode across multiple proxy nodes.',
        uk: "Вузол з мільйонами relationships (наприклад, знаменитість у соціальному графі, коренева категорія у ієрархії продуктів) стає вузьким місцем traversal — слідування за повним списком relationships коштує O(мільйони). Помʼякшуйте з фільтрами типу relationship, вибіркою на основі ступеня або розбиттям supernode на кілька proxy nodes.",
      },
    },
    {
      title: { en: 'Confusing LPG and RDF', uk: 'Плутанина між LPG і RDF' },
      body: {
        en: 'The "graph database" umbrella covers two very different models: labeled property graphs (Cypher/GQL) and RDF triple stores (SPARQL). They do not interoperate. Choose LPG for operational use cases (fraud, social, recommendations); RDF for knowledge representation, semantic web, and ontology reasoning.',
        uk: "Під \"graph database\" обʼєднані дві дуже різні моделі: labeled property graphs (Cypher/GQL) і RDF triple stores (SPARQL). Вони не взаємодіють. Вибирайте LPG для операційних випадків (fraud, соціальні, рекомендації); RDF для представлення знань, semantic web та ontology reasoning.",
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: {
        en: 'Why is multi-hop traversal orders of magnitude faster in a native graph database than in a relational database?',
        uk: 'Чому multi-hop traversal на порядки швидший у native graph database, ніж у реляційній базі даних?',
      },
      a: {
        en: 'Index-free adjacency: each node physically stores a pointer to its relationship list, so following a relationship is a single memory dereference — O(1) per hop. In a relational DB, each hop requires an index lookup (O(log n)) on a foreign-key column. At 4–5 hops the relational intermediate result sets can be orders of magnitude larger. Native graph traversal cost is O(k × average_degree), which grows linearly with depth; relational self-JOINs grow exponentially.',
        uk: "Index-free adjacency: кожен node фізично зберігає вказівник на свій список relationships, тому слідування за relationship — це одна операція звернення до памʼяті — O(1) на hop. У реляційній БД кожен hop потребує index lookup (O(log n)) на стовпчику foreign key. При 4–5 hops реляційні проміжні result sets можуть бути на порядки більшими. Вартість native graph traversal — O(k × average_degree), що зростає лінійно із глибиною; реляційні self-JOINs зростають експоненційно.",
      },
    },
    {
      level: 'senior',
      q: {
        en: 'What is the key structural difference between an LPG and an RDF triple store?',
        uk: 'Яка ключова структурна відмінність між LPG і RDF triple store?',
      },
      a: {
        en: 'In an LPG, relationships are first-class entities with their own property maps — you can store `since: 2020` or `role: "Ariadne"` directly on a relationship. In RDF, predicates (edges) are URI-identified values, not objects, so they cannot carry properties natively. To attach a property to an RDF edge you must use reification (a verbose pattern that wraps the triple in additional triples), which breaks the simple subject–predicate–object model. LPG is richer for operational graphs; RDF is richer for ontology and inference.',
        uk: "У LPG relationships є першокласними сутностями з власними property maps — ви можете зберігати `since: 2020` або `role: \"Ariadne\"` безпосередньо на relationship. В RDF предикати (ребра) — це ідентифіковані URI значення, а не обʼєкти, тому вони не можуть нести properties нативно. Щоб приєднати property до RDF ребра, потрібно використовувати reification (докладний патерн, що обгортає triple у додаткові triples), що порушує просту модель subject–predicate–object. LPG багатший для операційних графів; RDF багатший для ontology та inference.",
      },
    },
    {
      level: 'staff',
      q: {
        en: 'A fraud detection team wants to find circular money transfer rings of depth 3–5 hops involving the same account. Why is this a graph problem, and how would you design the query?',
        uk: 'Команда fraud detection хоче знайти кільця кругових грошових переказів глибиною 3–5 hops, що включають один і той самий акаунт. Чому це graph-проблема і як би ви спроектували запит?',
      },
      a: {
        en: 'This is a cycle detection problem at variable depth — a relational DB would need 3–5 nested self-JOINs on the transfers table with exponentially growing intermediate result sets, often timing out. In a graph, each account is a node and each transfer is a directed `[:TRANSFERRED_TO]` relationship. A variable-length path query in Cypher can express this concisely: `MATCH (a:Account)-[:TRANSFERRED_TO*3..5]->(a)` — find all cycles of length 3 to 5 starting and ending at the same account. The graph engine traverses pointers without materialising intermediate tables. To operationalise: index `Account.id`; store transfer amount and timestamp as relationship properties for post-filter; run periodic batch analysis with the Louvain algorithm to surface tightly-connected transfer communities for human review.',
        uk: "Це проблема виявлення циклів змінної глибини — реляційна БД потребувала б 3–5 вкладених self-JOINs у таблиці переказів з експоненційно зростаючими проміжними result sets, що часто призводить до timeout. У графі кожен акаунт є node, а кожен переказ — спрямованим `[:TRANSFERRED_TO]` relationship. Запит змінної довжини шляху в Cypher може виразити це лаконічно: `MATCH (a:Account)-[:TRANSFERRED_TO*3..5]->(a)` — знайти всі цикли довжиною від 3 до 5, що починаються і закінчуються на одному і тому ж акаунті. Graph engine проходить вказівники без матеріалізації проміжних таблиць. Для операціоналізації: індексуйте `Account.id`; зберігайте суму переказу і timestamp як relationship properties для пост-фільтрації; запускайте periodичний batch-аналіз з алгоритмом Louvain для виявлення тісно повʼязаних transfer communities для перевірки людиною.",
      },
    },
  ],

  seeAlso: ['m3-sql-vs-nosql', 'm25-document', 'm26-key-value', 'm27-wide-column', 'm29-vector'],

  sources: [
    {
      title: 'Neo4j — Native vs. Non-Native Graph Technology (index-free adjacency)',
      url: 'https://neo4j.com/blog/cypher-and-gql/native-vs-non-native-graph-technology/',
    },
    {
      title: 'Neo4j — RDF vs. Property Graphs for Knowledge Graphs',
      url: 'https://neo4j.com/blog/knowledge-graph/rdf-vs-property-graphs-knowledge-graphs/',
    },
    {
      title: 'openCypher.org — The Open Cypher Specification',
      url: 'https://opencypher.org/',
    },
    {
      title: 'ISO/IEC 39075:2024 — GQL (Graph Query Language)',
      url: 'https://www.iso.org/standard/76120.html',
    },
    {
      title: 'Apache AGE v1.7.0 — Graph extension for PostgreSQL 18',
      url: 'https://age.apache.org/',
    },
    {
      title: 'Neo4j — Graph Algorithms: Community Detection (Louvain, PageRank, Centrality)',
      url: 'https://neo4j.com/blog/graph-data-science/graph-algorithms-community-detection-recommendations/',
    },
  ],
};
