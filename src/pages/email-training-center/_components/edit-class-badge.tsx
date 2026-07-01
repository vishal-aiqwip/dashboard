const EDIT_CLASS_COLORS: Record<string, string> = {
  accepted: 'bg-emerald-500/15 text-emerald-700',
  light: 'bg-lime-400/20 text-lime-700',
  medium: 'bg-amber-500/15 text-amber-700',
  heavy: 'bg-rose-400/20 text-rose-700',
  rewritten: 'bg-rose-600/15 text-rose-700',
};

export function EditClassBadge({ editClass }: { editClass: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${EDIT_CLASS_COLORS[editClass] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {editClass}
    </span>
  );
}
