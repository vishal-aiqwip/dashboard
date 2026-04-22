import type { EditClass } from '@/pages/email-performance/_data/mock';

export const EDIT_CLASS_COLORS: Record<EditClass, string> = {
  accepted: 'bg-emerald-500/15 text-emerald-700',
  light: 'bg-lime-400/20 text-lime-700',
  medium: 'bg-amber-500/15 text-amber-700',
  heavy: 'bg-rose-400/20 text-rose-700',
  rewritten: 'bg-rose-600/15 text-rose-700',
};

export function editClassBadgeClasses(c: EditClass): string {
  return EDIT_CLASS_COLORS[c];
}
