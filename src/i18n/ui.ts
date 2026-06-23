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

  landscapeMap: { en: 'Landscape Map', uk: 'Карта ландшафту' },
  startHere: { en: 'Start here', uk: 'Почати тут' },
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

  comingSoon: { en: 'Content coming in a later session', uk: 'Контент з’явиться в наступній сесії' },
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

  footerRole: { en: 'Senior Fullstack Engineer', uk: 'Senior Fullstack Engineer' },
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
