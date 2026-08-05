import moment from "moment";

// Parse a timestamp that may be date-only (e.g. "2026-08-03") or a full
// datetime string. Date-only values are treated as local to avoid the
// UTC-midnight shift that moves the displayed date back a day.
export const parseTimestamp = (ts) => {
  if (!ts) return null;
  if (ts.length <= 10) return moment(ts);
  return /[Zz]$|[+-]\d{2}:\d{2}$/.test(ts) ? moment.utc(ts).local() : moment(ts);
};