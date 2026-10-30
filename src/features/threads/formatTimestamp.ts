/**
 * Relative age as a bare unit — "12m", "5h", "2d".
 *
 * Split out from `formatTimestamp` for the reply list, where every row carries
 * one and a column of identical "ago"s is noise rather than information. The
 * heading above the list already establishes that these are times.
 */
export function formatAge(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours}h`;
  } else {
    return `${days}d`;
  }
}

/**
 * Relative time for thread metadata rows — "12m ago", "5h ago", "2d ago".
 * Rendered in Geist Mono wherever it appears.
 */
export function formatTimestamp(date: Date): string {
  return `${formatAge(date)} ago`;
}
