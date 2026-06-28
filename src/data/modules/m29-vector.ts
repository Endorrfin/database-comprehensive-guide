// M29 · Vector databases & AI [senior] — S15
// Web-verified 2026-06-26:
//   pgvector v0.8.2 (Feb 26 2026, CVE-2026-3172 fix); HNSW recommended (IVFFlat deprecated for
//   new installs in practice); pgvector HNSW params: m (max connections, default 16), ef_construction
//   (default 64), ef (query time, default 40). Qdrant v1.18.2 (Jun 12 2026); $50M Series B Mar 2026.
//   Milvus 3.0-beta (May 9 2026); CNCF project. Weaviate v1.37.2 (Apr 2026). Pinecone serverless-
//   default 2026. HNSW paper: Malkov & Yashunin 2018, arXiv:1603.09320 / IEEE TPAMI 42(4):824-836.
//   RAG = primary AI use-case for vector search (Lewis et al., NeurIPS 2020).
import type { Module } from '../types';

const m29: Module = {
  id:        'm29-vector',
  num:       29,
  section:   's7-modern',
  order:     1,
  level:     'senior',
  signature: true,
  readMins:  13,

  title:    { en: 'Vector Databases & AI', uk: 'Vector Databases та AI' },
  tagline:  { en: 'Embeddings, ANN/HNSW, pgvector vs dedicated vector DBs, and RAG', uk: 'Embeddings, ANN/HNSW, pgvector проти спеціалізованих vector DBs та RAG' },

  mentalModel: {
    en: 'A vector DB stores points in high-dimensional space and finds the nearest neighbours fast — trading exact recall for speed via HNSW graph navigation.',
    uk: 'Vector DB зберігає точки у багатовимірному просторі та швидко знаходить найближчих сусідів, жертвуючи точним recall заради швидкості через навігацію HNSW графом.',
  },

  topics: [
    // ── Topic 1: embeddings & similarity ──────────────────────────────────
    {
      id:    'what-are-embeddings',
      title: { en: 'Embeddings & similarity search', uk: 'Embeddings та пошук схожості' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'An **embedding** is a dense vector of floating-point numbers — typically 768–3072 dimensions — produced by a neural model (BERT, OpenAI text-embedding-3, Gemini, Mistral). Semantically similar objects land near each other in this high-dimensional space. Nearest-neighbour search then becomes the query: *"return the k documents whose vector is closest to the query vector."*',
            uk: 'An **embedding** — це щільний вектор з чисел з плаваючою комою (типово 768–3072 вимірів), який виробляє нейронна модель (BERT, OpenAI text-embedding-3, Gemini, Mistral). Семантично схожі обʼєкти знаходяться поруч у цьому багатовимірному просторі. Пошук найближчих сусідів стає запитом: *"повернути k документів, чий вектор найближчий до вектора запиту."*',
          },
        },
        {
          kind: 'table',
          caption: { en: 'Distance metrics used in practice', uk: 'Метрики відстані на практиці' },
          head: [
            { en: 'Metric', uk: 'Метрика' },
            { en: 'Formula', uk: 'Формула' },
            { en: 'When to use', uk: 'Коли використовувати' },
          ],
          rows: [
            [
              { en: 'Cosine similarity', uk: 'Косинусна схожість' },
              { en: '(A·B) / (|A||B|)', uk: '(A·B) / (|A||B|)' },
              { en: 'Text, documents — direction matters more than magnitude', uk: 'Текст, документи — напрямок важливіший за величину' },
            ],
            [
              { en: 'L2 (Euclidean)', uk: 'L2 (Евклідова)' },
              { en: '√(Σ(aᵢ−bᵢ)²)', uk: '√(Σ(aᵢ−bᵢ)²)' },
              { en: 'Images, structured features — absolute position matters', uk: 'Зображення, структуровані ознаки — важлива абсолютна позиція' },
            ],
            [
              { en: 'Dot product (IP)', uk: 'Скалярний добуток (IP)' },
              { en: 'A·B = Σ aᵢbᵢ', uk: 'A·B = Σ aᵢbᵢ' },
              { en: 'Recommendation systems with magnitude meaning', uk: 'Рекомендаційні системи, де важлива величина' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'Normalise before cosine — or use dot product on unit vectors', uk: 'Нормалізуйте перед cosine — або використовуйте dot product на unit vectors' },
          md: {
            en: 'After L2-normalising embeddings to unit length, cosine similarity = dot product. Many engines (pgvector, Qdrant) store normalised vectors and use inner product to halve the arithmetic cost.',
            uk: 'Після L2-нормалізації embeddings до unit length, cosine similarity = dot product. Багато engines (pgvector, Qdrant) зберігають нормалізовані вектори та використовують inner product для зменшення арифметичних витрат вдвічі.',
          },
        },
      ],
    },

    // ── Topic 2: exact kNN vs ANN / HNSW ──────────────────────────────────
    {
      id:    'ann-hnsw',
      title: { en: 'Exact kNN vs ANN — HNSW', uk: 'Exact kNN проти ANN — HNSW' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**Exact kNN** computes the distance from the query to every stored vector — O(n·d) per query, where n is dataset size and d is dimension. Guaranteed recall = 100%, but at tens of millions of vectors this is prohibitively slow.\n\n**Approximate Nearest Neighbour (ANN)** indices trade a small recall reduction for orders-of-magnitude speedup. The dominant algorithm today is **HNSW** (Hierarchical Navigable Small World graphs — Malkov & Yashunin 2018). HNSW builds a multi-layer proximity graph at index time; at query time it navigates from a random entry point, greedily following edges toward the query, and returns the k closest nodes found.\n\nKey HNSW parameters:\n- **M** — max edges per node per layer (typical 16–32). Higher M = denser graph, better recall, more memory.\n- **ef_construction** — beam width during *index build* (typical 64–200). Higher = better recall, slower build.\n- **ef** (or `ef_search`) — beam width during *query* (typical 40–100). Higher = better recall, slower query. Tune this at query time without rebuilding.',
            uk: '**Exact kNN** обчислює відстань від запиту до кожного збереженого вектора — O(n·d) на запит, де n — розмір датасету, d — вимірність. Гарантований recall = 100%, але при десятках мільйонів векторів це неприйнятно повільно.\n\n**Approximate Nearest Neighbour (ANN)** indices жертвують невеликим recall заради значного прискорення. Домінуючий алгоритм сьогодні — **HNSW** (Hierarchical Navigable Small World graphs — Malkov & Yashunin 2018). HNSW будує багаторівневий граф суміжності; під час запиту навігація від випадкової точки входу жадібно слідує ребрами до запиту та повертає k найближчих знайдених вузлів.\n\nКлючові параметри HNSW:\n- **M** — макс. ребер на вузол на рівень (типово 16–32). Вищий M = густіший граф, кращий recall, більше памʼяті.\n- **ef_construction** — ширина beam під час *побудови індексу* (типово 64–200). Вищий = кращий recall, повільніша побудова.\n- **ef** (`ef_search`) — ширина beam під час *запиту* (типово 40–100). Вищий = кращий recall, повільніший запит. Налаштовується в runtime без перебудови.',
          },
        },
        {
          kind: 'sim',
          sim: 'vector-search',
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Recall vs speed is a tuning knob, not a fixed trade-off', uk: 'Recall vs speed — параметр налаштування, не фіксований компроміс' },
          md: {
            en: 'Raise `ef` (or `hnsw_ef` in pgvector) at query time to buy recall without rebuilding the index. The right `ef` is the lowest value where recall meets your SLA — measure on your data.',
            uk: 'Підвищте `ef` (або `hnsw_ef` у pgvector) під час запиту, щоб підвищити recall без перебудови індексу. Правильне `ef` — найменше значення, при якому recall відповідає SLA — вимірюйте на своїх даних.',
          },
        },
      ],
    },

    // ── Topic 3: pgvector — the PostgreSQL vector extension ───────────────
    {
      id:    'pgvector',
      title: { en: 'pgvector — vector search inside PostgreSQL', uk: 'pgvector — vector search усередині PostgreSQL' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**pgvector** (v0.8.2, Feb 2026) adds a `vector(n)` column type and three index types to PostgreSQL. It is the dominant choice for RAG at the scale most applications actually reach (tens of millions of vectors) because it eliminates a dedicated infrastructure component and lets you join vector search results with relational data in a single SQL query.',
            uk: '**pgvector** (v0.8.2, лют. 2026) додає тип стовпця `vector(n)` та три типи індексів до PostgreSQL. Це домінуючий вибір для RAG при масштабах, яких реально досягають більшість застосунків (десятки мільйонів векторів), оскільки він усуває виділений інфраструктурний компонент та дозволяє обʼєднувати результати vector search з реляційними даними в одному SQL-запиті.',
          },
        },
        {
          kind: 'code',
          lang: 'sql',
          code: `-- pgvector: enable, create table, index, query
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id        SERIAL PRIMARY KEY,
  content   TEXT,
  embedding vector(1536)          -- OpenAI text-embedding-3-small dim
);

-- HNSW index (recommended over IVFFlat for new installs)
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Tune recall at query time (default ef = 40)
SET hnsw.ef_search = 80;

-- Top-5 nearest neighbours by cosine distance
SELECT id, content, embedding <=> '[0.21,-0.88,...]' AS distance
FROM documents
ORDER BY embedding <=> '[0.21,-0.88,...]'
LIMIT 5;

-- Hybrid: vector ANN + BM25-style text filter in one query (pg_trgm)
SELECT id, content, 1 - (embedding <=> '[...]') AS similarity
FROM documents
WHERE content ILIKE '%neural%'
ORDER BY embedding <=> '[...]'
LIMIT 10;`,
          note: {
            en: '`<=>` = cosine distance (0 = identical, 2 = opposite). `<->` = L2, `<#>` = negative dot product.',
            uk: '`<=>` = cosine distance (0 = ідентичні, 2 = протилежні). `<->` = L2, `<#>` = відʼємний dot product.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'pgvector index types', uk: 'Типи індексів pgvector' },
          head: [
            { en: 'Index', uk: 'Індекс' },
            { en: 'Build', uk: 'Побудова' },
            { en: 'Query', uk: 'Запит' },
            { en: 'Notes', uk: 'Примітки' },
          ],
          rows: [
            [
              { en: 'Exact (no index)', uk: 'Точний (без індексу)' },
              { en: 'Instant', uk: 'Миттєво' },
              { en: 'O(n)', uk: 'O(n)' },
              { en: 'Recall = 100%; fine up to ~100k rows', uk: 'Recall = 100%; підходить до ~100k rows' },
            ],
            [
              { en: 'IVFFlat', uk: 'IVFFlat' },
              { en: 'Fast (k-means)', uk: 'Швидко (k-means)' },
              { en: 'O(lists·n/lists)', uk: 'O(lists·n/lists)' },
              { en: 'Needs data before build; no live insert', uk: 'Потребує даних перед побудовою; не підтримує live insert' },
            ],
            [
              { en: 'HNSW', uk: 'HNSW' },
              { en: 'Slower (graph)', uk: 'Повільніше (граф)' },
              { en: 'O(log n)', uk: 'O(log n)' },
              { en: 'Recommended: live inserts, better recall, higher memory', uk: 'Рекомендований: live inserts, кращий recall, більше памʼяті' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: { en: 'pgvector first, dedicated DB second', uk: 'Спочатку pgvector, потім спеціалізована DB' },
          md: {
            en: 'Start with pgvector on your existing Postgres. Move to a dedicated vector DB only when you need: billions of vectors, GPU-accelerated indexing, multimodal (image+text) combined search, or advanced sparse-dense hybrid. pgvector covers most RAG needs up to ~100M vectors with proper tuning.',
            uk: 'Починайте з pgvector на наявному Postgres. Переходьте до спеціалізованої vector DB лише коли потрібно: мільярди векторів, GPU-прискорена індексація, мультимодальний пошук (зображення+текст) або розширений sparse-dense hybrid. pgvector покриває більшість RAG-потреб до ~100M векторів при правильному налаштуванні.',
          },
        },
      ],
    },

    // ── Topic 4: dedicated vector databases ──────────────────────────────
    {
      id:    'dedicated-vector-dbs',
      title: { en: 'Dedicated vector databases', uk: 'Спеціалізовані vector databases' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: 'When your dataset exceeds hundreds of millions of vectors, or you need GPU indexing, multimodal search, or managed cloud-native scaling, purpose-built vector databases become the right tool.',
            uk: 'Коли датасет перевищує сотні мільйонів векторів, або потрібна GPU-індексація, мультимодальний пошук або хмарне масштабування, спеціалізовані vector databases стають правильним вибором.',
          },
        },
        {
          kind: 'table',
          caption: { en: 'Major dedicated vector databases (2026)', uk: 'Основні спеціалізовані vector databases (2026)' },
          head: [
            { en: 'Engine', uk: 'Engine' },
            { en: 'Language / model', uk: 'Мова / модель' },
            { en: 'Stand-out feature', uk: 'Ключова особливість' },
            { en: 'Scale', uk: 'Масштаб' },
          ],
          rows: [
            [
              { en: 'Qdrant v1.18.2', uk: 'Qdrant v1.18.2' },
              { en: 'Rust, AGPL-3 / cloud', uk: 'Rust, AGPL-3 / cloud' },
              { en: 'Quantisation, GPU indexing, rich payload filtering', uk: 'Quantisation, GPU indexing, багата фільтрація payload' },
              { en: '~billions via sharding', uk: '~мільярди через sharding' },
            ],
            [
              { en: 'Milvus 3.0-beta', uk: 'Milvus 3.0-beta' },
              { en: 'Go + C++, Apache-2', uk: 'Go + C++, Apache-2' },
              { en: 'CNCF, cloud-native (K8s), separated compute/storage', uk: 'CNCF, cloud-native (K8s), розділені compute/storage' },
              { en: 'Billions; designed for distributed ops', uk: 'Мільярди; проєктований для distributed ops' },
            ],
            [
              { en: 'Weaviate v1.37.2', uk: 'Weaviate v1.37.2' },
              { en: 'Go, BSD-3 / cloud', uk: 'Go, BSD-3 / cloud' },
              { en: 'Hybrid search (BM25 + dense), GraphQL, MCP server', uk: 'Hybrid search (BM25 + dense), GraphQL, MCP server' },
              { en: '~100M–1B per cluster', uk: '~100M–1B на кластер' },
            ],
            [
              { en: 'Pinecone', uk: 'Pinecone' },
              { en: 'Managed SaaS (2013)', uk: 'Managed SaaS (2013)' },
              { en: 'Serverless-default (2026), multi-cloud, zero ops', uk: 'Serverless-default (2026), multi-cloud, zero ops' },
              { en: 'Unlimited (billed on usage)', uk: 'Необмежено (оплата за використання)' },
            ],
          ],
        },
        {
          kind: 'callout',
          tone: 'senior',
          title: { en: 'Hybrid search: dense + sparse together', uk: 'Hybrid search: dense + sparse разом' },
          md: {
            en: 'Dense HNSW retrieves semantically similar docs but may miss exact keyword matches. Sparse retrieval (BM25 / TF-IDF) catches those keywords but misses paraphrase. Hybrid (Reciprocal Rank Fusion or learned fusion) gets both. Weaviate and Qdrant support hybrid natively; pgvector + pg_trgm can approximate it.',
            uk: 'Dense HNSW отримує семантично схожі документи, але може пропустити точні ключові слова. Sparse retrieval (BM25 / TF-IDF) їх вловлює, але пропускає перефразування. Hybrid (Reciprocal Rank Fusion або learned fusion) отримує обидва. Weaviate та Qdrant підтримують hybrid нативно; pgvector + pg_trgm можуть наблизитись до цього.',
          },
        },
      ],
    },

    // ── Topic 5: RAG — Retrieval-Augmented Generation ─────────────────────
    {
      id:    'rag',
      title: { en: 'RAG — Retrieval-Augmented Generation', uk: 'RAG — Retrieval-Augmented Generation' },
      blocks: [
        {
          kind: 'prose',
          md: {
            en: '**RAG** (Lewis et al., NeurIPS 2020) is the primary use-case driving the vector database wave. The pattern: embed the user\'s query → ANN-search the vector store → inject the top-k retrieved chunks into the LLM\'s context window → the LLM answers using those chunks as grounding evidence. The LLM\'s parametric memory provides reasoning; the vector DB provides up-to-date, domain-specific, retrievable knowledge.',
            uk: '**RAG** (Lewis et al., NeurIPS 2020) — основний use-case, що рухає хвилю vector databases. Паттерн: embed запит користувача → ANN-пошук у vector store → вставка top-k отриманих chunks у context window LLM → LLM відповідає, використовуючи ці chunks як обґрунтування. Параметрична памʼять LLM надає міркування; vector DB надає актуальні, доменні, відновлювані знання.',
          },
        },
        {
          kind: 'figure',
          fig: 'rag-pipeline',
          caption: {
            en: 'RAG pipeline: query → embed → ANN search → inject top-k chunks → LLM answer.',
            uk: 'RAG pipeline: query → embed → ANN search → вставка top-k chunks → відповідь LLM.',
          },
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: { en: 'RAG is not magic — garbage in, garbage out', uk: 'RAG — не магія: сміття на вході = сміття на виході' },
          md: {
            en: 'The quality of retrieved chunks determines answer quality. Problems: wrong embedding model for your domain; chunks too large (noise) or too small (missing context); stale embeddings after document updates; hallucination when retrieval fails (no chunk matches). Evaluation (recall@k, MRR, RAGAS) is mandatory — not optional.',
            uk: 'Якість отриманих chunks визначає якість відповіді. Проблеми: неправильна embedding model для вашого домену; chunks занадто великі (шум) або занадто малі (відсутній контекст); застарілі embeddings після оновлення документів; галюцинації при невдалому retrieval (жоден chunk не відповідає). Оцінювання (recall@k, MRR, RAGAS) є обовʼязковим, а не опціональним.',
          },
        },
      ],
    },
  ],

  keyPoints: [
    {
      en: 'Embeddings map objects to high-dimensional vectors; similarity search finds the closest vectors.',
      uk: 'Embeddings відображають обʼєкти у багатовимірні вектори; similarity search знаходить найближчі вектори.',
    },
    {
      en: 'HNSW builds a multi-layer proximity graph; query navigation is O(log n) with adjustable recall via `ef`.',
      uk: 'HNSW будує багаторівневий граф суміжності; навігація при запиті — O(log n) з налаштованим recall через `ef`.',
    },
    {
      en: 'pgvector (v0.8.2) covers most RAG needs at ≤100M vectors; no separate infrastructure required.',
      uk: 'pgvector (v0.8.2) покриває більшість RAG-потреб при ≤100M векторів; не потребує окремої інфраструктури.',
    },
    {
      en: 'Dedicated DBs (Qdrant, Milvus, Weaviate, Pinecone) shine at billions of vectors, GPU indexing, or managed serverless.',
      uk: 'Спеціалізовані DBs (Qdrant, Milvus, Weaviate, Pinecone) виграють при мільярдах векторів, GPU-індексації або managed serverless.',
    },
    {
      en: 'RAG = embed query → ANN search → inject top-k chunks into LLM context. Eval (recall@k, RAGAS) is non-negotiable.',
      uk: 'RAG = embed query → ANN search → вставка top-k chunks у контекст LLM. Оцінювання (recall@k, RAGAS) є обовʼязковим.',
    },
  ],

  pitfalls: [
    {
      title: { en: 'Choosing IVFFlat for new installs', uk: 'Вибір IVFFlat для нових інсталяцій' },
      body: {
        en: 'IVFFlat requires data to be present at build time (k-means over existing rows) and has no online index updates. New installs should use HNSW: it supports live inserts, has better recall at the same query latency, and its parameters are easier to tune.',
        uk: 'IVFFlat вимагає наявності даних під час побудови (k-means по наявних рядках) та не має online оновлень індексу. Нові інсталяції повинні використовувати HNSW: він підтримує live inserts, має кращий recall при тій самій затримці запиту, а його параметри простіше налаштовувати.',
      },
    },
    {
      title: { en: 'Trusting recall blindly — never measuring it', uk: 'Сліпа довіра recall без вимірювання' },
      body: {
        en: 'A default `ef=40` may give 90% recall on one dataset and 60% on another. Always measure recall@k on a representative sample with known ground truth before shipping. HNSW recall depends on your data distribution, not just the parameter values.',
        uk: 'За замовчуванням `ef=40` може давати 90% recall на одному датасеті та 60% на іншому. Завжди вимірюйте recall@k на репрезентативній вибірці з відомою ground truth перед запуском. Recall HNSW залежить від розподілу даних, а не лише від значень параметрів.',
      },
    },
    {
      title: { en: 'Jumping to a dedicated vector DB too early', uk: 'Занадто рання міграція на спеціалізовану vector DB' },
      body: {
        en: 'Dedicated vector DBs add operational complexity, a new failure domain, and potential consistency gaps between your primary store and the vector index. pgvector on Postgres keeps everything in one transactional store — the right default until you actually hit its limits.',
        uk: 'Спеціалізовані vector DBs додають операційну складність, нову failure domain та потенційні розриви консистентності між основним сховищем та vector індексом. pgvector на Postgres зберігає все в одному транзакційному сховищі — правильний default, поки ви не досягнете його меж.',
      },
    },
  ],

  interview: [
    {
      level: 'senior',
      q: { en: 'What is the difference between exact kNN and HNSW, and when would you choose each?', uk: 'В чому різниця між exact kNN та HNSW, і коли ви б обрали кожен?' },
      a: {
        en: 'Exact kNN computes distances to all n vectors — O(n·d), guaranteed 100% recall. Fine up to ~100k vectors where latency is acceptable. HNSW builds a multi-layer proximity graph at index time, then navigates it at query time in O(log n) by following edges toward the query. Recall is configurable via `ef`: raise it for better recall at the cost of more work per query. HNSW is the right choice for production RAG at millions+ of vectors where you need sub-second latency.',
        uk: 'Exact kNN обчислює відстані до всіх n векторів — O(n·d), гарантований 100% recall. Підходить до ~100k векторів, де затримка прийнятна. HNSW будує багаторівневий граф суміжності під час індексації, потім навігує ним при запиті за O(log n), слідуючи ребрами до запиту. Recall налаштовується через `ef`: підвищуйте для кращого recall за рахунок більшої роботи на запит. HNSW — правильний вибір для production RAG при мільйонах+ векторів з вимогою затримки менше секунди.',
      },
    },
    {
      level: 'senior',
      q: { en: 'Explain the RAG pattern and its failure modes.', uk: 'Поясніть паттерн RAG та його режими збоїв.' },
      a: {
        en: 'RAG: embed query → ANN-search vector store → inject top-k chunks into LLM prompt → LLM generates answer grounded in retrieved chunks. Failure modes: (1) retrieval failure — the right chunk is not in the top-k because of embedding model mismatch, chunk size problems, or low `ef`; (2) stale embeddings after document updates — must re-embed on change; (3) context stuffing — too many chunks exceed the context window or dilute the relevant signal; (4) LLM hallucination when no relevant chunk is found — the model fills the gap with parametric memory. Mitigation: eval with recall@k and RAGAS on representative queries.',
        uk: 'RAG: embed query → ANN-пошук у vector store → вставка top-k chunks у prompt LLM → LLM генерує відповідь, засновану на отриманих chunks. Режими збоїв: (1) невдалий retrieval — правильний chunk не потрапив у top-k через невідповідність embedding model, проблеми розміру chunk або низький `ef`; (2) застарілі embeddings після оновлення документів — потрібно повторно embed при зміні; (3) перевантаження контексту — занадто багато chunks перевищують context window або розбавляють релевантний сигнал; (4) галюцинації LLM при відсутності релевантного chunk. Помʼякшення: оцінювання з recall@k та RAGAS на репрезентативних запитах.',
      },
    },
    {
      level: 'staff',
      q: { en: 'When would you choose Qdrant or Milvus over pgvector?', uk: 'Коли ви б обрали Qdrant або Milvus замість pgvector?' },
      a: {
        en: 'pgvector wins for: datasets under ~100M vectors, teams already on Postgres, need for transactional joins, and operational simplicity. Move to a dedicated vector DB when: (1) scale exceeds hundreds of millions to billions of vectors where HNSW build memory or query latency becomes the bottleneck; (2) need GPU-accelerated index build (Qdrant v1.18+ with GPU indexing); (3) need multimodal (image+text+audio) combined collections; (4) need managed serverless billing (Pinecone); (5) need advanced hybrid sparse-dense natively. The operational cost of a second data store is real — only pay it when you have concrete evidence pgvector is the bottleneck.',
        uk: 'pgvector виграє для: датасетів менше ~100M векторів, команд вже на Postgres, потреби в транзакційних join та операційній простоті. Переходьте до спеціалізованої vector DB, коли: (1) масштаб перевищує сотні мільйонів — мільярди векторів, де памʼять побудови HNSW або затримка запиту стає вузьким місцем; (2) потрібна GPU-прискорена побудова індексу (Qdrant v1.18+ з GPU indexing); (3) потрібні мультимодальні (зображення+текст+аудіо) комбіновані колекції; (4) потрібне managed serverless billing (Pinecone); (5) потрібен advanced hybrid sparse-dense нативно. Операційна вартість другого data store є реальною — оплачуйте її лише коли є конкретні докази, що pgvector є вузьким місцем.',
      },
    },
  ],

  seeAlso: ['m14-index-toolbox', 'm25-document', 'm31-analytics', 'm35-choosing'],

  sources: [
    {
      title: 'pgvector v0.8.2 release (Feb 2026) — CVE-2026-3172 fix',
      url:   'https://github.com/pgvector/pgvector/releases/tag/v0.8.2',
    },
    {
      title: 'HNSW paper: Malkov & Yashunin 2018 — Efficient and robust approximate nearest neighbor search using HNSW',
      url:   'https://arxiv.org/abs/1603.09320',
    },
    {
      title: 'RAG paper: Lewis et al. (NeurIPS 2020) — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
      url:   'https://arxiv.org/abs/2005.11401',
    },
    {
      title: 'Qdrant v1.18.2 changelog (Jun 2026)',
      url:   'https://github.com/qdrant/qdrant/releases',
    },
    {
      title: 'pgvector HNSW indexing documentation',
      url:   'https://github.com/pgvector/pgvector#hnsw',
    },
    {
      title: 'Milvus 3.0-beta announcement (May 2026) — CNCF project',
      url:   'https://milvus.io/blog',
    },
  ],
};

export default m29;
