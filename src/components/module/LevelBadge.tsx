import type { Level } from '../../data/types';
import { useLang } from '../../i18n/lang';
import { ui } from '../../i18n/ui';

const LABEL = {
  beginner: ui.beginner,
  middle: ui.middle,
  senior: ui.senior,
  staff: ui.staff,
} as const;

export function LevelBadge({ level }: { level: Level }) {
  const { t } = useLang();
  return (
    <span className="chip badge-level" data-level={level}>
      {t(LABEL[level])}
    </span>
  );
}
