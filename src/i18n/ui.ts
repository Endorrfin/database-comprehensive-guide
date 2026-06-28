import type { Localized } from '../data/types';

/**
 * UI chrome strings (bilingual). Technical terms stay English in both languages.
 * Resolve with the `t()` helper from useLang(): t(ui.search).
 */
export const ui = {
  brandTitle: { en: 'Databases', uk: 'Databases' },
  brandSubtitle: { en: 'The Comprehensive Guide', uk: 'Вичерпний посібник' },

  search: { en: 'Search', uk: 'Пошук' },
  searchPlaceholder: {
    en: 'Search modules & topics…',
    uk: 'Пошук модулів і тем…',
  },
  searchNoResults: { en: 'No matches', uk: 'Нічого не знайдено' },
  searchHint: { en: 'Type to search', uk: 'Почніть вводити' },

  levelFilter: { en: 'Level', uk: 'Рівень' },
  allLevels: { en: 'All levels', uk: 'Усі рівні' },
  beginner: { en: 'Beginner', uk: 'Beginner' },
  middle: { en: 'Middle', uk: 'Middle' },
  senior: { en: 'Senior', uk: 'Senior' },
  staff: { en: 'Staff', uk: 'Staff' },

  language: { en: 'Language', uk: 'Мова' },
  english: { en: 'English', uk: 'English' },
  ukrainian: { en: 'Українська', uk: 'Українська' },

  theme: { en: 'Theme', uk: 'Тема' },
  themeSystem: { en: 'System', uk: 'Системна' },
  themeDark: { en: 'Dark', uk: 'Темна' },
  themeLight: { en: 'Light', uk: 'Світла' },

  landscapeMap: { en: 'Landscape Map', uk: 'Карта ландшафту' },
  startHere: { en: 'Start here', uk: 'Почати тут' },
  // CHANGED (S2): landing "Start here" guided path.
  suggestedPath: { en: 'Suggested path', uk: 'Рекомендований шлях' },
  suggestedPathLede: {
    en: 'A guided route from first principles to the internals — skip ahead any time.',
    uk: 'Орієнтовний шлях від основ до internals — пропускайте вперед будь-коли.',
  },
  mentalModels: { en: 'Mental Models', uk: 'Ментальні моделі' },
  glossary: { en: 'Glossary', uk: 'Глосарій' },
  decide: { en: 'Database Picker', uk: 'Підбір бази даних' },

  onThisPage: { en: 'On this page', uk: 'На цій сторінці' },
  keyPoints: { en: 'Key points', uk: 'Ключові тези' },
  pitfalls: { en: 'Pitfalls & misconceptions', uk: 'Пастки та хибні уявлення' },
  interview: { en: 'Interview questions', uk: 'Питання для співбесіди' },
  seeAlso: { en: 'See also', uk: 'Дивіться також' },
  sources: { en: 'Sources', uk: 'Джерела' },
  mentalModelLabel: { en: 'Mental model', uk: 'Ментальна модель' },
  readMins: { en: 'min read', uk: 'хв читання' },

  prevModule: { en: 'Previous', uk: 'Попередній' },
  nextModule: { en: 'Next', uk: 'Наступний' },
  markKnown: { en: 'Mark as known', uk: 'Позначити як вивчене' },
  known: { en: 'Known', uk: 'Вивчено' },

  comingSoon: { en: 'Content coming in a later session', uk: 'Контент зʼявиться в наступній сесії' },
  stubNote: {
    en: 'This module is part of the navigable skeleton. Its full content is authored in a later session per the roadmap.',
    uk: 'Цей модуль — частина навігаційного каркасу. Його повний зміст буде створено в наступній сесії згідно з планом.',
  },

  showStep: { en: 'Step', uk: 'Крок' },
  play: { en: 'Play', uk: 'Відтворити' },
  pause: { en: 'Pause', uk: 'Пауза' },
  reset: { en: 'Reset', uk: 'Скинути' },
  next: { en: 'Next', uk: 'Далі' },
  back: { en: 'Back', uk: 'Назад' },

  // CHANGED (S21): study tools — search result kinds, Flashcards & Quiz.
  searchKindModule: { en: 'Module', uk: 'Модуль' },
  searchKindTopic: { en: 'Topic', uk: 'Тема' },
  searchKindGlossary: { en: 'Term', uk: 'Термін' },

  flashcards: { en: 'Flashcards', uk: 'Flashcards' },
  flashcardsLede: {
    en: 'Recall it before you flip — then grade yourself. Cards you miss come back this round.',
    uk: 'Пригадайте перед тим, як перевернути — тоді оцініть себе. Картки, які пропустили, повернуться цього кола.',
  },
  deckLabel: { en: 'Deck', uk: 'Колода' },
  deckGlossaryTerms: { en: 'Glossary terms', uk: 'Терміни глосарію' },
  flip: { en: 'Flip', uk: 'Перевернути' },
  shuffle: { en: 'Shuffle', uk: 'Перемішати' },
  restart: { en: 'Restart', uk: 'Спочатку' },
  knewIt: { en: 'Knew it', uk: 'Знав' },
  reviewAgain: { en: 'Review again', uk: 'Повторити' },
  flipHint: { en: 'Space or click to flip · ← → to move', uk: 'Пробіл або клік — перевернути · ← → — рух' },
  cardLabel: { en: 'Card', uk: 'Картка' },
  knownCount: { en: 'known', uk: 'вивчено' },
  deckDone: { en: 'Deck complete', uk: 'Колоду пройдено' },
  deckDoneLede: {
    en: 'You graded every card. Shuffle for another pass, or switch decks.',
    uk: 'Ви оцінили кожну картку. Перемішайте для нового проходу або змініть колоду.',
  },

  quiz: { en: 'Quiz', uk: 'Quiz' },
  quizLede: {
    en: 'One question at a time across the whole guide. Pick an answer to see why it is right.',
    uk: 'По одному питанню з усього посібника. Оберіть відповідь, щоб побачити, чому вона правильна.',
  },
  quizScore: { en: 'Score', uk: 'Рахунок' },
  quizCorrect: { en: 'Correct', uk: 'Правильно' },
  quizIncorrect: { en: 'Not quite', uk: 'Не зовсім' },
  quizOpenModule: { en: 'Open the module', uk: 'Відкрити модуль' },
  quizNext: { en: 'Next question', uk: 'Наступне питання' },
  quizDone: { en: 'Quiz complete', uk: 'Тест завершено' },
  quizYourScore: { en: 'You scored', uk: 'Ваш результат' },
  quizNew: { en: 'New quiz', uk: 'Новий тест' },

  footerRole: { en: 'Senior Fullstack Engineer', uk: 'Senior Fullstack Engineer' },
  footerCountry: { en: 'Ukraine', uk: 'Україна' }, // CHANGED (S2): footer brand line
  footerTagline: {
    en: 'Deep, interactive, bilingual guide to how databases actually work.',
    uk: 'Глибокий інтерактивний двомовний посібник про те, як насправді працюють бази даних.',
  },
  builtWith: { en: 'Built with Vite · React · TypeScript', uk: 'Зроблено на Vite · React · TypeScript' },

  modulesLabel: { en: 'modules', uk: 'модулів' },
  sectionsLabel: { en: 'sections', uk: 'розділів' },
  simsLabel: { en: 'signature sims', uk: 'фірмових симуляцій' },
  toggleSidebar: { en: 'Toggle navigation', uk: 'Перемкнути навігацію' },
  skipToContent: { en: 'Skip to content', uk: 'Перейти до вмісту' },
} satisfies Record<string, Localized>;

export type UiKey = keyof typeof ui;
