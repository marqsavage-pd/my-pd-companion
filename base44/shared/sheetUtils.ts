// Shared utilities for Google Sheet parsing used by sync functions.
// Column A dates are "DD-MMM-YY" (e.g. "15-Jul-26").

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

// "15-Jul-26" -> "2026-07-15"
export const parseSheetDate = (s) => {
  if (!s) return null;
  const parts = String(s).split('-');
  if (parts.length !== 3) return null;
  const [d, mon, y] = parts;
  if (!MONTHS[mon]) return null;
  return `20${y}-${MONTHS[mon]}-${d.padStart(2, '0')}`;
};

// Exchange/VitalSign logged timestamp -> local calendar date (America/Los_Angeles).
// Stored timestamps are inconsistent: form entries are UTC ("...Z"), imported
// records are bare local strings whose date part is already the local date.
export const laDate = (iso) => {
  if (!iso) return null;
  if (iso.includes('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date(iso));
    } catch { return iso.slice(0, 10); }
  }
  return iso.slice(0, 10);
};