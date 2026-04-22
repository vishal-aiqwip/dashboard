export type EmailFilters = {
  mailbox: string;
  category: string;
  editClass: string;
  tripType: string;
  verdict: string;
  failureType: string;
  editDistMin: string;
  editDistMax: string;
  search: string;
};

export const EMPTY_FILTERS: EmailFilters = {
  mailbox: 'all',
  category: 'all',
  editClass: 'all',
  tripType: 'all',
  verdict: 'all',
  failureType: 'all',
  editDistMin: '',
  editDistMax: '',
  search: '',
};

export function countActiveFilters(f: EmailFilters): number {
  let n = 0;
  if (f.mailbox !== 'all') n++;
  if (f.category !== 'all') n++;
  if (f.editClass !== 'all') n++;
  if (f.tripType !== 'all') n++;
  if (f.verdict !== 'all') n++;
  if (f.failureType !== 'all') n++;
  if (f.editDistMin !== '') n++;
  if (f.editDistMax !== '') n++;
  if (f.search.trim() !== '') n++;
  return n;
}
