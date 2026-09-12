/**
 * A channel with no threads, in either view.
 *
 * No glyph and no button, deliberately. "New Thread" already sits in the channel
 * header a few inches above, and a second call to action here would make the
 * empty region compete with the one that is always there. Two lines: what is true,
 * then what to do about it.
 *
 * It draws no background of its own — the grid shows plain Void behind it, the
 * canvas its dot grid, and each is right for its own view.
 */
export function ThreadEmptyState() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center text-center"
      style={{ gap: 'var(--space-1)' }}
    >
      <span
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-ink)',
        }}
      >
        No threads here yet
      </span>
      <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-mist)' }}>
        A post in this channel starts one.
      </span>
    </div>
  );
}
