import type { EditClass } from '@/pages/email-performance/_data/mock';

import { EDIT_CLASS_COLORS } from './edit-class-colors';

export function EditClassBadge({ value }: { value: EditClass }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${EDIT_CLASS_COLORS[value]}`}
    >
      {value[0].toUpperCase() + value.slice(1)}
    </span>
  );
}
